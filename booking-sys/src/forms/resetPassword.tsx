"use client";

import { useState } from "react";
import { supabase } from "@/src/lib/supabase";

export default function ResetPasswordForm() {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setMessage("");
		setLoading(true);

		try {
			// Send a password reset email using Supabase
			const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;
			const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

			if (error) throw error;

			setMessage("If an account with that email exists, a password reset link has been sent.");
			setEmail("");
		} catch (err: any) {
			setError(err.message || "Failed to send reset email");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form className="space-y-4" onSubmit={handleSubmit}>
			<h2 className="text-xl font-semibold text-gray-800 mb-4">Nulstil adgangskode</h2>

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
					<span className="block text-sm font-medium text-gray-700">E-mail adresse *</span>
					<input
						type="email"
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="Din e-mail"
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</label>
			</div>

			<button
				type="submit"
				disabled={loading}
				className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
			>
				{loading ? "Sender..." : "Send nulstillingsmail"}
			</button>
		</form>
	);
}
'use client';