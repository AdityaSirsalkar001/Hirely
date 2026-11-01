"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  MapPin,
  RefreshCw,
  Search,
  ArrowUpRight,
  Clock3,
  FileText,
  Users,
} from "lucide-react";
import useHiring from "@/hooks/Hiring/useHiring";

export default function VendorOpeningsPage() {
  const {
    vendorOpenings,
    isLoading,
    error,
    loadVendorOpenings,
    handleClearError,
  } = useHiring();

  const [search, setSearch] = useState("");

  useEffect(() => {
    loadVendorOpenings();
  }, [loadVendorOpenings]);

  const filteredOpenings = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return vendorOpenings || [];

    return (vendorOpenings || []).filter((opening) => {
      const searchableText = [
        opening.title,
        opening.location,
        opening.contractType,
        opening.description,
        ...(opening.requiredSkills || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [vendorOpenings, search]);

  const refreshOpenings = () => {
    loadVendorOpenings(true);
  };

  const retryLoading = () => {
    handleClearError();
    loadVendorOpenings(true);
  };

  const formatExperience = (opening) => {
    const min = opening.experienceMin ?? 0;
    const max = opening.experienceMax;

    if (max === undefined || max === null) {
      return `${min}+ years`;
    }

    return `${min}–${max} years`;
  };

  const skillStyles = [
    "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  ];

  return (
    <main className="min-h-screen bg-background px-4 py-7 text-foreground sm:px-6 lg:px-9 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-9">

        {/* Page heading */}
        <section className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Open opportunities
            </h1>

            <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
              Explore available roles and find the right opportunities to
              submit candidate profiles for.
            </p>
          </div>

          <button
            onClick={refreshOpenings}
            disabled={isLoading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[color:var(--tertiary)] px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accent disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={isLoading ? "animate-spin" : ""}
            />
            Refresh openings
          </button>
        </section>

        {/* Search and count */}
        <section className="grid gap-6 rounded-3xl bg-[color:var(--tertiary)] p-6 sm:grid-cols-[1fr_1.1fr] sm:items-center sm:p-8">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Available opportunities
            </p>

            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-4xl font-bold tracking-tight text-foreground">
                {vendorOpenings?.length || 0}
              </span>
              <span className="text-sm text-muted-foreground">
                openings available
              </span>
            </div>
          </div>

          <div className="relative">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search roles, skills, location..."
              className="w-full rounded-xl bg-background py-4 pl-12 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </section>

        {/* Error state */}
        {error && (
          <section className="flex flex-col justify-between gap-4 rounded-2xl bg-red-500/10 p-5 sm:flex-row sm:items-center">
            <p className="text-sm text-red-700 dark:text-red-300">
              {typeof error === "string"
                ? error
                : "Something went wrong while loading opportunities."}
            </p>

            <button
              onClick={retryLoading}
              className="inline-flex items-center gap-2 self-start rounded-lg bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-500/20 dark:text-red-300 sm:self-auto"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </section>
        )}

        {/* Section heading */}
        <section>
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Explore openings
            </h2>

            <span className="text-sm text-muted-foreground">
              {filteredOpenings.length}{" "}
              {filteredOpenings.length === 1 ? "result" : "results"}
            </span>
          </div>

          {/* Loading skeleton */}
          {isLoading && (!vendorOpenings || vendorOpenings.length === 0) && (
            <div className="grid gap-6 lg:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="animate-pulse space-y-6 rounded-3xl bg-[color:var(--tertiary)] p-7"
                >
                  <div className="flex gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-muted" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 w-2/3 rounded bg-muted" />
                      <div className="h-4 w-1/3 rounded bg-muted" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-20 rounded-xl bg-muted" />
                    <div className="h-20 rounded-xl bg-muted" />
                  </div>
                  <div className="h-16 rounded bg-muted" />
                  <div className="h-12 rounded-xl bg-muted" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && vendorOpenings?.length === 0 && (
            <div className="rounded-3xl bg-[color:var(--tertiary)] px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                <BriefcaseBusiness size={30} />
              </div>

              <h3 className="mt-5 text-lg font-bold text-foreground">
                No opportunities available
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                There are no openings available right now. Refresh the page
                later to check for new opportunities.
              </p>

              <button
                onClick={refreshOpenings}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#172f4d] dark:bg-primary dark:text-primary-foreground"
              >
                <RefreshCw size={16} />
                Refresh openings
              </button>
            </div>
          )}

          {/* No search results */}
          {!isLoading &&
            vendorOpenings?.length > 0 &&
            filteredOpenings.length === 0 && (
              <div className="rounded-3xl bg-[color:var(--tertiary)] px-6 py-14 text-center">
                <Search
                  size={30}
                  className="mx-auto text-muted-foreground"
                />

                <h3 className="mt-4 font-bold text-foreground">
                  No matching opportunities
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  Try a different role, skill or location.
                </p>

                <button
                  onClick={() => setSearch("")}
                  className="mt-5 text-sm font-semibold text-primary hover:underline"
                >
                  Clear search
                </button>
              </div>
            )}

          {/* Opportunity cards */}
          {filteredOpenings.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-2">
              {filteredOpenings.map((opening, index) => (
                <article
                  key={opening.id}
                  className="group relative flex flex-col overflow-hidden rounded-3xl bg-[color:var(--tertiary)] transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10"
                >
                  <div className="flex flex-1 flex-col p-6 sm:p-7">
                    {/* Title and location */}
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                        <BriefcaseBusiness size={26} />
                      </div>

                      <div className="min-w-0 flex-1 pt-0.5">
                        <h3 className="text-xl font-bold leading-snug tracking-tight text-foreground transition group-hover:text-primary">
                          {opening.title}
                        </h3>

                        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin
                            size={16}
                            className="shrink-0 text-primary"
                          />
                          {opening.location || "Location not specified"}
                        </p>
                      </div>
                    </div>

                    {/* Role information */}
                    <div className="mt-7 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-cyan-500/10 p-4">
                        <p className="text-xs font-medium text-muted-foreground">
                          Employment type
                        </p>
                        <p className="mt-2 truncate text-base font-bold text-foreground">
                          {opening.contractType || "Not specified"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-violet-500/10 p-4">
                        <p className="text-xs font-medium text-muted-foreground">
                          Experience required
                        </p>
                        <p className="mt-2 text-base font-bold text-foreground">
                          {formatExperience(opening)}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mt-7">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        About this role
                      </h4>

                      <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-muted-foreground">
                        {opening.description || "No description provided."}
                      </p>
                    </div>

                    {/* Skills */}
                    {opening.requiredSkills?.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Required skills
                        </h4>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {opening.requiredSkills
                            .slice(0, 6)
                            .map((skill, skillIndex) => (
                              <span
                                key={skill}
                                className={`rounded-full px-3.5 py-2 text-xs font-semibold ${
                                  skillStyles[skillIndex % skillStyles.length]
                                }`}
                              >
                                {skill}
                              </span>
                            ))}

                          {opening.requiredSkills.length > 6 && (
                            <span className="rounded-full bg-muted px-3.5 py-2 text-xs font-semibold text-muted-foreground">
                              +{opening.requiredSkills.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Bottom action */}
                    <div className="mt-auto pt-7">
                      <div className="mb-5 h-px bg-border/50" />

                      <Link
                        href={`/vendor/openings/${encodeURIComponent(opening.id)}`}
                        className="flex w-full items-center justify-between gap-3 rounded-xl bg-[#24476b] px-5 py-4 text-sm font-semibold text-white shadow-md shadow-[#24476b]/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1b3855] hover:shadow-lg hover:shadow-[#24476b]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:bg-[#294766] dark:text-white dark:shadow-black/20 dark:hover:bg-[#355a7d] dark:hover:shadow-lg dark:focus-visible:ring-offset-background"
                      >
                        <span>View opportunity & submit candidate</span>
                        <ArrowUpRight
                          size={19}
                          className="shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                        />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
