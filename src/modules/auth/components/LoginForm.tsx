/**
 * Login Form Component
 * Example form using react-hook-form + Zod validation
 * Shows form handling patterns and error display
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
import { useLogin } from "@/lib/api/hooks/k2-tax-api/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginFormData } from "../lib/schemas";
import { useAuthStore } from "../store/auth.store";

export const LoginForm: React.FC = () => {
  const { login, isPending } = useLogin();
  const { error } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    // Hook handles redirect and error - no need for try/catch or manual routing
    login({ email: data.email, password: data.password });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
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

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              disabled={isPending}
            />
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
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
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>

          {/* Forgot Password Link */}
          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Forgot password?
            </Link>
          </div>
        </form>

        <p className="mt-6 font-semibold">Demo Credentials Note</p>
        <div className="mt-6 rounded-md bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <p className="font-semibold">Demo Credentials:</p>
          <p>Role:Sales Representative</p>
          <p>
            Email:{" "}
            <span className="font-mono font-bold">
              michael.anderson@yopmail.com
            </span>
          </p>
          <p>
            Password:<span className="font-mono font-bold"> Anderson@123</span>
          </p>
          <p>Role:Admin</p>
          <p>
            Email:{" "}
            <span className="font-mono font-bold">
              john.anderson@example.com
            </span>
          </p>
          <p>
            Password:
            <span className="font-mono font-bold"> John@2026Secure!</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
