'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SecurityInfoPage() {
  const [recoveryMethod, setRecoveryMethod] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const router = useRouter();

  const handleAddMethod = () => {
    if (selectedMethod) {
      setRecoveryMethod(selectedMethod);
      setIsEditing(false);
      // Here you would save to the database
    }
  };

  return (
    <div className="bg-gray-50 py-8 px-4 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={() => router.back()}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Tilbage
          </button>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold mb-2">Sikkerhedsoplysninger</h1>
            <p className="text-gray-600 mb-8">
              Disse metoder bruges for at få adgang til din konto, hvis du ikke kan bruge din adgangskode.
            </p>

            {/* Add login method section */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Tilføj loginmetode</h2>
              
              {!isEditing && !recoveryMethod ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <p className="text-gray-500 mb-4">Har du ikke en adgangskode? - Opsæt én!</p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Tilføj logonmetode
                  </button>
                </div>
              ) : null}

              {isEditing && (
                <div className="border border-gray-300 rounded-lg p-6">
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Adgangskode
                  </label>
                  <select
                    value={selectedMethod}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  >
                    <option value="">Vælg metode</option>
                    <option value="email">Email</option>
                    <option value="phone">Telefonnummer</option>
                    <option value="authenticator">Godkendelses-app</option>
                  </select>

                  <div className="flex gap-3">
                    <button
                      onClick={handleAddMethod}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Tilføj
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedMethod('');
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                      Annuller
                    </button>
                  </div>
                </div>
              )}

              {recoveryMethod && !isEditing && (
                <div className="border border-gray-300 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">Gendannelsesmetode</p>
                    <p className="text-sm text-gray-600">{recoveryMethod}</p>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Rediger
                  </button>
                </div>
              )}
            </div>

            {/* Session info */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-4">Senest opdateret</h2>
              <p className="text-gray-600 text-sm">
                Senest opdateret: 5 måneder siden
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}
