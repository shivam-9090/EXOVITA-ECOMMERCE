import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./admin/AdminSidebar";

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="fixed inset-0 flex bg-sage-50/50 overflow-hidden font-admin text-secondary">
      <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden transition-all duration-300 w-full bg-sage-50/50">
        {/* Main content area */}
        <main className="flex-1 overflow-auto p-6 lg:p-10 relative">
          <div className="lg:hidden absolute top-4 left-4 z-20">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg bg-white shadow-sm ring-1 ring-sage-200 text-secondary"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="mx-auto max-w-7xl pt-10 lg:pt-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
