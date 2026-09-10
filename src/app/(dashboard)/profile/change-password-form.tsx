"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { changeOwnPasswordSchema } from "@/lib/validations/settings.schema";
import { changeOwnPassword } from "@/actions/users.actions";

type FormValues = z.infer<typeof changeOwnPasswordSchema>;

function PasswordField({
  id,
  label,
  register,
  error,
  show,
  onToggle,
}: {
  id: string;
  label: string;
  register: ReturnType<typeof useForm<FormValues>>["register"];
  error?: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label} *</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          {...register(id as keyof FormValues)}
          className="pr-10"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function ChangePasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(changeOwnPasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    const result = await changeOwnPassword(data);
    if (result?.error) {
      setServerError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Password changed.");
    reset();
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <PasswordField
            id="currentPassword"
            label="Current Password"
            register={register}
            error={errors.currentPassword?.message}
            show={showCurrent}
            onToggle={() => setShowCurrent(!showCurrent)}
          />
          <PasswordField
            id="newPassword"
            label="New Password"
            register={register}
            error={errors.newPassword?.message}
            show={showNew}
            onToggle={() => setShowNew(!showNew)}
          />
          <PasswordField
            id="confirmPassword"
            label="Confirm New Password"
            register={register}
            error={errors.confirmPassword?.message}
            show={showConfirm}
            onToggle={() => setShowConfirm(!showConfirm)}
          />

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Change Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
