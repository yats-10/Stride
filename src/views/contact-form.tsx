"use client";

// Contact form — a bold intro prompt, three underlined fields (name + phone on one
// row, email below) and a centred pill submit. Pinned (`sticky top-0 h-lvh`, z-10)
// so the site footer slides up over it, the same two-layer reveal the Product uses
// over the chain (see home.tsx). Client leaf: controlled inputs POSTing to the
// same-origin `/api/contact` route handler via `apiFetch` (never a third-party API
// from the browser — see obsidian/backend/api-architecture.md). Motion stays
// spring-free — states change instantly.
import { useState, type FormEvent } from "react";
import { AnimatedHeading } from "@/components/common/animated-heading";
import { apiFetch } from "@/lib/api-client";
import type { ContactContent } from "@/data/mocks/contact";

export interface ContactFormProps {
  content: ContactContent;
}

type Status = "idle" | "sending" | "sent" | "error";

export const ContactForm = ({ content }: ContactFormProps) => {
  const { labelId, heading, fields, cta, status: statusCopy } = content;
  const [values, setValues] = useState({ name: "", phone: "", email: "" });
  const [status, setStatus] = useState<Status>("idle");

  const set = (key: keyof typeof values) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    try {
      await apiFetch("/api/contact", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setStatus("sent");
    } catch {
      // Surface the failure — a form that swallows a failed send loses the message
      // silently, which is worse than saying so.
      setStatus("error");
    }
  };

  const message =
    status === "sending"
      ? statusCopy.sending
      : status === "sent"
        ? statusCopy.sent
        : status === "error"
          ? statusCopy.error
          : "";

  // A filled field lights its trailing status dot.
  const dot = (filled: boolean) =>
    `pointer-events-none absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full ${
      filled ? "bg-black" : "bg-black/25"
    }`;

  const fieldWrap =
    "relative border-b border-black/25 pb-3 focus-within:border-black";
  const input =
    "w-full bg-transparent pr-6 text-lg text-black outline-none placeholder:uppercase placeholder:tracking-wide placeholder:text-black/40";

  return (
    <section
      id="contact"
      aria-labelledby={labelId}
      className="sticky top-0 z-10 flex h-lvh flex-col justify-center bg-hero-page px-6 py-24 md:px-12 lg:px-page-gutter"
    >
      <AnimatedHeading
        as="h2"
        id={labelId}
        className="mx-auto mb-16 max-w-2xl text-center text-2xl leading-snug tracking-tight text-black"
      >
        {heading}
      </AnimatedHeading>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-10">
        <div className="grid gap-10 md:grid-cols-2">
          <div className={fieldWrap}>
            <label htmlFor="cf-name" className="sr-only">
              {fields.name}
            </label>
            <input
              id="cf-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder={fields.name}
              value={values.name}
              onChange={set("name")}
              className={input}
            />
            <span aria-hidden="true" className={dot(values.name.length > 0)} />
          </div>

          <div className={fieldWrap}>
            <label htmlFor="cf-phone" className="sr-only">
              {fields.phone}
            </label>
            <input
              id="cf-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={fields.phone}
              value={values.phone}
              onChange={set("phone")}
              className={input}
            />
            <span aria-hidden="true" className={dot(values.phone.length > 0)} />
          </div>
        </div>

        <div className={fieldWrap}>
          <label htmlFor="cf-email" className="sr-only">
            {fields.email}
          </label>
          <input
            id="cf-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder={fields.email}
            value={values.email}
            onChange={set("email")}
            className={input}
          />
          <span aria-hidden="true" className={dot(values.email.length > 0)} />
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60"
          >
            {cta}
          </button>
          <p
            role="status"
            aria-live="polite"
            className={`min-h-5 max-w-md text-center text-sm ${
              status === "error" ? "text-red-700" : "text-black/60"
            }`}
          >
            {message}
          </p>
        </div>
      </form>
    </section>
  );
};
