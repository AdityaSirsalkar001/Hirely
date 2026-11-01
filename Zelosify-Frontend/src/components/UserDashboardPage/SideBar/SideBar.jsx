"use client";

import {
  useEffect,
  useRef,
  memo,
  useState,
  createContext,
  useCallback,
  useMemo,
} from "react";

import { usePathname, useRouter } from "next/navigation";

import SidebarHeader from "./SidebarHeader";
import useAuth from "@/hooks/Auth/useAuth";
import SignOutConfirmation from "@/components/UI/SignOutConfirmation";
import { getRoleFromCookie } from "@/utils/Auth/roleUtils";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./components/SideBarMenu";

import {
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "./components/SideBarMenuSub";

import {
  getSidebarSectionsByRole,
  settingsItem,
  supportItem,
  signOutItem,
} from "./Routes/ItemRoutes";

// Sidebar context
const SidebarContext = createContext(null);

// eslint-disable-next-line react/display-name
const Sidebar = memo(({ isOpen, toggleSidebar }) => {
  const pathname = usePathname();
  const router = useRouter();

  const sidebarRef = useRef(null);

  const [expandedItems, setExpandedItems] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const {
    handleOpenSignoutConfirmation,
    showSignoutConfirmation,
  } = useAuth();

  // Detect screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();

    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Get user role
  useEffect(() => {
    const role = getRoleFromCookie();

    setUserRole(role);

    if (!role) {
      const timer = setTimeout(() => {
        const retryRole = getRoleFromCookie();

        if (retryRole) {
          setUserRole(retryRole);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, []);

  // Get sidebar sections based on role
  const sidebarSections = useMemo(() => {
    if (!userRole) return [];

    return getSidebarSectionsByRole(userRole);
  }, [userRole]);

  // Expand active submenu
  useEffect(() => {
    const itemsToExpand = [];

    for (const section of sidebarSections) {
      for (const item of section.items) {
        if (item.hasSubmenu) {
          const activeSubmenuItem = item.submenu.find(
            (subItem) => subItem.href === pathname
          );

          if (activeSubmenuItem) {
            itemsToExpand.push(item.title);
          }
        }
      }
    }

    if (itemsToExpand.length > 0) {
      setExpandedItems((prev) => {
        const newItems = itemsToExpand.filter(
          (item) => !prev.includes(item)
        );

        return [...prev, ...newItems];
      });
    }
  }, [pathname, sidebarSections]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        isOpen &&
        isMobile
      ) {
        toggleSidebar();
      }
    };

    if (isMobile && isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, toggleSidebar, isMobile]);

  // Toggle submenu
  const toggleSubmenu = useCallback((title) => {
    setExpandedItems((prevExpanded) => {
      if (prevExpanded.includes(title)) {
        return prevExpanded.filter((item) => item !== title);
      }

      return [...prevExpanded, title];
    });
  }, []);

  // Sidebar context
  const sidebarContextValue = useMemo(
    () => ({
      isOpen,
      toggleSidebar,
      expandedItems,
      setExpandedItems,
      toggleSubmenu,
    }),
    [isOpen, toggleSidebar, expandedItems, toggleSubmenu]
  );

  // Support
  const handleSupportClick = useCallback(() => {
    router.push(supportItem.href);

    if (isMobile) {
      toggleSidebar();
    }
  }, [router, isMobile, toggleSidebar]);

  // Settings
  const handleSettingsClick = useCallback(() => {
    router.push(settingsItem.href);

    if (isMobile) {
      toggleSidebar();
    }
  }, [router, isMobile, toggleSidebar]);

  // Menu item click
  const createMenuItemClickHandler = useCallback(
    (item) => {
      return () => {
        if (!isOpen && item.hasSubmenu) {
          toggleSidebar();

          setExpandedItems((prev) => {
            if (!prev.includes(item.title)) {
              return [...prev, item.title];
            }

            return prev;
          });
        } else if (item.hasSubmenu) {
          toggleSubmenu(item.title);
        } else {
          router.push(item.href);

          if (isMobile) {
            toggleSidebar();
          }
        }
      };
    },
    [
      isOpen,
      toggleSidebar,
      toggleSubmenu,
      router,
      isMobile,
    ]
  );

  // Render sidebar sections
  const renderSidebarSections = useMemo(() => {
    if (!sidebarSections || sidebarSections.length === 0) {
      return (
        <div className="px-4 py-8">
          {isOpen && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No menu items available for your role.
            </p>
          )}
        </div>
      );
    }

    return sidebarSections.map((section, index) => (
      <div key={index} className="space-y-2">

        {isOpen && (
          <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 pl-1">
            {section.title.toUpperCase()}
          </h2>
        )}

        <SidebarMenu>
          {section.items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.hasSubmenu &&
                item.submenu.some(
                  (subItem) => pathname === subItem.href
                ));

            const isExpanded = expandedItems.includes(item.title);

            const onItemClick =
              createMenuItemClickHandler(item);

            return (
              <SidebarMenuItem key={item.title}>

                <SidebarMenuButton
                  icon={item.icon}
                  title={item.title}
                  isActive={isActive}
                  isOpen={isOpen}
                  hasSubmenu={item.hasSubmenu}
                  isExpanded={isExpanded}
                  onClick={onItemClick}
                />

                {item.hasSubmenu && (
                  <SidebarMenuSub
                    isOpen={isOpen}
                    isExpanded={isExpanded}
                  >
                    {item.submenu.map((subItem) => (
                      <SidebarMenuSubItem
                        key={subItem.title}
                        item={subItem}
                        isActive={pathname === subItem.href}
                        isOpen={isOpen}
                      />
                    ))}
                  </SidebarMenuSub>
                )}

              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </div>
    ));
  }, [
    isOpen,
    pathname,
    expandedItems,
    createMenuItemClickHandler,
    sidebarSections,
  ]);

  return (
    <SidebarContext.Provider value={sidebarContextValue}>
      <>

        {/* Mobile Background Overlay */}
        {isOpen && isMobile && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={toggleSidebar}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          ref={sidebarRef}
          aria-label="Main navigation"
          className={`
            fixed inset-y-0 left-0 z-50
            bg-background border-r border-border
            flex flex-col
            h-screen
            w-64
            transition-all duration-300 ease-in-out
            ${
              isMobile
                ? isOpen
                  ? "translate-x-0"
                  : "-translate-x-full"
                : "translate-x-0"
            }
            ${
              isOpen
                ? "lg:w-[12rem]"
                : "lg:w-[5rem]"
            }
          `}
        >

          {/* Sidebar Header */}
          <SidebarHeader
            isOpen={isOpen}
            toggleSidebar={toggleSidebar}
          />

          {/* Navigation */}
          <div className="flex-1 overflow-hidden min-h-0">
            <div
              className={`h-full ${
                isOpen
                  ? "overflow-y-auto"
                  : "overflow-y-hidden"
              }`}
            >
              <div className="px-3 py-4 space-y-6">
                {renderSidebarSections}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-3 py-4 border-t border-dashed border-gray-200 dark:border-gray-700 shrink-0">

            {/* Support */}
            <button
              onClick={handleSupportClick}
              className={`
                rounded-md flex gap-2 items-center w-full
                px-4 py-2
                text-gray-600 dark:text-gray-300
                hover:bg-gray-100 dark:hover:bg-gray-800
                transition
                ${
                  isOpen
                    ? "justify-start"
                    : "justify-center"
                }
              `}
            >
              <supportItem.icon className="h-5 w-5 shrink-0" />

              {isOpen && (
                <span>{supportItem.title}</span>
              )}
            </button>

            {/* Settings */}
            <button
              onClick={handleSettingsClick}
              className={`
                rounded-md flex gap-2 items-center w-full
                px-4 py-2
                text-gray-600 dark:text-gray-300
                hover:bg-gray-100 dark:hover:bg-gray-800
                transition
                ${
                  isOpen
                    ? "justify-start"
                    : "justify-center"
                }
              `}
            >
              <settingsItem.icon className="h-5 w-5 shrink-0" />

              {isOpen && (
                <span>{settingsItem.title}</span>
              )}
            </button>

            {/* Sign Out */}
            <button
              onClick={handleOpenSignoutConfirmation}
              className={`
                rounded-md flex gap-2 items-center w-full
                px-4 py-2 text-sm cancel-red
                hover:bg-gray-100 dark:hover:bg-gray-800
                transition
                ${
                  isOpen
                    ? "justify-start"
                    : "justify-center"
                }
              `}
            >
              <signOutItem.icon className="h-5 w-5 shrink-0" />

              {isOpen && (
                <span>{signOutItem.title}</span>
              )}
            </button>

          </div>
        </aside>

        {/* Signout Confirmation */}
        <SignOutConfirmation
          isOpen={showSignoutConfirmation}
          onCancel={handleOpenSignoutConfirmation}
        />

      </>
    </SidebarContext.Provider>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;