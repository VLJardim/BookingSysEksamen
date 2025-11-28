// src/components/confirmationModal.tsx
"use client";

import React from "react";

type ConfirmationModalProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: "red" | "blue";
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmationModal({
  open,
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Annuller",
  confirmColor = "blue",
  onConfirm,
  onClose,
}: ConfirmationModalProps) {
  if (!open) return null;

  const confirmClasses =
    confirmColor === "red"
      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
      : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        {title && (
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            {title}
          </h2>
        )}

        <p className="mb-6 text-sm text-gray-700">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 ${confirmClasses}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
