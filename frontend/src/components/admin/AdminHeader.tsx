import React, { useState } from "react";
import {
  Search,
  Menu,
  LogOut,
  Bell,
  Settings,
  ExternalLink,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

interface AdminHeaderProps {
  toggleSidebar: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const storefrontUrl =
    import.meta.env.VITE_STOREFRONT_URL || "http://localhost:3001";

  const handleLogout = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      if (token) {
        await axios.post(
          "http://localhost:3000/api/auth/logout",
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );
      }
    } catch (e) {
      console.error("Logout failed", e);
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    delete axios.defaults.headers.common["Authorization"];
    navigate("/admin/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-sage-200 bg-white/80 backdrop-blur-md px-4 shadow-sm shadow-sage-200/50 sm:px-6 lg:px-8 transition-all">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={toggleSidebar}
          className="rounded-xl p-2.5 text-secondary/60 hover:bg-sage-100 hover:text-secondary lg:hidden focus:ring-2 focus:ring-primary/20 transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 rounded-full py-1 pl-1 pr-3 hover:bg-sage-50 transition-colors focus:outline-none group ring-1 ring-transparent hover:ring-sage-200"
          >
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white font-bold shadow-md shadow-primary/20">
              A
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-sm font-semibold text-secondary group-hover:text-primary transition-colors tracking-wide">
                Admin
              </span>
            </div>
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              ></div>
              <div className="absolute right-0 z-20 mt-3 w-64 origin-top-right rounded-2xl bg-white py-2 shadow-xl shadow-sage-200 ring-1 ring-black/5 focus:outline-none animate-in fade-in zoom-in-95 duration-200">
                <div className="px-5 py-4 border-b border-sage-100 bg-sage-50/30 rounded-t-2xl">
                  <p className="text-sm font-bold text-secondary">
                    Administrator
                  </p>
                  <p className="truncate text-xs text-secondary/60 mt-1">
                    admin@exovita.com
                  </p>
                </div>

                <div className="py-2">
                  <Link
                    to="/admin/settings"
                    className="flex items-center gap-3 px-5 py-3 text-sm text-secondary/70 hover:bg-sage-50 hover:text-primary transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings size={16} />
                    Settings
                  </Link>
                  <a
                    href={storefrontUrl}
                    className="flex items-center gap-3 px-5 py-3 text-sm text-secondary/70 hover:bg-sage-50 hover:text-primary transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink size={16} />
                    View Storefront
                  </a>
                </div>

                <div className="border-t border-sage-100 py-2 mt-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-5 py-3 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-medium"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
