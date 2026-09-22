/**
 * Welcome Page
 * Clean, professional landing page with proper gradient and spacing
 * Version is dynamically loaded from package.json
 */

"use client";

import React from "react";
import { Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@base-ui/react";

export default function WelcomePage() {
  const features = [
    "Governed intake, exception handling, and audit history",
    "Strategy screening backed by a versioned catalog",
    "Independent quality control before every release",
  ];

  return (
    <div
      style={{
        background:
          "linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        color: "#e2e8f0",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: "hidden",
      }}
    >
      <div className="flex flex-col  p-12 text-white h-full">
        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-3">
          <span className="text-blue-700 font-bold text-xl">K2</span>
        </div>
        <h1 className="text-sm font-semibold text-blue-100">
          Concave Taxation limited
        </h1>

        <h2 className="text-4xl font-bold leading-tight mb-6">
          The operating platform for modern tax planning teams.
        </h2>

        <p className="text-blue-100 text-lg mb-12 leading-relaxed">
          Manage firm relationships, ingest and validate source documents,
          screen strategies, and quality-check every plan before it reaches a
          client — all in one place.
        </p>
        <div className="space-y-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <span className="text-blue-100">{feature}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col w-full justify-start items-center space-y-4">
          <Link href="/auth/login">
            <Button className="inline-flex items-center gap-2 px-6 py-1 rounded-full border border-gray-400 bg-gray-800 text-gray-200 mt-5 text-sm hover:bg-gray-700 transition-colors cursor-pointer">
              Login
            </Button>
          </Link>
        </div>
      </div>

      <div className="text-blue-200 text-sm p-12">
        © 2024 K2 Concave. All rights reserved.
      </div>
    </div>
  );
}
