// src/app/teacher-home/[search]/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import BookingCard from "@/src/components/bookingCard";
import getBrowserSupabase from "@/src/lib/supabase";
import ConfirmationModal from "@/src/components/confirmationModal";
import { formatBookingInterval } from "@/src/utils/time";

type RouteParams = { search: string };

type Slot = {
  booking_id: string;
  starts_at: string;
  ends_at?: string | null;
  role: "available" | "not_available";
  owner: string | null;
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

type BookingModalConfig = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

function sortFacilitiesByFloorThenTitle(facilities: Facility[]): Facility[] {
  return [...facilities].sort((a, b) => {
    const fa = parseInt(a.floor || "999", 10);
    const fb = parseInt(b.floor || "999", 10);
    if (!Number.isNaN(fa) && !Number.isNaN(fb) && fa !== fb) {
      return fa - fb;
    }
    return a.title.localeCompare(b.title, "da-DK", { numeric: true });
  });
}

// Parse capacity string and return approx max capacity
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
  const slotStartHM = slot.starts_at.slice(11, 16);
  const slotEndHM = slot.ends_at ? slot.ends_at.slice(11, 16) : null;

  if (startFilter && slotStartHM < startFilter) {
    return false;
  }

  if (endFilter && slotEndHM) {
    if (slotEndHM > endFilter) return false;
  }

  return true;
}

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

