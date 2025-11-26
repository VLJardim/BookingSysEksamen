import CreateAccountForm from "@/src/forms/createAccount";
import React from "react";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow">
        <CreateAccountForm />
      </div>
    </div>
  );
}
