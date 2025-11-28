// app/home/[search]/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import NavBar from "@/src/components/navBar";
import BookingCard from "@/src/components/bookingCard";
import getBrowserSupabase from "@/src/lib/supabase";
import ConfirmationModal from "@/src/components/confirmationModal";

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
  slots: Slot[];
};

type Role = "student" | "teacher" | null;

export default function SearchPage() {
  const params = useParams<RouteParams>();
  const rawSearch = params.search;
  const searchDate =
    Array.isArray(rawSearch) ? rawSearch[0] : rawSearch || "";

  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);

  // modal til feedback efter booking / fejl
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    confirmColor: "blue" | "red";
  }>({
    title: "",
    message: "",
    confirmLabel: "OK",
    confirmColor: "blue",
  });

  // 1) Hent brugerens rolle (student/teacher) fra userlist via Supabase
  useEffect(() => {
    const supabase = getBrowserSupabase();

    const loadRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRole(null);
        return;
      }

      const { data } = await supabase
        .from("userlist")
        .select("user_role")
        .eq("user_id", user.id)
        .maybeSingle();

      const r = (data?.user_role as Role | undefined) ?? "student";
      setRole(r);
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

  // 4) Booking af et slot → ændrer row i Supabase & viser modal
  const handleBookSlot = async (bookingId: string) => {
    try {
      const supabase = getBrowserSupabase();
      setError(null);

      // tjek om bruger er logget ind
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setModalConfig({
          title: "Ikke logget ind",
          message: "Du skal være logget ind for at booke et lokale.",
          confirmLabel: "OK",
          confirmColor: "blue",
        });
        setModalOpen(true);
        return;
      }

      // forsøg at markere slot som booket
      const { data, error } = await supabase
        .from("booking")
        .update({
          role: "not_available",
          owner: user.id,
        })
        .eq("booking_id", bookingId)
        .eq("role", "available") // beskytter mod dobbelt-booking
        .select("booking_id")
        .maybeSingle();

      if (error || !data) {
        console.error("Booking error", error);
        setModalConfig({
          title: "Kunne ikke booke",
          message:
            "Tidsrummet kunne ikke bookes. Det kan være, at en anden allerede har taget det.",
          confirmLabel: "OK",
          confirmColor: "red",
        });
        setModalOpen(true);
        return;
      }

      // fjern slot fra listen i UI'et
      setFacilities((prev) =>
        prev.map((f) => ({
          ...f,
          slots: f.slots.filter((s) => s.booking_id !== bookingId),
        }))
      );

      // vis succes-modal
      setModalConfig({
        title: "Booking gennemført",
        message:
          "Dit lokale er nu booket. Du kan se det under 'Mine bookinger'.",
        confirmLabel: "OK",
        confirmColor: "blue",
      });
      setModalOpen(true);
    } catch (err) {
      console.error("Uventet booking-fejl:", err);
      setModalConfig({
        title: "Fejl",
        message: "Der skete en uventet fejl under booking. Prøv igen.",
        confirmLabel: "OK",
        confirmColor: "red",
      });
      setModalOpen(true);
    }
  };

  // 5) Render UI
  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <NavBar />

        <main className="flex-1 p-8">
          <header className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Find ledige lokaler</h1>
            <p className="text-gray-600">
              Søgeresultat for:{" "}
              <span className="font-medium">{searchDate}</span>
            </p>
          </header>

          {loading && <p>Henter ledige tider...</p>}
          {error && <p className="text-red-600 mb-4">Fejl: {error}</p>}

          {!loading && !error && visibleFacilities.length === 0 && (
            <p className="text-gray-600">
              Der blev ikke fundet ledige lokaler på denne dato.
            </p>
          )}

          {!loading && !error && visibleFacilities.length > 0 && (
            <div className="space-y-10">
              {visibleFacilities.map((facility) => (
                <section key={facility.facility_id}>
                  <h2 className="text-xl font-semibold mb-1">
                    {facility.title}
                  </h2>

                  {facility.description && (
                    <p className="text-gray-600 mb-1">
                      {facility.description}
                    </p>
                  )}

                  {facility.capacity && (
                    <p className="text-gray-500 text-sm mb-4">
                      Kapacitet: {facility.capacity}
                    </p>
                  )}

                  {facility.slots.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      Ingen ledige tider for dette lokale.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {facility.slots.map((slot) => {
                        const start = new Date(slot.starts_at);
                        const end = slot.ends_at
                          ? new Date(slot.ends_at)
                          : null;

                        const dateLabel = start.toLocaleDateString("da-DK", {
                          weekday: "short",
                          day: "2-digit",
                          month: "2-digit",
                        });

                        const timeLabel =
                          start.toLocaleTimeString("da-DK", {
                            hour: "2-digit",
                            minute: "2-digit",
                          }) +
                          (end
                            ? " - " +
                              end.toLocaleTimeString("da-DK", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "");

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
        </main>
      </div>

      <ConfirmationModal
        open={modalOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmLabel={modalConfig.confirmLabel}
        cancelLabel="Luk"
        confirmColor={modalConfig.confirmColor}
        onConfirm={() => setModalOpen(false)}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
