"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MasterDialog, type MasterItem } from "@/components/shared/master-dialog";

export function MasterRowActions({
  entityLabel,
  item,
  namePlaceholder,
  onCreate,
  onUpdate,
  onToggleStatus,
  onDelete,
}: {
  entityLabel: string;
  item: MasterItem;
  namePlaceholder?: string;
  onCreate: (data: { name: string; status: boolean }) => Promise<{ error?: string }>;
  onUpdate: (id: string, data: { name: string; status: boolean }) => Promise<{ error?: string }>;
  onToggleStatus: (id: string, status: boolean) => Promise<{ error?: string }>;
  onDelete: (id: string) => Promise<{ error?: string }>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-end gap-2">
      <Switch
        checked={item.status}
        disabled={pending}
        onCheckedChange={(checked) =>
          startTransition(async () => {
            const result = await onToggleStatus(item.id, checked);
            if (result?.error) toast.error(result.error);
          })
        }
      />
      <MasterDialog
        entityLabel={entityLabel}
        item={item}
        namePlaceholder={namePlaceholder}
        onCreate={onCreate}
        onUpdate={onUpdate}
      />
      <ConfirmDialog
        trigger={
          <Button variant="ghost" size="icon-sm" className="text-destructive">
            <Trash2 className="size-4" />
          </Button>
        }
        title={`Delete ${entityLabel.toLowerCase()}?`}
        description={`This will permanently delete "${item.name}". This cannot be undone.`}
        onConfirm={() => onDelete(item.id)}
      />
    </div>
  );
}
