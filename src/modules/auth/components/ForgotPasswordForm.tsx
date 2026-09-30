/**
 * Forgot Password Form Component
 * Allows users to request a password reset when they've forgotten their password
 * Uses Card component pattern matching LoginForm structure
 */

"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForgotPassword } from "@/lib/api/hooks/k2-tax-api/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useForm } from "react-hook-form";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "../lib/schemas";
import { useAuthStore } from "../store/auth.store";

export const ForgotPasswordForm: React.FC = () => {
  const { sendResetEmail, isPending, isSuccess } = useForgotPassword();
  const { error, setSuccess } = useAuthStore();
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });
  console.log("isSuccess from page:", isSuccess, "isPending:", isPending);
  const onSubmit = (data: ForgotPasswordFormData) => {
    // Call API to send password reset email
    // Success screen will show when API returns success (isSuccess = true)
    sendResetEmail({ email: data.email });
  };

  if (isSuccess && !isPending) {
    const email = getValues("email");
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
          </div>
          <CardTitle>Check Your Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              We&apos;ve sent a password recovery link to:
            </p>
            <p className="text-sm font-semibold text-foreground">{email}</p>
          </div>

          <div className="bg-info/10 border border-info/20 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold">Next steps:</p>
            <p>• Click the link in your email to create a new password</p>
            <p>• The link will expire in 24 hours</p>
            <p>• Check your spam folder if you don&apos;t see the email</p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setSuccess(false); // Reset success to show form again
            }}
          >
            Send to a Different Email
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Link href="/login" className="block">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-center mb-2">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary" />
          </div>
        </div>
        <CardTitle className="text-center">Forgot Password?</CardTitle>
        <CardDescription className="text-center">
          No worries! We&apos;ll send you a link to reset your password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              disabled={isPending}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Error Messages */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Recovery Link"
            )}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Remember password?
              </span>
            </div>
          </div>

          {/* Back to Login Link */}
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </form>
      </CardContent>
    </Card>
  );
};

export default ForgotPasswordForm;
