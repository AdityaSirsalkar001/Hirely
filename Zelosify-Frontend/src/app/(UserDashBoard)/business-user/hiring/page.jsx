"use client";

import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Eye,
  Plus,
  RefreshCw,
  Users,
  X,
  MapPin,
  Clock3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  FileText,
  Building2,
  Search,
  Trash2,
} from "lucide-react";
import useHiring from "@/hooks/Hiring/useHiring";
import axiosInstance from "@/utils/Axios/AxiosInstance";

const initialForm = {
  title: "",
  location: "",
  contractType: "",
  experienceMin: "0",
  experienceMax: "",
  requiredSkills: "",
  description: "",
};

export default function HiringManagerPage() {
  const {
    managerOpenings,
    profilesByOpening,
    isLoading,
    isSubmitting,
    error,
    loadManagerOpenings,
    loadProfiles,
    handleReview,
    handleCreateOpening,
    handleDeleteOpening,
    handleClearError,
  } = useHiring();

  const [activeOpening, setActiveOpening] = useState("");
  const [notice, setNotice] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [deletingOpening, setDeletingOpening] = useState(false);

  useEffect(() => {
    loadManagerOpenings();
  }, [loadManagerOpenings]);

  useEffect(() => {
    if (!activeOpening && managerOpenings.length) {
      const openingId = managerOpenings[0].id;
      setActiveOpening(openingId);
      loadProfiles(openingId);
    }
  }, [activeOpening, managerOpenings, loadProfiles]);

  const selectOpening = (openingId) => {
    setActiveOpening(openingId);
    loadProfiles(openingId);
  };

  const handleRefresh = () => {
    loadManagerOpenings(true);
    if (activeOpening) loadProfiles(activeOpening);
  };

  const review = async (profileId, decision) => {
    setNotice("");
    try {
      await handleReview(profileId, decision).unwrap();
      setNotice(
        `Candidate ${decision === "shortlist" ? "shortlisted" : "rejected"}.`
      );
    } catch {
      // The shared alert displays the server message.
    }
  };

  const createOpening = async (event) => {
    event.preventDefault();
    setNotice("");

    try {
      const result = await handleCreateOpening(form).unwrap();
      const created = result.data;

      setForm(initialForm);
      setShowCreate(false);
      setActiveOpening(created.id);
      setNotice("Opening published. Vendors in your organization can now view it.");
    } catch {
      // The shared alert displays the server message.
    }
  };

  const deleteOpening = async () => {
    if (!activeOpeningData || deletingOpening) return;
    const confirmed = window.confirm(
      `Delete “${activeOpeningData.title}” and all candidate profiles submitted to it? This cannot be undone.`
    );
    if (!confirmed) return;

    setNotice("");
    setDeletingOpening(true);
    try {
      await handleDeleteOpening(activeOpeningData.id).unwrap();
      setActiveOpening("");
      setNotice("Job posting deleted.");
    } catch {
      // The shared alert displays the server message.
    } finally {
      setDeletingOpening(false);
    }
  };

  const previewProfile = async (profileId) => {
    try {
      const response = await axiosInstance.get(
        `/hiring-manager/profiles/${profileId}/preview`,
        { responseType: "blob" }
      );

      const url = URL.createObjectURL(response.data);
      const previewTab = window.open("", "_blank");

      if (!previewTab) {
        URL.revokeObjectURL(url);
        setNotice("Allow pop-ups for this local site to preview the profile.");
        return;
      }

      previewTab.opener = null;
      previewTab.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setNotice("Could not preview this profile. Refresh your sign-in and try again.");
    }
  };

  useEffect(() => {
    if (!activeOpening) return;

    const currentProfiles = profilesByOpening[activeOpening] || [];
    const hasPending = currentProfiles.some(
      (p) =>
        p.recommendationStatus === "PENDING" ||
        p.recommendationStatus === "PROCESSING"
    );

    if (!hasPending) return;

    const interval = setInterval(() => {
      loadProfiles(activeOpening);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeOpening, profilesByOpening, loadProfiles]);

  const renderRecommendationBadge = (profile) => {
    if (profile.recommendationStatus === "COMPLETED") {
      const score = profile.recommendationScore ?? 0;

      if (score >= 0.75) {
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 size={14} />
            Recommended
          </span>
        );
      }

      if (score >= 0.5) {
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
            <AlertCircle size={14} />
            Borderline
          </span>
        );
      }

      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
          <XCircle size={14} />
          Not recommended
        </span>
      );
    }

    if (profile.recommendationStatus === "FAILED") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-300">
          <AlertCircle size={14} />
          Analysis failed
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
        <Loader2 size={14} className="animate-spin" />
        Analyzing
      </span>
    );
  };

  const activeOpeningData = managerOpenings?.find(
    (opening) => opening.id === activeOpening
  );

  const activeProfiles = activeOpening
    ? profilesByOpening?.[activeOpening] || []
    : [];

  const totalProfiles = Object.values(profilesByOpening || {}).reduce(
    (total, profiles) => total + (profiles?.length || 0),
    0
  );

  const shortlistedCount = Object.values(profilesByOpening || {})
    .flat()
    .filter((profile) => profile.status === "SHORTLISTED").length;

  const inputClass =
    "mt-2 w-full rounded-xl bg-background px-4 py-3 text-sm text-foreground outline-none ring-1 ring-border transition focus:ring-2 focus:ring-primary/40";

  const labelClass = "block text-sm font-semibold text-foreground";

  return (
    <main className="min-h-screen bg-background px-4 py-7 text-foreground sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-7xl space-y-7">

        {/* Header */}
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Hiring
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Candidate review
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Manage your job openings, review candidate profiles and make hiring decisions.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--tertiary)] px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#24476b] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#24476b]/15 transition hover:-translate-y-0.5 hover:bg-[#1b3855] dark:bg-[#294766] dark:hover:bg-[#355a7d]"
            >
              <Plus size={18} />
              Post a job
            </button>
          </div>
        </header>

        {/* Summary */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 p-5 dark:from-blue-950/60 dark:to-indigo-950/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500 text-white shadow-lg shadow-cyan-600/20">
              <BriefcaseBusiness size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {managerOpenings?.length || 0}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Job openings</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 p-5 dark:from-blue-950/60 dark:to-indigo-950/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
              <Users size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {totalProfiles}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Loaded candidate profiles</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 p-5 dark:from-blue-950/60 dark:to-indigo-950/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {shortlistedCount}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Shortlisted</p>
            </div>
          </div>
        </section>

        {/* Messages */}
        {error && (
          <div
            role="alert"
            className="flex items-start justify-between gap-4 rounded-xl bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300"
          >
            <span>{error}</span>
            <button
              type="button"
              className="shrink-0 font-semibold underline"
              onClick={handleClearError}
            >
              Dismiss
            </button>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="flex items-center gap-3 rounded-xl bg-emerald-500/10 p-4 text-sm font-medium text-emerald-700 dark:text-emerald-300"
          >
            <CheckCircle2 size={18} />
            {notice}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            <div className="h-24 animate-pulse rounded-2xl bg-muted" />
            <div className="h-48 animate-pulse rounded-2xl bg-muted" />
          </div>
        )}

        {/* No openings */}
        {!isLoading &&
          (!managerOpenings || managerOpenings.length === 0) && (
            <div className="rounded-3xl bg-[color:var(--tertiary)] px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <BriefcaseBusiness size={30} />
              </div>

              <h2 className="mt-5 text-xl font-bold text-foreground">
                No job openings yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted-foreground">
                Create your first job opening to start receiving candidate profiles.
              </p>

              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#24476b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1b3855] dark:bg-[#294766] dark:hover:bg-[#355a7d]"
              >
                <Plus size={17} />
                Post a job
              </button>
            </div>
          )}

        {/* Main dashboard */}
        {!isLoading && managerOpenings?.length > 0 && (
          <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">

            {/* Opening list */}
            <aside className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">
                  Your openings
                </h2>
                <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  {managerOpenings.length}
                </span>
              </div>

              <nav aria-label="Your openings" className="space-y-2">
                {managerOpenings.map((opening) => {
                  const selected = activeOpening === opening.id;

                  return (
                    <button
                      key={opening.id}
                      type="button"
                      onClick={() => selectOpening(opening.id)}
                      className={`w-full rounded-2xl p-4 text-left transition-all ${
                        selected
                          ? "bg-gradient-to-br from-blue-100 to-indigo-100 shadow-md shadow-blue-950/5 ring-1 ring-blue-300 dark:from-blue-950/70 dark:to-indigo-950/50 dark:ring-blue-800"
                          : "bg-[color:var(--tertiary)] hover:-translate-y-0.5 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold leading-6 text-foreground">
                            {opening.title}
                          </p>

                          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin size={13} />
                            <span className="truncate">
                              {opening.location || "Location flexible"}
                            </span>
                          </p>
                        </div>

                        <ChevronRight
                          size={17}
                          className={`mt-1 shrink-0 ${
                            selected ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          {opening.profilesCount || 0} profiles
                        </span>

                        <span className="rounded-md bg-background/70 px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                          {opening.status?.replaceAll("_", " ") || "OPEN"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Selected opening and candidates */}
            {activeOpening && (
              <div className="min-w-0 space-y-5">

                {/* Opening details */}
                {activeOpeningData && (
                  <section className="rounded-2xl bg-gradient-to-br from-indigo-50 via-blue-50 to-white p-6 shadow-sm dark:from-slate-900 dark:via-blue-950/40 dark:to-slate-900 sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                          {activeOpeningData.title}
                        </h2>

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <MapPin size={15} />
                            {activeOpeningData.location || "Location flexible"}
                          </span>

                          {activeOpeningData.contractType && (
                            <span className="flex items-center gap-1.5">
                              <Clock3 size={15} />
                              {activeOpeningData.contractType}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
                          {activeProfiles.length} candidates
                        </div>
                        <button
                          type="button"
                          onClick={deleteOpening}
                          disabled={deletingOpening}
                          className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300"
                        >
                          {deletingOpening ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                          {deletingOpening ? "Deleting…" : "Delete posting"}
                        </button>
                      </div>
                    </div>

                    {activeOpeningData.description && (
                      <p className="mt-5 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                        {activeOpeningData.description}
                      </p>
                    )}

                    {activeOpeningData.requiredSkills?.length > 0 && (
                      <div className="mt-5">
                        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Required skills
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {activeOpeningData.requiredSkills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-lg bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-800 dark:text-cyan-200"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {/* Candidate heading */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      Candidate profiles
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Review applications submitted for this opening.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => loadProfiles(activeOpening)}
                    className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--tertiary)] px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  >
                    <RefreshCw size={14} />
                    Refresh profiles
                  </button>
                </div>

                {/* Empty candidate state */}
                {activeProfiles.length === 0 && (
                  <div className="rounded-2xl bg-[color:var(--tertiary)] px-6 py-14 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-700 dark:text-violet-300">
                      <Users size={26} />
                    </div>

                    <h3 className="mt-4 font-bold text-foreground">
                      No candidate profiles yet
                    </h3>

                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                      Candidate profiles submitted for this opening will appear here.
                    </p>
                  </div>
                )}

                {/* Candidate cards */}
                {activeProfiles.map((profile) => (
                  <article
                    key={profile.id}
                    className="space-y-5 rounded-2xl bg-[color:var(--tertiary)] p-5 sm:p-6"
                  >
                    {/* Candidate heading */}
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-blue-600/20">
                          <FileText size={21} />
                        </div>

                        <div className="min-w-0">
                          <h3 className="break-all text-base font-bold text-foreground">
                            {profile.fileName}
                          </h3>

                          <p className="mt-1.5 text-xs text-muted-foreground">
                            Submitted{" "}
                            {new Date(profile.submittedAt).toLocaleDateString()}
                            {" · "}
                            {profile.status?.replaceAll("_", " ")}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        {renderRecommendationBadge(profile)}

                        <button
                          type="button"
                          title="Preview profile"
                          aria-label="Preview profile"
                          onClick={() => previewProfile(profile.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-muted-foreground transition hover:bg-accent hover:text-foreground"
                        >
                          <Eye size={17} />
                        </button>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-5 dark:from-blue-950/50 dark:to-indigo-950/40">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">
                            Match score
                          </p>

                          <p className="mt-1 text-2xl font-bold text-foreground">
                            {profile.recommendationScore == null
                              ? "—"
                              : `${Math.round(profile.recommendationScore * 100)}%`}
                          </p>
                        </div>

                        <div
                          className="text-center"
                          title="The model’s confidence in its evaluation explanation; it does not change the deterministic match score."
                        >
                          <p className="text-xs font-semibold text-muted-foreground">
                            AI confidence
                          </p>
                          <p className="mt-1 text-lg font-bold text-foreground">
                            {typeof profile.recommendationConfidence === "number" &&
                            Number.isFinite(profile.recommendationConfidence)
                              ? `${Math.round(
                                  Math.min(
                                    1,
                                    Math.max(0, profile.recommendationConfidence)
                                  ) * 100
                                )}%`
                              : "—"}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            Candidate status
                          </p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {profile.status?.replaceAll("_", " ") || "Pending"}
                          </p>
                        </div>
                      </div>

                      {profile.recommendationScore != null && (
                        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className={`h-full rounded-full transition-all ${
                              profile.recommendationScore >= 0.75
                                ? "bg-emerald-500"
                                : profile.recommendationScore >= 0.5
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  profile.recommendationScore * 100
                                )
                              )}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* AI processing */}
                    {(profile.recommendationStatus === "PENDING" ||
                      profile.recommendationStatus === "PROCESSING") && (
                      <div className="flex items-center gap-3 rounded-xl bg-primary/5 p-4">
                        <Loader2
                          size={19}
                          className="shrink-0 animate-spin text-primary"
                        />
                        <p className="text-sm leading-6 text-muted-foreground">
                          Candidate profile is being analyzed against the job
                          requirements, including skills, experience and location.
                        </p>
                      </div>
                    )}

                    {/* Completed evaluation */}
                    {profile.recommendationStatus === "COMPLETED" && (
                      <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 p-5 dark:from-violet-950/40 dark:to-indigo-950/30">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Evaluation explanation
                        </p>

                        <p className="text-sm leading-7 text-foreground/85">
                          {profile.recommendationReason ||
                            "Analysis complete. Candidate scored based on required skills, experience range, and location alignment."}
                        </p>

                        {(() => {
                          const breakdown = profile.recommendationScoreBreakdown;
                          const rows = [
                            { label: "Skills", score: breakdown?.skillMatchScore, weight: 0.5 },
                            { label: "Experience", score: breakdown?.experienceMatchScore, weight: 0.3 },
                            { label: "Location", score: breakdown?.locationMatchScore, weight: 0.2 },
                          ];
                          if (!rows.every(({ score }) => typeof score === "number")) return null;

                          const total = rows.reduce((sum, row) => sum + row.score * row.weight, 0);
                          const formatPercent = (value) => `${Math.round(value * 100)}%`;
                          const formatPoints = (value) => Number((value * 100).toFixed(1));

                          return (
                            <div className="mt-4 rounded-xl border border-border/60 bg-background/50 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Weighted score breakdown
                              </p>
                              <div className="mt-3 space-y-2">
                                {rows.map(({ label, score, weight }) => (
                                  <div key={label} className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm">
                                    <span className="text-foreground/85">{label}: {formatPercent(score)} × {formatPercent(weight)} weight</span>
                                    <span className="font-medium text-foreground">{formatPoints(score * weight)} points</span>
                                  </div>
                                ))}
                              </div>
                              <p className="mt-3 border-t border-border/60 pt-3 text-sm font-semibold text-foreground">
                                Total: {formatPercent(total)}
                                {profile.recommendationScore != null && (
                                  <span className="font-normal text-muted-foreground"> (displayed score: {formatPercent(profile.recommendationScore)})</span>
                                )}
                              </p>
                            </div>
                          );
                        })()}

                        {profile.recommendationLatencyMs != null && (
                          <p className="mt-3 text-xs text-muted-foreground">
                            Evaluation time:{" "}
                            {(profile.recommendationLatencyMs / 1000).toFixed(1)}s
                          </p>
                        )}
                      </div>
                    )}

                    {/* Failed evaluation */}
                    {profile.recommendationStatus === "FAILED" && (
                      <div className="rounded-xl bg-red-500/10 p-4">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                          <div>
                            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                              Analysis could not complete
                            </p>

                            <p className="mt-1 text-xs leading-6 text-red-700/80 dark:text-red-300/80">
                              {profile.recommendationError ===
                              "AI_PROVIDER_UNAVAILABLE"
                                ? "The AI service could not complete the analysis after an automatic retry."
                                : profile.recommendationError ===
                                  "PROVIDER_KEY_MISSING"
                                ? "The AI service is not configured on the backend."
                                : "Analysis stopped before it could finish, including the automatic retry. Contact support if it continues."}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Candidate decisions */}
                    {profile.status !== "SHORTLISTED" &&
                      profile.status !== "REJECTED" && (
                        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => review(profile.id, "shortlist")}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <CheckCircle2 size={17} />
                            Shortlist candidate
                          </button>

                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => review(profile.id, "reject")}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60"
                          >
                            <XCircle size={17} />
                            Reject candidate
                          </button>
                        </div>
                      )}

                    {profile.status === "SHORTLISTED" && (
                      <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 size={17} />
                        This candidate has been shortlisted.
                      </div>
                    )}

                    {profile.status === "REJECTED" && (
                      <div className="flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm font-semibold text-red-700 dark:text-red-300">
                        <XCircle size={17} />
                        This candidate has been rejected.
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create opening modal */}
        {showCreate && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setShowCreate(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-opening-title"
              className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-3xl bg-[color:var(--tertiary)] p-7 shadow-2xl sm:p-9"
            >
              <div className="mb-7 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    New opening
                  </p>

                  <h2
                    id="create-opening-title"
                    className="mt-2 text-2xl font-bold text-foreground"
                  >
                    Post a job
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Add the role details so vendors can submit suitable candidates.
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setShowCreate(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition hover:bg-accent hover:text-foreground"
                >
                  <X size={19} />
                </button>
              </div>

              <form onSubmit={createOpening} className="grid gap-5 sm:grid-cols-2">
                <label className={`${labelClass} sm:col-span-2`}>
                  Job title *
                  <input
                    required
                    maxLength={120}
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    className={inputClass}
                    placeholder="e.g. Senior Backend Engineer"
                  />
                </label>

                <label className={labelClass}>
                  Location
                  <input
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    className={inputClass}
                    placeholder="Remote, New York..."
                  />
                </label>

                <label className={labelClass}>
                  Contract type
                  <select
                    value={form.contractType}
                    onChange={(e) =>
                      setForm({ ...form, contractType: e.target.value })
                    }
                    className={inputClass}
                  >
                    <option value="">Select type</option>
                    <option>Full-time</option>
                    <option>Contract</option>
                    <option>Part-time</option>
                    <option>Temporary</option>
                  </select>
                </label>

                <label className={labelClass}>
                  Minimum experience (years) *
                  <input
                    required
                    type="number"
                    min="0"
                    max="60"
                    value={form.experienceMin}
                    onChange={(e) =>
                      setForm({ ...form, experienceMin: e.target.value })
                    }
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Maximum experience (years)
                  <input
                    type="number"
                    min={form.experienceMin || 0}
                    max="60"
                    value={form.experienceMax}
                    onChange={(e) =>
                      setForm({ ...form, experienceMax: e.target.value })
                    }
                    className={inputClass}
                    placeholder="Optional"
                  />
                </label>

                <label className={`${labelClass} sm:col-span-2`}>
                  Required skills
                  <input
                    value={form.requiredSkills}
                    onChange={(e) =>
                      setForm({ ...form, requiredSkills: e.target.value })
                    }
                    className={inputClass}
                    placeholder="Comma-separated, e.g. TypeScript, PostgreSQL, AWS"
                  />
                </label>

                <label className={`${labelClass} sm:col-span-2`}>
                  Job description
                  <textarea
                    rows={5}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    className={`${inputClass} resize-y`}
                    placeholder="Responsibilities, requirements and expected outcomes..."
                  />
                </label>

                <div className="flex flex-col-reverse gap-3 pt-3 sm:col-span-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="rounded-xl bg-muted px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#24476b] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1b3855] disabled:opacity-50 dark:bg-[#294766] dark:hover:bg-[#355a7d]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Plus size={17} />
                        Publish opening
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
