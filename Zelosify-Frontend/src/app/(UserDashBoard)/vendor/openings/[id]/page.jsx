"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import {
  BriefcaseBusiness,
  Eye,
  MapPin,
  RefreshCw,
  Trash2,
  UploadCloud,
  FileText,
  CalendarDays,
  UserRound,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Users,
  Building2,
  Sparkles,
} from "lucide-react";
import axiosInstance from "@/utils/Axios/AxiosInstance";

export default function OpeningDetailsPage() {
  const { id } = useParams();
  const [opening, setOpening] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [profileToRemove, setProfileToRemove] = useState(null);
  const [removingProfileId, setRemovingProfileId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFilesAdded = useCallback((acceptedFiles, fileRejections) => {
    const existingKeys = new Set(
      selectedFiles.map((file) => `${file.name}:${file.size}:${file.lastModified}`)
    );
    const newFiles = acceptedFiles.filter((file) => {
      const key = `${file.name}:${file.size}:${file.lastModified}`;
      if (existingKeys.has(key)) return false;
      existingKeys.add(key);
      return true;
    });
    const availableSlots = Math.max(0, 10 - selectedFiles.length);
    const filesToAdd = newFiles.slice(0, availableSlots);
    const messages = [];

    if (filesToAdd.length) {
      setSelectedFiles([...selectedFiles, ...filesToAdd]);
      setSuccess("");
    }
    if (newFiles.length > availableSlots) {
      messages.push("Upload up to 10 files at a time.");
    }
    if (fileRejections.length) {
      const reasons = new Set(
        fileRejections.flatMap(({ errors }) => errors.map(({ code }) => code))
      );
      if (reasons.has("file-too-large")) {
        messages.push("Each file must be 20 MB or smaller.");
      }
      if (reasons.has("file-invalid-type")) {
        messages.push("Only PDF and PPTX files are supported.");
      }
      if (reasons.has("too-many-files")) {
        messages.push("Upload up to 10 files at a time.");
      }
    }

    setError(messages.join(" "));
  }, [selectedFiles]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
  } = useDropzone({
    onDrop: handleFilesAdded,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    },
    multiple: true,
    maxFiles: 10,
    maxSize: 20 * 1024 * 1024,
    minSize: 1,
    disabled: busy,
  });

  const loadOpening = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axiosInstance.get(
        `/vendor/openings/${encodeURIComponent(id)}`
      );
      setOpening(data.data);
      setFiles(data.data.profiles || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not load this opening. Please sign in again and retry."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOpening();
  }, [loadOpening]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const formElement = event.currentTarget;
    const selected = Array.from(selectedFiles);

    if (!selected.length) {
      setError("Choose at least one PDF or PPTX profile.");
      return;
    }

    if (selected.length > 10) {
      setError("Upload up to 10 files at a time.");
      return;
    }

    if (
      selected.some(
        (file) =>
          file.size > 20 * 1024 * 1024 ||
          file.size === 0 ||
          !/\.(pdf|pptx)$/i.test(file.name)
      )
    ) {
      setError("Each file must be a PDF or PPTX between 1 byte and 20 MB.");
      return;
    }

    setBusy(true);

    try {
      const failedFiles = [];
      const failedReasons = [];
      let submittedCount = 0;

      for (let index = 0; index < selected.length; index += 1) {
        const file = selected[index];
        setUploadProgress(`Uploading ${index + 1} of ${selected.length}…`);

        try {
          const { data } = await axiosInstance.post(
            `/vendor/openings/${encodeURIComponent(id)}/profiles/presign`,
            { files: [{ fileName: file.name, size: file.size }] }
          );
          const upload = data.data[0];
          if (!upload?.uploadToken || !upload?.uploadEndpoint) {
            throw new Error("Could not prepare this file for upload.");
          }

          const formData = new FormData();
          formData.append("files", file);
          formData.append("uploadTokens", JSON.stringify([upload.uploadToken]));
          await axiosInstance.post(upload.uploadEndpoint, formData);
          submittedCount += 1;
        } catch (fileUploadError) {
          console.error(`Submission failed for ${file.name}:`, fileUploadError);
          failedFiles.push(file);
          failedReasons.push(
            `${file.name}: ${fileUploadError.response?.data?.message || fileUploadError.message || "Upload failed"}`
          );
        }
      }

      if (formElement && typeof formElement.reset === "function") {
        formElement.reset();
      }
      setSelectedFiles(failedFiles);

      await loadOpening();

      if (submittedCount > 0) {
        setSuccess(
          `${submittedCount} profile${submittedCount === 1 ? "" : "s"} submitted. Recommendations are processing in the background.`
        );
      }
      if (failedFiles.length > 0) {
        setError(
          `Could not submit ${failedFiles.length} file${failedFiles.length === 1 ? "" : "s"}: ${failedReasons.join("; ")}. The remaining files were submitted; retry the selected files.`
        );
      }
    } catch (uploadError) {
      console.error("Submission error:", uploadError);
      setError(
        uploadError.response?.data?.message ||
          uploadError.message ||
          "Upload failed. Please try again."
      );
    } finally {
      setBusy(false);
      setUploadProgress("");
    }
  };

  const preview = async (profile) => {
    setError("");
    try {
      const response = await axiosInstance.get(
        `/vendor/openings/profiles/${profile.id}/preview`,
        { responseType: "blob" }
      );

      const url = URL.createObjectURL(response.data);
      const tab = window.open("", "_blank");

      if (!tab) {
        URL.revokeObjectURL(url);
        setError(
          "Your browser blocked the preview window. Allow pop-ups for this local site and try again."
        );
        return;
      }

      tab.opener = null;
      tab.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not preview this profile."
      );
    }
  };

  const removeProfile = async (profile) => {
    setError("");
    setSuccess("");
    setRemovingProfileId(profile.id);

    try {
      await axiosInstance.delete(
        `/vendor/openings/profiles/${profile.id}`
      );
      setFiles((current) =>
        current.filter((item) => item.id !== profile.id)
      );
      setProfileToRemove(null);
      setSuccess("Profile removed from your submission list.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not remove this profile."
      );
    } finally {
      setRemovingProfileId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not available";
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime())
      ? "Not available"
      : parsed.toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  };

  const isOpen = opening?.status === "OPEN";

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-4 text-foreground sm:p-6 lg:p-9">

      {/* Navigation */}
      <Link
        href="/vendor/openings"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft size={16} />
        Back to opportunities
      </Link>

      {/* Notifications */}
      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-500/10 px-5 py-4 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl bg-emerald-500/10 px-5 py-4 text-sm text-emerald-700 dark:text-emerald-400"
        >
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-5 animate-pulse">
          <div className="h-64 rounded-3xl bg-muted" />
          <div className="h-28 rounded-2xl bg-muted" />
          <div className="h-64 rounded-3xl bg-muted" />
        </div>
      )}

      {!loading && opening && (
        <>
          {/* Hero */}
          <header className="relative overflow-hidden rounded-[2rem] bg-[#172f4d] text-white dark:bg-[#172b43]">
            <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute -bottom-32 right-1/3 h-72 w-72 rounded-full bg-violet-400/10 blur-3xl" />

            <div className="relative p-7 sm:p-10 lg:p-12">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
                  <Sparkles size={15} />
                  Hirely opportunities
                </span>

                <span
                  className={`rounded-full px-4 py-2 text-xs font-bold ${
                    isOpen
                      ? "bg-emerald-400/15 text-emerald-200"
                      : "bg-white/10 text-white/70"
                  }`}
                >
                  {isOpen ? "●  OPEN FOR SUBMISSIONS" : "CLOSED"}
                </span>
              </div>

              <div className="mt-10 max-w-3xl">
                <p className="text-sm font-medium text-blue-100/70">
                  Opportunity details
                </p>

                <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                  {opening.title}
                </h1>

                <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3 text-sm text-blue-100/80">
                  <span className="flex items-center gap-2">
                    <MapPin size={17} />
                    {opening.location || "Location flexible"}
                  </span>

                  <span className="flex items-center gap-2">
                    <BriefcaseBusiness size={17} />
                    {opening.contractType || "Contract type not specified"}
                  </span>
                </div>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-6">
                <p className="text-xs text-blue-100/60">
                  Review the role and submit suitable candidate profiles.
                </p>

                <button
                  onClick={loadOpening}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  <RefreshCw size={15} />
                  Refresh details
                </button>
              </div>
            </div>
          </header>

          {/* Information strip */}
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-4 rounded-2xl bg-cyan-500/10 p-5">
              <div className="rounded-xl bg-cyan-500/15 p-3 text-cyan-700 dark:text-cyan-300">
                <Clock3 size={22} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Experience required
                </p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {opening.experienceMin ?? 0}–{opening.experienceMax ?? "Any"} years
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-violet-500/10 p-5">
              <div className="rounded-xl bg-violet-500/15 p-3 text-violet-700 dark:text-violet-300">
                <UserRound size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  Hiring manager
                </p>
                <p className="mt-1 truncate text-lg font-bold text-foreground">
                  {opening.hiringManagerName || "Hiring team"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-amber-500/10 p-5">
              <div className="rounded-xl bg-amber-500/15 p-3 text-amber-700 dark:text-amber-300">
                <CalendarDays size={22} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Date posted
                </p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {formatDate(opening.postedDate)}
                </p>
              </div>
            </div>
          </section>

          {/* Role overview - open layout */}
          <section className="grid gap-8 py-5 lg:grid-cols-[1fr_280px] lg:gap-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                About this opportunity
              </p>

              <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Role overview
              </h2>

              <p className="mt-5 whitespace-pre-line text-sm leading-8 text-muted-foreground">
                {opening.description ||
                  "The hiring team has not added a role description yet."}
              </p>

              {opening.requiredSkills?.length > 0 && (
                <div className="mt-9">
                  <h3 className="text-base font-bold text-foreground">
                    Skills & requirements
                  </h3>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {opening.requiredSkills.map((skill, index) => {
                      const styles = [
                        "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
                        "bg-violet-500/15 text-violet-700 dark:text-violet-300",
                        "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                        "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                        "bg-rose-500/15 text-rose-700 dark:text-rose-300",
                      ];

                      return (
                        <span
                          key={skill}
                          className={`rounded-full px-4 py-2 text-xs font-semibold ${styles[index % styles.length]}`}
                        >
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <aside className="h-fit rounded-2xl bg-[color:var(--tertiary)] p-6">
              <div className="flex items-center gap-2 text-primary">
                <Building2 size={19} />
                <h3 className="text-sm font-bold">Opportunity summary</h3>
              </div>

              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-xs text-muted-foreground">Position</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {opening.title}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Employment type</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {opening.contractType || "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {opening.location || "Flexible"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className={`mt-1 text-sm font-semibold ${isOpen ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                    {isOpen ? "Accepting profiles" : "Closed"}
                  </p>
                </div>
              </div>
            </aside>
          </section>

          {/* Submission area */}
          <section className="overflow-hidden rounded-[2rem] bg-[#e9f0f8] dark:bg-[#172538]">
            <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
              <div className="flex flex-col justify-center p-7 sm:p-9">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#31577f] dark:text-cyan-300">
                  Next step
                </span>

                <h2 className="mt-3 text-2xl font-bold leading-tight text-[#172f4d] dark:text-white sm:text-3xl">
                  Find the right talent for this role.
                </h2>

                <p className="mt-4 text-sm leading-7 text-[#52677e] dark:text-slate-300">
                  Submit candidate profiles and let the hiring team review
                  suitable matches for this opportunity.
                </p>

                <div className="mt-7 space-y-3 text-sm text-[#405a75] dark:text-slate-300">
                  <p className="flex items-center gap-3">
                    <CheckCircle2 size={17} className="text-emerald-600 dark:text-emerald-400" />
                    PDF and PPTX supported
                  </p>
                  <p className="flex items-center gap-3">
                    <CheckCircle2 size={17} className="text-emerald-600 dark:text-emerald-400" />
                    Up to 10 profiles per submission
                  </p>
                  <p className="flex items-center gap-3">
                    <CheckCircle2 size={17} className="text-emerald-600 dark:text-emerald-400" />
                    Maximum 20 MB per file
                  </p>
                </div>
              </div>

              <div className="bg-[color:var(--tertiary)] p-6 sm:p-9">
                {!isOpen ? (
                  <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                    <Clock3 size={35} className="text-muted-foreground" />
                    <h3 className="mt-4 font-bold text-foreground">
                      Submissions are closed
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      This opportunity is no longer accepting profiles.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={submit} className="space-y-5">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        Upload candidate profiles
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Select the files you want to submit.
                      </p>
                    </div>

                    <div
                      {...getRootProps({
                        "aria-label": "Choose or drop PDF and PPTX candidate profiles",
                        className: `group flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition ${
                          isDragReject
                            ? "border-rose-500 bg-rose-500/10"
                            : isDragActive
                              ? "border-primary bg-primary/10"
                              : "border-transparent bg-background/70 hover:border-primary/40 hover:bg-primary/5"
                        } ${busy ? "cursor-not-allowed opacity-60" : ""}`,
                      })}
                    >
                      <input {...getInputProps()} />
                      <div className="rounded-2xl bg-cyan-500/15 p-4 text-cyan-700 transition group-hover:scale-105 dark:text-cyan-300">
                        <UploadCloud size={32} />
                      </div>

                      <span className="mt-4 font-bold text-foreground">
                        {isDragReject
                          ? "PDF or PPTX files only"
                          : isDragActive
                            ? "Drop files to add them"
                            : "Choose or drop files to upload"}
                      </span>

                      <span className="mt-2 text-xs text-muted-foreground">
                        Browse your device or drag files here · PDF or PPTX · Up to 10 files, 20 MB each
                      </span>
                    </div>

                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-foreground">
                            Selected files
                          </p>
                          <span className="text-xs font-semibold text-primary">
                            {selectedFiles.length} selected
                          </span>
                        </div>

                        {Array.from(selectedFiles).map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="flex items-center gap-3 rounded-xl bg-background/70 p-3"
                          >
                            <FileText size={19} className="shrink-0 text-primary" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-foreground">
                                {file.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                            <CheckCircle2 size={17} className="text-emerald-500" />
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-xs leading-5 text-muted-foreground">
                      Only submit profiles you are authorized to share.
                    </p>

                    <button
                      type="submit"
                      disabled={busy}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#172f4d] disabled:opacity-60 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                    >
                      {busy ? (
                        <>
                          <RefreshCw size={17} className="animate-spin" />
                          {uploadProgress || "Uploading securely…"}
                        </>
                      ) : (
                        <>
                          Submit profiles
                          <ArrowUpRight size={17} />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>

          {/* Submitted profiles */}
          <section className="space-y-5 pt-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Your activity
                </p>
                <h2 className="mt-2 text-2xl font-bold text-foreground">
                  Submitted profiles
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage the candidate profiles submitted for this opening.
                </p>
              </div>

              <span className="rounded-xl bg-violet-500/10 px-4 py-2 text-sm font-bold text-violet-700 dark:text-violet-300">
                {files.length} profiles
              </span>
            </div>

            {files.length === 0 ? (
              <div className="rounded-2xl bg-[color:var(--tertiary)] px-6 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-300">
                  <FileText size={27} />
                </div>
                <h3 className="mt-4 font-bold text-foreground">
                  Nothing submitted yet
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your submitted profiles will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {files.map((profile) => (
                  <article
                    key={profile.id}
                    className="flex flex-col justify-between gap-4 py-5 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-700 dark:text-cyan-300">
                        <FileText size={22} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-foreground">
                          {profile.fileName}
                        </h3>
                        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays size={13} />
                          Submitted{" "}
                          {profile.submittedAt
                            ? new Date(profile.submittedAt).toLocaleString()
                            : "date unavailable"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => preview(profile)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-500/10 px-4 py-2.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-500/20 dark:text-cyan-300 sm:flex-none"
                      >
                        <Eye size={15} />
                        Preview
                      </button>

                      <button
                        onClick={() => setProfileToRemove(profile)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-500/20 dark:text-rose-300 sm:flex-none"
                      >
                        <Trash2 size={15} />
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {profileToRemove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !removingProfileId) {
              setProfileToRemove(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-profile-title"
            className="w-full max-w-md rounded-2xl border border-border bg-background p-6 text-foreground shadow-2xl"
          >
            <h2 id="remove-profile-title" className="text-lg font-bold">
              Remove this profile?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {profileToRemove.fileName} will be hidden from your active submissions.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={Boolean(removingProfileId)}
                onClick={() => setProfileToRemove(null)}
                className="rounded-xl bg-muted px-4 py-2.5 text-sm font-semibold transition hover:bg-accent disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(removingProfileId)}
                onClick={() => removeProfile(profileToRemove)}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
              >
                {removingProfileId ? <RefreshCw size={15} className="animate-spin" /> : <Trash2 size={15} />}
                {removingProfileId ? "Removing…" : "Remove profile"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
