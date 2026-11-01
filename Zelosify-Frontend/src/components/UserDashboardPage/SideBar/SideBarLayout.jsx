"use client";

import Sidebar from "./SideBar";

function SideBarLayout({ isSidebarOpen, toggleSidebar }) {
  return (
    <Sidebar
      isOpen={isSidebarOpen}
      toggleSidebar={toggleSidebar}
    />
  );
}

export default SideBarLayout;