"use client";

import SignOutConfirmation from "@/components/UI/SignOutConfirmation";
import Header from "@/components/UserDashboardPage/Header/Header";
import SideBarLayout from "@/components/UserDashboardPage/SideBar/SideBarLayout";
import { useState, useEffect, useCallback } from "react";
import useAuth from "@/hooks/Auth/useAuth";

export default function UserDashboardlayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { showSignoutConfirmation, handleCloseSignoutConfirmation } =
    useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Automatically configure sidebar based on screen size.
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const handleScreenChange = (event) => {
      setIsSidebarOpen(event.matches);
    };

    setIsSidebarOpen(mediaQuery.matches);

    mediaQuery.addEventListener("change", handleScreenChange);

    return () => {
      mediaQuery.removeEventListener("change", handleScreenChange);
    };
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen min-w-0 bg-background overflow-x-clip">
      <SignOutConfirmation
        isOpen={showSignoutConfirmation}
        onCancel={handleCloseSignoutConfirmation}
      />

      <Header
        toggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex flex-1 min-w-0">
        <SideBarLayout
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />

        <main
          className={`relative flex-1 min-w-0 w-full min-h-[calc(100vh-4rem)] transition-all duration-300 ${
            isSidebarOpen ? "lg:ml-48" : "lg:ml-20"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}