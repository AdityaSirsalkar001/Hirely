import { useRouter } from "next/navigation";
import { memo, useCallback } from "react";

export const SidebarMenuSub = memo(
  ({ children, isOpen, isExpanded, className, ...props }) => {
    const isVisible = isOpen && isExpanded;

    return (
      <div
        className={`grid transition-all duration-200 ease-in-out ${
          isVisible
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <ul
            data-sidebar="menu-sub"
            className={`ml-5 mt-1 space-y-1 border-l border-border pl-3 ${
              isVisible ? "pointer-events-auto" : "pointer-events-none"
            } ${className || ""}`}
            {...props}
          >
            {children}
          </ul>
        </div>
      </div>
    );
  }
);

SidebarMenuSub.displayName = "SidebarMenuSub";

export const SidebarMenuSubItem = memo(
  ({ item, isActive, isOpen, ...props }) => {
    const router = useRouter();

    const handleClick = useCallback(() => {
      router.push(item.href);
    }, [router, item.href]);

    return (
      <li {...props}>
        <button
          type="button"
          onClick={handleClick}
          aria-current={isActive ? "page" : undefined}
          className={`
            flex min-h-10 w-full items-center gap-2 rounded-lg
            px-3 py-2 text-sm transition-colors duration-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
            ${
              isActive
                ? "bg-primary/10 font-semibold text-primary"
                : "font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            }
          `}
        >
          {item.icon && (
            <item.icon
              className={`h-4 w-4 shrink-0 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            />
          )}

          {isOpen && <span className="truncate">{item.title}</span>}
        </button>
      </li>
    );
  }
);

SidebarMenuSubItem.displayName = "SidebarMenuSubItem";
