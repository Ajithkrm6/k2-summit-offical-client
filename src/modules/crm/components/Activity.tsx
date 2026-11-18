"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { GetLogActivityByTaxFirmIdResponse } from "@/lib/api/generated/k2-tax-api/k2TaxAPI.schemas";
import { useDeleteLogActivity } from "@/lib/api/hooks/k2-tax-api/useDeleteLogActivity";
import { useGetLogActivities } from "@/lib/api/hooks/k2-tax-api/useGetLogActivities";
import { useGetTaxFirms } from "@/lib/api/hooks/k2-tax-api/useGetTaxFirms";
import { useLookupData } from "@/lib/api/hooks/k2-tax-api/useLookupData";
import { useUpdateLogActivity } from "@/lib/api/hooks/k2-tax-api/useUpdateLogActivity";
import {
  updateLogActivitySchema,
  type UpdateLogActivityFormData,
} from "@/modules/crm/lib";
import { getTodayDateString, getTodayOnly } from "@/utils/helperFunctions";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Trash } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

interface SelectedActivity {
  firmId: string;
  activityId: string;
  summary: string;
}

const editFields: {
  name:
    | "activityDate"
    | "activityTime"
    | "activityTypeId"
    | "summary"
    | "outcome"
    | "nextFollowUpDate"
    | "nextFollowUpTime";
  label: string;
  type: string;
  required: boolean;
}[] = [
  {
    name: "activityDate",
    label: "Activity Date",
    type: "date",
    required: true,
  },
  {
    name: "activityTime",
    label: "Activity Time",
    type: "time",
    required: true,
  },
  {
    name: "activityTypeId",
    label: "Activity Type",
    type: "select",
    required: true,
  },
  {
    name: "nextFollowUpDate",
    label: "Next Follow-up Date",
    type: "date",
    required: false,
  },
  {
    name: "nextFollowUpTime",
    label: "Next Follow-up Time",
    type: "time",
    required: false,
  },
  {
    name: "summary",
    label: "Summary",
    type: "textarea",
    required: true,
  },
  {
    name: "outcome",
    label: "Outcome",
    type: "textarea",
    required: false,
  },
];

