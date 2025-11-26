export type User = {
	id: string; // Auth user id (uuid)
	email: string;
	full_name?: string | null;
	avatar_url?: string | null;
	created_at?: string; // ISO timestamp
};

export type UserRole = 'student' | 'teacher' | 'admin';

export type UserWithRole = User & { role: UserRole };

export default User;

