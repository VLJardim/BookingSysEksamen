// src/app/student-home/[search]/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import BookingCard from "@/src/components/bookingCard";
import getBrowserSupabase from "@/src/lib/supabase";
import ConfirmationModal from "@/src/components/confirmationModal";

type RouteParams = { search: string };

type Slot = {
  booking_id: string;
  starts_at: string;
  ends_at?: string | null;
};

type BookingRow = {
  booking_id: string;
  role: "available" | "not_available";
  owner: string | null;
};

type Facility = {
  facility_id: string;
  title: string;
  capacity?: string | null;
  description?: string | null;
  facility_type?: string | null;
  floor?: string | null;
  slots: Slot[];
};

type UserRole = "student" | "teacher";
type UserRoleState = UserRole | null;

type UserListRow = {
  role: UserRole;
};

type BookingModalConfig = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

// Vis tid præcis som i DB (ignorerer timezone)
function formatTimeRange(startsAt: string, endsAt?: string | null) {
  const startHM = startsAt.slice(11, 16);
  const endHM = endsAt ? endsAt.slice(11, 16) : "";
  return endHM ? `${startHM} - ${endHM}` : startHM;
}

// Parse capacity string (e.g. "3-4 pers", "20-30", "8+ pers") and return approx max capacity
function parseCapacityMax(capacity: string | null | undefined): number {
  if (!capacity) return 0;
  const nums = capacity.match(/\d+/g);
  if (!nums || nums.length === 0) return 0;
  return Math.max(...nums.map((n) => parseInt(n, 10)).filter((n) => !Number.isNaN(n)));
}

// Map capacity filter value from UI to a minimum number of seats
function getMinCapacityFromFilter(filter: string | null): number | null {
  if (!filter) return null;

  switch (filter) {
    case "1":
      return 1;
    case "2-4":
      return 2; // rooms that can handle 2 or more
    case "4-8":
      return 4;
    case "8+":
      return 8;
    default:
      return null;
  }
}

// Check if a slot matches the optional time filters
function slotMatchesTime(
  slot: Slot,
  startFilter: string | null,
  endFilter: string | null
): boolean {
  const slotStartHM = slot.starts_at.slice(11, 16); // "HH:MM"
  const slotEndHM = slot.ends_at ? slot.ends_at.slice(11, 16) : null;

  if (startFilter && slotStartHM < startFilter) {
    return false;
  }

  if (endFilter && slotEndHM) {
    if (slotEndHM > endFilter) return false;
  }

  return true;
}

// Flad liste: sortér efter etage → lokale → starttid
function flattenAndSortSlots(facilities: Facility[]) {
  const items: {
    facilityTitle: string;
    floor: string | null | undefined;
    slot: Slot;
  }[] = [];

  for (const fac of facilities) {
    for (const slot of fac.slots) {
      items.push({
        facilityTitle: fac.title,
        floor: fac.floor,
        slot,
      });
    }
  }

  return items.sort((a, b) => {
    const fa = parseInt(a.floor || "999", 10);
    const fb = parseInt(b.floor || "999", 10);

    if (!Number.isNaN(fa) && !Number.isNaN(fb) && fa !== fb) {
      return fa - fb;
    }

    const titleCmp = a.facilityTitle.localeCompare(b.facilityTitle, "da-DK", {
      numeric: true,
    });
    if (titleCmp !== 0) return titleCmp;

    return a.slot.starts_at.localeCompare(b.slot.starts_at);
  });
}

