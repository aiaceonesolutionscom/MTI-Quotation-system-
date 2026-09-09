"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50),
  status: z.boolean(),
});
type FormInput = z.infer<typeof formSchema>;

export interface CategoryLookupItem {
  id: string;
  name: string;
  status: boolean;
}

export function CategoryLookupDialog({
  entityLabel,
  categoryId,
  item,
  namePlaceholder,
  onCreate,
  onUpdate,
}: {
  entityLabel: string;
  categoryId: string;
  item?: CategoryLookupItem;
  namePlaceholder?: string;
  onCreate: (data: { name: string; categoryId: string; status: boolean }) => Promise<{ error?: string }>;
  onUpdate: (id: string, data: { name: string; categoryId: string; status: boolean }) => Promise<{ error?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = !!item;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: item?.name ?? "", status: item?.status ?? true },
  });

  const onSubmit = async (data: FormInput) => {
    const payload = { ...data, categoryId };
    const result = isEdit ? await onUpdate(item.id, payload) : await onCreate(payload);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? `${entityLabel} updated.` : `${entityLabel} added.`);
    setOpen(false);
    if (!isEdit) reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset({ name: item?.name ?? "", status: item?.status ?? true });
      }}
    >
      {isEdit ? (
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <Pencil className="size-4" />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size="sm" />}>
          <Plus /> Add {entityLabel}
        </DialogTrigger>
      )}
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEdit ? `Edit ${entityLabel}` : `Add ${entityLabel}`}</DialogTitle>
            <DialogDescription>
              {isEdit ? `Update this ${entityLabel.toLowerCase()}.` : `Add a new ${entityLabel.toLowerCase()} for this category.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lookup-name">{entityLabel} Name *</Label>
              <Input id="lookup-name" {...register("name")} placeholder={namePlaceholder} autoFocus />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="lookup-status"
                checked={watch("status")}
                onCheckedChange={(v) => setValue("status", v)}
              />
              <Label htmlFor="lookup-status" className="font-normal">
                Active
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
