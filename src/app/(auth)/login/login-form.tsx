"use client";

import { useActionState } from "react";
import { loginAction, type LoginActionState } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: LoginActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center text-center">
        <img src="/logo.png" alt="MTI" className="mb-2 size-12" />
        <CardTitle className="text-xl">Master Tech International</CardTitle>
        <CardDescription>Sign in to the quotation management system</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="remember" name="remember" defaultChecked />
            <Label htmlFor="remember" className="font-normal text-muted-foreground">
              Remember session
            </Label>
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Forgot your password? Ask a Super Admin or Admin to reset it for you.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
