'use client';

export default function LoginForm() {
  return (
    <form className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Velkommen tilbage!</h2>
        
        <div className="space-y-2">
            <label className="block">
                <small className="text-xs text-gray-600">Denne e-mail skal være tilknyttet en uddannelse.</small>
                <span className="block text-sm font-medium text-gray-700 mt-1">E-mail adresse *</span>
                <input 
                    type="email" 
                    placeholder="E-mail adresse" 
                    required 
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </label>
        </div>

        <div className="space-y-2">
            <label className="block">
                <span className="block text-sm font-medium text-gray-700">Adgangskode *</span>
                <input 
                    type="password" 
                    placeholder="Adgangskode" 
                    required 
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </label>
        </div>

        <a href="#" className="text-sm text-blue-600 hover:text-blue-800 block">
            Har du glemt din adgangskode?
        </a>
        
        <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-700">Husk oplysninger i 30 dage</span>
        </label>

        <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
            Log ind
        </button>

        <button 
            type="button" 
            onClick={() => window.location.href = '/register'}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
            Opret ny konto
        </button>
    </form>
    )
    }