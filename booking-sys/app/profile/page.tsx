'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import getBrowserSupabase from '@/src/lib/supabase';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function getUser() {
      const supabase = getBrowserSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  const handleLogout = async () => {
    const supabase = getBrowserSupabase();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="bg-gray-50 py-8 px-4 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Min profil</h1>
          
          {/* User info card */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold">{user?.user_metadata?.full_name || 'Bruger'}</h2>
                <p className="text-gray-600">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Action cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Change Password Card */}
            <Link href="/profile/change-password">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Skift adgangskode</h3>
                  <p className="text-sm text-gray-600">
                    Gør din adgangskode stærkere, eller skift den, hvis en anden person har kendskab til den.
                  </p>
                </div>
              </div>
            </Link>

            {/* Security Information Card */}
            <Link href="/profile/security-inf">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Sikkerhedsoplysninger</h3>
                  <p className="text-sm text-gray-600">
                    Hold dine bekræftelsesmetoder og sikkerhedsoplysninger opdateret.
                  </p>
                </div>
              </div>
            </Link>

            {/* Log Off Card */}
            <div 
              onClick={handleLogout}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Log af</h3>
                <p className="text-sm text-gray-600">
                  Log ud af din konto
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
