import ProfileImage from "@/components/UI/ProfileImage";
import {
  UserRound,
  Bell,
  LogOut,
  Building2,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { memo } from "react";
import useAuth from "@/hooks/Auth/useAuth";

const UserProfile = memo(
  ({ toggleNotifications, isProfileOpen, toggleProfile, profileRef }) => {
    const router = useRouter();

    const {
      user,
      handleOpenSignoutConfirmation,
      getDisplayName,
      getUserHandle,
    } = useAuth();

    const displayName = getDisplayName();
    const userHandle = getUserHandle();

    const menuItemClass =
      "group flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:bg-accent";

    const iconContainerClass =
      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary";

    return (
      <div className="relative" ref={profileRef}>
        {/* Profile trigger */}
        <button
          onClick={toggleProfile}
          className={`flex items-center gap-3 rounded-2xl px-3 py-2 transition-colors ${
            isProfileOpen
              ? "bg-accent"
              : "hover:bg-accent"
          }`}
          aria-label="Toggle profile menu"
          aria-expanded={isProfileOpen}
          aria-haspopup="menu"
          type="button"
        >
          <ProfileImage className="h-10 w-10 rounded-full" />

          <span className="hidden max-w-40 truncate text-sm font-semibold text-foreground sm:inline">
            {displayName}
          </span>
        </button>

        {/* Dropdown */}
        {isProfileOpen && (
          <div
            className="absolute right-0 z-50 mt-3 w-[min(350px,calc(100vw-24px))] overflow-hidden rounded-2xl bg-[color:var(--tertiary)] shadow-2xl shadow-black/20 ring-1 ring-border/70"
            role="menu"
            aria-label="Profile menu"
          >
            {/* Profile information */}
            <div className="p-5">
              <div className="flex items-center gap-3">
                <ProfileImage className="h-14 w-14 shrink-0 rounded-full" />

                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-foreground">
                    {displayName}
                  </h3>

                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {userHandle}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3 rounded-xl bg-background/70 p-4">
                {user?.role && (
                  <div className="flex items-center gap-3">
                    <ShieldCheck
                      size={16}
                      className="shrink-0 text-primary"
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground">
                        Account role
                      </p>
                      <p className="truncate text-sm font-medium text-foreground">
                        {user.role.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                )}

                {user?.department && (
                  <div className="flex items-center gap-3">
                    <Building2
                      size={16}
                      className="shrink-0 text-violet-500"
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground">
                        Department
                      </p>
                      <p className="truncate text-sm font-medium text-foreground">
                        {user.department}
                      </p>
                    </div>
                  </div>
                )}

                {user?.tenant?.companyName && (
                  <div className="flex items-center gap-3">
                    <Building2
                      size={16}
                      className="shrink-0 text-cyan-600 dark:text-cyan-400"
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground">
                        Organization
                      </p>
                      <p className="truncate text-sm font-medium text-foreground">
                        {user.tenant.companyName}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Menu actions */}
            <div className="border-t border-border/70 py-2">
              <button
                onClick={() => router.push("/user/settings")}
                className={menuItemClass}
                role="menuitem"
                type="button"
              >
                <span className={iconContainerClass}>
                  <UserRound size={19} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">
                    Profile settings
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Manage your personal information
                  </span>
                </span>

                <ChevronRight
                  size={17}
                  className="text-muted-foreground transition-transform group-hover:translate-x-1"
                />
              </button>

              <button
                onClick={toggleNotifications}
                className={menuItemClass}
                role="menuitem"
                type="button"
              >
                <span className={iconContainerClass}>
                  <Bell size={19} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">
                    Notifications
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    View your notifications
                  </span>
                </span>

                <ChevronRight
                  size={17}
                  className="text-muted-foreground transition-transform group-hover:translate-x-1"
                />
              </button>
            </div>

            {/* Sign out */}
            <div className="border-t border-border/70 p-2">
              <button
                onClick={handleOpenSignoutConfirmation}
                className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-red-500/10 focus-visible:outline-none focus-visible:bg-red-500/10"
                role="menuitem"
                type="button"
                aria-label="Sign out"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600 transition-colors group-hover:bg-red-500/15 dark:text-red-400">
                  <LogOut size={19} />
                </span>

                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                  Sign out
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

UserProfile.displayName = "UserProfile";

export default UserProfile;
