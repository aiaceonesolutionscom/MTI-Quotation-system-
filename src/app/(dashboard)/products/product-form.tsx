"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Combobox } from "@/components/shared/combobox";
import { productSchema, type ProductInput, type ProductOutput } from "@/lib/validations/product.schema";
import { createProduct, updateProduct } from "@/actions/products.actions";
import { listSizesByCategory } from "@/actions/sizes.actions";
import { listRangeTypesByCategory } from "@/actions/range-types.actions";

interface Option {
  id: string;
  name: string;
}

export function ProductForm({
  product,
  categories,
  uoms,
  existingRates = [],
}: {
  product?: {
    id: string;
    name: string;
    categoryId: string;
    status: boolean;
  };
  categories: Option[];
  uoms: Option[];
  existingRates?: { id: string; sizeId: string; rangeTypeId: string; uomId: string; rate: string; status: boolean }[];
}) {
  const isEdit = !!product;
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const [sizes, setSizes] = useState<Option[]>([]);
  const [rangeTypes, setRangeTypes] = useState<Option[]>([]);
  const [loadingLookups, startLoadingLookups] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput, unknown, ProductOutput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      categoryId: product?.categoryId ?? "",
      status: product?.status ?? true,
      rates: existingRates.map((r) => ({
        id: r.id,
        sizeId: r.sizeId,
        rangeTypeId: r.rangeTypeId,
        uomId: r.uomId,
        rate: Number(r.rate),
        status: r.status,
      })),
    },
  });

  const { fields: rateFields, append: appendRate, remove: removeRate } = useFieldArray({ control, name: "rates" });

  const categoryId = watch("categoryId");

  useEffect(() => {
    if (!categoryId) {
      setSizes([]);
      setRangeTypes([]);
      return;
    }
    startLoadingLookups(async () => {
      const [s, r] = await Promise.all([listSizesByCategory(categoryId), listRangeTypesByCategory(categoryId)]);
      setSizes(s);
      setRangeTypes(r);
    });
  }, [categoryId]);

  const onSubmit = async (data: ProductOutput) => {
    setServerError(null);
    if (isEdit) {
      const result = await updateProduct(product.id, data);
      if (result?.error) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Product updated.");
      router.push(`/products/${product.id}`);
      return;
    }
    const result = await createProduct(data);
    if (result?.error) {
      setServerError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Product created.");
    router.push(`/products/${result.id}`);
  };

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const uomOptions = uoms.map((u) => ({ value: u.id, label: u.name }));
  const rateSizeOptions = sizes.map((s) => ({ value: s.id, label: s.name }));
  const rateRangeTypeOptions = rangeTypes.map((r) => ({ value: r.id, label: r.name }));

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form id="product-form" noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" {...register("name")} placeholder="e.g. Butterfly Valve" autoFocus />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Combobox
                      options={categoryOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select category"
                      searchPlaceholder="Search categories…"
                    />
                  )}
                />
                {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
              </div>

              <div className="flex items-center gap-2 sm:col-span-2">
                <Switch id="status" checked={watch("status")} onCheckedChange={(v) => setValue("status", v)} />
                <Label htmlFor="status" className="font-normal">
                  Active
                </Label>
              </div>
            </div>

            <div className="border-t border-border pt-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Rates</h3>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!categoryId}
                    onClick={() => appendRate({ sizeId: "", rangeTypeId: "", uomId: "", rate: 0, status: true })}
                  >
                    <Plus /> Add Rate
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  {!categoryId ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">Select a category above first.</p>
                  ) : rateFields.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No rates yet. Click &ldquo;Add Rate&rdquo; to price a Size + Range/Type + UOM combination.
                    </p>
                  ) : (
                    <Table className="min-w-[640px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Size</TableHead>
                          <TableHead>Range/Type</TableHead>
                          <TableHead>UOM</TableHead>
                          <TableHead className="w-32">Rate (PKR)</TableHead>
                          <TableHead className="w-12" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rateFields.map((field, index) => (
                          <TableRow key={field.id}>
                            <TableCell>
                              <Controller
                                control={control}
                                name={`rates.${index}.sizeId`}
                                render={({ field }) => (
                                  <Combobox
                                    options={rateSizeOptions}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder={loadingLookups ? "Loading…" : "Size"}
                                    searchPlaceholder="Search…"
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <Controller
                                control={control}
                                name={`rates.${index}.rangeTypeId`}
                                render={({ field }) => (
                                  <Combobox
                                    options={rateRangeTypeOptions}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder={loadingLookups ? "Loading…" : "Range/Type"}
                                    searchPlaceholder="Search…"
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <Controller
                                control={control}
                                name={`rates.${index}.uomId`}
                                render={({ field }) => (
                                  <Combobox
                                    options={uomOptions}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="UOM"
                                    searchPlaceholder="Search…"
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <Controller
                                control={control}
                                name={`rates.${index}.rate`}
                                render={({ field }) => (
                                  <>
                                    <Input
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      value={field.value == null ? "" : String(field.value)}
                                      onChange={(e) => field.onChange(e.target.value)}
                                      onBlur={field.onBlur}
                                      name={field.name}
                                      ref={field.ref}
                                    />
                                    {errors.rates?.[index]?.rate && (
                                      <p className="mt-1 text-sm text-destructive">{errors.rates[index]?.rate?.message}</p>
                                    )}
                                  </>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="text-destructive"
                                onClick={() => removeRate(index)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  {errors.rates && <p className="mt-2 text-sm text-destructive">{errors.rates.message as string}</p>}
                </div>
              </div>
          </form>
        </CardContent>
      </Card>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" form="product-form" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
      </Button>
    </div>
  );
}