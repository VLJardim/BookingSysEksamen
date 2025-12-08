// src/app/student-home/[search]/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import BookingCard from "@/src/components/bookingCard";
import getBrowserSupabase from "@/src/lib/supabase";
import ConfirmationModal from "@/src/components/confirmationModal";
import { bookSlot, cancelBooking } from "@/src/lib/bookingApi";
import { getErrorMessage } from "@/src/lib/errorMessages";

type RouteParams = { search: string };

type Slot = {
  booking_id: string;
  starts_at: string;
  ends_at?: string | null;
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
  confirmVariant?: "primary" | "danger";
  onConfirm?: () => void;
  onCancel?: () => void;
};

// 🔹 Fælles helper: format "YYYY-MM-DD" → "4. December"
function formatDateLabelDa(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;

  let formatted = d.toLocaleDateString("da-DK", {
    day: "numeric",
    month: "long",
  });

  formatted = formatted.replace(
    /(\d+\.\s*)([a-zæøå])/,
    (match, prefix, firstLetter) => prefix + firstLetter.toUpperCase()
  );

  return formatted;
}

// Vis tid præcis som i DB (ignorerer timezone)
function formatTimeRange(startsAt: string, endsAt?: string | null) {
  const startHM = startsAt.slice(11, 16); // "HH:MM"
  const endHM = endsAt ? endsAt.slice(11, 16) : "";
  return endHM ? `${startHM} - ${endHM}` : startHM;
}

// Parse capacity string (e.g. "3-4 pers", "20-30", "8+ pers") and return approx max capacity
function parseCapacityMax(capacity: string | null | undefined): number {
  if (!capacity) return 0;
  const nums = capacity.match(/\d+/g);
  if (!nums || nums.length === 0) return 0;
  return Math.max(
    ...nums.map((n) => parseInt(n, 10)).filter((n) => !Number.isNaN(n))
  );
}

