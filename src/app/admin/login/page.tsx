import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm, AuthLink, AuthShell } from "@/components/admin/auth-card";
import { signIn } from "@/lib/admin/auth-actions";
import { getAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await getAdmin()) redirect("/admin");
  const { next, error } = await searchParams;

  if (!isSupabaseConfigured) {
    return (
      <AuthShell title="Connect Supabase first" description="The admin needs a Supabase project to sign in and store content.">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Copy .env.example to .env.local and fill in the Supabase values.</li>
          <li>Run npm run db:setup to create the tables.</li>
          <li>Run npm run admin:create -- --email you@example.com.</li>
          <li>Restart npm run dev and come back here.</li>
        </ol>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Sign in" description="Manage your portfolio content.">
      <AuthForm
        action={signIn}
        submit="Sign in"
        hidden={{ next: typeof next === "string" ? next : "/admin" }}
        initialError={error === "link" ? "That link has expired or was already used. Request a new one." : undefined}
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          {
            name: "password",
            label: "Password",
            type: "password",
            autoComplete: "current-password",
            extra: <AuthLink href="/admin/forgot-password">Forgot password?</AuthLink>,
          },
        ]}
      />
    </AuthShell>
  );
}
