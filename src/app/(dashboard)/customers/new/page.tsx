import { PageHeader } from "@/components/shared/page-header";
import { CustomerForm } from "../customer-form";

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add Customer" description="Create a new customer record." />
      <CustomerForm />
    </div>
  );
}
