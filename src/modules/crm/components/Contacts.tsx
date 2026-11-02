import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export const Contacts = () => {
  return (
    <div className="container min-h-screen space-y-6 rounded-lg bg-white p-4">
      <section
        aria-labelledby="contacts-heading"
        className="flex flex-col gap-4 rounded-lg border p-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-1">
          <h1 id="contacts-heading" className="text-2xl font-bold">
            Contacts
          </h1>
          <p className="text-sm text-gray-600">
            Manage contacts linked to your tax firms.
          </p>
        </div>
        <Link
          href="/crm/addContact/new"
          className={buttonVariants({ className: "self-start sm:self-auto" })}
        >
          Add Contact
        </Link>
      </section>

      <section
        aria-labelledby="saved-contacts-heading"
        className="space-y-4 rounded-lg border p-6"
      >
        <div>
          <h2 id="saved-contacts-heading" className="text-lg font-semibold">
            Saved Contacts
          </h2>
          <p id="contacts-availability" className="mt-1 text-sm text-gray-600">
            Contact listing is not connected yet. Saved contacts will appear
            here once the contacts retrieval API is available.
          </p>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <table
            className="w-full text-left text-sm"
            aria-describedby="contacts-availability"
          >
            <caption className="sr-only">Saved tax firm contacts</caption>
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                {[
                  "Name",
                  "Firm",
                  "Role",
                  "Email",
                  "Phone",
                  "Primary Contact",
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 font-medium"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  Contact data is currently unavailable.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
