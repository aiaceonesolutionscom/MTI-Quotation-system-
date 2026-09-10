"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function parseNames(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function BulkAddDialog({
  entityLabel,
  placeholder,
  onCreateBulk,
}: {
  entityLabel: string;
  placeholder: string;
  onCreateBulk: (names: string[]) => Promise<{ error?: string; count?: number }>;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const names = parseNames(value);

  const handleSubmit = async () => {
    if (names.length === 0) return;
    setPending(true);
    const result = await onCreateBulk(names);
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`${result.count ?? names.length} ${entityLabel.toLowerCase()}(s) added.`);
    setValue("");
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setValue("");
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        <Plus /> Add {entityLabel}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {entityLabel}</DialogTitle>
          <DialogDescription>
            Add several at once — one per line, or comma-separated. All of them are added together when you save.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4">
          <Label htmlFor="bulk-names">{entityLabel} Names</Label>
          <Textarea
            id="bulk-names"
            rows={6}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            {names.length > 0 ? `${names.length} will be added: ${names.join(", ")}` : "Nothing entered yet."}
          </p>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSubmit} disabled={pending || names.length === 0}>
            {pending ? "Saving…" : `Add ${names.length || ""} ${entityLabel}${names.length === 1 ? "" : "s"}`.trim()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