export default function Activity() {
  const [editingActivity, setEditingActivity] =
    useState<SelectedActivity | null>(null);
  const [deletingActivity, setDeletingActivity] =
    useState<SelectedActivity | null>(null);
  const { min, max } = getTodayOnly();
  // Form for firm selection
  const { control, setValue } = useForm({
    defaultValues: { firmId: "" },
  });
  const selectedFirmId = useWatch({ control, name: "firmId" });

  // Form for edit dialog
  const {
    control: editControl,
    register,
    handleSubmit,
    formState: { errors: editErrors, isSubmitting: isUpdating },
    reset,
    clearErrors,
  } = useForm<UpdateLogActivityFormData>({
    resolver: zodResolver(updateLogActivitySchema),
    mode: "onBlur",
  });

  // Fetch firms
  const {
    taxFirms,
    isLoading: firmsLoading,
    error: firmsError,
  } = useGetTaxFirms();

  // Fetch lookup data for activity types
  const { activityTypes } = useLookupData();

  // Fetch activities for selected firm
  const {
    logActivities,
    isLoading,
    error,
    refetch: refetchActivities,
  } = useGetLogActivities({
    taxFirmId: selectedFirmId,
  });

  // Update activity mutation
  const { updateLogActivity } = useUpdateLogActivity({
    taxFirmId: selectedFirmId,
    onSuccess: () => {
      refetchActivities();
      setEditingActivity(null);
      reset();
    },
  });

  // Delete activity mutation
  const { deleteLogActivity } = useDeleteLogActivity({
    onSuccess: () => {
      refetchActivities();
      setDeletingActivity(null);
    },
    onError: () => {
      setDeletingActivity(null);
    },
  });

  // Get firm options from data

  const firmOptions = useMemo(
    () =>
      Array.isArray(taxFirms)
        ? taxFirms
            .map((firm) => ({
              id: firm.taxFirmId,
              name: firm.firmName,
            }))
            .filter(
              (f): f is { id: string; name: string } =>
                typeof f.id === "string" && typeof f.name === "string",
            )
        : [],
    [taxFirms],
  );

  // Set first firm ID on load
  useEffect(() => {
    if (firmOptions.length > 0 && !selectedFirmId) {
      setValue("firmId", firmOptions[0].id);
    }
  }, [firmOptions, selectedFirmId, setValue]);

  // Helper function to map activity type ID to name
  const getActivityTypeName = (typeId?: number): string => {
    if (!typeId) return "Not provided";
    const type = activityTypes.find((t) => t.activityTypeId === typeId);
    return type?.activityTypeName || "Unknown";
  };

  // Helper function to format activity data
  const selectActivity = (
    activity: GetLogActivityByTaxFirmIdResponse,
  ): SelectedActivity => ({
    firmId: selectedFirmId || "",
    activityId: activity.logActivityId || "",
    summary: activity.summary || "",
  });

  // Open edit dialog
  const openEditDialog = (activity: GetLogActivityByTaxFirmIdResponse) => {
    clearErrors();
    setEditingActivity(selectActivity(activity));

    // Extract date and time from activityDate ISO string
    const activityDateTime = activity.activityDate
      ? new Date(activity.activityDate)
      : null;
    const activityDateStr = activityDateTime
      ? activityDateTime.toISOString().split("T")[0]
      : undefined;
    const activityTimeStr = activityDateTime
      ? `${String(activityDateTime.getHours()).padStart(2, "0")}:${String(activityDateTime.getMinutes()).padStart(2, "0")}`
      : undefined;

    // Extract date and time from nextFollowUpDate ISO string
    const followUpDateTime = activity.nextFollowUpDate
      ? new Date(activity.nextFollowUpDate)
      : null;
    const followUpDateStr = followUpDateTime
      ? followUpDateTime.toISOString().split("T")[0]
      : undefined;
    const followUpTimeStr = followUpDateTime
      ? `${String(followUpDateTime.getHours()).padStart(2, "0")}:${String(followUpDateTime.getMinutes()).padStart(2, "0")}`
      : undefined;

    reset({
      activityDate: activityDateStr,
      activityTime: activityTimeStr,
      activityTypeId: activity.activityTypeId,
      summary: activity.summary || "",
      outcome: activity.outcome || "",
      nextFollowUpDate: followUpDateStr,
      nextFollowUpTime: followUpTimeStr,
    });
  };

  // Handle edit submit
  const onEditSubmit = (data: UpdateLogActivityFormData) => {
    if (!editingActivity) return;

    // Combine date and time into ISO 8601 format
    const activityDateTime = new Date(
      `${data.activityDate}T${data.activityTime}:00`,
    ).toISOString();

    let nextFollowUpDateTime: string | null = null;
    if (data.nextFollowUpDate && data.nextFollowUpTime) {
      nextFollowUpDateTime = new Date(
        `${data.nextFollowUpDate}T${data.nextFollowUpTime}:00`,
      ).toISOString();
    }

    updateLogActivity(editingActivity.activityId, {
      ...data,
      activityDate: activityDateTime,
      nextFollowUpDate: nextFollowUpDateTime,
    });
  };

  // Handle delete confirmation
  const confirmDelete = () => {
    if (!deletingActivity || !selectedFirmId) return;
    deleteLogActivity(selectedFirmId, deletingActivity.activityId);
  };

  return (
    <div className="container min-h-screen space-y-6 rounded-lg bg-white p-4">
      {/* Header Section */}
      <section
        aria-labelledby="activities-heading"
        className="flex flex-col gap-4 rounded-lg border p-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-1">
          <h1 id="activities-heading" className="text-2xl font-bold">
            Log Activities
          </h1>
          <p className="text-sm text-gray-600">
            Manage activities logged for your tax firms.
          </p>
        </div>
        <Link
          href="/crm/activity/logActivity"
          // className={buttonVariants({ className: "self-start sm:self-auto" })}
        >
          <Button size="lg">Add Activity</Button>
        </Link>
      </section>

      {/* Activities Table Section */}
      <section
        aria-labelledby="saved-activities-heading"
        className="space-y-4 rounded-lg border p-6"
      >
        <div>
          <h2 id="saved-activities-heading" className="text-lg font-semibold">
            Saved Activities
          </h2>
          <p
            id="activities-availability"
            className="mt-1 text-sm text-gray-600"
          >
            Select a firm to view its saved activities.
          </p>
        </div>

        {/* Firm Selector */}
        <div className="space-y-2">
          <Label htmlFor="firmSelect">
            Select Firm <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="firmId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="firmSelect" className="w-full">
                  <SelectValue placeholder="Select a firm">
                    {field.value
                      ? firmOptions.find((f) => f.id === field.value)?.name ||
                        field.value
                      : "Select a firm"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Available Firms</SelectLabel>
                    {firmsLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading firms...
                      </SelectItem>
                    ) : firmOptions.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        No firms available
                      </SelectItem>
                    ) : (
                      firmOptions.map((firm) => (
                        <SelectItem key={firm.id} value={firm.id}>
                          {firm.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Error Alerts */}
        {firmsError && (
          <Alert variant="destructive">
            <AlertDescription>Failed to load firms</AlertDescription>
          </Alert>
        )}
        {error && selectedFirmId && (
          <Alert variant="destructive">
            <AlertDescription>Failed to load activities</AlertDescription>
          </Alert>
        )}

        {/* Activities Table */}
        <div className="overflow-x-auto rounded-lg border">
          <table
            className="w-full text-left text-sm"
            aria-describedby="activities-availability"
          >
            <caption className="sr-only">Saved tax firm activities</caption>
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                {[
                  "Date",
                  "Type",
                  "Summary",
                  "Outcome",
                  "Follow-up Date",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-center font-medium"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!selectedFirmId ||
              isLoading ||
              error ||
              logActivities.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    {!selectedFirmId
                      ? "Select a firm to view activities."
                      : isLoading
                        ? "Loading activities..."
                        : error
                          ? "Activities could not be loaded."
                          : "No activities found for this firm."}
                  </td>
                </tr>
              ) : (
                logActivities.map((activity, index) => (
                  <tr
                    key={activity.logActivityId ?? index}
                    className="border-t"
                  >
                    <td className="px-4 py-3 text-center">
                      {activity.activityDate
                        ? new Date(activity.activityDate).toLocaleDateString()
                        : "Not provided"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getActivityTypeName(activity.activityTypeId)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {activity.summary || "Not provided"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {activity.outcome || "Not provided"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {activity.nextFollowUpDate
                        ? new Date(
                            activity.nextFollowUpDate,
                          ).toLocaleDateString()
                        : "Not provided"}
                    </td>
                    <td className="px-4 py-3 flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        aria-label={`Edit ${selectActivity(activity).summary}`}
                        onClick={() => openEditDialog(activity)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        aria-label={`Delete ${selectActivity(activity).summary}`}
                        onClick={() =>
                          setDeletingActivity(selectActivity(activity))
                        }
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Edit Activity Dialog */}
      <Dialog
        open={!!editingActivity}
        onOpenChange={(open) => {
          if (!open) {
            setEditingActivity(null);
            reset();
          }
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
            <DialogDescription>
              Update the activity details. Click save when done.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onEditSubmit)} noValidate>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {editFields.map((field) => (
                <div
                  key={field.name}
                  className={`min-w-0 space-y-2${field.type === "textarea" ? " md:col-span-2" : ""}`}
                >
                  <Label htmlFor={`edit-${field.name}`}>
                    {field.label}
                    {field.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>

                  {field.type === "textarea" ? (
                    <Textarea
                      {...register(
                        field.name as keyof UpdateLogActivityFormData,
                      )}
                      id={`edit-${field.name}`}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      rows={2}
                    />
                  ) : field.name === "activityTypeId" ? (
                    <Controller
                      name="activityTypeId"
                      control={editControl}
                      render={({ field: fieldProps }) => {
                        const selectedItem = activityTypes.find(
                          (type) => type.activityTypeId === fieldProps.value,
                        );
                        return (
                          <div>
                            <Select
                              onValueChange={(value) =>
                                fieldProps.onChange(
                                  value ? Number(value) : undefined,
                                )
                              }
                              value={fieldProps.value?.toString() || ""}
                            >
                              <SelectTrigger
                                id={`edit-${field.name}`}
                                className="w-full"
                              >
                                <SelectValue placeholder="Select activity type">
                                  {selectedItem?.activityTypeName}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="w-full">
                                <SelectGroup>
                                  <SelectLabel>Activity Types</SelectLabel>
                                  {activityTypes.map((type) => (
                                    <SelectItem
                                      key={type.activityTypeId}
                                      value={
                                        type.activityTypeId?.toString() || ""
                                      }
                                    >
                                      {type.activityTypeName}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      }}
                    />
                  ) : (
                    <Input
                      {...register(
                        field.name as keyof UpdateLogActivityFormData,
                      )}
                      id={`edit-${field.name}`}
                      type={field.type || "text"}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      {...(field.name === "activityDate" && getTodayOnly())}
                      {...(field.name === "nextFollowUpDate" && {
                        min: getTodayDateString(),
                      })}
                    />
                  )}

                  {editErrors[
                    field.name as keyof UpdateLogActivityFormData
                  ] && (
                    <p className="text-red-500 text-sm">
                      {
                        editErrors[
                          field.name as keyof UpdateLogActivityFormData
                        ]?.message
                      }
                    </p>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingActivity(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingActivity}
        onOpenChange={() => setDeletingActivity(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Activity</DialogTitle>
            <DialogDescription>
              Delete {deletingActivity?.summary}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingActivity(null)}
            >
              Cancel
            </Button>
            {deletingActivity ? (
              <Button
                type="button"
                variant="destructive"
                onClick={confirmDelete}
              >
                Delete
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                onClick={confirmDelete}
              >
                Delete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
