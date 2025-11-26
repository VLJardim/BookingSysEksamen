'use client';
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import NavBar from "@/src/components/navBar";
import { supabase } from "@/src/lib/supabase";
import { useRouter } from "next/navigation";
import BookingCard from "@/src/components/bookingCard";
import Link from "next/link";

export default function MyBookingsPage() {
    const [userId, setUserId] = useState<string | null>(null);
    const [bookings, setBookings] = useState<any[]>([]);

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
            }
        }
        getUser();
    }, []);

    useEffect(() => {
        if (!userId) return;

        async function fetchBookings() {
            const { data, error } = await supabase
                .from('booking')
                .select('*')
                .eq('owner', userId)
                .order('starts_at', { ascending: true });

            if (error) {
                console.error("Error fetching bookings:", error);
            } else {
                setBookings(data || []);
            }
        }
        fetchBookings();
    }, [userId]);

    return (
        <div className="flex min-h-screen">
            <NavBar />
            
            <div className="flex-1 bg-gray-50 py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6">Mine bookinger</h1>
                    
                    {bookings.length === 0 ? (
                        <p className="text-gray-500">Du har ingen bookinger</p>
                    ) : (
                        <div className="grid gap-4">
                            {bookings.map((booking) => (
                                <Link 
                                    href={`/my-bookings/${booking.booking_id}`}
                                    key={booking.booking_id}
                                    className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                                >
                                    <h3 className="text-xl font-semibold mb-2">{booking.title}</h3>
                                    <p className="text-gray-600">Start: {new Date(booking.starts_at).toLocaleString('da-DK')}</p>
                                    <p className="text-gray-600">Slut: {booking.ends_at ? new Date(booking.ends_at).toLocaleString('da-DK') : 'Ikke angivet'}</p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}