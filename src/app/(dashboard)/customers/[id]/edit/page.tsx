import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { CustomerForm } from "../../customer-form";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <BackLink href="/customers" label="Back to Customers" />
      <PageHeader title="Edit Customer" description={customer.companyName} />
      <CustomerForm customer={customer} />
    </div>
  );
}
