import type { Metadata } from "next";
import { AuthForm, AuthLink, AuthShell } from "@/components/admin/auth-card";
import { requestPasswordReset } from "@/lib/admin/auth-actions";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset your password" description="We'll email you a link to choose a new one.">
      <AuthForm
        action={requestPasswordReset}
        submit="Send reset link"
        fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]}
        footer={
          <p className="text-center">
            <AuthLink href="/admin/login">Back to sign in</AuthLink>
          </p>
        }
      />
    </AuthShell>
  );
}
