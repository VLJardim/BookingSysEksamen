// src/forms/createAccount.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/src/lib/authApi";
import { getErrorMessage } from "@/src/lib/errorMessages";

export default function CreateAccountForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  // Password validation checks
  const hasMinLength = password.length >= 8 && password.length <= 16;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar =
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const isPasswordValid =
    hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!isPasswordValid) {
      setError("Adgangskoden opfylder ikke alle krav");
      return;
    }

    if (password !== confirm) {
      setError("Adgangskoderne matcher ikke");
      return;
    }

    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/login`;

      const result = await register({
        fullName,
        email,
        password,
        redirectTo,
      });

      if (!result.ok) {
        setError(getErrorMessage(result.errorKey));
        return;
      }

      setMessage(
        "Din konto er oprettet. Tjek din e-mail for at bekræfte din konto."
      );

      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      console.error("[CreateAccountForm] Unexpected error", err);
      setError("Der opstod en fejl under oprettelse af kontoen.");
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
          <span className="block text-sm font-medium text-gray-700">
            Fulde navn
          </span>
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
          <span className="block text-sm font-medium text-gray-700">
            E-mail adresse
            <span className="text-red-600"> *</span>
          </span>
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
          <span className="block text-sm font-medium text-gray-700">
            Adgangskode
            <span className="text-red-600"> *</span>
          </span>
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
          <span className="block text-sm font-medium text-gray-700">
            Bekræft adgangskode
            <span className="text-red-600"> *</span>
          </span>
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

      {/* Password requirements (samme som før) */}
      {password && (
        <div className="space-y-2 bg-gray-50 p-4 rounded-md">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Adgangskode skal:
          </p>

          <div
            className={`flex items-center gap-2 text-sm ${
              hasMinLength ? "text-green-600" : "text-gray-500"
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              {hasMinLength ? (
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              ) : (
                <circle cx="10" cy="10" r="2" />
              )}
            </svg>
            <span>Være mellem 8 og 16 tegn</span>
          </div>

          <div
            className={`flex items-center gap-2 text-sm ${
              hasUpperCase && hasLowerCase
                ? "text-green-600"
                : "text-gray-500"
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              {hasUpperCase && hasLowerCase ? (
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              ) : (
                <circle cx="10" cy="10" r="2" />
              )}
            </svg>
            <span>Indeholde både store og små bogstaver</span>
          </div>

          <div
            className={`flex items-center gap-2 text-sm ${
              hasNumber ? "text-green-600" : "text-gray-500"
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              {hasNumber ? (
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              ) : (
                <circle cx="10" cy="10" r="2" />
              )}
            </svg>
            <span>Indeholde mindst ét tal</span>
          </div>

          <div
            className={`flex items-center gap-2 text-sm ${
              hasSpecialChar ? "text-green-600" : "text-gray-500"
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              {hasSpecialChar ? (
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              ) : (
                <circle cx="10" cy="10" r="2" />
              )}
            </svg>
            <span>Indeholde mindst ét specialtegn (f.eks. !@#$%&*)</span>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1864AB] text-white py-2 px-4 rounded-full hover:bg-[#4E7CD9] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed font-medium"
      >
        {loading ? "Opretter..." : "Opret konto"}
      </button>
    </form>
  );
}