export default function SearchPage() {
  const params = useParams<RouteParams>();
  const rawSearch = params.search;
  const searchDate =
    Array.isArray(rawSearch) ? rawSearch[0] : rawSearch || "";

  const searchParams = useSearchParams();
  const startFilter = searchParams.get("start");      // "HH:MM" or null
  const endFilter = searchParams.get("end");          // "HH:MM" or null
  const capacityFilter = searchParams.get("capacity"); // "1", "2-4", ...

  const minCapacity = getMinCapacityFromFilter(capacityFilter);

  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<UserRoleState>(null);

  const [bookingModal, setBookingModal] =
    useState<BookingModalConfig | null>(null);

  // Hent brugerens rolle
  useEffect(() => {
    const supabase = getBrowserSupabase();

    const loadRole = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setRole(null);
        return;
      }

      const { data, error } = await (supabase as any)
        .from("userlist")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (error || !data) {
        setRole("student");
        return;
      }

      const row = data as UserListRow;
      setRole(row.role ?? "student");
    };

    loadRole().catch((err) => {
      console.error("Failed to load role", err);
      setRole(null);
    });
  }, []);

  // Hent slots for datoen
  useEffect(() => {
    if (!searchDate) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/search?date=${encodeURIComponent(searchDate)}`
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body.error ||
              `Fejl ved hentning af lokaler (status ${res.status})`
          );
        }

        const data = (await res.json()) as Facility[];
        setFacilities(data);
      } catch (err: any) {
        setError(err.message || "Ukendt fejl");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchDate]);

  // Filtrer lærer-only lokaler fra for studerende + kapacitet filter
  const visibleFacilities = useMemo(() => {
    // 1) Teacher / student access
    let base = facilities;
    if (role === "student") {
      base = facilities.filter((f) => {
        const desc = (f.description || "").toLowerCase();
        const type = (f.facility_type || "").toLowerCase();

        const isTeacherOnlyDesc =
          desc.includes("kun lærere") || desc.includes("kun laerere");

        const isTeacherOnlyType =
          type === "open learning" || type === "undervisning";

        if (isTeacherOnlyDesc || isTeacherOnlyType) return false;
        return true;
      });
    }

    // 2) Capacity filter (same for students + teachers)
    if (minCapacity == null) return base;

    return base.filter((f) => {
      const maxCap = parseCapacityMax(f.capacity ?? null);
      return maxCap >= minCapacity;
    });
  }, [facilities, role, minCapacity]);

  // Flad liste og sortering (etage → lokale → starttid)
  const sortedSlots = useMemo(
    () => flattenAndSortSlots(visibleFacilities),
    [visibleFacilities]
  );

  // Anvend time-filter på slots
  const filteredSlots = useMemo(
    () =>
      sortedSlots.filter((item) =>
        slotMatchesTime(item.slot, startFilter, endFilter)
      ),
    [sortedSlots, startFilter, endFilter]
  );

  const prettySearchDate = useMemo(() => {
    if (!searchDate) return "";
    const d = new Date(searchDate + "T00:00:00");
    if (Number.isNaN(d.getTime())) return searchDate;

    let formatted = d.toLocaleDateString("da-DK", {
      day: "numeric",
      month: "long",
    });

    formatted = formatted.replace(
      /(\d+\.\s*)([a-zæøå])/,
      (match, prefix, firstLetter) => prefix + firstLetter.toUpperCase()
    );

    return formatted;
  }, [searchDate]);

  const handleBookSlot = async (bookingId: string) => {
    try {
      const supabase = getBrowserSupabase();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setBookingModal({
          title: "Log ind påkrævet",
          message:
            "Du skal være logget ind for at booke et lokale. Log ind og prøv igen.",
          confirmLabel: "OK",
          cancelLabel: "Luk",
        });
        return;
      }

      const {
        data: existingData,
        error: fetchError,
      } = await (supabase as any)
        .from("booking")
        .select("booking_id, role, owner")
        .eq("booking_id", bookingId)
        .maybeSingle();

      const existing = existingData as BookingRow | null;

      if (fetchError || !existing || existing.role !== "available") {
        setBookingModal({
          title: "Kunne ikke booke",
          message: "Tidsrummet er allerede booket af en anden.",
          confirmLabel: "OK",
          cancelLabel: "Luk",
        });
        return;
      }

      const {
        data: updatedData,
        error: updateError,
      } = await (supabase as any)
        .from("booking")
        .update({
          role: "not_available",
          owner: user.id,
        })
        .eq("booking_id", bookingId)
        .eq("role", "available")
        .select("*")
        .maybeSingle();

      const updated = updatedData as BookingRow | null;

      if (updateError || !updated) {
        setBookingModal({
          title: "Kunne ikke booke",
          message:
            "Tidsrummet kunne ikke bookes. Det kan være, at en anden lige har taget det.",
          confirmLabel: "OK",
          cancelLabel: "Luk",
        });
        return;
      }

      setFacilities((prev) =>
        prev.map((facility) => ({
          ...facility,
          slots: facility.slots.filter(
            (slot) => slot.booking_id !== bookingId
          ),
        }))
      );

      setBookingModal({
        title: "Booking gennemført",
        message:
          "Dit lokale er nu booket. Du kan se det under 'Mine bookinger'.",
        confirmLabel: "OK",
        cancelLabel: "Luk",
      });
    } catch (err) {
      console.error("Unexpected booking error", err);
      setBookingModal({
        title: "Kunne ikke booke",
        message: "Der opstod en uventet fejl. Prøv igen senere.",
        confirmLabel: "OK",
        cancelLabel: "Luk",
      });
    }
  };

  // Group filtered slots by facility to get your “boxes”
  const groupedByFacility = useMemo(() => {
    return filteredSlots.reduce<
      Record<
        string,
        { facilityTitle: string; floor: string | null | undefined; slot: Slot }[]
      >
    >((acc, item) => {
      if (!acc[item.facilityTitle]) {
        acc[item.facilityTitle] = [];
      }
      acc[item.facilityTitle].push(item);
      return acc;
    }, {});
  }, [filteredSlots]);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8">
        <h1 className="mb-2 text-2xl font-bold">Lokaler og bookinger</h1>
        <p className="text-gray-600">
          Dato: <span className="font-medium">{prettySearchDate}</span>
        </p>
      </header>

      {loading && <p>Henter ledige tider...</p>}
      {error && <p className="mb-4 text-red-600">Fejl: {error}</p>}

      {!loading && !error && filteredSlots.length === 0 && (
        <p className="text-gray-600">
          Der blev ikke fundet ledige lokaler på denne dato med de valgte
          filtre.
        </p>
      )}

      {!loading && !error && filteredSlots.length > 0 && (
        <section className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold">
            Til studerende og lærere
          </h2>

          <div className="space-y-6">
            {Object.entries(groupedByFacility).map(
              ([facilityTitle, group]) => {
                const floor = group[0]?.floor ?? null;

                return (
                  <div
                    key={facilityTitle}
                    className="space-y-3 rounded-lg border border-gray-200 bg-white/60 p-4"
                  >
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-md font-semibold text-gray-800">
                        {facilityTitle}
                      </h3>
                      {floor && (
                        <span className="text-xs text-gray-500">
                          {floor}. sal
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {group.map((item) => {
                        const timeLabel = formatTimeRange(
                          item.slot.starts_at,
                          item.slot.ends_at ?? null
                        );

                        return (
                          <BookingCard
                            key={item.slot.booking_id}
                            bookingId={item.slot.booking_id}
                            roomName={facilityTitle}
                            date={searchDate}
                            time={timeLabel}
                            onBook={handleBookSlot}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>
      )}

      <ConfirmationModal
        isOpen={bookingModal !== null}
        title={bookingModal?.title ?? ""}
        message={bookingModal?.message ?? ""}
        confirmLabel={bookingModal?.confirmLabel}
        cancelLabel={bookingModal?.cancelLabel}
        onClose={() => setBookingModal(null)}
      />
    </main>
  );
}
