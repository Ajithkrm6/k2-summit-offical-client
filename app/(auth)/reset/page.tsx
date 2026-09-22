/**
 * Reset Password Page
 * Accessible at: /auth/reset
 * Uses ResetPasswordForm component from src/modules/auth
 */

"use client";

import React from "react";
import { ResetPasswordForm } from "@/modules/auth/components/ResetPasswordForm";

export default function ResetPage() {
  return <ResetPasswordForm />;
}
