"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Save,
  UserRound,
  Mail,
  Phone,
  BriefcaseBusiness,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "@/utils/Axios/AxiosInstance";
import { setUser } from "@/redux/features/Auth/authSlice";

const blankForm = {
  firstName: "",
  lastName: "",
  phoneNumber: "",
  department: "",
};

export default function ProfileSettingsPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [form, setForm] = useState(blankForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;

    axiosInstance
      .get("/auth/user")
      .then(({ data }) => {
        if (!active) return;

        dispatch(setUser(data));

        setForm({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          phoneNumber: data.phoneNumber || "",
          department: data.department || "",
        });
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Could not load your profile. Please sign in again."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [dispatch]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const { data } = await axiosInstance.put("/auth/user", form);

      dispatch(setUser(data));

      setForm({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phoneNumber: data.phoneNumber || "",
        department: data.department || "",
      });

      setSaved(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not save your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "mt-2 w-full rounded-xl bg-background px-4 py-3 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed";

  const labelClass = "block text-sm font-semibold text-foreground";

  const readOnlyClass =
    "mt-2 w-full rounded-xl bg-muted/70 px-4 py-3 text-sm font-medium text-muted-foreground outline-none";

  const field = (key, label, type = "text", icon = null) => (
    <label className={labelClass}>
      {label}

      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        )}

        <input
          type={type}
          required={key === "firstName" || key === "lastName"}
          maxLength={key === "phoneNumber" ? 30 : 80}
          value={form[key]}
          onChange={(event) => {
            setForm({ ...form, [key]: event.target.value });
            setSaved(false);
          }}
          className={`${inputClass} ${
            icon ? "pl-11" : ""
          }`}
        />
      </div>
    </label>
  );

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl space-y-8">

        {/* Page heading */}
        <header className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Account
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Profile and settings
          </h1>

          <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
            Manage your personal information and account details.
            Keep your contact information up to date.
          </p>
        </header>

        {/* Status messages */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {saved && (
          <div
            role="status"
            className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 p-4 text-sm font-medium text-emerald-700 dark:text-emerald-300"
          >
            <CheckCircle2 size={19} />
            Your profile has been saved successfully.
          </div>
        )}

        {/* Main form */}
        <form onSubmit={save} className="space-y-6">

          {/* Personal details */}
          <section className="overflow-hidden rounded-3xl bg-[color:var(--tertiary)]">
            <div className="p-6 sm:p-8">

              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                  <UserRound size={23} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Personal details
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your name and contact information.
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="animate-pulse space-y-3">
                      <div className="h-4 w-28 rounded bg-muted" />
                      <div className="h-12 rounded-xl bg-muted" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
                  {field("firstName", "First name", "text", <UserRound size={17} />)}

                  {field("lastName", "Last name", "text", <UserRound size={17} />)}

                  <label className={labelClass}>
                    Email address

                    <div className="relative">
                      <Mail
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <input
                        readOnly
                        value={user?.email || ""}
                        className={`${readOnlyClass} pl-11`}
                      />
                    </div>
                    <span className="mt-1.5 block text-xs font-normal text-muted-foreground">
                      Email address cannot be changed here.
                    </span>
                  </label>

                  {field(
                    "phoneNumber",
                    "Phone number",
                    "tel",
                    <Phone size={17} />
                  )}

                  {field(
                    "department",
                    "Department",
                    "text",
                    <BriefcaseBusiness size={17} />
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Organization */}
          <section className="overflow-hidden rounded-3xl bg-[color:var(--tertiary)]">
            <div className="p-6 sm:p-8">

              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-700 dark:text-violet-300">
                  <Building2 size={23} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Organization
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your company and account membership.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <label className={labelClass}>
                  Company

                  <div className="relative">
                    <Building2
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      readOnly
                      value={user?.tenant?.companyName || ""}
                      className={`${readOnlyClass} pl-11`}
                    />
                  </div>
                </label>

                <label className={labelClass}>
                  Account role

                  <div className="relative">
                    <ShieldCheck
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      readOnly
                      value={(user?.role || "").replaceAll("_", " ")}
                      className={`${readOnlyClass} pl-11`}
                    />
                  </div>
                </label>
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-xl bg-violet-500/5 p-4">
                <ShieldCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-300"
                />
                <p className="text-xs leading-6 text-muted-foreground">
                  Organization information is managed by your administrator.
                  Contact your administrator if these details need to be updated.
                </p>
              </div>
            </div>
          </section>

          {/* Save area */}
          <div className="flex flex-col-reverse gap-4 rounded-2xl bg-[color:var(--tertiary)] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="text-xs text-muted-foreground">
              Your changes will be reflected in your account.
            </p>

            <button
              type="submit"
              disabled={loading || saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#24476b] px-7 py-3.5 text-sm font-bold text-white shadow-md shadow-[#24476b]/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1b3855] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#294766] dark:text-white dark:hover:bg-[#355a7d]"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving changes...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
