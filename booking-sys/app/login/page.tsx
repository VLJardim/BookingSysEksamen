import LoginForm from "@/src/forms/loginModule";
import React from "react";

export default function LoginPage() {
  return (
    <div className="py-8 px-20">
      <div className="max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}