"use client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { CreateTaxFirmRequest } from "@/lib/api/generated/k2-tax-api/k2TaxAPI.schemas";
import { useAddTaxFirm } from "@/lib/api/hooks/k2-tax-api/useAddTaxFirm";
import { CreateTaxFirmFormData, createTaxFirmSchema } from "@/modules/crm/lib";
import { useCRMStore } from "@/modules/crm/store/crm.store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

export const AddFirmCRM = () => {
  const { addTaxFirm, isPending, isSuccess } = useAddTaxFirm();
  const { error, setSuccess } = useCRMStore();
  const {
    handleSubmit,
    register,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createTaxFirmSchema),
    defaultValues: {} as CreateTaxFirmFormData,
  });

  const onSubmit = (data: CreateTaxFirmFormData) => {
    addTaxFirm(data as CreateTaxFirmRequest);
  };

  // Auto-clear form after successful submission
  useEffect(() => {
    if (isSuccess && !isPending) {
      reset();
      setSuccess(false);
    }
  }, [isSuccess, isPending, reset, setSuccess]);

  const items = [
    { label: "Select a firm type", value: null },
    { label: "firm type 1", value: "apple", id: 1 },
    { label: "firm type 2", value: "banana", id: 2 },
    { label: "firm type 3", value: "blueberry", id: 3 },
    { label: "firm type 4", value: "grapes", id: 4 },
    { label: "firm type 5", value: "pineapple", id: 5 },
  ];
  return (
    <div className="p-4 space-y-3 min-h-screen bg-white rounded-lg">
      <h1>Enter a new Tax Firm</h1>
      <p>
        Capture the code firm record, Allowing it to be linked to Contacts,
        Activites and Tax clients.
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
            <div className="space-y-2">
              <Label htmlFor="firmName">Firm Name</Label>
              <Input {...register("firmName")} id="firmName" />
              {errors.firmName && (
                <p className="text-red-500">{errors.firmName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="firmTypeId">Firm Type</Label>
              <Controller
                name="firmTypeId"
                control={control}
                render={({ field }) => {
                  const selectedItem = items.find(
                    (item) => item.id === field.value,
                  );
                  return (
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value ? Number(value) : undefined)
                      }
                      value={field.value?.toString() || ""}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a firm type">
                          {selectedItem?.label}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Firm Types</SelectLabel>
                          {items.map((item) => (
                            <SelectItem
                              key={item.id || item.value}
                              value={(item.id || "").toString()}
                            >
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  );
                }}
              />
              {errors.firmTypeId && (
                <p className="text-red-500">{errors.firmTypeId.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credentialTypeId">Credentials</Label>
              <Controller
                name="credentialTypeId"
                control={control}
                render={({ field }) => {
                  const selectedItem = items.find(
                    (item) => item.id === field.value,
                  );
                  return (
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value ? Number(value) : undefined)
                      }
                      value={field.value?.toString() || ""}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select credentials">
                          {selectedItem?.label}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Credentials</SelectLabel>
                          {items.map((item) => (
                            <SelectItem
                              key={item.id || item.value}
                              value={(item.id || "").toString()}
                            >
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  );
                }}
              />
              {errors.credentialTypeId && (
                <p className="text-red-500">
                  {errors.credentialTypeId.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="leadStatusTypeId">Load Status</Label>
              <Controller
                name="leadStatusTypeId"
                control={control}
                render={({ field }) => {
                  const selectedItem = items.find(
                    (item) => item.id === field.value,
                  );
                  return (
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value ? Number(value) : undefined)
                      }
                      value={field.value?.toString() || ""}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status">
                          {selectedItem?.label}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Status</SelectLabel>
                          {items.map((item) => (
                            <SelectItem
                              key={item.id || item.value}
                              value={(item.id || "").toString()}
                            >
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  );
                }}
              />
              {errors.leadStatusTypeId && (
                <p className="text-red-500">
                  {errors.leadStatusTypeId.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input {...register("address")} id="address" />
            {errors.address && (
              <p className="text-red-500">{errors.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Url</Label>
              <Input {...register("websiteUrl")} id="websiteUrl" />
              {errors.websiteUrl && (
                <p className="text-red-500">{errors.websiteUrl.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mainPhoneNumber">Main Phone number</Label>
              <Input {...register("mainPhoneNumber")} id="mainPhoneNumber" />
              {errors.mainPhoneNumber && (
                <p className="text-red-500">{errors.mainPhoneNumber.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numberOfOffices">No of Offices</Label>
              <Input
                {...register("numberOfOffices")}
                id="numberOfOffices"
                type="number"
              />
              {errors.numberOfOffices && (
                <p className="text-red-500">{errors.numberOfOffices.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfTaxClients">No of Tax Clients</Label>
              <Input
                {...register("numberOfTaxClients")}
                id="numberOfTaxClients"
                type="number"
              />
              {errors.numberOfTaxClients && (
                <p className="text-red-500">
                  {errors.numberOfTaxClients.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedAnnualRevenue">
                Estimated Annual Revenue
              </Label>
              <Input
                {...register("estimatedAnnualRevenue")}
                id="estimatedAnnualRevenue"
                type="number"
              />
              {errors.estimatedAnnualRevenue && (
                <p className="text-red-500">
                  {errors.estimatedAnnualRevenue.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeCount">Employee Count</Label>
              <Input
                {...register("employeeCount")}
                id="employeeCount"
                type="number"
              />
              {errors.employeeCount && (
                <p className="text-red-500">{errors.employeeCount.message}</p>
              )}
            </div>
          </div>
          <div>
            <div className="space-y-2">
              <Label htmlFor="currentSoftware">Current Software</Label>
              <Input {...register("currentSoftware")} id="currentSoftware" />
              {errors.currentSoftware && (
                <p className="text-red-500">{errors.currentSoftware.message}</p>
              )}
            </div>
          </div>
          <div>
            <span>Services Offered</span>
            <div>
              <Controller
                name="servicesOffered"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="servicesOffered"
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leadSource">Lead Source</Label>
              <Controller
                name="leadSource"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Lead Sources</SelectLabel>
                        {items.map((item) => (
                          <SelectItem
                            key={item.id || item.value}
                            value={item.value || ""}
                          >
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.leadSource && (
                <p className="text-red-500">{errors.leadSource.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="referralSource">Referral Source</Label>
              <Input {...register("referralSource")} id="referralSource" />
              {errors.referralSource && (
                <p className="text-red-500">{errors.referralSource.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="potentialDealSize">Potential deal size</Label>
              <Input
                {...register("potentialDealSize")}
                id="potentialDealSize"
                type="number"
              />
              {errors.potentialDealSize && (
                <p className="text-red-500">
                  {errors.potentialDealSize.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="competitorInUse">Competitor in use</Label>
              <Input {...register("competitorInUse")} id="competitorInUse" />
              {errors.competitorInUse && (
                <p className="text-red-500">{errors.competitorInUse.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input {...register("notes")} id="notes" />
            {errors.notes && (
              <p className="text-red-500">{errors.notes.message}</p>
            )}
          </div>
        </div>
        <div className="flex flex-row justify-end items-center space-x-2 mt-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Adding..." : "Submit"}
          </Button>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
