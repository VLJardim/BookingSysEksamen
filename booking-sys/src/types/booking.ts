// src/types/booking.ts

export type BookingRole = 'available' | 'not_available';

export type Booking = {
  booking_id: string;              // uuid
  title: string;
  role: BookingRole;              // i DB er den altid sat, ikke valgfri
  starts_at: string;              // ISO timestamp
  ends_at: string | null;         // i DB: NULL eller timestamp (ikke undefined)
  owner: string;                  // user id (uuid)
  facility_id: string | null;     // kan være NULL, men kolonnen findes altid
  created_at?: string;            // sættes af DB, derfor ok at lade den være optional i TS
};

// Payload når du opretter booking fra appen
export type BookingCreate = Omit<
  Booking,
  'booking_id' | 'created_at' | 'owner' | 'role'
> & {
  owner?: string;                 // server sætter owner hvis udeladt
  role?: BookingRole;             // server/DB default'er til 'available' hvis udeladt
};

export type BookingUpdate = Partial<BookingCreate>;

export default Booking;
