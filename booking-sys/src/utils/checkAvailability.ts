type BookingLike = {
	booking_id?: string | number;
	room_id?: string | number;
	start_time: string; // ISO datetime
	end_time?: string | null; // ISO datetime or null
};

/**
 * Returns true if two time intervals overlap.
 * Intervals are [start, end). If end is missing/null, treat as open-ended and consider overlap.
 */
export function intervalsOverlap(aStart: string, aEnd: string | null | undefined, bStart: string, bEnd: string | null | undefined): boolean {
	const as = new Date(aStart).getTime();
	const ae = aEnd ? new Date(aEnd).getTime() : Infinity;
	const bs = new Date(bStart).getTime();
	const be = bEnd ? new Date(bEnd).getTime() : Infinity;

	if (isNaN(as) || isNaN(bs) || isNaN(ae) && aEnd !== undefined && aEnd !== null || isNaN(be) && bEnd !== undefined && bEnd !== null) {
		// invalid dates - treat as not overlapping conservatively
		return false;
	}

	return as < be && bs < ae;
}

/**
 * Given a list of existing bookings and a candidate interval, return conflicting bookings (same room).
 * If `roomId` is omitted, conflicts across all rooms will be returned.
 * `excludeBookingId` can be used when updating an existing booking to ignore itself.
 */
export function findConflicts(
	existing: BookingLike[],
	candidateStart: string,
	candidateEnd: string,
	roomId?: string | number,
	excludeBookingId?: string | number
): BookingLike[] {
	return existing.filter((b) => {
		if (excludeBookingId && b.booking_id && String(b.booking_id) === String(excludeBookingId)) return false;
		if (roomId !== undefined && b.room_id !== undefined && String(b.room_id) !== String(roomId)) return false;

		return intervalsOverlap(b.start_time, b.end_time ?? null, candidateStart, candidateEnd ?? null);
	});
}

export function isAvailable(
	existing: BookingLike[],
	candidateStart: string,
	candidateEnd: string,
	roomId?: string | number,
	excludeBookingId?: string | number
): boolean {
	const conflicts = findConflicts(existing, candidateStart, candidateEnd, roomId, excludeBookingId);
	return conflicts.length === 0;
}

export default isAvailable;

