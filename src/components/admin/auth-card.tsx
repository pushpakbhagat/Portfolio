"use client";

import { useActionState, type ReactNode } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthState } from "@/lib/admin/auth-actions";

export function AuthShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r bg-surface p-10 lg:flex">
        <p className="eyebrow">Portfolio · Admin</p>
        <p className="text-headline max-w-md">
          Your work, <span className="serif-accent">kept current.</span>
        </p>
        <p className="eyebrow">Signed-in admins only</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 mb-8 text-sm text-muted-foreground">{description}</p>
          {children}
        </div>
      </div>
    </main>
  );
}

type FieldSpec = { name: string; label: string; type: string; autoComplete: string; extra?: ReactNode };

export function AuthForm({
  action,
  fields,
  submit,
  hidden,
  footer,
  initialError,
}: {
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  fields: FieldSpec[];
  submit: string;
  hidden?: Record<string, string>;
  footer?: ReactNode;
  initialError?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialError ? { error: initialError } : undefined);

  return (
    <form action={formAction} className="space-y-5">
      {Object.entries(hidden ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {fields.map((f) => (
        <div key={f.name} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={f.name}>{f.label}</Label>
            {f.extra}
          </div>
          <Input id={f.name} name={f.name} type={f.type} autoComplete={f.autoComplete} required className="h-10" />
        </div>
      ))}
      {state?.error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.message && (
        <p role="status" className="rounded-md border bg-surface px-3 py-2 text-sm">
          {state.message}
        </p>
      )}
      <Button type="submit" className="h-10 w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {submit}
      </Button>
      {footer}
    </form>
  );
}

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
      {children}
    </Link>
  );
}
