/**
 * Forgot Password Page
 * Accessible at: /auth/forgotpassword
 * Uses ForgotPasswordForm component from src/modules/auth
 */

"use client";

import React from "react";
import { ForgotPasswordForm } from "@/modules/auth/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
