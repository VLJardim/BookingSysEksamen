// src/app/teacher-home/[search]/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import BookingCard from "@/src/components/bookingCard";
import getBrowserSupabase from "@/src/lib/supabase";
import ConfirmationModal from "@/src/components/confirmationModal";
import { formatBookingInterval, formatSearchDateLabel } from "@/src/utils/time";

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

const parseFloor = (floor?: string | null) => {
  if (!floor) return 999;
  const n = parseInt(floor, 10);
  return Number.isNaN(n) ? 999 : n;
};

const isTeacherOnlyFacility = (f: Facility) => {
  const desc = (f.description || "").toLowerCase();
  const type = (f.facility_type || "").toLowerCase();

  const isTeacherOnlyDesc =
    desc.includes("kun lærere") || desc.includes("kun laerere");

  const isTeacherOnlyType =
    type === "open learning" || type === "undervisning";

  return isTeacherOnlyDesc || isTeacherOnlyType;
};

export default function TeacherSearchPage() {
  const params = useParams<RouteParams>();
  const rawSearch = params.search;
  const searchDate =
    Array.isArray(rawSearch) ? rawSearch[0] : rawSearch || "";

  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [bookingModal, setBookingModal] =
    useState<BookingModalConfig | null>(null);

  // Hent alle slots (både ledige og bookede) for lærere
  useEffect(() => {
    if (!searchDate) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/search?date=${encodeURIComponent(
            searchDate
          )}&mode=teacher`
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

  const { sharedFacilities, teacherOnlyFacilities } = useMemo(() => {
    const shared = facilities
      .filter((f) => !isTeacherOnlyFacility(f))
      .sort((a, b) => parseFloor(a.floor) - parseFloor(b.floor));

    const teacherOnly = facilities
      .filter((f) => isTeacherOnlyFacility(f))
      .sort((a, b) => parseFloor(a.floor) - parseFloor(b.floor));

    return { sharedFacilities: shared, teacherOnlyFacilities: teacherOnly };
  }, [facilities]);

  // Book / override slot direkte via Supabase
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

      // 🔹 Hent nuværende booking
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

      // 🔹 Forsøg at sætte role = not_available og owner = lærerens id
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

      // Succes – fjern slot fra UI
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

  const headerDate = formatSearchDateLabel(searchDate);

  const renderFacilityGroup = (
    title: string,
    list: Facility[]
  ) => {
    if (list.length === 0) return null;

    return (
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">{title}</h2>

        <div className="space-y-8">
          {list.map((facility) => (
            <section key={facility.facility_id}>
              <h3 className="mb-1 text-xl font-semibold">
                {facility.title}
              </h3>

              {facility.description && (
                <p className="mb-1 text-gray-600">
                  {facility.description}
                </p>
              )}

              {facility.slots.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Ingen bookinger for dette lokale denne dag.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {facility.slots.map((slot) => {
                    const { dateLabel, timeLabel } =
                      formatBookingInterval(
                        slot.starts_at,
                        slot.ends_at ?? null
                      );

                    const isAvailable = slot.role === "available";

                    return (
                      <BookingCard
                        key={slot.booking_id}
                        bookingId={slot.booking_id}
                        roomName={facility.title}
                        date={dateLabel}
                        time={timeLabel}
                        onBook={handleBookSlot}
                        actionLabel={
                          isAvailable
                            ? "Book dette tidsrum"
                            : "Overtag booking"
                        }
                        notice={
                          !isAvailable
                            ? "Allerede booket – klik for at overtage bookingen."
                            : undefined
                        }
                      />
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      </section>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8">
        <h1 className="mb-2 text-2xl font-bold">
          Lokaler og bookinger
        </h1>
        <p className="text-gray-600">
          Dato:{" "}
          <span className="font-medium">{headerDate}</span>
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Blå knapper = ledige tider. Når et kort er markeret som
          allerede booket, kan du forsøge at overtage bookingen.
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
          {renderFacilityGroup(
            "Til studerende og lærere",
            sharedFacilities
          )}
          {renderFacilityGroup("Kun lærere", teacherOnlyFacilities)}
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
