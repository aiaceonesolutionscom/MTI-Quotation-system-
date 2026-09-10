"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { customerSchema, type CustomerInput } from "@/lib/validations/customer.schema";
import { createCustomer, updateCustomer } from "@/actions/customers.actions";

export function CustomerForm({
  customer,
}: {
  customer?: {
    id: string;
    companyName: string;
    city: string | null;
    country: string | null;
    status: boolean;
  };
}) {
const isEdit = !!customer;
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      companyName: customer?.companyName ?? "",
      city: customer?.city ?? "",
      country: customer?.country ?? "",
      status: customer?.status ?? true,
    },
  });

const onSubmit = async (data: CustomerInput) => {
    setServerError(null);
    if (isEdit) {
      const result = await updateCustomer(customer.id, data);
      if (result?.error) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Customer updated.");
      router.push(`/customers/${customer.id}`);
      return;
    }
    const result = await createCustomer(data);
    if (result?.error) {
      setServerError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Customer created.");
    router.push(`/customers/${result.id}`);
  };

  return (
    <Card className="max-w-2xl">
      <CardContent className="pt-6">
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input id="companyName" {...register("companyName")} autoFocus />
              {errors.companyName && <p className="text-sm text-destructive">{errors.companyName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register("city")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" {...register("country")} />
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <Switch id="status" checked={watch("status")} onCheckedChange={(v) => setValue("status", v)} />
              <Label htmlFor="status" className="font-normal">
                Active
              </Label>
            </div>
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : isEdit ? "Save Changes" : "Create Customer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
