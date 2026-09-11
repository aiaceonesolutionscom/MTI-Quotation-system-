"use client";

import { useMemo } from "react";
import { Package, Users, FileText, FileClock, Clock3, CheckCircle2, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";
import { getEffectiveStatus } from "@/lib/quotation-expiry";
import { useExpiryTick } from "@/hooks/use-expiry-tick";
import type { QuotationStatus } from "@/generated/prisma/enums";

type QuotationMeta = { status: QuotationStatus; expirationDate: number };

export function DashboardStats({
  totalProducts,
  totalCustomers,
  totalQuotations,
  quotations,
  totalValue,
}: {
  totalProducts: number;
  totalCustomers: number;
  totalQuotations: number;
  quotations: QuotationMeta[];
  totalValue: number;
}) {
  const now = useExpiryTick();

  const { draftCount, activeCount, expiredCount } = useMemo(() => {
    let draftCount = 0;
    let activeCount = 0;
    let expiredCount = 0;

    for (const q of quotations) {
      const effective = getEffectiveStatus({ status: q.status, expirationDate: new Date(q.expirationDate) }, now);
      if (q.status === "DRAFT") draftCount++;
      if (effective === "EXPIRED") expiredCount++;
      else if (effective !== "ACCEPTED" && effective !== "REJECTED") activeCount++;
    }

    return { draftCount, activeCount, expiredCount };
  }, [quotations, now]);

  const cards = [
    { label: "Total Products", value: totalProducts, icon: Package },
    { label: "Total Customers", value: totalCustomers, icon: Users },
    { label: "Total Quotations", value: totalQuotations, icon: FileText },
    { label: "Draft Quotations", value: draftCount, icon: FileClock },
    { label: "Active Quotations", value: activeCount, icon: Clock3 },
    { label: "Expired Quotations", value: expiredCount, icon: CheckCircle2 },
  ];

  return (
    <>
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <c.icon className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-tight">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
      <Card className="sm:col-span-2 lg:col-span-3 xl:col-span-6">
        <CardContent className="flex items-center gap-3 pt-6">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <DollarSign className="size-5" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-tight">{formatMoney(totalValue)}</p>
            <p className="text-xs text-muted-foreground">Total Quotation Value</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}