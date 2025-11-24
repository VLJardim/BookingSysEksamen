import BookingForm from "../src/forms/bookingForm";
import React from "react";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <BookingForm />
            </div>
        </div>
    );
}