"use client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { useAddLogActivity } from "@/lib/api/hooks/k2-tax-api/useAddLogActivity";
import { useGetContacts } from "@/lib/api/hooks/k2-tax-api/useGetContacts";
import { useGetTaxFirms } from "@/lib/api/hooks/k2-tax-api/useGetTaxFirms";
import { useLookupData } from "@/lib/api/hooks/k2-tax-api/useLookupData";
import {
  CreateLogActivityFormData,
  createLogActivitySchema,
} from "@/modules/crm/lib";
import { getTodayDateString, getTodayOnly } from "@/utils/helperFunctions";
import { zodResolver } from "@hookform/resolvers/zod";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";

export const LogActivity = () => {
  const router = useRouter();
  const { taxFirms, isLoading: firmsLoading } = useGetTaxFirms();
  const { activityTypes } = useLookupData();
  const { min, max } = getTodayOnly();

  const firmOptions =
    taxFirms.map((firm) => ({
      id: firm.taxFirmId || "",
      name: firm.firmName || "Unknown",
    })) || [];

  const activityTypeOptions = activityTypes.map((type) => ({
    id: type.activityTypeId,
    label: type.activityTypeName || "Unknown",
  }));

  const {
    handleSubmit,
    control,
    register,
    reset,
    formState: { errors },
    watch,
  } = useForm<CreateLogActivityFormData>({
    resolver: zodResolver(createLogActivitySchema),
    mode: "onChange",
    defaultValues: {
      firmId: "",
      contactId: "",
      activityDate: new Date().toISOString().split("T")[0],
      activityTime: "09:00",
      activityTypeId: undefined,
      summary: "",
      outcome: "",
      nextFollowUpDate: "",
      nextFollowUpTime: "",
      loggedBy: "",
    },
  });

  const selectedFirmId = useWatch({ control, name: "firmId" });

  const { contacts: contactsList, isLoading: contactsLoading } =
    useGetContacts(selectedFirmId);

  const contactOptions = contactsList.flatMap((contact) => {
    if (!contact.contactId) {
      return [];
    }
    return [
      {
        id: contact.contactId,
        label:
          [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
          "Unknown contact",
      },
    ];
  });

  const handleAddLogActivitySuccess = () => {
    reset();
    router.push("/crm/activity");
  };

  const {
    addLogActivity,
    isPending,
    error: errorMessage,
  } = useAddLogActivity({
    taxFirmId: selectedFirmId,
    onSuccess: handleAddLogActivitySuccess,
  });

  const onSubmit = (data: CreateLogActivityFormData) => {
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

    addLogActivity({
      activityDate: activityDateTime,
      activityTypeId: data.activityTypeId,
      summary: data.summary,
      outcome: data.outcome || null,
      nextFollowUpDate: nextFollowUpDateTime,
    });
  };

  return (
    <div className="p-4 container space-y-3 min-h-screen bg-white rounded-lg">
      <Link
        href="/crm/activity"
        className="inline-block text-sm text-primary underline-offset-4 hover:underline"
      >
        Back to Activities
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Log Activity</h1>
        <p className="text-gray-600 text-sm">
          Record and track client interactions and follow-ups.
        </p>
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
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
                            {firm.name} ({firm.id})
                          </SelectItem>
                        ))
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.firmId && (
              <p role="alert" className="text-red-500 text-sm">
                {errors.firmId.message}
              </p>
            )}
          </div>

          {selectedFirmId && (
            <div className="space-y-2">
              <Label htmlFor="contactId">Contact</Label>
              <Controller
                name="contactId"
                control={control}
                render={({ field }) => {
                  const selectedItem = contactOptions.find(
                    (item) => item.id === field.value,
                  );
                  return (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select contact">
                          {selectedItem?.label || "Select contact"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Contacts</SelectLabel>
                          {contactsLoading ? (
                            <SelectItem value="loading" disabled>
                              Loading contacts...
                            </SelectItem>
                          ) : contactOptions.length === 0 ? (
                            <SelectItem value="empty" disabled>
                              No contacts available
                            </SelectItem>
                          ) : (
                            contactOptions.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.label}
                              </SelectItem>
                            ))
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="activityDate">
                Activity Date <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("activityDate")}
                min={min}
                max={max}
                id="activityDate"
                type="date"
                disabled={!selectedFirmId}
              />
              {errors.activityDate && (
                <p className="text-red-500 text-sm">
                  {errors.activityDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="activityTime">
                Activity Time <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("activityTime")}
                id="activityTime"

                type="time"
                disabled={!selectedFirmId}
              />
              {errors.activityTime && (
                <p className="text-red-500 text-sm">
                  {errors.activityTime.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="activityTypeId">
                Activity Type <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="activityTypeId"
                control={control}
                render={({ field }) => {
                  const selectedItem = activityTypeOptions.find(
                    (item) => item.id === field.value,
                  );
                  return (
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value ? Number(value) : undefined)
                      }
                      value={field.value?.toString() || ""}
                    >
                      <SelectTrigger
                        id="activityTypeId"
                        className="w-full"
                        disabled={!selectedFirmId}
                      >
                        <SelectValue placeholder="Select activity type">
                          {selectedItem?.label}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Activity Types</SelectLabel>
                          {activityTypeOptions.length === 0 ? (
                            <SelectItem value="empty" disabled>
                              No activity types available
                            </SelectItem>
                          ) : (
                            activityTypeOptions.map((item) => (
                              <SelectItem
                                key={item.id}
                                value={item.id?.toString() || ""}
                              >
                                {item.label}
                              </SelectItem>
                            ))
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  );
                }}
              />
              {errors.activityTypeId && (
                <p className="text-red-500 text-sm">
                  {errors.activityTypeId.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">
              Summary <span className="text-red-500">*</span>
            </Label>
            <Textarea
              {...register("summary")}
              id="summary"
              placeholder="Describe the activity..."
              rows={4}
              disabled={!selectedFirmId}
            />
            {errors.summary && (
              <p className="text-red-500 text-sm">{errors.summary.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="outcome">Outcome</Label>
            <Textarea
              {...register("outcome")}
              id="outcome"
              placeholder="What was the outcome?"
              rows={3}
              disabled={!selectedFirmId}
            />
            {errors.outcome && (
              <p className="text-red-500 text-sm">{errors.outcome.message}</p>
            )}
          </div>

          <div className="space-y-2 grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nextFollowUpDate">Next Follow-up Date</Label>
              <Input
                {...register("nextFollowUpDate")}
                id="nextFollowUpDate"
                type="date"
                min={getTodayDateString()}
                disabled={!selectedFirmId}
              />
              {errors.nextFollowUpDate && (
                <p className="text-red-500 text-sm">
                  {errors.nextFollowUpDate.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextFollowUpTime">Next Follow-up Time</Label>
              <Input
                {...register("nextFollowUpTime")}
                id="nextFollowUpTime"
                type="time"
                disabled={!selectedFirmId}
              />
              {errors.nextFollowUpTime && (
                <p className="text-red-500 text-sm">
                  {errors.nextFollowUpTime.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="loggedBy">
                Logged By <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("loggedBy")}
                id="loggedBy"
                placeholder="Enter your name"
                disabled={!selectedFirmId}
              />
              {errors.loggedBy && (
                <p className="text-red-500 text-sm">
                  {errors.loggedBy.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/crm/activity")}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !selectedFirmId}>
              {isPending ? "Saving..." : "Log Activity"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
