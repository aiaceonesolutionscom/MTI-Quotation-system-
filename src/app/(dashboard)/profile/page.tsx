import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { ChangePasswordForm } from "./change-password-form";

export default async function ProfilePage() {
  const session = await auth();
  const user = session!.user;

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Your account details." />

      <Card className="max-w-md">
        <CardContent className="space-y-3 pt-6 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span>{user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{user.email}</span>
          </div>
        </CardContent>
      </Card>

      <ChangePasswordForm />
    </div>
  );
}
