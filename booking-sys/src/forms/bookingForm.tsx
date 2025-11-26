'use client';

// Generate time options in 15-minute intervals
const generateTimeOptions = () => {
    const times = [];
    for (let hour = 8; hour < 16; hour++) {
        for (let minute of [0, 15, 30, 45]) {
            const hourStr = hour.toString().padStart(2, '0');
            const minStr = minute.toString().padStart(2, '0');
            times.push(`${hourStr}:${minStr}`);
        }
    }
    return times;
};

export default function BookingForm() {
    const timeOptions = generateTimeOptions();
    
    return (
        <div>
            <form className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Book et lokale</h2>

                <div className="space-y-2">
                    <span className="block text-sm font-medium text-gray-700 mb-1">Dato *</span>
                    <small className="block text-xs text-gray-600 mb-2">OBS! Du kan kun booke et lokale i hverdage mellem 8-16.</small>
                    <div className="cursor-pointer" onClick={(e) => {
                        const input = e.currentTarget.querySelector('input');
                        input?.showPicker?.();
                    }}>
                        <input 
                            type="date" 
                            required 
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                        />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <label className="block">
                        <span className="block text-sm font-medium text-gray-700 mb-1">Starttidspunkt</span>
                        <small className="block text-xs text-gray-600 mb-2">OBS! Du kan maks booke et lokale i 4 timer.</small>
                        <select 
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Vælg tidspunkt</option>
                            {timeOptions.map(time => (
                                <option key={`start-${time}`} value={time}>{time}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="space-y-2">
                    <label className="block">
                        <span className="block text-sm font-medium text-gray-700 mb-1">Sluttidspunkt</span>
                        <small className="block text-xs text-gray-600 mb-2">OBS! Du kan maks booke et lokale i 4 timer.</small>
                        <select 
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Vælg tidspunkt</option>
                            {timeOptions.map(time => (
                                <option key={`end-${time}`} value={time}>{time}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="space-y-2">
                    <label className="block">
                        <span className="block text-sm font-medium text-gray-700 mb-1">Kapacitet</span>
                        <select 
                            defaultValue="4-8"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="" disabled>Vælg kapacitet</option>
                            <option value="1">1</option>
                            <option value="2-4">2-4</option>
                            <option value="4-8">4-8</option>
                            <option value="8+">8+</option>
                        </select>
                    </label>
                </div>

                <button 
                    type="submit" 
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                >
                    Søg
                </button>
            </form>

            {/* TODO: Render upcoming bookings here */}
        </div>
    )
}