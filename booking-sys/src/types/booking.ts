export type Booking = {
	booking_id: string; // uuid
	title: string;
	role?: 'available' | 'not_available';
	starts_at: string; // ISO timestamp
	ends_at?: string | null; // ISO timestamp or null
	owner: string; // user id (uuid)
	facility_id?: string | null; // optional facility/room id
	created_at?: string;
};

export type BookingCreate = Omit<Booking, 'booking_id' | 'created_at' | 'owner'> & {
	owner?: string; // server will set owner if omitted
};

export type BookingUpdate = Partial<BookingCreate>;

export default Booking;

