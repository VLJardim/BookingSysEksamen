// src/app/teacher-home/[search]/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import BookingCard from "@/src/components/bookingCard";
import ConfirmationModal from "@/src/components/confirmationModal";
import { formatBookingInterval } from "@/src/utils/time";
import { bookSlot } from "@/src/lib/bookingApi";
import { getErrorMessage } from "@/src/lib/errorMessages";

type RouteParams = { search: string };

type Slot = {
  booking_id: string;
  starts_at: string;
  ends_at?: string | null;
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

// Parse capacity string and return approx max capacity
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

  // 🔹 State til forslag (næste dag med ledige tider)
  const [suggestedDate, setSuggestedDate] = useState<string | null>(null);
  const [suggestedFacilities, setSuggestedFacilities] = useState<Facility[]>(
    []
  );
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

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
    return formatDateLabelDa(searchDate);
  }, [searchDate]);

  // 🔹 Del op i kategorier (fælles / undervisning / open learning) + kapacitetsfilter
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

  // 🔹 Flad + sortér
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

  // 🔹 Anvend tidsfilter på slots
  const filteredSharedSlots = useMemo(
    () =>
      sharedSlots.filter((item) =>
        slotMatchesTime(item.slot, startFilter, endFilter)
      ),
    [sharedSlots, startFilter, endFilter]
  );

  const filteredTeachingSlots = useMemo(
    () =>
      teachingSlots.filter((item) =>
        slotMatchesTime(item.slot, startFilter, endFilter)
      ),
    [teachingSlots, startFilter, endFilter]
  );

  const filteredOpenLearningSlots = useMemo(
    () =>
      openLearningSlots.filter((item) =>
        slotMatchesTime(item.slot, startFilter, endFilter)
      ),
    [openLearningSlots, startFilter, endFilter]
  );

  // 🔹 Er der overhovedet nogen slots for denne dag med de valgte filtre?
  const noSlotsForThisDate = useMemo(() => {
    const total =
      filteredSharedSlots.length +
      filteredTeachingSlots.length +
      filteredOpenLearningSlots.length;
    return total === 0;
  }, [filteredSharedSlots, filteredTeachingSlots, filteredOpenLearningSlots]);

  // 🔹 Forsøg at finde næste dag med ledige tider når der ikke er nogen i dag
  useEffect(() => {
    if (!searchDate) return;
    if (loading || error) return;

    if (!noSlotsForThisDate) {
      // Ryd forslag hvis der nu ER slots
      setSuggestedDate(null);
      setSuggestedFacilities([]);
      setSuggestionsError(null);
      setSuggestionsLoading(false);
      return;
    }

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
            `/api/search?date=${encodeURIComponent(nextDateStr)}&mode=teacher`
          );
          if (!res.ok) {
            // Bare prøv næste dag, hvis der er fejl på en enkelt
            continue;
          }

          const data = (await res.json()) as Facility[];

          // Respekter kapacitetsfilteret også for forslag
          let capacityFiltered = data;
          if (minCapacity !== null) {
            capacityFiltered = data.filter((f) => {
              const maxCap = parseCapacityMax(f.capacity ?? null);
              return maxCap >= minCapacity;
            });
          }

          if (capacityFiltered.length > 0) {
            if (cancelled) return;
            setSuggestedDate(nextDateStr);
            setSuggestedFacilities(capacityFiltered);
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
          console.error("Failed to fetch teacher suggestions", err);
          setSuggestionsError("Kunne ikke hente alternative tider.");
          setSuggestionsLoading(false);
        }
      }
    };

    findNextAvailableDay();

    return () => {
      cancelled = true;
    };
  }, [searchDate, noSlotsForThisDate, loading, error, minCapacity]);

  // 🔹 Forslag: brug alle typer lokaler, men respekter kapacitetsfilteret
  const suggestedSortedSlots = useMemo(() => {
    if (!suggestedFacilities.length) return [];
    return flattenAndSortSlots(suggestedFacilities);
  }, [suggestedFacilities]);

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

      const successMessage = result.wasAvailableBefore
        ? "Dit lokale er nu booket."
        : "Du har nu overtaget denne booking.";

      setBookingModal({
        title: "Booking gennemført",
        message: successMessage,
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

  // 🔹 Grid helper: forventer slots der allerede er tids-filtreret
  const renderSlotGrid = (slots: ReturnType<typeof flattenAndSortSlots>) => {
    if (slots.length === 0) {
      return (
        <p className="text-sm text-gray-500">
          Ingen bookinger for denne kategori på denne dag med de valgte filtre.
        </p>
      );
    }

    // Group by facility title so each room is visually separated
    const byFacility = slots.reduce<
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

    return (
      <div className="space-y-6">
        {Object.entries(byFacility).map(([facilityTitle, group]) => {
          const capacityLabel = group[0]?.capacity ?? null;

          return (
            <div
              key={facilityTitle}
              className="rounded-lg bg-white/60 p-4"
            >
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
                      capacity={capacityLabel || undefined}
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

      {/* 🔹 Hvis der ikke er nogen bookinger for denne dag (med de valgte filtre) → show tekst + forslag */}
      {!loading && !error && noSlotsForThisDate && (
        <>
          <p className="text-gray-600">
            Der blev ikke fundet nogle bookinger for denne dato med de valgte
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

                  {renderSlotGrid(suggestedSortedSlots)}
                </div>
              )}
          </section>
        </>
      )}

      {/* 🔹 Normal visning når der ER slots for denne dag */}
      {!loading && !error && !noSlotsForThisDate && (
        <div className="space-y-10">
          {filteredSharedSlots.length > 0 && (
            <section className="mt-8 space-y-4 border-t border-gray-200 pt-6 first:mt-0 first:border-t-0 first:pt-0">
              <h2 className="text-lg font-semibold">
                Til studerende og lærere
              </h2>
              {renderSlotGrid(filteredSharedSlots)}
            </section>
          )}

          {filteredTeachingSlots.length > 0 && (
            <section className="mt-8 space-y-4 border-t border-gray-200 pt-6 first:mt-0 first:border-t-0 first:pt-0">
              <h2 className="text-lg font-semibold">
                Kun lærere – undervisningslokaler
              </h2>
              {renderSlotGrid(filteredTeachingSlots)}
            </section>
          )}

          {filteredOpenLearningSlots.length > 0 && (
            <section className="mt-8 space-y-4 border-t border-gray-200 pt-6 first:mt-0 first:border-t-0 first:pt-0">
              <h2 className="text-lg font-semibold">
                Kun lærere – Open Learning
              </h2>
              {renderSlotGrid(filteredOpenLearningSlots)}
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
