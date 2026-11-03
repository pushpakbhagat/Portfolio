import type { Metadata } from "next";
import { AuthForm, AuthShell } from "@/components/admin/auth-card";
import { updatePassword } from "@/lib/admin/auth-actions";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  await requireAdmin();
  return (
    <AuthShell title="Choose a new password" description="At least 12 characters, mixing letters and numbers.">
      <AuthForm
        action={updatePassword}
        submit="Update password"
        fields={[
          { name: "password", label: "New password", type: "password", autoComplete: "new-password" },
          { name: "confirm", label: "Confirm password", type: "password", autoComplete: "new-password" },
        ]}
      />
    </AuthShell>
  );
}
