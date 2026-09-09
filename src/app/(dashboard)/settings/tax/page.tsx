import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { TaxSettingsForm } from "./tax-settings-form";

export default async function TaxSettingsPage() {
  const settings = await prisma.taxSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Tax Settings" description="Default GST and Additional Tax used to pre-fill new quotations." />
      <TaxSettingsForm
        settings={{
          defaultGstPercent: Number(settings.defaultGstPercent),
          defaultAdditionalTaxEnabled: settings.defaultAdditionalTaxEnabled,
          defaultAdditionalTaxName: settings.defaultAdditionalTaxName ?? "",
          defaultAdditionalTaxPercent:
            settings.defaultAdditionalTaxPercent != null ? Number(settings.defaultAdditionalTaxPercent) : null,
        }}
      />
    </div>
  );
}
