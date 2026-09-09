"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface DateInputProps {
  value: string;
  onChange: (iso: string) => void;
  label: string;
}

function isoToDate(iso: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return undefined;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function isoToDisplay(iso: string): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  return `${m[2]}/${m[3]}/${m[1]}`;
}

function formatTyped(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const parts: string[] = [];
  if (digits.length > 0) parts.push(digits.slice(0, 2));
  if (digits.length > 2) parts.push(digits.slice(2, 4));
  if (digits.length > 4) parts.push(digits.slice(4, 8));
  return parts.join("/");
}

function isValidDate(mm: string, dd: string, yyyy: string): boolean {
  const m = Number(mm);
  const d = Number(dd);
  const y = Number(yyyy);
  if (!m || !d || !y) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function DateInput({ value, onChange, label }: DateInputProps) {
  const lastEmitted = useRef(value);
  const [text, setText] = useState(() => isoToDisplay(value));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (value !== lastEmitted.current) {
      lastEmitted.current = value;
      setText(isoToDisplay(value));
    }
  }, [value]);

  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emit = (iso: string) => {
    if (pendingRef.current) clearTimeout(pendingRef.current);
    pendingRef.current = null;
    lastEmitted.current = iso;
    setText(isoToDisplay(iso));
    onChange(iso);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTyped(e.target.value);
    const digits = formatted.replace(/\D/g, "");
    let iso = "";
    if (digits.length === 8 && isValidDate(digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8))) {
      iso = `${digits.slice(4, 8)}-${digits.slice(0, 2)}-${digits.slice(2, 4)}`;
    }
    setText(formatted);
    if (pendingRef.current) clearTimeout(pendingRef.current);
    pendingRef.current = setTimeout(() => {
      pendingRef.current = null;
      lastEmitted.current = iso;
      onChange(iso);
    }, 250);
  };

  const selected = isoToDate(value);
  const defaultMonth = selected ?? new Date();

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <Input
          type="text"
          inputMode="numeric"
          value={text}
          maxLength={10}
          placeholder="MM/DD/YYYY"
          aria-label={`${label} (MM/DD/YYYY)`}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          className="pr-9"
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 size-6 -translate-y-1/2 text-muted-foreground"
              />
            }
          >
            <CalendarIcon className="size-4" />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-1">
            <Calendar
              mode="single"
              selected={selected}
              defaultMonth={defaultMonth}
              onSelect={(d) => {
                if (d) {
                  emit(format(d, "yyyy-MM-dd"));
                  setOpen(false);
                }
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}