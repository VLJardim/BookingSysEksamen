'use client';

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import NavBar from "@/src/components/navBar";
import { supabase } from "@/src/lib/supabase";
import BookingCard from "@/src/components/bookingCard";

export default function BookingDetailsPage({ params }: { params: { bookingId: string } }) {
    const [booking, setBooking] = useState<any>(null);
    const bookingId = params.bookingId;

    useEffect(() => {
        async function fetchBooking() {
            const { data, error } = await supabase
                .from('booking')
                .select('*')
                .eq('booking_id', bookingId)
                .single();

            if (error) {
                console.error("Error fetching booking:", error);
            } else {
                setBooking(data);
            }
        }

        fetchBooking();
    }, [bookingId]);
    
    return (
        <div className="flex min-h-screen">
            <NavBar />

            <div className="flex-1 py-8 px-20">
                {booking ? (
                    <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl">
                        <h1 className="text-3xl font-bold mb-6">{booking.title}</h1>
                        
                        <div className="space-y-4">
                            <div>
                                <p className="text-gray-600 text-sm">Start tid</p>
                                <p className="text-lg">{new Date(booking.starts_at).toLocaleString('da-DK')}</p>
                            </div>
                            
                            <div>
                                <p className="text-gray-600 text-sm">Slut tid</p>
                                <p className="text-lg">
                                    {booking.ends_at ? new Date(booking.ends_at).toLocaleString('da-DK') : 'Ikke angivet'}
                                </p>
                            </div>
                            
                            <div className="flex gap-4 mt-8">
                                <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                                    Rediger
                                </button>
                                <button className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700">
                                    Annuller booking
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p>Indlæser...</p>
                )}
            </div>
        </div>
    );
}