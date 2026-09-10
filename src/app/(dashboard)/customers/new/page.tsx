import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { CustomerForm } from "../customer-form";

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <BackLink href="/customers" label="Back to Customers" />
      <PageHeader title="Add Customer" description="Create a new customer record." />
      <CustomerForm />
    </div>
  );
}
