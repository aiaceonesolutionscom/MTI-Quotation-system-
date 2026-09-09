import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { QuotationSettingsForm } from "./quotation-settings-form";

export default async function QuotationSettingsPage() {
  const settings = await prisma.quotationSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotation Settings"
        description="Controls quotation numbering. Expiry is always Quotation Date + 7 days and isn't configurable here."
      />
      <QuotationSettingsForm
        settings={{ prefix: settings.prefix, nextSequence: settings.nextSequence, currency: settings.currency }}
      />
    </div>
  );
}
