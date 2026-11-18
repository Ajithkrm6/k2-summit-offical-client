import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteTaxFirm,
  useGetFirmById,
  useLookupData,
  useUpdateTaxFirm,
} from "@/lib/api/hooks";
import { useAddContact } from "@/lib/api/hooks/k2-tax-api/useAddContact";
import { useAddLogActivity } from "@/lib/api/hooks/k2-tax-api/useAddLogActivity";
import { useAddTaxClient } from "@/lib/api/hooks/k2-tax-api/useAddTaxClient";
import {
  AddActivityDialog,
  AddContactDialog,
  AddTaxClientDialog,
  toCreateContactRequest,
  toCreateLogActivityRequest,
} from "@/modules/crm/components/AddActionDialog";
import { EditTaxFirmDialog } from "@/modules/crm/components/TaxFirmDialogs";
import { FormatDateTime } from "@/utils/helperFunctions";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export const FirmDetailedPage = ({ firmId }: { firmId: string }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "dashboard";

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addTaxClientDialogOpen, setAddTaxClientDialogOpen] = useState(false);
  const [addContactDialogOpen, setAddContactDialogOpen] = useState(false);
  const [addActivityDialogOpen, setAddActivityDialogOpen] = useState(false);

  const { firm, isLoading } = useGetFirmById(firmId);

  const { updateTaxFirm, isPending: isUpdating } = useUpdateTaxFirm({
    firmId,
    onSuccess: () => {
      setEditDialogOpen(false);
    },
  });
  const { deleteTaxFirm, isPending: isDeleting } = useDeleteTaxFirm({
    onSuccess: () => {
      setDeleteDialogOpen(false);
      router.push(getBackRoute());
    },
  });

  const {
    firmTypes,
    credentialsTypes,
    leadStatusTypes,
    contactMethodTypes,
    contactTypes,
    activityTypes,
    isLoading: lookupLoading,
  } = useLookupData();

  const { addTaxClient, isPending: isAddingTaxClient } = useAddTaxClient({
    onSuccess: () => setAddTaxClientDialogOpen(false),
  });

  const { addContact, isPending: isAddingContact } = useAddContact({
    taxFirmId: firmId,
    onSuccess: () => setAddContactDialogOpen(false),
  });

  const { addLogActivity, isPending: isAddingActivity } = useAddLogActivity({
    taxFirmId: firmId,
    onSuccess: () => setAddActivityDialogOpen(false),
  });

  // Helper functions to map IDs to labels
  const getFirmTypeName = (id: number | null | undefined): string => {
    if (!id) return "N/A";
    const item = firmTypes.find((t) => t.firmTypeId === id);
    return item?.name || "N/A";
  };

  const getCredentialName = (id: number | null | undefined): string => {
    if (!id) return "N/A";
    const item = credentialsTypes.find((t) => t.credentialTypeId === id);
    return item?.name || "N/A";
  };

  const getLeadStatusName = (id: number | null | undefined): string => {
    if (!id) return "N/A";
    const item = leadStatusTypes.find((t) => t.leadStatusTypeId === id);
    return item?.name || "N/A";
  };

  const getContactMethodName = (id: number | null | undefined): string => {
    if (!id) return "N/A";
    const item = contactMethodTypes.find((t) => t.contactMethodTypeId === id);
    return item?.contactMethodTypeName || "N/A";
  };

  const getActivityTypeName = (id: number | null | undefined): string => {
    if (!id) return "N/A";
    const item = activityTypes.find((t) => t.activityTypeId === id);
    return item?.activityTypeName || "N/A";
  };

  const getBackRoute = () => {
    switch (from) {
      case "dashboard":
        return "/dashboard";
      case "crm":
        return "/crm/taxFirm";
      default:
        return "/dashboard";
    }
  };

  const handleBack = () => {
    router.push(getBackRoute());
  };

  const isLoaded = !isLoading && !lookupLoading;

  const maskSSN = (ssn: string | null | undefined) => {
    if (!ssn) return "Not available";
    const cleaned = ssn.replace(/\D/g, "");
    if (cleaned.length !== 9) return "Invalid SSN";
    return `xxx-xx-${cleaned.slice(-4)}`;
  };

  return (
    <div className="p-4 container space-y-5 min-h-screen bg-white rounded-lg">
      <Button
        variant="link"
        onClick={handleBack}
        className="text-blue-600 hover:text-blue-800 underline"
      >
        Back to {from}
      </Button>
      {isLoading ? (
        <Skeleton className="h-6 w-full" />
      ) : (
        <div className="flex justify-between items-center">
          <div>
            <h1 id="contacts-heading" className="text-2xl font-bold">
              {firm?.firmName}
            </h1>

            <Badge>Firm Id: {firm?.taxFirmId}</Badge>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setEditDialogOpen(true)} variant="default">
              Edit Firm
            </Button>
            {/* <Button
              onClick={() => setDeleteDialogOpen(true)}
              variant="destructive"
            >
              Delete Firm
            </Button> */}
          </div>
        </div>
      )}
      <div className="border rounded-lg p-4 space-y-4">
        {lookupLoading ? (
          <Skeleton className="h-100 w-full" />
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="font-bold text-sm">Firm Name</Label>
                <h3 className="text-sm">
                  {firm?.firmName ? firm?.firmName : "N/A"}
                </h3>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-sm">Firm Type</Label>
                <h3 className="text-sm">
                  {firm?.firmTypeId ? getFirmTypeName(firm?.firmTypeId) : "N/A"}
                </h3>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-sm">Credentials</Label>
                <h3 className="text-sm">
                  {firm?.credentialTypeId
                    ? getCredentialName(firm?.credentialTypeId)
                    : "N/A"}
                </h3>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="font-bold text-sm">Lead Status</Label>
                <h3 className="text-sm">
                  {firm?.leadStatusTypeId
                    ? getLeadStatusName(firm?.leadStatusTypeId)
                    : "N/A"}
                </h3>
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-sm">Address</Label>
                <h3 className="text-sm">
                  {firm?.address ? firm?.address : "N/A"}
                </h3>
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-sm">Main Phone</Label>
                <h3 className="text-sm">
                  {firm?.mainPhoneNumber ? firm?.mainPhoneNumber : "N/A"}
                </h3>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="font-bold text-sm">Website URL</Label>
                <h3 className="text-sm">
                  {firm?.websiteUrl ? firm?.websiteUrl : "N/A"}
                </h3>
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-sm">Number of Offices</Label>
                <h3 className="text-sm">
                  {firm?.numberOfOffices ? firm?.numberOfOffices : "N/A"}
                </h3>
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-sm">
                  Tax Clients (Reported)
                </Label>
                <h3 className="text-sm">
                  {firm?.numberOfTaxClients ? firm?.numberOfTaxClients : "N/A"}
                </h3>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="font-bold text-sm">Est. Annual Revenue</Label>
                <h3 className="text-sm">
                  {firm?.estimatedAnnualRevenue
                    ? firm?.estimatedAnnualRevenue
                    : "N/A"}
                </h3>
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-sm">Employee Count</Label>
                <h3 className="text-sm">
                  {firm?.employeeCount ? firm?.employeeCount : "N/A"}
                </h3>
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-sm">Services Offered</Label>
                <h3 className="text-sm">
                  {firm?.servicesOffered ? firm?.servicesOffered : "N/A"}
                </h3>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="font-bold text-sm">Current Software</Label>
                <h3 className="text-sm">
                  {firm?.currentSoftware ? firm?.currentSoftware : "N/A"}
                </h3>
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-sm">Lead Source</Label>
                <h3 className="text-sm">
                  {firm?.leadSource ? firm?.leadSource : "N/A"}
                </h3>
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-sm">Referral Source</Label>
                <h3 className="text-sm">
                  {firm?.referralSource ? firm?.referralSource : "N/A"}
                </h3>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-bold text-sm">Potential Deal Size</Label>
                <h3 className="text-sm">
                  {firm?.potentialDealSize ? firm?.potentialDealSize : "N/A"}
                </h3>
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-sm">Competitor In Use</Label>
                <h3 className="text-sm">
                  {firm?.competitorInUse ? firm?.competitorInUse : "N/A"}
                </h3>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="font-bold text-sm">Additional Notes</Label>
              <h3 className="text-sm">{firm?.notes ? firm?.notes : "N/A"}</h3>
            </div>
          </>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h1 className="font-bold">Tax Clients</h1>
          <div>
            <Button
              onClick={() => setAddTaxClientDialogOpen(true)}
              disabled={!firm?.taxFirmId}
            >
              Add Client
            </Button>
          </div>
        </div>

        <div className="rounded-lg overflow-x-auto border">
          <table
            className="w-full text-left text-sm"
            aria-describedby="contacts-availability"
          >
            <thead className="bg-gray-50 text-gray-600">
              <tr className="">
                {[
                  "Client Id",
                  "Name",
                  "Tax Year",
                  "SSN",
                  "Phone",
                  "Email",
                  "Preferred Contact Method",
                ].map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-center font-bold"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ||
              !firm?.taxPersonClients ||
              firm.taxPersonClients.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    {isLoading
                      ? "Loading tax clients..."
                      : "No tax clients found for this firm."}
                  </td>
                </tr>
              ) : (
                firm.taxPersonClients.map((contact) => (
                  <tr key={contact?.taxPersonClientId} className="">
                    <td className="px-4 py-3 text-center">
                      {contact?.taxPersonClientId || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {contact?.taxpayerFirstName || "N/A"}{" "}
                      {contact?.taxpayerLastName || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {contact?.taxYear || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {maskSSN(contact?.taxpayerSsn)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {contact?.phoneNumber || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {contact?.email || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getContactMethodName(
                        contact?.preferredContactMethodTypeId,
                      ) || "N/A"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h1 className="font-bold">Contacts</h1>
          <Button
            onClick={() => setAddContactDialogOpen(true)}
            disabled={!firm?.taxFirmId}
          >
            Add Contact
          </Button>
        </div>
        <div className="rounded-lg overflow-x-auto border">
          <table
            className="w-full text-left text-sm"
            aria-describedby="contacts-availability"
          >
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                {[
                  "Name",
                  "Email",
                  "Phone",
                  "Preferred Contact Method",
                  "Notes",
                ].map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-center font-bold"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ||
              !firm?.taxFirmContacts ||
              firm.taxFirmContacts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    {isLoading
                      ? "Loading contacts..."
                      : "No contacts found for this firm."}
                  </td>
                </tr>
              ) : (
                firm.taxFirmContacts.map((contact) => (
                  <tr key={contact?.contactId} className="">
                    <td className="px-4 py-3 text-center">
                      {contact?.firstName || "N/A"} {contact?.lastName || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {contact?.email || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {contact?.phoneNumber || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getContactMethodName(
                        contact?.preferredContactMethodTypeId,
                      ) || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {contact?.notes || "N/A"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h1 className="font-bold">Activity Logs</h1>
          <Button
            onClick={() => setAddActivityDialogOpen(true)}
            disabled={!firm?.taxFirmId}
          >
            Add Activity Log
          </Button>
        </div>
        <div className="rounded-lg overflow-x-auto border">
          <table
            className="w-full text-left text-sm"
            aria-describedby="contacts-availability"
          >
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                {[
                  "Id",
                  "Activity Type",
                  "Activity Date",
                  "Next Follow-up Date",
                  "Summary",
                ].map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-center font-bold"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ||
              !firm?.logActivities ||
              firm.logActivities.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    {isLoading
                      ? "Loading activity logs..."
                      : "No activity logs found for this firm."}
                  </td>
                </tr>
              ) : (
                firm.logActivities.map((activity) => (
                  <tr key={activity?.logActivityId} className="">
                    <td className="px-4 py-3 text-center">
                      {activity?.logActivityId || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getActivityTypeName(activity?.activityTypeId) || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {FormatDateTime(activity?.activityDate) || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {FormatDateTime(activity?.nextFollowUpDate) || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {activity?.summary || "N/A"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit and Delete Dialogs */}
      {firm && (
        <>
          <EditTaxFirmDialog
            open={editDialogOpen}
            firm={firm}
            lookupOptions={{
              firmTypes: (firmTypes || []).map((t) => ({
                value: String(t.firmTypeId),
                label: t.name || "N/A",
              })),
              credentialTypes: (credentialsTypes || []).map((t) => ({
                value: String(t.credentialTypeId),
                label: t.name || "N/A",
              })),
              leadStatusTypes: (leadStatusTypes || []).map((t) => ({
                value: String(t.leadStatusTypeId),
                label: t.name || "N/A",
              })),
            }}
            isUpdating={isUpdating}
            onClose={() => setEditDialogOpen(false)}
            onSubmit={(updatedData, firmId) => {
              updateTaxFirm(firmId, updatedData);
            }}
          />
          {/* 
          <DeleteTaxFirmDialog
            open={deleteDialogOpen}
            firm={firm}
            isDeleting={isDeleting}
            onClose={() => setDeleteDialogOpen(false)}
            onConfirm={() => {
              if (firm.taxFirmId) {
                deleteTaxFirm(firm.taxFirmId);
              }
            }}
          /> */}
        </>
      )}
      <AddTaxClientDialog
        firmId={firmId}
        open={addTaxClientDialogOpen}
        contactMethodOptions={(contactMethodTypes || []).map((t) => ({
          value: String(t.contactMethodTypeId),
          label: t.contactMethodTypeName || "N/A",
        }))}
        isSubmitting={isAddingTaxClient}
        onClose={() => setAddTaxClientDialogOpen(false)}
        onSubmit={addTaxClient}
      />
      <AddContactDialog
        firmId={firmId}
        open={addContactDialogOpen}
        roleOptions={(contactTypes || []).map((t) => ({
          value: String(t.contactTypeId),
          label: t.contactTypeName || "N/A",
        }))}
        contactMethodOptions={(contactMethodTypes || []).map((t) => ({
          value: String(t.contactMethodTypeId),
          label: t.contactMethodTypeName || "N/A",
        }))}
        isSubmitting={isAddingContact}
        onClose={() => setAddContactDialogOpen(false)}
        onSubmit={(data) => addContact(toCreateContactRequest(data))}
      />
      <AddActivityDialog
        firmId={firmId}
        open={addActivityDialogOpen}
        activityTypeOptions={(activityTypes || []).map((t) => ({
          value: String(t.activityTypeId),
          label: t.activityTypeName || "N/A",
        }))}
        contactOptions={(firm?.taxFirmContacts || []).flatMap((c) =>
          c?.contactId
            ? [
                {
                  value: c.contactId,
                  label:
                    [c.firstName, c.lastName].filter(Boolean).join(" ") ||
                    "Unknown contact",
                },
              ]
            : [],
        )}
        isSubmitting={isAddingActivity}
        onClose={() => setAddActivityDialogOpen(false)}
        onSubmit={(data) => addLogActivity(toCreateLogActivityRequest(data))}
      />
    </div>
  );
};
