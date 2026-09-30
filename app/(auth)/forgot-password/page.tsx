/**
 * Forgot Password Page
 * Accessible at: /forgot-password
 * Public route - unprotected (part of auth group)
 * Uses ForgotPasswordForm component from src/modules/auth
 */

"use client";

import { ForgotPasswordForm } from "@/modules/auth/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-100">Forgot Password?</h1>
        <p className="mt-2 text-slate-300">
          We&apos;ll help you reset your password
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
