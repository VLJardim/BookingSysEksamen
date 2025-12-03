// src/components/confirmationModal.tsx
"use client";

import React from "react";

type ConfirmationVariant = "primary" | "danger";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ConfirmationVariant;
  onConfirm?: () => void;
  onClose: () => void;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Annullér",
  confirmVariant = "primary",
  onConfirm,
  onClose,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const confirmClasses =
    confirmVariant === "danger"
      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
      : "bg-[#1864AB] hover:bg-[#4E7CD9] focus:ring-blue-500";

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-xl font-semibold text-gray-900">{title}</h2>
        <p className="mb-6 text-sm text-gray-700 whitespace-pre-line">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            className={`rounded-full px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 transition-colors ${confirmClasses}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
