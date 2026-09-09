import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { CompanySettingsForm } from "./company-settings-form";

export default async function CompanySettingsPage() {
  const settings = await prisma.companySettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Company Profile" description="These details appear on every generated quotation PDF." />
      <CompanySettingsForm
        settings={{
          name: settings.name,
          logoUrl: settings.logoUrl ?? "",
          address: settings.address ?? "",
          phone: settings.phone ?? "",
          mobile: settings.mobile ?? "",
          email: settings.email ?? "",
          website: settings.website ?? "",
          ntn: settings.ntn ?? "",
          strn: settings.strn ?? "",
          isoCerts: settings.isoCerts ?? "",
        }}
      />
    </div>
  );
}
