"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { taxSettingsSchema, type TaxSettingsInput, type TaxSettingsOutput } from "@/lib/validations/settings.schema";
import { updateTaxSettings } from "@/actions/tax-settings.actions";

export function TaxSettingsForm({ settings }: { settings: TaxSettingsInput }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TaxSettingsInput, unknown, TaxSettingsOutput>({
    resolver: zodResolver(taxSettingsSchema),
    defaultValues: settings,
  });

  const onSubmit = async (data: TaxSettingsOutput) => {
    setServerError(null);
    const result = await updateTaxSettings(data);
    if (result?.error) {
      setServerError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Tax settings updated.");
  };

  return (
    <Card className="max-w-xl">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="defaultGstPercent">Default GST % *</Label>
            <Input id="defaultGstPercent" type="number" min={0} max={100} step="0.01" {...register("defaultGstPercent")} />
            {errors.defaultGstPercent && (
              <p className="text-sm text-destructive">{errors.defaultGstPercent.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Pre-fills the GST field on new quotations. GST can still be toggled on/off per quotation.
            </p>
          </div>

          <div className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="defaultAdditionalTaxEnabled" className="font-medium">
                Additional Tax enabled by default
              </Label>
              <Controller
                control={control}
                name="defaultAdditionalTaxEnabled"
                render={({ field }) => (
                  <Switch id="defaultAdditionalTaxEnabled" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="defaultAdditionalTaxName">Default Name</Label>
                <Input id="defaultAdditionalTaxName" {...register("defaultAdditionalTaxName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultAdditionalTaxPercent">Default %</Label>
                <Input
                  id="defaultAdditionalTaxPercent"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  {...register("defaultAdditionalTaxPercent")}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Sales users can change the name, percent, or turn this off entirely on each quotation.
            </p>
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
