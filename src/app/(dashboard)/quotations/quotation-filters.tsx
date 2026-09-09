"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/shared/combobox";
import { DateInput } from "@/components/shared/date-input";
import { cn } from "@/lib/utils";

interface Option {
  id: string;
  name: string;
}

const QUICK_FILTERS = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "expired", label: "Expired" },
  { value: "expiring_soon", label: "Expiring Soon" },
  { value: "active", label: "Active" },
];

const STATUS_LABELS: Record<string, string> = {
  all: "All Status",
  DRAFT: "Draft",
  GENERATED: "Generated",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
};

export function QuotationFilters({ customers }: { customers: Option[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const updateDebounced = (key: string, value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => update(key, value), 300);
  };

  const quick = searchParams.get("quick") ?? "";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((f) => (
          <Button
            key={f.value}
            type="button"
            size="sm"
            variant={quick === f.value ? "default" : "outline"}
            onClick={() => update("quick", quick === f.value ? "" : f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Quotation #…"
            defaultValue={searchParams.get("q") ?? ""}
            className="pl-8"
            onChange={(e) => updateDebounced("q", e.target.value)}
          />
        </div>
        <Combobox
          options={customers.map((c) => ({ value: c.id, label: c.name }))}
          value={searchParams.get("customer") ?? ""}
          onChange={(v) => update("customer", v)}
          placeholder="Customer"
          searchPlaceholder="Search customers…"
        />
        <Select
          defaultValue={searchParams.get("status") ?? "all"}
          onValueChange={(v) => update("status", v === "all" || !v ? "" : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue>{(v) => STATUS_LABELS[v ?? ""] ?? "All Status"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="GENERATED">Generated</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="ACCEPTED">Accepted</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DateInput value={searchParams.get("from") ?? ""} onChange={(v) => update("from", v)} label="Start Date" />
        <DateInput value={searchParams.get("to") ?? ""} onChange={(v) => update("to", v)} label="End Date" />
      </div>
    </div>
  );
}