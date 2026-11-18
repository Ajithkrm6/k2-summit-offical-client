"use client";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { TaxFirmList } from "./TaxFirmList";

export const TaxFirm = () => {
  return (
    <div className="container min-h-screen space-y-6 rounded-lg bg-white p-4">
      <section
        aria-labelledby="contacts-heading"
        className="flex flex-col gap-4 rounded-lg border p-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-1">
          <h1 id="contacts-heading" className="text-2xl font-bold">
            Tax Firm
          </h1>
          <p className="text-sm text-gray-600">
            Manage tax firms linked to your contacts.
          </p>
        </div>
        <Link
          href="/crm/taxFirm/addTaxFirm"
          className={buttonVariants({ className: "self-start sm:self-auto" })}
        >
          Add Tax Firm
        </Link>
      </section>
      <section
        aria-labelledby="saved-contacts-heading"
        className="space-y-4 rounded-lg "
      >
        <TaxFirmList from="crm" />
      </section>
    </div>
  );
};
