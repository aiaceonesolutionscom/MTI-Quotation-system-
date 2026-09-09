"use client";

import { useMemo, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Combobox } from "@/components/shared/combobox";
import { quotationSchema, type QuotationInput, type QuotationOutput } from "@/lib/validations/quotation.schema";
import { createQuotation, updateQuotation } from "@/actions/quotations.actions";
import { calculateQuotation } from "@/lib/quotation-calc";
import { calculateExpirationDate } from "@/lib/quotation-expiry";
import { numberToWords } from "@/lib/number-to-words";
import { formatMoney, formatNumber } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { QuotationLineItemRow } from "./quotation-line-item-row";

export type QuotationBuilderValues = QuotationInput;

interface Option {
  id: string;
  name: string;
}

interface ProductOption extends Option {}

const NONE_DISCOUNT = "NONE";

export function QuotationForm({
  quotationId,
  initialValues,
  customers,
  products,
  sizes,
  rangeTypes,
  uoms,
  defaultGstPercent,
  defaultAdditionalTaxEnabled,
  defaultAdditionalTaxName,
  defaultAdditionalTaxPercent,
  defaultCustomerId,
}: {
  quotationId?: string;
  initialValues?: QuotationInput;
  customers: Option[];
  products: ProductOption[];
  sizes: Option[];
  rangeTypes: Option[];
  uoms: Option[];
  defaultGstPercent: number;
  defaultAdditionalTaxEnabled: boolean;
  defaultAdditionalTaxName: string;
  defaultAdditionalTaxPercent: number | null;
  defaultCustomerId?: string;
}) {
  const isEdit = !!quotationId;
  const [serverError, setServerError] = useState<string | null>(null);

  const { control, register, handleSubmit, watch, setValue, formState: { isSubmitting, errors } } = useForm<
    QuotationInput,
    unknown,
    QuotationOutput
  >({
    resolver: zodResolver(quotationSchema),
    defaultValues: initialValues ?? {
      customerId: defaultCustomerId ?? "",
      quotationDate: new Date().toISOString().slice(0, 10),
      discountType: null,
      discountValue: null,
      gstEnabled: true,
      gstPercent: defaultGstPercent,
      additionalTaxEnabled: defaultAdditionalTaxEnabled,
      additionalTaxName: defaultAdditionalTaxName,
      additionalTaxPercent: defaultAdditionalTaxPercent,
      notes: "",
      items: [],
    },
  });

  const { fields, append, insert, remove } = useFieldArray({ control, name: "items" });

  const watched = watch();

  const expirationDate = useMemo(() => {
    const raw = watched.quotationDate as string | undefined;
    const d = raw ? new Date(raw) : new Date();
    return calculateExpirationDate(d);
  }, [watched.quotationDate]);

  const gstPercentNum = Number(watched.gstPercent) || 0;
  const additionalTaxPercentNum =
    watched.additionalTaxPercent != null && watched.additionalTaxPercent !== ("" as unknown)
      ? Number(watched.additionalTaxPercent)
      : null;
  const discountValueNum =
    watched.discountValue != null && watched.discountValue !== ("" as unknown) ? Number(watched.discountValue) : null;

  const calc = useMemo(() => {
    return calculateQuotation({
      items: (watched.items ?? []).map((i) => ({ quantity: Number(i.quantity) || 0, finalRate: Number(i.finalRate) || 0 })),
      discountType: (watched.discountType as "AMOUNT" | "PERCENT" | null) ?? null,
      discountValue: discountValueNum,
      gstEnabled: !!watched.gstEnabled,
      gstPercent: gstPercentNum,
      additionalTaxEnabled: !!watched.additionalTaxEnabled,
      additionalTaxPercent: additionalTaxPercentNum,
    });
  }, [watched, gstPercentNum, additionalTaxPercentNum, discountValueNum]);

  const onSubmit = async (data: QuotationOutput) => {
    setServerError(null);
    const result = isEdit ? await updateQuotation(quotationId, data) : await createQuotation(data);
    if (result?.error) {
      setServerError(result.error);
      toast.error(result.error);
    }
  };

  const customerOptions = customers.map((c) => ({ value: c.id, label: c.name }));

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer & Dates</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-1">
            <Label>Customer *</Label>
            <Controller
              control={control}
              name="customerId"
              render={({ field }) => (
                <Combobox
                  options={customerOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select customer"
                  searchPlaceholder="Search customers…"
                />
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quotationDate">Quotation Date *</Label>
            <Input id="quotationDate" type="date" {...register("quotationDate")} />
          </div>
          <div className="space-y-2">
            <Label>Expiration Date</Label>
            <Input value={formatDate(expirationDate)} disabled readOnly />
            <p className="text-xs text-muted-foreground">Always Quotation Date + 7 days.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Items</CardTitle>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              append({
                productId: "",
                sizeId: "",
                rangeTypeId: "",
                uomId: "",
                productRateId: "",
                descriptionSnapshot: "",
                uomSnapshot: "",
                quantity: 1,
                matchedRateSnapshot: null,
                finalRate: 0,
                isOverridden: false,
              })
            }
          >
            <Plus /> Add Item
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {fields.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No items yet. Click &ldquo;Add Item&rdquo; to start building the quotation.
            </p>
          ) : (
            <Table className="min-w-[1240px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead className="min-w-[190px]">Product</TableHead>
                  <TableHead className="min-w-[260px]">Specification</TableHead>
                  <TableHead className="min-w-[240px]">Item Description</TableHead>
                  <TableHead className="w-24">UOM</TableHead>
                  <TableHead className="w-20">Qty</TableHead>
                  <TableHead className="w-28">Rate</TableHead>
                  <TableHead className="w-32 text-right">Total</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <QuotationLineItemRow
                    key={field.id}
                    index={index}
                    control={control}
                    setValue={setValue}
                    products={products}
                    sizes={sizes}
                    rangeTypes={rangeTypes}
                    uoms={uoms}
                    onRemove={() => remove(index)}
                    onDuplicate={() => insert(index + 1, { ...watched.items[index] })}
                    quantity={Number(watched.items?.[index]?.quantity) || 0}
                    finalRate={Number(watched.items?.[index]?.finalRate) || 0}
                    initialProductId={isEdit ? field.productId : undefined}
                    initialIsOverridden={field.isOverridden}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Discount & Tax</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Discount</Label>
                <Controller
                  control={control}
                  name="discountType"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? NONE_DISCOUNT}
                      onValueChange={(v) => field.onChange(v === NONE_DISCOUNT ? null : v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_DISCOUNT}>None</SelectItem>
                        <SelectItem value="AMOUNT">Fixed Amount</SelectItem>
                        <SelectItem value="PERCENT">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountValue">Value</Label>
                <Input
                  id="discountValue"
                  type="number"
                  min={0}
                  step="0.01"
                  disabled={!watched.discountType}
                  {...register("discountValue")}
                />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="gstEnabled" className="font-medium">
                  GST
                </Label>
                <Controller
                  control={control}
                  name="gstEnabled"
                  render={({ field }) => (
                    <Switch id="gstEnabled" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gstPercent">GST %</Label>
                <Input
                  id="gstPercent"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  disabled={!watched.gstEnabled}
                  {...register("gstPercent")}
                />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="additionalTaxEnabled" className="font-medium">
                  Additional Tax
                </Label>
                <Controller
                  control={control}
                  name="additionalTaxEnabled"
                  render={({ field }) => (
                    <Switch id="additionalTaxEnabled" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="additionalTaxName">Tax Name</Label>
                  <Input
                    id="additionalTaxName"
                    placeholder="e.g. WHT"
                    disabled={!watched.additionalTaxEnabled}
                    {...register("additionalTaxName")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="additionalTaxPercent">Percent</Label>
                  <Input
                    id="additionalTaxPercent"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    disabled={!watched.additionalTaxEnabled}
                    {...register("additionalTaxPercent")}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes / Terms</Label>
              <Textarea id="notes" rows={3} {...register("notes")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatMoney(calc.subtotal.toString())}</span>
            </div>
            {calc.discountAmount.greaterThan(0) && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>− {formatMoney(calc.discountAmount.toString())}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxable Amount</span>
              <span>{formatMoney(calc.taxableAmount.toString())}</span>
            </div>
            {watched.gstEnabled && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST ({formatNumber(gstPercentNum)}%)</span>
                <span>{formatMoney(calc.gstAmount.toString())}</span>
              </div>
            )}
            {watched.additionalTaxEnabled && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {watched.additionalTaxName || "Additional Tax"} ({formatNumber(additionalTaxPercentNum ?? 0)}%)
                </span>
                <span>{formatMoney(calc.additionalTaxAmount.toString())}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Grand Total</span>
              <span>{formatMoney(calc.grandTotal.toString())}</span>
            </div>
            <p className="pt-2 text-xs italic text-muted-foreground">
              {numberToWords(calc.grandTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      {(() => {
        const itemErrors = errors.items as
          | Array<Record<string, { message?: string }> | undefined>
          | undefined;
        const messages: string[] = [];
        if (errors.customerId?.message) messages.push(errors.customerId.message);
        const itemsLevelMsg = (errors.items as { message?: string } | undefined)?.message;
        if (itemsLevelMsg && typeof itemErrors?.length !== "number") messages.push(itemsLevelMsg);
        for (const key of ["quotationDate", "discountValue", "gstPercent", "additionalTaxPercent"] as const) {
          const m = errors[key]?.message;
          if (m) messages.push(m);
        }
        for (let i = 0; i < (itemErrors?.length ?? 0); i++) {
          const it = itemErrors?.[i];
          if (!it) continue;
          for (const key of ["quantity", "finalRate", "sizeId", "rangeTypeId", "uomId", "descriptionSnapshot", "uomSnapshot"] as const) {
            const m = it[key]?.message;
            if (m) messages.push(`Item ${i + 1}: ${m}`);
          }
        }
        if (messages.length === 0) return null;
        return (
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
            <p className="text-sm font-medium text-destructive">Please fix the following:</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-destructive">
              {messages.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        );
      })()}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : isEdit ? "Save Changes" : "Save Draft"}
        </Button>
      </div>
    </form>
  );
}
