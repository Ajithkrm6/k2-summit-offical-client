import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export const TaxClients = () => {
  return (
    <div className="container min-h-screen space-y-6 rounded-lg bg-white p-4">
      <section
        aria-labelledby="tax-clients-heading"
        className="flex flex-col gap-4 rounded-lg border p-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-1">
          <h1 id="tax-clients-heading" className="text-2xl font-bold">
            Tax Clients
          </h1>
          <p className="text-sm text-gray-600">
            Manage taxpayers and clients linked to your tax firms.
          </p>
        </div>
        <Link
          href="/crm/addTaxClient/new"
          className={buttonVariants({ className: "self-start sm:self-auto" })}
        >
          Add Tax Client
        </Link>
      </section>

      <section
        aria-labelledby="saved-tax-clients-heading"
        className="space-y-4 rounded-lg border p-6"
      >
        <div>
          <h2 id="saved-tax-clients-heading" className="text-lg font-semibold">
            Saved Tax Clients
          </h2>
          <p
            id="tax-clients-availability"
            className="mt-1 text-sm text-gray-600"
          >
            Tax client listing is not connected yet. Saved tax clients will
            appear here once the tax clients retrieval API is available.
          </p>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <table
            className="w-full text-left text-sm"
            aria-describedby="tax-clients-availability"
          >
            <caption className="sr-only">Saved tax clients</caption>
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                {["Name", "Firm", "Tax Year", "Email", "Phone"].map(
                  (heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="whitespace-nowrap px-4 py-3 font-medium"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  Tax client data is currently unavailable.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
