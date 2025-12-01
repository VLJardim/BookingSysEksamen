"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import getBrowserSupabase from "@/src/lib/supabase";

export default function CreateAccountForm() {
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setMessage("");

		if (password.length < 6) {
			setError("Password must be at least 6 characters");
			return;
		}

		if (password !== confirm) {
			setError("Passwords do not match");
			return;
		}

		setLoading(true);
		try {
			const supabase = getBrowserSupabase();
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
				options: { data: { full_name: fullName } },
			} as any);

			if (error) throw error;

			// Depending on Supabase settings, user may need to verify email.
			setMessage("Account created. Check your email to confirm your account.");
			// Optionally redirect to login after a short delay
			setTimeout(() => router.push('/login'), 2000);
		} catch (err: any) {
			setError(err.message || "Failed to create account");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form className="space-y-4" onSubmit={handleSubmit}>
			<h2 className="text-xl font-semibold text-gray-800 mb-4">Opret konto</h2>

			{message && (
				<div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
					{message}
				</div>
			)}

			{error && (
				<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
					{error}
				</div>
			)}

			<div>
				<label className="block">
					<span className="block text-sm font-medium text-gray-700">Fulde navn</span>
					<input
						type="text"
						value={fullName}
						onChange={(e) => setFullName(e.target.value)}
						placeholder="Dit navn"
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</label>
			</div>

			<div>
				<label className="block">
					<span className="block text-sm font-medium text-gray-700">E-mail adresse *</span>
					<input
						type="email"
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="E-mail adresse"
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</label>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<label className="block">
					<span className="block text-sm font-medium text-gray-700">Adgangskode *</span>
					<input
						type="password"
						required
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Adgangskode"
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</label>

				<label className="block">
					<span className="block text-sm font-medium text-gray-700">Bekræft adgangskode *</span>
					<input
						type="password"
						required
						value={confirm}
						onChange={(e) => setConfirm(e.target.value)}
						placeholder="Gentag adgangskode"
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</label>
			</div>

			<button
				type="submit"
				disabled={loading}
				className="w-full bg-[#1864AB] text-white py-2 px-4 rounded-md hover:bg-[#4E7CD9] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
			>
				{loading ? "Opretter..." : "Opret konto"}
			</button>
		</form>
	);
}

