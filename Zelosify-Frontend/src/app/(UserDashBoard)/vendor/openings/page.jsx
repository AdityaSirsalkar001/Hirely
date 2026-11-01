"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  MapPin,
  RefreshCw,
  Search,
  ArrowUpRight,
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
        opening.hiringManagerName,
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

  const formatPostedDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  };

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

          {/* Openings table */}
          {filteredOpenings.length > 0 && (
            <div className="overflow-hidden rounded-2xl bg-[color:var(--tertiary)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead className="border-b border-border/60 bg-background/40">
                    <tr className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <th scope="col" className="px-5 py-4">Title</th>
                      <th scope="col" className="px-5 py-4">Location</th>
                      <th scope="col" className="px-5 py-4">Contract type</th>
                      <th scope="col" className="px-5 py-4">Posted date</th>
                      <th scope="col" className="px-5 py-4">Hiring manager</th>
                      <th scope="col" className="px-5 py-4"><span className="sr-only">Action</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredOpenings.map((opening) => (
                      <tr key={opening.id} className="transition hover:bg-background/30">
                        <th scope="row" className="max-w-xs px-5 py-5 font-semibold text-foreground">
                          <Link
                            href={`/vendor/openings/${encodeURIComponent(opening.id)}`}
                            className="transition hover:text-primary hover:underline"
                          >
                            {opening.title}
                          </Link>
                          {opening.description && (
                            <p className="mt-1 line-clamp-2 text-xs font-normal leading-5 text-muted-foreground">
                              {opening.description}
                            </p>
                          )}
                        </th>
                        <td className="whitespace-nowrap px-5 py-5 text-sm text-foreground/85">
                          <span className="inline-flex items-center gap-2">
                            <MapPin size={15} className="shrink-0 text-primary" />
                            {opening.location || "Not specified"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-5 text-sm text-foreground/85">
                          {opening.contractType || "Not specified"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-5 text-sm text-foreground/85">
                          {formatPostedDate(opening.postedDate)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-5 text-sm text-foreground/85">
                          {opening.hiringManagerName || "Hiring team"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-5 text-right">
                          <Link
                            href={`/vendor/openings/${encodeURIComponent(opening.id)}`}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#24476b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1b3855] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:bg-[#294766] dark:hover:bg-[#355a7d] dark:focus-visible:ring-offset-background"
                          >
                            View & apply
                            <ArrowUpRight size={16} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
