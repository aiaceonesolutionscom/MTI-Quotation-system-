"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ProductFilters({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [initial] = useState(() => new URLSearchParams(searchParams.toString()));
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

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search products…"
          defaultValue={initial.get("q") ?? ""}
          className="pl-8"
          onChange={(e) => updateDebounced("q", e.target.value)}
        />
      </div>
      <Select defaultValue={initial.get("category") ?? "all"} onValueChange={(v) => update("category", v === "all" || !v ? "" : v)}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue>
            {(v) => (v === "all" || !v ? "All Categories" : categories.find((c) => c.id === v)?.name ?? "All Categories")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select defaultValue={initial.get("status") ?? "all"} onValueChange={(v) => update("status", v === "all" || !v ? "" : v)}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue>
            {(v) => (v === "all" || !v ? "All Status" : v === "active" ? "Active" : "Inactive")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
