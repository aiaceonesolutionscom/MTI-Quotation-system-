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

const nameStatusSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  status: z.boolean(),
});
type NameStatusInput = z.infer<typeof nameStatusSchema>;

export interface MasterItem {
  id: string;
  name: string;
  status: boolean;
}

export function MasterDialog({
  entityLabel,
  item,
  namePlaceholder,
  onCreate,
  onUpdate,
}: {
  entityLabel: string;
  item?: MasterItem;
  namePlaceholder?: string;
  onCreate: (data: NameStatusInput) => Promise<{ error?: string }>;
  onUpdate: (id: string, data: NameStatusInput) => Promise<{ error?: string }>;
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
  } = useForm<NameStatusInput>({
    resolver: zodResolver(nameStatusSchema),
    defaultValues: { name: item?.name ?? "", status: item?.status ?? true },
  });

  const onSubmit = async (data: NameStatusInput) => {
    const result = isEdit ? await onUpdate(item.id, data) : await onCreate(data);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? `${entityLabel} updated.` : `${entityLabel} created.`);
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
        <DialogTrigger render={<Button />}>
          <Plus /> Add {entityLabel}
        </DialogTrigger>
      )}
      <DialogContent>
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEdit ? `Edit ${entityLabel}` : `Add ${entityLabel}`}</DialogTitle>
            <DialogDescription>
              {isEdit ? `Update this ${entityLabel.toLowerCase()}.` : `Create a new ${entityLabel.toLowerCase()}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="master-name">{entityLabel} Name *</Label>
              <Input id="master-name" {...register("name")} placeholder={namePlaceholder} autoFocus />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="master-status"
                checked={watch("status")}
                onCheckedChange={(v) => setValue("status", v)}
              />
              <Label htmlFor="master-status" className="font-normal">
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
