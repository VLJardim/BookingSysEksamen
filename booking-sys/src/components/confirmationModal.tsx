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
  onCancel?: () => void;        // 🔹 NY: separat handler til cancel-knappen
  onClose: () => void;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Fortryd",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
  onClose,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const confirmClasses =
    confirmVariant === "danger"
      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
      : "bg-[#1864AB] hover:bg-[#4E7CD9] focus:ring-blue-500";

  const cancelClasses =
    confirmVariant === "danger"
      ? "bg-[#1864AB] hover:bg-[#4E7CD9] focus:ring-blue-500"
      : "bg-red-600 hover:bg-red-700 focus:ring-red-500";

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose} // klik på overlay lukker altid bare
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-xl font-semibold text-gray-900">{title}</h2>
        <p className="mb-6 whitespace-pre-line text-sm text-gray-700">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          {/* Cancel / Fortryd-knap */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
          >
            {cancelLabel}
          </button>

          {/* Bekræft-knap */}
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
