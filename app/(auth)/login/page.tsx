/**
 * Login Page
 * Accessible at: /auth/login
 * Uses LoginForm component from src/modules/auth
 */

"use client";

import React from "react";
import { LoginForm } from "@/modules/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-100">Welcome Back</h1>
        <p className="mt-2 text-slate-300">
          Sign in to your account to continue
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
