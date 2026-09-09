"use client";

import { useState } from "react";
import { Search, Ruler, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { CategoryLookupRowActions } from "./category-lookup-row-actions";

interface Item {
  id: string;
  name: string;
  status: boolean;
}

const EMPTY_ICONS = { size: Ruler, rangeType: SlidersHorizontal } as const;

export function SearchableLookupList({
  entityLabel,
  columnLabel,
  categoryId,
  items,
  emptyIcon,
  onCreate,
  onUpdate,
  onToggleStatus,
  onDelete,
}: {
  entityLabel: string;
  columnLabel: string;
  categoryId: string;
  items: Item[];
  emptyIcon: keyof typeof EMPTY_ICONS;
  onCreate: (data: { name: string; categoryId: string; status: boolean }) => Promise<{ error?: string }>;
  onUpdate: (id: string, data: { name: string; categoryId: string; status: boolean }) => Promise<{ error?: string }>;
  onToggleStatus: (id: string, status: boolean) => Promise<{ error?: string }>;
  onDelete: (id: string) => Promise<{ error?: string }>;
}) {
  const [query, setQuery] = useState("");

  if (items.length === 0) {
    return (
      <EmptyState
        icon={EMPTY_ICONS[emptyIcon]}
        title={`No ${entityLabel.toLowerCase()}s yet`}
        description={`Add the ${entityLabel.toLowerCase()}s available for this category.`}
      />
    );
  }

  const filtered = query.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(query.trim().toLowerCase()))
    : items;

  return (
    <div className="space-y-3">
      {items.length > 8 && (
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${entityLabel.toLowerCase()}s…`}
            className="pl-8"
          />
        </div>
      )}

      <div className="max-h-[420px] overflow-y-auto rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-card">
            <TableRow>
              <TableHead>{columnLabel}</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="py-8 text-center text-sm text-muted-foreground">
                  No {entityLabel.toLowerCase()}s match &ldquo;{query}&rdquo;.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <CategoryLookupRowActions
                      entityLabel={entityLabel}
                      categoryId={categoryId}
                      item={item}
                      onCreate={onCreate}
                      onUpdate={onUpdate}
                      onToggleStatus={onToggleStatus}
                      onDelete={onDelete}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