export default function TeacherSearchPage() {
  const params = useParams<RouteParams>();
  const rawSearch = params.search;
  const searchDate =
    Array.isArray(rawSearch) ? rawSearch[0] : rawSearch || "";

  const searchParams = useSearchParams();
  const startFilter = searchParams.get("start");
  const endFilter = searchParams.get("end");
  const capacityFilter = searchParams.get("capacity");
  const minCapacity = getMinCapacityFromFilter(capacityFilter);

  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [bookingModal, setBookingModal] =
    useState<BookingModalConfig | null>(null);

  useEffect(() => {
    if (!searchDate) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/search?date=${encodeURIComponent(searchDate)}&mode=teacher`
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

  const {
    sharedFacilities,
    teachingFacilities,
    openLearningFacilities,
  } = useMemo(() => {
    const shared: Facility[] = [];
    const teaching: Facility[] = [];
    const openLearning: Facility[] = [];

    for (const fac of facilities) {
      // Capacity filter at facility level
      if (minCapacity !== null) {
        const maxCap = parseCapacityMax(fac.capacity ?? null);
        if (maxCap < minCapacity) {
          continue;
        }
      }

      const desc = (fac.description || "").toLowerCase();
      const type = (fac.facility_type || "").toLowerCase();

      const isTeacherOnlyDesc =
        desc.includes("kun lærere") || desc.includes("kun laerere");
      const isTeaching = type === "undervisning";
      const isOpenLearning = type === "open learning";

      if (!isTeacherOnlyDesc && !isTeaching && !isOpenLearning) {
        shared.push(fac);
      } else if (isTeaching) {
        teaching.push(fac);
      } else if (isOpenLearning) {
        openLearning.push(fac);
      } else {
        teaching.push(fac);
      }
    }

    return {
      sharedFacilities: sortFacilitiesByFloorThenTitle(shared),
      teachingFacilities: sortFacilitiesByFloorThenTitle(teaching),
      openLearningFacilities: sortFacilitiesByFloorThenTitle(openLearning),
    };
  }, [facilities, minCapacity]);

  const sharedSlots = useMemo(
    () => flattenAndSortSlots(sharedFacilities),
    [sharedFacilities]
  );
  const teachingSlots = useMemo(
    () => flattenAndSortSlots(teachingFacilities),
    [teachingFacilities]
  );
  const openLearningSlots = useMemo(
    () => flattenAndSortSlots(openLearningFacilities),
    [openLearningFacilities]
  );

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

      if (fetchError || !existing) {
        console.error("Failed to fetch booking slot", fetchError);
        setBookingModal({
          title: "Kunne ikke booke",
          message:
            "Der opstod en fejl ved hentning af tidsrummet. Prøv igen senere.",
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
        .select("*")
        .maybeSingle();

      const updated = updatedData as BookingRow | null;

      if (updateError || !updated) {
        console.error("Failed to book/override slot", updateError);
        const msg = updateError?.message || "";

        let userMessage =
          "Tidsrummet kunne ikke bookes. Det kan være, at en anden har taget det.";

        if (msg.includes("Students cannot override existing bookings")) {
          userMessage =
            "Studerende kan ikke overtage en eksisterende booking.";
        } else if (
          msg.includes("Teachers cannot override other teachers")
        ) {
          userMessage =
            "Du kan ikke overtage en booking, der allerede er lavet af en anden lærer.";
        } else if (msg.includes("maximum number of bookings")) {
          userMessage =
            "Du har allerede det maksimale antal bookinger for denne dag.";
        } else if (
          msg.includes("cannot book multiple different rooms")
        ) {
          userMessage = "Du kan kun booke ét lokale pr. dag.";
        }

        setBookingModal({
          title: "Kunne ikke booke",
          message: userMessage,
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

      const wasAvailableBefore = existing.role === "available";

      setBookingModal({
        title: "Booking gennemført",
        message: wasAvailableBefore
          ? "Dit lokale er nu booket."
          : "Du har nu overtaget denne booking.",
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

  const renderSlotGrid = (slots: ReturnType<typeof flattenAndSortSlots>) => {
    // Apply time filter BEFORE grouping into boxes
    const filtered = slots.filter((item) =>
      slotMatchesTime(item.slot, startFilter, endFilter)
    );

    if (filtered.length === 0) {
      return (
        <p className="text-sm text-gray-500">
          Ingen bookinger for denne kategori på denne dag med de valgte filtre.
        </p>
      );
    }

    // Group by facility title so each room is visually separated
    const byFacility = filtered.reduce<
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

    return (
      <div className="space-y-6">
        {Object.entries(byFacility).map(([facilityTitle, group]) => {
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
                  const { timeLabel } = formatBookingInterval(
                    item.slot.starts_at,
                    item.slot.ends_at ?? null
                  );

                  const isAvailable = item.slot.role === "available";

                  return (
                    <BookingCard
                      key={item.slot.booking_id}
                      bookingId={item.slot.booking_id}
                      roomName={facilityTitle}
                      date={searchDate}
                      time={timeLabel}
                      onBook={handleBookSlot}
                      actionLabel={
                        isAvailable ? "Book dette tidsrum" : "Overtag booking"
                      }
                      notice={
                        isAvailable
                          ? undefined
                          : "Allerede booket – klik for at overtage bookingen."
                      }
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8">
        <h1 className="mb-2 text-2xl font-bold">
          Lokaler og bookinger (Lærer)
        </h1>
        <p className="text-gray-600">
          Dato: <span className="font-medium">{prettySearchDate}</span>
        </p>
      </header>

      {loading && <p>Henter lokaler og tider...</p>}
      {error && <p className="mb-4 text-red-600">Fejl: {error}</p>}

      {!loading && !error && facilities.length === 0 && (
        <p className="text-gray-600">
          Der blev ikke fundet nogle bookinger for denne dato.
        </p>
      )}

      {!loading && !error && facilities.length > 0 && (
        <div className="space-y-10">
          {sharedSlots.length > 0 && (
            <section className="mt-8 space-y-4 border-t border-gray-200 pt-6 first:mt-0 first:border-t-0 first:pt-0">
              <h2 className="text-lg font-semibold">
                Til studerende og lærere
              </h2>
              {renderSlotGrid(sharedSlots)}
            </section>
          )}

          {teachingSlots.length > 0 && (
            <section className="mt-8 space-y-4 border-t border-gray-200 pt-6 first:mt-0 first:border-t-0 first:pt-0">
              <h2 className="text-lg font-semibold">
                Kun lærere – undervisningslokaler
              </h2>
              {renderSlotGrid(teachingSlots)}
            </section>
          )}

          {openLearningSlots.length > 0 && (
            <section className="mt-8 space-y-4 border-t border-gray-200 pt-6 first:mt-0 first:border-t-0 first:pt-0">
              <h2 className="text-lg font-semibold">
                Kun lærere – Open Learning
              </h2>
              {renderSlotGrid(openLearningSlots)}
            </section>
          )}
        </div>
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
