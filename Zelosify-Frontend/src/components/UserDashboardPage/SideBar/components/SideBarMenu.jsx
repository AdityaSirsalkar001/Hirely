import { ChevronDown, ChevronRight } from "lucide-react";
import { memo } from "react";

export const SidebarMenu = memo(({ children, className, ...props }) => (
  <ul
    data-sidebar="menu"
    className={`flex w-full min-w-0 flex-col gap-1 ${className || ""}`}
    {...props}
  >
    {children}
  </ul>
));

SidebarMenu.displayName = "SidebarMenu";

export const SidebarMenuItem = memo(({ children, className, ...props }) => (
  <li
    data-sidebar="menu-item"
    className={`group/menu-item relative ${className || ""}`}
    {...props}
  >
    {children}
  </li>
));

SidebarMenuItem.displayName = "SidebarMenuItem";

export const SidebarMenuButton = memo(
  ({
    icon: Icon,
    title,
    isActive,
    onClick,
    isOpen,
    hasSubmenu,
    isExpanded,
    className,
    ...props
  }) => (
    <button
      type="button"
      data-sidebar="menu-button"
      data-active={isActive}
      aria-current={isActive ? "page" : undefined}
      aria-expanded={hasSubmenu ? isExpanded : undefined}
      title={!isOpen ? title : undefined}
      onClick={onClick}
      className={`
        relative flex min-h-11 w-full items-center rounded-xl
        px-3 py-2.5 text-sm transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
        ${isOpen ? "justify-between" : "justify-center"}
        ${
          isActive
            ? "bg-primary/10 font-semibold text-primary"
            : "font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        }
        ${className || ""}
      `}
      {...props}
    >
      <span className={`flex min-w-0 items-center ${isOpen ? "gap-3" : "justify-center"}`}>
        {Icon && (
          <Icon
            className={`h-[19px] w-[19px] shrink-0 transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          />
        )}

        {isOpen && (
          <span className="truncate text-left">{title}</span>
        )}
      </span>

      {isOpen && hasSubmenu && (
        isExpanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )
      )}
    </button>
  )
);

SidebarMenuButton.displayName = "SidebarMenuButton";
