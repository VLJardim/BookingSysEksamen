// src/app/student-home/[search]/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
  slots: Slot[];
};

// Rolle-typen for brugere (userlist.role)
type UserRole = "student" | "teacher";
type UserRoleState = UserRole | null;

// Minimal shape af en række i userlist-tabellen
type UserListRow = {
  role: UserRole;
};

type BookingModalConfig = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

// Hjælper til at vise tid præcis som i DB (ignorerer timezone)
// Forventer ISO string: "YYYY-MM-DDTHH:MM:SS..."
function formatTimeRange(startsAt: string, endsAt?: string | null) {
  const startHM = startsAt.slice(11, 16); // "HH:MM"
  const endHM = endsAt ? endsAt.slice(11, 16) : "";
  return endHM ? `${startHM} - ${endHM}` : startHM;
}

export default function SearchPage() {
  const params = useParams<RouteParams>();
  const rawSearch = params.search;
  const searchDate =
    Array.isArray(rawSearch) ? rawSearch[0] : rawSearch || "";

  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<UserRoleState>(null);

  // Modal state for booking success / failure
  const [bookingModal, setBookingModal] =
    useState<BookingModalConfig | null>(null);

  // 1) Hent brugerens rolle (student/teacher) fra userlist via Supabase (client-side)
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

      // Simpelt call uden at slås med Supabase generics
      const { data, error } = await (supabase as any)
        .from("userlist")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (error || !data) {
        // Hvis der ikke findes en række i userlist, falder vi bare tilbage til student
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

  // 2) Hent alle ledige lokaler for den valgte dato via vores API (/api/search)
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

  // 3) Filtrer lærer-områder fra, hvis brugeren er student
  const visibleFacilities = useMemo(() => {
    if (role !== "student") return facilities;

    return facilities.filter((f) => {
      const desc = (f.description || "").toLowerCase();
      const type = (f.facility_type || "").toLowerCase();

      const isTeacherOnlyDesc =
        desc.includes("kun lærere") || desc.includes("kun laerere");

      const isTeacherOnlyType =
        type === "open learning" || type === "undervisning";

      if (isTeacherOnlyDesc || isTeacherOnlyType) return false;
      return true;
    });
  }, [facilities, role]);

  // 4) Book slot direkte via Supabase (ingen API-route, ingen cookies i din kode)
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

      // 1) Fetch current row
      const {
        data: existingData,
        error: fetchError,
      } = await (supabase as any)
        .from("booking")
        .select("booking_id, role, owner")
        .eq("booking_id", bookingId)
        .maybeSingle();

      console.log("[BOOK] existing row:", { existingData, fetchError });

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

      // 2) Try to book (update)
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

      console.log("[BOOK] update result:", { updatedData, updateError });

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

      // 3) Remove from UI
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
        message: "Dit lokale er nu booket. Du kan se det under 'My Bookings'.",
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

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8">
        <h1 className="mb-2 text-2xl font-bold">Find ledige lokaler</h1>
        <p className="text-gray-600">
          Søgeresultat for:{" "}
          <span className="font-medium">{searchDate}</span>
        </p>
      </header>

      {loading && <p>Henter ledige tider...</p>}
      {error && <p className="mb-4 text-red-600">Fejl: {error}</p>}

      {!loading && !error && visibleFacilities.length === 0 && (
        <p className="text-gray-600">
          Der blev ikke fundet ledige lokaler på denne dato.
        </p>
      )}

      {!loading && !error && visibleFacilities.length > 0 && (
        <div className="space-y-10">
          {visibleFacilities.map((facility) => (
            <section key={facility.facility_id}>
              <h2 className="mb-1 text-xl font-semibold">
                {facility.title}
              </h2>

              {facility.description && (
                <p className="mb-1 text-gray-600">
                  {facility.description}
                </p>
              )}

              {facility.capacity && (
                <p className="mb-4 text-sm text-gray-500">
                  Kapacitet: {facility.capacity}
                </p>
              )}

              {facility.slots.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Ingen ledige tider for dette lokale.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {facility.slots.map((slot) => {
                    const start = new Date(slot.starts_at);
                    const end = slot.ends_at ? new Date(slot.ends_at) : null;

                    const dateLabel = start.toLocaleDateString("da-DK", {
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                    });

                    const timeLabel = formatTimeRange(
                      slot.starts_at,
                      slot.ends_at ?? null
                    );

                    return (
                      <BookingCard
                        key={slot.booking_id}
                        bookingId={slot.booking_id}
                        roomName={facility.title}
                        date={dateLabel}
                        time={timeLabel}
                        onBook={handleBookSlot}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {/* Booking success / error modal */}
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
