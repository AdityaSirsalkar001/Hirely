"use client";

import { memo, useEffect, useState, useRef } from "react";
import { Moon, Sun, Menu } from "lucide-react";
import UserProfile from "./UserProfile";
import Notification from "./Notification";
import { useTheme } from "next-themes";

const Header = memo(({ isSidebarOpen, toggleSidebar }) => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [showNotifications, setShowNotifications] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const currentTheme = theme === "system" ? resolvedTheme : theme;

  const toggleNotifications = (e) => {
    e.stopPropagation();

    setShowNotifications((prev) => !prev);
    setIsProfileOpen(false);
  };

  const toggleProfile = (e) => {
    e.stopPropagation();

    setIsProfileOpen((prev) => !prev);
    setShowNotifications(false);
  };

  return (
    <header
      className={`h-16 flex items-center sticky top-0 z-40 bg-background border-b border-border transition-all duration-300 ${
        isSidebarOpen
          ? "pl-0 lg:pl-[12rem]"
          : "pl-0 lg:pl-[5rem]"
      }`}
    >
      <div className="flex items-center justify-between px-3 sm:px-6 w-full min-w-0">

        {/* Mobile Sidebar Toggle */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
          aria-expanded={isSidebarOpen}
          className="lg:hidden flex items-center justify-center h-10 w-10 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
        >
          <Menu className="h-6 w-6 text-gray-700 dark:text-gray-200" />
        </button>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">

          {/* Theme Toggle */}
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={currentTheme === "dark"}
              onChange={() =>
                setTheme(currentTheme === "dark" ? "light" : "dark")
              }
            />

            <div className="w-12 h-6 bg-gray-200 dark:bg-gray-700 dark:border dark:border-gray-700 rounded-full peer peer-checked:after:translate-x-6 rtl:peer-checked:after:-translate-x-6 after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black">

              {currentTheme === "dark" ? (
                <Moon className="absolute left-1 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white" />
              ) : (
                <Sun className="absolute right-1 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
              )}

            </div>
          </label>

          {/* User Profile */}
          <UserProfile
            toggleNotifications={toggleNotifications}
            isProfileOpen={isProfileOpen}
            toggleProfile={toggleProfile}
            profileRef={profileRef}
          />

        </div>
      </div>

      {/* Notification Popup */}
      {showNotifications && (
        <Notification
          notificationRef={notificationRef}
          setShowNotifications={setShowNotifications}
        />
      )}

    </header>
  );
});

Header.displayName = "Header";

export default Header;