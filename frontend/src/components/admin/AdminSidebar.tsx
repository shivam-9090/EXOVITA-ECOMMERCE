import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  FileText,
  Settings,
  Shield,
  X,
  Layers,
  Tag,
  MessageSquare,
  BarChart,
  UserCog,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface AdminSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCompact, setIsCompact] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/admin/login");
  };

  const menuGroups = [
    {
      title: "Overview",
      items: [{ icon: LayoutDashboard, label: "Dashboard", path: "/admin" }],
    },
    {
      title: "Store Management",
      items: [
        { icon: ShoppingCart, label: "Orders", path: "/admin/orders" },
        { icon: Package, label: "Products", path: "/admin/products" },
        { icon: Layers, label: "Categories", path: "/admin/categories" },
        { icon: Users, label: "Customers", path: "/admin/customers" },
        { icon: Tag, label: "Inventory", path: "/admin/inventory" },
        { icon: Tag, label: "Coupons", path: "/admin/coupons" },
        { icon: MessageSquare, label: "Reviews", path: "/admin/reviews" },
      ],
    },
    {
      title: "Finance",
      items: [
        { icon: CreditCard, label: "Payments", path: "/admin/payments" },
        { icon: BarChart, label: "Reports", path: "/admin/reports" },
      ],
    },
    {
      title: "Content",
      items: [{ icon: FileText, label: "CMS / Pages", path: "/admin/cms" }],
    },
    {
      title: "System",
      items: [
        { icon: UserCog, label: "Roles & Permissions", path: "/admin/roles" },
        { icon: Settings, label: "Settings", path: "/admin/settings" },
        { icon: Shield, label: "System Logs", path: "/admin/logs" },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-secondary/80 backdrop-blur-sm transition-opacity lg:hidden ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 transform bg-secondary text-white transition-all duration-300 ease-in-out border-r border-white/5 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isCompact ? "lg:w-20" : "lg:w-72"} w-72 lg:static`}
      >
        {/* Header */}
        <div
          className={`flex h-20 items-center bg-secondary border-b border-white/5 shrink-0 ${
            isCompact ? "justify-center px-2" : "justify-between px-4"
          }`}
        >
          {!isCompact && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 min-w-[2.5rem] items-center justify-center rounded-lg bg-primary shadow-lg shadow-black/20">
                <span className="text-xl font-bold text-white">E</span>
              </div>
              <span className="text-xl font-bold tracking-wide text-white uppercase truncate">
                EXOVITA
              </span>
            </div>
          )}
          <div className={`flex items-center gap-1 ${isCompact ? "" : ""}`}>
            <button
              onClick={() => setIsCompact(!isCompact)}
              className="hidden lg:flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title={isCompact ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCompact ? (
                <PanelLeftOpen size={18} />
              ) : (
                <PanelLeftClose size={18} />
              )}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Content - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-8 space-y-9 custom-scrollbar">
          {menuGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {!isCompact && (
                <h3 className="px-4 text-xs font-bold text-gold/80 uppercase tracking-widest mb-3 whitespace-nowrap">
                  {group.title}
                </h3>
              )}
              <nav className="space-y-1.5">
                {group.items.map((item, itemIndex) => {
                  const isActive =
                    item.path === "/admin"
                      ? location.pathname === "/admin"
                      : location.pathname.startsWith(item.path);

                  return (
                    <NavLink
                      key={itemIndex}
                      to={item.path}
                      onClick={() =>
                        window.innerWidth < 1024 && setIsOpen(false)
                      }
                      title={isCompact ? item.label : ""}
                      className={({ isActive }) => `
                        group flex items-center ${
                          isCompact
                            ? "justify-center px-0"
                            : "justify-between px-4"
                        } py-3 rounded-xl text-sm font-medium transition-all duration-300
                        ${
                          isActive
                            ? "bg-primary/20 text-white shadow-md shadow-black/10 border border-primary/20"
                            : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
                        }
                      `}
                    >
                      <div
                        className={`flex items-center ${
                          isCompact ? "justify-center" : "gap-3.5"
                        }`}
                      >
                        <item.icon
                          size={18}
                          className={`transition-colors ${
                            isActive
                              ? "text-gold"
                              : "text-slate-500 group-hover:text-gold/80"
                          }`}
                        />
                        {!isCompact && (
                          <span
                            className={
                              isActive
                                ? "font-semibold tracking-wide"
                                : "tracking-wide"
                            }
                          >
                            {item.label}
                          </span>
                        )}
                      </div>
                      {isActive && !isCompact && (
                        <ChevronRight
                          size={14}
                          className="text-gold opacity-100"
                        />
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer Area */}
        <div className="p-4 border-t border-white/5 bg-secondary space-y-2">
          <button
            onClick={handleLogout}
            className={`flex w-full items-center ${
              isCompact ? "justify-center px-0" : "gap-3 px-4"
            } py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-black/20 hover:text-rose-400 transition-all duration-300 group border border-transparent hover:border-white/5`}
            title={isCompact ? "Sign Out" : ""}
          >
            <LogOut
              size={18}
              className="group-hover:text-rose-400 transition-colors"
            />
            {!isCompact && <span className="tracking-wide">Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
