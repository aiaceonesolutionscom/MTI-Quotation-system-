"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { companySettingsSchema, type CompanySettingsInput } from "@/lib/validations/settings.schema";
import { updateCompanySettings } from "@/actions/company-settings.actions";

export function CompanySettingsForm({ settings }: { settings: CompanySettingsInput }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanySettingsInput>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: settings,
  });

  const onSubmit = async (data: CompanySettingsInput) => {
    setServerError(null);
    const result = await updateCompanySettings(data);
    if (result?.error) {
      setServerError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Company profile updated.");
  };

  const fields: { name: keyof CompanySettingsInput; label: string; span?: boolean }[] = [
    { name: "name", label: "Company Name", span: true },
    { name: "logoUrl", label: "Logo URL", span: true },
    { name: "address", label: "Address", span: true },
    { name: "phone", label: "Phone" },
    { name: "mobile", label: "Mobile" },
    { name: "email", label: "Email" },
    { name: "website", label: "Website" },
    { name: "ntn", label: "NTN" },
    { name: "strn", label: "STRN" },
    { name: "isoCerts", label: "ISO Certifications", span: true },
  ];

  return (
    <Card className="max-w-2xl">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.name} className={`space-y-2 ${f.span ? "sm:col-span-2" : ""}`}>
                <Label htmlFor={f.name}>{f.label}</Label>
                <Input id={f.name} {...register(f.name)} />
                {errors[f.name] && <p className="text-sm text-destructive">{errors[f.name]?.message}</p>}
              </div>
            ))}
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
