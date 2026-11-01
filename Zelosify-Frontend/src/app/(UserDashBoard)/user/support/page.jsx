"use client";

import { useState } from "react";
import {
  ChevronDown,
  CircleHelp,
  FileText,
  ShieldCheck,
  ArrowUpRight,
  Upload,
  LockKeyhole,
} from "lucide-react";

const topics = [
  {
    title: "How do vendors submit candidate profiles?",
    body: "Open Opportunities, choose an open role, select PDF or PPTX profiles (up to 10 files, 20 MB each), then choose Submit profiles. Hiring managers can review the submissions for their openings.",
  },
  {
    title: "Why can’t I see an opening or candidate profile?",
    body: "Openings and profiles are restricted to your organization and assigned account role. Vendors see their own submissions; hiring managers see profiles submitted to openings they manage.",
  },
  {
    title: "What should I do if a page shows an authentication error?",
    body: "Sign out, return to the sign-in page, and sign in again with your current authenticator code. If the issue remains, refresh after signing in and confirm the local API and database services are running.",
  },
  {
    title: "How do AI recommendations work?",
    body: "The hiring workflow evaluates submitted profile content against the opening criteria. Treat its score and explanation as decision support; a hiring manager makes the shortlist or reject decision.",
  },
];

const helpItems = [
  {
    icon: Upload,
    title: "Candidate submissions",
    description:
      "Submit candidate profiles in PDF or PPTX format. You can upload up to 10 files, with a maximum size of 20 MB each.",
    color: "cyan",
    detail: "PDF · PPTX",
  },
  {
    icon: LockKeyhole,
    title: "Organization access",
    description:
      "Your account role and organization determine which openings and candidate records you can access.",
    color: "violet",
    detail: "Role-based access",
  },
];

export default function SupportPage() {
  const [open, setOpen] = useState(0);

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl space-y-9">

        {/* Page heading */}
        <header className="max-w-2xl space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Help center
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How can we help?
          </h1>

          <p className="text-sm leading-7 text-muted-foreground sm:text-base">
            Find answers to common questions about hiring, candidate
            submissions and managing your account.
          </p>
        </header>

        {/* Help topics */}
        <section className="grid gap-5 md:grid-cols-2">
          {helpItems.map((item) => {
            const Icon = item.icon;
            const isCyan = item.color === "cyan";

            return (
              <article
                key={item.title}
                className={`relative overflow-hidden rounded-2xl p-6 transition-transform duration-200 hover:-translate-y-1 ${
                  isCyan
                    ? "bg-cyan-500/[0.08] dark:bg-cyan-400/[0.07]"
                    : "bg-violet-500/[0.08] dark:bg-violet-400/[0.07]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                      isCyan
                        ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300"
                        : "bg-violet-500/15 text-violet-700 dark:text-violet-300"
                    }`}
                  >
                    <Icon size={23} />
                  </div>

                  <span className="rounded-lg bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    {item.detail}
                  </span>
                </div>

                <h2 className="mt-6 text-lg font-bold text-foreground">
                  {item.title}
                </h2>

                <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
                  {item.description}
                </p>
              </article>
            );
          })}
        </section>

        {/* Frequently asked questions */}
        <section className="overflow-hidden rounded-2xl bg-[color:var(--tertiary)]">
          <div className="flex items-center gap-4 px-6 py-6 sm:px-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CircleHelp size={23} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground sm:text-xl">
                Frequently asked questions
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Quick answers to help you use Hirely.
              </p>
            </div>
          </div>

          <div className="px-5 pb-4 sm:px-8">
            {topics.map((topic, index) => {
              const isOpen = open === index;

              return (
                <div
                  key={topic.title}
                  className="border-t border-border/70"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? -1 : index)}
                    className="flex w-full items-center justify-between gap-5 py-5 text-left transition-colors hover:text-primary"
                  >
                    <span
                      className={`text-sm font-semibold leading-6 sm:text-base ${
                        isOpen ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {topic.title}
                    </span>

                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                        isOpen
                          ? "rotate-180 bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <ChevronDown size={17} />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="pb-5 pr-8 sm:pr-12">
                      <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                        {topic.body}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom help note */}
        <div className="flex items-start gap-4 rounded-2xl bg-muted/50 p-5 sm:items-center sm:px-7">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background text-muted-foreground">
            <FileText size={19} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Need help with a specific workflow?
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Check the relevant page instructions before submitting
              candidate profiles or managing an opening.
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}
