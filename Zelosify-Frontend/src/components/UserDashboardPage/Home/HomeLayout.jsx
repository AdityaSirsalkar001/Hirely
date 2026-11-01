"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CircleHelp,
  Settings2,
  UsersRound,
  ChevronRight,
  ClipboardCheck,
  UserRound,
} from "lucide-react";
import useAuth from "@/hooks/Auth/useAuth";

export default function HomeLayout() {
  const { user, getDisplayName } = useAuth();

  const isVendor = user?.role === "IT_VENDOR";
  const isHiringManager = user?.role === "HIRING_MANAGER";
  const name = getDisplayName();

  const primaryHref = isVendor
    ? "/vendor/openings"
    : isHiringManager
    ? "/business-user/hiring"
    : "/user/settings";

  const primaryTitle = isVendor
    ? "Browse opportunities"
    : isHiringManager
    ? "Manage hiring"
    : "Complete your profile";

  const primaryDescription = isVendor
    ? "Explore available roles and submit suitable candidate profiles."
    : isHiringManager
    ? "Review candidate submissions and manage your recruitment workflow."
    : "Keep your account information updated to get started with Hirely.";

  if (isHiringManager) {
    return (
      <main className="mx-auto max-w-7xl space-y-9 p-5 text-foreground sm:p-7 lg:p-10">

        {/* Welcome hero */}
        <section className="relative isolate overflow-hidden rounded-[26px] bg-gradient-to-br from-[#172554] via-[#1e40af] to-[#4338ca] px-7 py-9 text-white shadow-xl shadow-blue-950/15 sm:px-10 sm:py-12 lg:px-12">
          <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-36 right-1/4 h-80 w-80 rounded-full bg-violet-400/25 blur-3xl" />

          <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Welcome{name ? `, ${name}` : ""}
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-blue-100 sm:text-base">
                Find the right people for your team. Review candidate
                submissions, explore profile recommendations, and make
                recruitment decisions from one workspace.
              </p>

              <Link
                href="/business-user/hiring"
                className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-blue-950 shadow-lg shadow-blue-950/20 transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-50"
              >
                Go to candidate review
                <ArrowUpRight size={18} />
              </Link>
            </div>

            <div className="hidden lg:flex lg:items-center lg:justify-center">
              <div className="relative flex h-52 w-52 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-2xl shadow-indigo-950/30 backdrop-blur-sm">
                <div className="absolute inset-5 rounded-full border border-white/20" />
                <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-300 to-blue-500 text-white shadow-xl shadow-blue-950/30">
                  <UsersRound size={58} strokeWidth={1.5} />
                </div>
                <div className="absolute -right-3 top-8 rounded-2xl bg-white p-3 text-indigo-600 shadow-lg">
                  <ClipboardCheck size={23} />
                </div>
                <div className="absolute -bottom-2 left-2 rounded-2xl bg-cyan-300 p-3 text-blue-950 shadow-lg">
                  <BriefcaseBusiness size={22} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main workspace */}
        <section>
          <div className="mb-6">
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              YOUR WORKSPACE
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              Recruitment activities
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Everything you need to manage your hiring process.
            </p>
          </div>

          <Link
            href="/business-user/hiring"
            className="group relative flex flex-col gap-7 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-950/10 dark:from-blue-950/50 dark:via-indigo-950/40 dark:to-violet-950/40 sm:flex-row sm:items-center sm:justify-between sm:p-8"
          >
            <div className="flex items-start gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20">
                <UsersRound size={27} />
              </div>

              <div className="max-w-xl">
                <h3 className="text-xl font-bold tracking-tight">
                  Candidate review
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  View submitted candidate profiles, check AI recommendations,
                  compare applicants, and record shortlist or rejection
                  decisions.
                </p>

                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700 dark:text-blue-300">
                  Explore candidates
                  <ArrowUpRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </span>
              </div>
            </div>

            <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-full bg-white/80 text-indigo-500 shadow-sm dark:bg-slate-900/70 dark:text-indigo-300 sm:flex">
              <ClipboardCheck size={43} strokeWidth={1.5} />
            </div>
          </Link>
        </section>

        {/* Hiring workflow */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold tracking-tight">
              Your hiring workflow
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A simple process to move from applications to hiring decisions.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-[#eaf2ff] p-5 dark:bg-blue-950/40">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                <BriefcaseBusiness size={22} />
              </div>
              <h3 className="mt-5 font-bold text-slate-900 dark:text-slate-100">
                01. Openings
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Access your hiring openings and select the role for which you
                want to review applicants.
              </p>
            </div>

            <div className="rounded-2xl bg-[#f0edff] p-5 dark:bg-violet-950/40">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-600/20">
                <UsersRound size={22} />
              </div>
              <h3 className="mt-5 font-bold text-slate-900 dark:text-slate-100">
                02. Evaluate
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Examine submitted profiles and use available recommendations
                to support your evaluation.
              </p>
            </div>

            <div className="rounded-2xl bg-[#e6f8f5] p-5 dark:bg-emerald-950/35">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                <ClipboardCheck size={22} />
              </div>
              <h3 className="mt-5 font-bold text-slate-900 dark:text-slate-100">
                03. Decide
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Shortlist suitable candidates or reject profiles after
                reviewing their information.
              </p>
            </div>
          </div>
        </section>

        {/* Account links */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold tracking-tight">
              Account and assistance
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your account or get help when needed.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/user/settings"
              className="group flex items-center gap-4 rounded-2xl bg-[color:var(--tertiary)] p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                <Settings2 size={23} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-bold">Profile and settings</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your account information.
                </p>
              </div>

              <ChevronRight
                size={20}
                className="text-muted-foreground transition group-hover:translate-x-1"
              />
            </Link>

            <Link
              href="/user/support"
              className="group flex items-center gap-4 rounded-2xl bg-[color:var(--tertiary)] p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300">
                <CircleHelp size={23} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-bold">Help and support</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Get assistance with using Hirely.
                </p>
              </div>

              <ChevronRight
                size={20}
                className="text-muted-foreground transition group-hover:translate-x-1"
              />
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-8 p-5 text-foreground sm:p-7 lg:p-10">
      <section className="rounded-2xl bg-gradient-to-br from-[#172554] via-[#1e40af] to-[#4338ca] p-8 text-white sm:p-10">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Welcome{name ? `, ${name}` : ""}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-blue-100">
          {isVendor
            ? "Discover opportunities, connect with hiring teams, and manage your candidate submissions."
            : "Your journey starts here. Set up your profile and explore your Hirely workspace."}
        </p>
        <Link
          href={primaryHref}
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-950 transition hover:bg-blue-50"
        >
          {primaryTitle}
          <ArrowUpRight size={18} />
        </Link>
      </section>

      <section>
        <h2 className="text-xl font-bold">Your workspace</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Quick access to the tools and sections you need.
        </p>

        <Link
          href={primaryHref}
          className="mt-5 flex items-center gap-5 rounded-2xl bg-blue-50 p-6 transition hover:shadow-md dark:bg-blue-950/40"
        >
          <span className="rounded-xl bg-blue-600 p-4 text-white">
            <BriefcaseBusiness size={25} />
          </span>
          <span className="flex-1">
            <span className="block font-bold">{primaryTitle}</span>
            <span className="mt-2 block text-sm text-muted-foreground">
              {primaryDescription}
            </span>
          </span>
          <ArrowUpRight size={20} />
        </Link>
      </section>

      <section>
        <h2 className="text-xl font-bold">Account and support</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Link
            href="/user/settings"
            className="flex items-center gap-4 rounded-2xl bg-[color:var(--tertiary)] p-5 transition hover:shadow-md"
          >
            <UserRound size={22} />
            <span className="flex-1 font-semibold">Profile and settings</span>
            <ChevronRight size={18} />
          </Link>

          <Link
            href="/user/support"
            className="flex items-center gap-4 rounded-2xl bg-[color:var(--tertiary)] p-5 transition hover:shadow-md"
          >
            <CircleHelp size={22} />
            <span className="flex-1 font-semibold">Help and support</span>
            <ChevronRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