// Map capacity filter value from UI to a minimum number of seats
function getMinCapacityFromFilter(filter: string | null): number | null {
  if (!filter) return null;

  switch (filter) {
    case "1":
      return 1;
    case "2-4":
      return 2;
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
    capacity: string | null | undefined;
    slot: Slot;
  }[] = [];

  for (const fac of facilities) {
    for (const slot of fac.slots) {
      items.push({
        facilityTitle: fac.title,
        floor: fac.floor,
        capacity: fac.capacity ?? null,
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
  const startFilter = searchParams.get("start"); // "HH:MM" or null
  const endFilter = searchParams.get("end"); // "HH:MM" or null
  const capacityFilter = searchParams.get("capacity"); // "1", "2-4", ...
  const minCapacity = getMinCapacityFromFilter(capacityFilter);

  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<UserRoleState>(null);
  const [bookingModal, setBookingModal] =
    useState<BookingModalConfig | null>(null);

  // 🔹 State til forslag (næste dag med ledige slots)
  const [suggestedDate, setSuggestedDate] = useState<string | null>(null);
  const [suggestedFacilities, setSuggestedFacilities] = useState<Facility[]>(
    []
  );
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

  // Hent brugerens rolle
  useEffect(() => {
    const supabase = getBrowserSupabase() as any;

    const loadRole = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setRole(null);
        return;
      }

      const { data, error } = await supabase
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

  // 🔹 Genbrugelig fetch-funktion til nuværende dato
  const fetchFacilitiesForCurrentDate = async () => {
    if (!searchDate) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `/api/search?date=${encodeURIComponent(searchDate)}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.error || `Fejl ved hentning af lokaler (status ${res.status})`
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

  // Hent slots for datoen
  useEffect(() => {
    if (!searchDate) return;
    void fetchFacilitiesForCurrentDate();
  }, [searchDate]);

  // Filtrer lærer-only lokaler fra for studerende + kapacitet filter
  const visibleFacilities = useMemo(() => {
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
    return formatDateLabelDa(searchDate);
  }, [searchDate]);

  // 🔹 Når der ikke er nogen tider på dagen → find næste dag med ledige tider
  useEffect(() => {
    if (!searchDate) return;

    // Hvis vi stadig loader eller har en fejl → vent
    if (loading || error) return;

    // Hvis der ER slots til denne dag → ryd forslag og stop
    if (filteredSlots.length > 0) {
      setSuggestedDate(null);
      setSuggestedFacilities([]);
      setSuggestionsError(null);
      setSuggestionsLoading(false);
      return;
    }

    // Ingen slots → prøv at finde næste dato med ledige tider
    let cancelled = false;

    const findNextAvailableDay = async () => {
      try {
        setSuggestionsLoading(true);
        setSuggestionsError(null);
        setSuggestedDate(null);
        setSuggestedFacilities([]);

        const base = new Date(searchDate + "T00:00:00");
        if (Number.isNaN(base.getTime())) {
          setSuggestionsError("Ugyldig dato.");
          setSuggestionsLoading(false);
          return;
        }

        const maxDaysAhead = 30;

        for (let offset = 1; offset <= maxDaysAhead; offset++) {
          const next = new Date(base);
          next.setDate(base.getDate() + offset);

          const yyyy = next.getFullYear();
          const mm = String(next.getMonth() + 1).padStart(2, "0");
          const dd = String(next.getDate()).padStart(2, "0");
          const nextDateStr = `${yyyy}-${mm}-${dd}`;

          const res = await fetch(
            `/api/search?date=${encodeURIComponent(nextDateStr)}`
          );

          if (!res.ok) {
            // Hvis der er et problem for en bestemt dag → prøv bare næste
            continue;
          }

          const data = (await res.json()) as Facility[];

          if (data.length > 0) {
            if (cancelled) return;
            setSuggestedDate(nextDateStr);
            setSuggestedFacilities(data);
            setSuggestionsLoading(false);
            return;
          }
        }

        if (!cancelled) {
          setSuggestionsError(
            "Vi fandt ingen alternative tider i de næste 30 dage."
          );
          setSuggestionsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch suggestions", err);
          setSuggestionsError("Kunne ikke hente alternative tider.");
          setSuggestionsLoading(false);
        }
      }
    };

    void findNextAvailableDay();

    return () => {
      cancelled = true;
    };
  }, [searchDate, filteredSlots, loading, error]);

  // 🔹 Anvend samme synlighedsregler (rolle + kapacitet) på forslagene
  const suggestedVisibleFacilities = useMemo(() => {
    if (suggestedFacilities.length === 0) return [];

    let base = suggestedFacilities;

    if (role === "student") {
      base = suggestedFacilities.filter((f) => {
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

    if (minCapacity == null) return base;

    return base.filter((f) => {
      const maxCap = parseCapacityMax(f.capacity ?? null);
      return maxCap >= minCapacity;
    });
  }, [suggestedFacilities, role, minCapacity]);

  const suggestedSortedSlots = useMemo(
    () => flattenAndSortSlots(suggestedVisibleFacilities),
    [suggestedVisibleFacilities]
  );

  const suggestedGroupedByFacility = useMemo(() => {
    return suggestedSortedSlots.reduce<
      Record<
        string,
        {
          facilityTitle: string;
          floor: string | null | undefined;
          capacity: string | null | undefined;
          slot: Slot;
        }[]
      >
    >((acc, item) => {
      if (!acc[item.facilityTitle]) {
        acc[item.facilityTitle] = [];
      }
      acc[item.facilityTitle].push(item);
      return acc;
    }, {});
  }, [suggestedSortedSlots]);

  const handleBookSlot = async (bookingId: string) => {
    try {
      const result = await bookSlot(bookingId);

      if (!result.ok) {
        const msg = getErrorMessage(result.errorKey);
        const isLoginError = result.errorKey === "BOOKING_LOGIN_REQUIRED";

        setBookingModal({
          title: isLoginError ? "Log ind påkrævet" : "Kunne ikke booke",
          message: msg,
          confirmLabel: "OK",
          cancelLabel: "Luk",
        });
        return;
      }

      // Success → fjern slot fra UI
      setFacilities((prev) =>
        prev.map((facility) => ({
          ...facility,
          slots: facility.slots.filter(
            (slot) => slot.booking_id !== bookingId
          ),
        }))
      );

      // Success-modal med mulighed for at fortryde
      setBookingModal({
        title: "Booking gennemført",
        message:
          "Dit lokale er nu booket. Du kan se det under 'Mine bookinger'.",
        confirmLabel: "OK",
        cancelLabel: "Fortryd",
        onConfirm: () => setBookingModal(null),
        onCancel: async () => {
          const undo = await cancelBooking(bookingId);

          if (!undo.ok) {
            const msg = getErrorMessage(undo.errorKey);
            setBookingModal({
              title: "Kunne ikke fortryde booking",
              message: msg,
              confirmLabel: "OK",
              cancelLabel: "Luk",
            });
            return;
          }

          await fetchFacilitiesForCurrentDate();
          setBookingModal(null);
        },
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
        {
          facilityTitle: string;
          floor: string | null | undefined;
          capacity: string | null | undefined;
          slot: Slot;
        }[]
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

      {/* 🔹 Ingen slots → vis tekst + forslag-sektion */}
      {!loading && !error && filteredSlots.length === 0 && (
        <>
          <p className="text-gray-600">
            Der blev ikke fundet ledige lokaler på denne dato med de valgte
            filtre.
          </p>

          <section className="mt-8 space-y-4">
            <h2 className="text-lg font-semibold">Forslag til andre tider</h2>

            {suggestionsLoading && (
              <p className="text-sm text-gray-500">
                Finder alternative tider...
              </p>
            )}

            {suggestionsError && !suggestionsLoading && (
              <p className="text-sm text-gray-500">{suggestionsError}</p>
            )}

            {!suggestionsLoading &&
              !suggestionsError &&
              suggestedDate &&
              suggestedSortedSlots.length > 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Første ledige dag er{" "}
                    <span className="font-medium">
                      {formatDateLabelDa(suggestedDate)}
                    </span>
                    .
                  </p>

                  <div className="space-y-6">
                    {Object.entries(suggestedGroupedByFacility).map(
                      ([facilityTitle, group]) => {
                        const capacityLabel = group[0]?.capacity ?? null;

                        return (
                          <div
                            key={facilityTitle}
                            className="rounded-lg bg-white/60 p-4"
                          >
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
                                    date={suggestedDate}
                                    time={timeLabel}
                                    capacity={capacityLabel || undefined}
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
                </div>
              )}
          </section>
        </>
      )}

      {/* 🔹 Normal liste når der ER slots */}
      {!loading && !error && filteredSlots.length > 0 && (
        <section className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold">Til studerende og lærere</h2>

          <div className="space-y-6">
            {Object.entries(groupedByFacility).map(
              ([facilityTitle, group]) => {
                const capacityLabel = group[0]?.capacity ?? null;

                return (
                  <div
                    key={facilityTitle}
                    className="rounded-lg bg-white/60 p-4"
                  >
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
                            capacity={capacityLabel || undefined}
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
        confirmVariant={bookingModal?.confirmVariant}
        onConfirm={bookingModal?.onConfirm}
        onCancel={bookingModal?.onCancel}
        onClose={() => setBookingModal(null)}
      />
    </main>
  );
}
