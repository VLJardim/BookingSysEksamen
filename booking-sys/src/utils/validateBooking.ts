import { bookingCreateSchema } from "../lib/schemas/dbSchemas";

type ValidationResult<T> = {
	valid: boolean;
	errors?: string[];
	data?: T;
};

/**
 * Validate a booking payload on the client before sending to the server.
 * Uses the same Zod schema as the server for consistency, and adds a
 * semantic check that start < end when both are provided.
 */
export function validateBooking(payload: unknown): ValidationResult<any> {
	const parsed = bookingCreateSchema.safeParse(payload);

		if (!parsed.success) {
			// Use Zod's flatten() to get fieldErrors and formErrors in a structured way.
			const flat = parsed.error.flatten();

			// Collect top-level form errors first
			const errors: string[] = [];
			if (Array.isArray(flat.formErrors) && flat.formErrors.length) {
				errors.push(...flat.formErrors.map(String));
			}

			// Then include field-specific errors (object values may be arrays)
			const fieldErrors = (flat.fieldErrors || {}) as Record<string, string[] | undefined>;
			for (const key of Object.keys(fieldErrors)) {
				const val = fieldErrors[key];
				if (Array.isArray(val) && val.length) {
					val.forEach((m) => errors.push(`${key}: ${m}`));
				}
			}

			return { valid: false, errors: errors.length ? errors : ['Invalid payload'] };
		}

	const data = parsed.data;

	// Semantic check: if both start_time and end_time exist, ensure ordering
	if (data.start_time && data.end_time) {
		const start = new Date(data.start_time);
		const end = new Date(data.end_time);
		if (isNaN(start.getTime()) || isNaN(end.getTime())) {
			return { valid: false, errors: ['start_time or end_time is not a valid date'] };
		}
		if (start >= end) {
			return { valid: false, errors: ['start_time must be before end_time'] };
		}
	}

	return { valid: true, data };
}

export default validateBooking;

