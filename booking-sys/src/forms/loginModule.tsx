'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import getBrowserSupabase from '@/src/lib/supabase';

// Vi fortæller TypeScript hvordan en række fra userlist ser ud
type UserRoleRow = {
  role: 'student' | 'teacher';
};

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = getBrowserSupabase();

      // 1) Log brugeren ind
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const user = data.user;
      if (!user) {
        throw new Error('Kunne ikke finde bruger efter login.');
      }

      // 2) Hent rolle fra userlist (DB er "source of truth")
      const { data: userlistRow, error: userlistError } = await supabase
        .from('userlist')
        .select('role')
        .eq('id', user.id)
        .maybeSingle<UserRoleRow>(); // <-- vigtig ændring

      if (userlistError) {
        console.error(userlistError);
        throw new Error('Kunne ikke hente brugerens rolle.');
      }

      const role = userlistRow?.role;

      // 3) Redirect baseret på rolle
      if (role === 'teacher') {
        router.push('/teacher-home');
      } else if (role === 'student') {
        router.push('/student-home');
      } else {
        throw new Error('Brugeren har ingen gyldig rolle tilknyttet.');
      }
<<<<<<< HEAD
=======

>>>>>>> fa3c4a94afaf776eace27b434b721bb90ce06c7e
    } catch (err: any) {
      setError(err.message || 'Login fejlede.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Velkommen tilbage!
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="block">
          <small className="text-xs text-gray-600">
            Denne e-mail skal være tilknyttet en uddannelse.
          </small>
          <span className="block text-sm font-medium text-gray-700 mt-1">
            E-mail adresse *
          </span>
          <input
            type="email"
            placeholder="E-mail adresse"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </label>
      </div>

<<<<<<< HEAD
      <div className="space-y-2">
        <label className="block">
          <span className="block text-sm font-medium text-gray-700">
            Adgangskode *
          </span>
          <input
            type="password"
            placeholder="Adgangskode"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </label>
      </div>
=======
        <div className="flex gap-4">
            <button 
                type="submit"
                disabled={loading}
                className="bg-[#6B8CAE] text-white py-3 px-8 rounded-full hover:bg-[#5A7A9A] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
                {loading ? 'Logger ind...' : 'Log ind'}
            </button>
>>>>>>> fa3c4a94afaf776eace27b434b721bb90ce06c7e

      <a href="#" className="text-sm text-blue-600 hover:text-blue-800 block">
        Har du glemt din adgangskode?
      </a>

      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">
          Husk oplysninger i 30 dage
        </span>
      </label>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-3 px-8 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Logger ind...' : 'Log ind'}
        </button>

        <button
          type="button"
          onClick={() => (window.location.href = '/register')}
          className="bg-gray-600 text-white py-3 px-8 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          Opret ny konto
        </button>
      </div>
    </form>
  );
}
