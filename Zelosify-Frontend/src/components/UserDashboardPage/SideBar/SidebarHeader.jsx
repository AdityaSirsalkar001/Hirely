import { X, Menu } from "lucide-react";
import { memo } from "react";
import Link from "next/link";

const SidebarHeader = memo(({ isOpen, toggleSidebar }) => (
  <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
    {isOpen && (
      <Link
        href="/user"
        aria-label="Hirely home"
        className="flex min-w-0 items-center"
      >
        <img
          src="/assets/logos/hirely.svg"
          alt="Hirely"
          width={120}
          height={40}
          className="block h-9 w-auto object-contain dark:hidden"
        />
        <img
          src="/assets/logos/hirely-dark.svg"
          alt="Hirely"
          width={120}
          height={40}
          className="hidden h-9 w-auto object-contain dark:block"
        />
      </Link>
    )}

    <button
      type="button"
      onClick={toggleSidebar}
      aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {isOpen ? (
        <X className="h-5 w-5" />
      ) : (
        <Menu className="h-5 w-5" />
      )}
    </button>
  </div>
));

SidebarHeader.displayName = "SidebarHeader";

export default SidebarHeader;
