'use client';

import BookingForm from "@/src/forms/bookingForm";
import React from "react";
import { Group, Text } from "@mantine/core";
import Link from "next/link";
import { useState, useEffect } from "react";
import getBrowserSupabase from "@/src/lib/supabase";

export default function HomePage() {

    const [bookings, setBookings] = useState<any[]>([]);

    useEffect(() => {
        async function fetchBookings() {
            const supabase = getBrowserSupabase();
            const { data, error } = await supabase
                .from('booking')
                .select('*')
                .order('starts_at', { ascending: true })
                .limit(3);

            if (data) setBookings(data);
        }

        fetchBookings();
    }, []); 

    return (
        <div className="flex">
            <div className="flex-1 py-8 px-20">
                <div>
                    <BookingForm />
                </div>
            </div>

            <div className="w-80 bg-white p-6">
                <h2 className="text-xl font-bold mb-4">Kommende bookinger</h2>
                {bookings.length === 0 ? (
                    <p className="text-gray-500">Ingen kommende bookinger</p>
                ) : (
                    bookings.map((booking) => (
                        <Link 
                            href={`/student-home/${booking.booking_id}`} 
                            key={booking.booking_id}
                            className="block mb-4 p-4 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
                        >
                            <p className="font-semibold">{booking.title}</p>
                            <p className="text-sm text-gray-600">Start: {new Date(booking.starts_at).toLocaleString('da-DK')}</p>
                            <p className="text-sm text-gray-600">Slut: {booking.ends_at ? new Date(booking.ends_at).toLocaleString('da-DK') : 'Ikke angivet'}</p>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}