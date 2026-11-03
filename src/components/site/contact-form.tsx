"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitContact } from "@/app/(site)/actions";
import { Magnetic } from "@/components/motion/magnetic";
import { contactSchema, type ContactInput } from "@/lib/validation/contact";
import { cn } from "@/lib/utils";

function Field({
  label,
  error,
  children,
  htmlFor,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  htmlFor: string;
}) {
  return (
    <div className="group relative border-b transition-colors focus-within:border-foreground">
      <label htmlFor={htmlFor} className="eyebrow block pt-5 group-focus-within:!text-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="pb-3 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass =
  "w-full bg-transparent pt-2 pb-4 text-lg tracking-tight outline-none placeholder:text-muted-foreground/60 focus-visible:outline-none";

export function ContactForm() {
  const [startedAt] = useState(() => Date.now());
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const onSubmit = handleSubmit((values, event) => {
    const website = (event?.target as HTMLFormElement | undefined)?.website?.value ?? "";
    startTransition(async () => {
      const result = await submitContact({ ...values, website, startedAt });
      if (result.ok) {
        setSent(true);
        reset();
        toast.success("Message sent. Thank you!");
        return;
      }
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        setError(field as keyof ContactInput, { message });
      }
      toast.error(result.error);
    });
  });

  if (sent) {
    return (
      <div className="flex min-h-[26rem] flex-col justify-center gap-6 border-y py-12" role="status">
        <span className="grid size-12 place-items-center rounded-full bg-signal text-signal-foreground">
          <Check className="size-5" />
        </span>
        <p className="text-title">Thanks, your message is on its way.</p>
        <p className="max-w-sm text-muted-foreground">I read every message and will reply to the address you gave.</p>
        <button type="button" onClick={() => setSent(false)} className="link-draw self-start text-sm font-medium">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-2">
      {/* Honeypot: hidden from people and assistive tech, tempting to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-x-8 md:grid-cols-2">
        <Field label="Name" htmlFor="contact-name" error={errors.name?.message}>
          <input
            id="contact-name"
            autoComplete="name"
            placeholder="Your name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            className={inputClass}
            {...register("name")}
          />
        </Field>
        <Field label="Email" htmlFor="contact-email" error={errors.email?.message}>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            className={inputClass}
            {...register("email")}
          />
        </Field>
      </div>
      <Field label="Subject" htmlFor="contact-subject" error={errors.subject?.message}>
        <input id="contact-subject" placeholder="What's it about? (optional)" className={inputClass} {...register("subject")} />
      </Field>
      <Field label="Message" htmlFor="contact-message" error={errors.message?.message}>
        <textarea
          id="contact-message"
          rows={5}
          placeholder="Tell me about the role, project or idea…"
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          className={cn(inputClass, "resize-none")}
          data-lenis-prevent
          {...register("message")}
        />
      </Field>

      <div className="pt-8">
        <Magnetic strength={0.25}>
          <button
            type="submit"
            disabled={pending}
            className="beam group inline-flex h-14 items-center gap-3 rounded-full bg-primary pr-2 pl-7 text-sm font-medium text-primary-foreground disabled:opacity-70"
          >
            {pending ? "Sending…" : "Send message"}
            <span className="grid size-10 place-items-center rounded-full bg-signal text-signal-foreground transition-transform duration-500 group-hover:rotate-[-45deg]">
              {pending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            </span>
          </button>
        </Magnetic>
      </div>
    </form>
  );
}
