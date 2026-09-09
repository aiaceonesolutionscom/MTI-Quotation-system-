"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  quotationSettingsSchema,
  type QuotationSettingsInput,
  type QuotationSettingsOutput,
} from "@/lib/validations/settings.schema";
import { updateQuotationSettings } from "@/actions/quotation-settings.actions";

export function QuotationSettingsForm({ settings }: { settings: QuotationSettingsInput }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<QuotationSettingsInput, unknown, QuotationSettingsOutput>({
    resolver: zodResolver(quotationSettingsSchema),
    defaultValues: settings,
  });

  const onSubmit = async (data: QuotationSettingsOutput) => {
    setServerError(null);
    const result = await updateQuotationSettings(data);
    if (result?.error) {
      setServerError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Quotation settings updated.");
  };

  return (
    <Card className="max-w-xl">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prefix">Quotation Prefix *</Label>
              <Input id="prefix" {...register("prefix")} placeholder="MTI" />
              {errors.prefix && <p className="text-sm text-destructive">{errors.prefix.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextSequence">Next Sequence Number *</Label>
              <Input id="nextSequence" type="number" min={1} {...register("nextSequence")} />
              {errors.nextSequence && <p className="text-sm text-destructive">{errors.nextSequence.message}</p>}
              <p className="text-xs text-muted-foreground">
                E.g. MTI2026{"{"}this number{"}"} — set to continue an existing paper numbering sequence.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Input id="currency" {...register("currency")} placeholder="PKR" />
              {errors.currency && <p className="text-sm text-destructive">{errors.currency.message}</p>}
            </div>
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
