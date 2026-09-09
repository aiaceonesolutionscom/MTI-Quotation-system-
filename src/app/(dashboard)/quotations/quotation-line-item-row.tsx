"use client";

import { useEffect, useRef, useState, useTransition, type KeyboardEvent, type RefObject } from "react";
import { Controller, type Control, type UseFormSetValue } from "react-hook-form";
import { Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TableCell, TableRow } from "@/components/ui/table";
import { Combobox, type ComboboxOption } from "@/components/shared/combobox";
import { listProductRates } from "@/actions/rates.actions";
import { generateItemDescription } from "@/lib/item-description";
import { formatMoney } from "@/lib/money";
import type { QuotationBuilderValues } from "./quotation-form";

interface Option {
  id: string;
  name: string;
}

interface ProductOption extends Option {}

function focusNext(ref: RefObject<HTMLInputElement | null>) {
  return (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      ref.current?.focus();
      ref.current?.select();
    }
  };
}

export function QuotationLineItemRow({
  index,
  control,
  setValue,
  products,
  sizes,
  rangeTypes,
  uoms,
  onRemove,
  onDuplicate,
  quantity,
  finalRate,
  initialProductId,
  initialIsOverridden,
}: {
  index: number;
  control: Control<QuotationBuilderValues>;
  setValue: UseFormSetValue<QuotationBuilderValues>;
  products: ProductOption[];
  sizes: Option[];
  rangeTypes: Option[];
  uoms: Option[];
  onRemove: () => void;
  onDuplicate: () => void;
  quantity: number;
  finalRate: number;
  initialProductId?: string | null;
  initialIsOverridden?: boolean;
}) {
  const [specOptions, setSpecOptions] = useState<
    { id: string; sizeId: string; sizeName: string; rangeTypeId: string; rangeTypeName: string; uomId: string; uomName: string; rate: string }[]
  >([]);
  const [loadingRates, startLoadingRates] = useTransition();
  const [productId, setProductId] = useState(initialProductId ?? "");
  const [overridden, setOverridden] = useState(!!initialProductId && !!initialIsOverridden);
  const [isCustom, setIsCustom] = useState(initialProductId !== undefined ? !initialProductId : false);

  const descRef = useRef<HTMLInputElement>(null);
  const uomRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const rateRef = useRef<HTMLInputElement>(null);

  const productOptions: ComboboxOption[] = products.map((p) => ({ value: p.id, label: p.name }));
  const specComboOptions: ComboboxOption[] = specOptions.map((s) => ({
    value: s.id,
    label: `${s.sizeName} / ${s.rangeTypeName} / ${s.uomName}`,
    sublabel: formatMoney(s.rate),
  }));

  const loadRates = (id: string) => {
    startLoadingRates(async () => {
      const rates = await listProductRates(id);
      setSpecOptions(rates);
    });
  };

  useEffect(() => {
    if (productId) loadRates(productId);
  }, [productId]);

  const lineTotal = (quantity || 0) * (finalRate || 0);

  const switchToCustom = (custom: boolean) => {
    setIsCustom(custom);
    if (custom) {
      setProductId("");
      setSpecOptions([]);
      setOverridden(false);
      setValue(`items.${index}.productId`, "");
      setValue(`items.${index}.sizeId`, "");
      setValue(`items.${index}.rangeTypeId`, "");
      setValue(`items.${index}.uomId`, "");
      setValue(`items.${index}.productRateId`, "");
      setValue(`items.${index}.matchedRateSnapshot`, null);
      setValue(`items.${index}.isOverridden`, true);
    } else {
      setValue(`items.${index}.descriptionSnapshot`, "");
      setValue(`items.${index}.uomSnapshot`, "");
      setValue(`items.${index}.isOverridden`, false);
    }
  };

  return (
    <>
      <TableRow>
        <TableCell className="align-top text-sm text-muted-foreground">{index + 1}</TableCell>
        <TableCell className="min-w-[190px] align-top">
          {isCustom ? (
            <p className="mt-1.5 text-xs text-muted-foreground">Custom item — no product link</p>
          ) : (
            <Controller
              control={control}
              name={`items.${index}.productId`}
              render={({ field }) => (
                <Combobox
                  options={productOptions}
                  value={field.value ?? ""}
                  onChange={(value) => {
                    const product = products.find((p) => p.id === value);
                    field.onChange(value);
                    setProductId(value);
                    setValue(`items.${index}.sizeId`, "");
                    setValue(`items.${index}.rangeTypeId`, "");
                    setValue(`items.${index}.uomId`, "");
                    setValue(`items.${index}.productRateId`, "");
                    setValue(`items.${index}.finalRate`, 0);
                    setValue(`items.${index}.matchedRateSnapshot`, null);
                    setValue(`items.${index}.descriptionSnapshot`, product ? generateItemDescription({ productName: product.name }) : "");
                    setValue(`items.${index}.uomSnapshot`, "");
                  }}
                  placeholder="Select product"
                  searchPlaceholder="Search products…"
                />
              )}
            />
          )}
          <div className="mt-1 flex items-center gap-1.5">
            <Checkbox
              id={`custom-${index}`}
              checked={isCustom}
              onCheckedChange={(v) => switchToCustom(v === true)}
            />
            <Label htmlFor={`custom-${index}`} className="text-xs font-normal text-muted-foreground">
              Custom item (not in Products)
            </Label>
          </div>
        </TableCell>
        <TableCell className="min-w-[260px] align-top">
          {isCustom ? (
            <p className="mt-1.5 text-xs text-muted-foreground">—</p>
          ) : !overridden ? (
            <Controller
              control={control}
              name={`items.${index}.productRateId`}
              render={({ field }) => (
                <Combobox
                  options={specComboOptions}
                  value={field.value ?? ""}
                  onChange={(value) => {
                    const spec = specOptions.find((s) => s.id === value);
                    const product = products.find((p) => p.id === productId);
                    if (!spec) return;
                    field.onChange(value);
                    setValue(`items.${index}.sizeId`, spec.sizeId);
                    setValue(`items.${index}.rangeTypeId`, spec.rangeTypeId);
                    setValue(`items.${index}.uomId`, spec.uomId);
                    setValue(`items.${index}.finalRate`, Number(spec.rate));
                    setValue(`items.${index}.matchedRateSnapshot`, Number(spec.rate));
                    setValue(
                      `items.${index}.descriptionSnapshot`,
                      generateItemDescription({
                        productName: product?.name ?? "",
                        sizeName: spec.sizeName,
                        rangeTypeName: spec.rangeTypeName,
                      })
                    );
                    setValue(`items.${index}.uomSnapshot`, spec.uomName);
                  }}
                  placeholder={
                    !productId
                      ? "Select a product first"
                      : loadingRates
                        ? "Loading…"
                        : specOptions.length === 0
                          ? "No rates configured"
                          : "Select size / range / UOM"
                  }
                  searchPlaceholder="Search…"
                  disabled={!productId}
                />
              )}
            />
          ) : (
            <div className="flex flex-col gap-1">
              <Controller
                control={control}
                name={`items.${index}.sizeId`}
                render={({ field }) => (
                  <Combobox
                    options={sizes.map((s) => ({ value: s.id, label: s.name }))}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Size"
                    searchPlaceholder="Size…"
                  />
                )}
              />
              <Controller
                control={control}
                name={`items.${index}.rangeTypeId`}
                render={({ field }) => (
                  <Combobox
                    options={rangeTypes.map((r) => ({ value: r.id, label: r.name }))}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Range"
                    searchPlaceholder="Range…"
                  />
                )}
              />
              <Controller
                control={control}
                name={`items.${index}.uomId`}
                render={({ field }) => (
                  <Combobox
                    options={uoms.map((u) => ({ value: u.id, label: u.name }))}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="UOM"
                    searchPlaceholder="UOM…"
                  />
                )}
              />
            </div>
          )}
          {!isCustom && (
            <div className="mt-1 flex items-center gap-1.5">
              <Checkbox
                id={`override-${index}`}
                checked={overridden}
                onCheckedChange={(v) => {
                  const next = v === true;
                  setOverridden(next);
                  setValue(`items.${index}.isOverridden`, next);
                }}
              />
              <Label htmlFor={`override-${index}`} className="text-xs font-normal text-muted-foreground">
                Override rate manually
              </Label>
            </div>
          )}
        </TableCell>
        <TableCell className="min-w-[240px] align-top">
          <Controller
            control={control}
            name={`items.${index}.descriptionSnapshot`}
            render={({ field }) => (
              <Input
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={(el) => {
                  field.ref(el);
                  descRef.current = el;
                }}
                placeholder="Full item description shown on the quotation"
                onKeyDown={focusNext(uomRef)}
              />
            )}
          />
        </TableCell>
        <TableCell className="w-28 align-top">
          <Controller
            control={control}
            name={`items.${index}.uomSnapshot`}
            render={({ field }) => (
              <Input
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={(el) => {
                  field.ref(el);
                  uomRef.current = el;
                }}
                placeholder="e.g. NOS"
                onKeyDown={focusNext(qtyRef)}
              />
            )}
          />
        </TableCell>
        <TableCell className="w-24 align-top">
          <Controller
            control={control}
            name={`items.${index}.quantity`}
            render={({ field }) => (
              <Input
                type="number"
                min={1}
                step="1"
                value={field.value == null ? "" : String(field.value)}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                name={field.name}
                ref={(el) => {
                  field.ref(el);
                  qtyRef.current = el;
                }}
                onKeyDown={focusNext(rateRef)}
              />
            )}
          />
        </TableCell>
        <TableCell className="w-32 align-top">
          <Controller
            control={control}
            name={`items.${index}.finalRate`}
            render={({ field }) => (
              <Input
                type="number"
                min={0}
                step="0.01"
                disabled={!overridden && !isCustom}
                value={field.value == null ? "" : String(field.value)}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                name={field.name}
                ref={(el) => {
                  field.ref(el);
                  rateRef.current = el;
                }}
              />
            )}
          />
        </TableCell>
        <TableCell className="w-32 align-top text-right font-medium">{formatMoney(lineTotal)}</TableCell>
        <TableCell className="align-top">
          <div className="flex items-center gap-0.5">
            <Button type="button" variant="ghost" size="icon-sm" onClick={onDuplicate} title="Duplicate line">
              <Copy className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-destructive"
              onClick={onRemove}
              title="Delete line"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    </>
  );
}
