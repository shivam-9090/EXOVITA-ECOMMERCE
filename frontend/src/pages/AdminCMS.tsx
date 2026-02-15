import React, { useState } from "react";
import { Image, FileText, Layers } from "lucide-react";
import AdminBanners from "./AdminBanners";
import AdminPages from "./AdminPages";

const AdminCMS: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"banners" | "pages">("banners");

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Layers className="h-8 w-8 text-primary" />
            Content Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage homepage banners, promotional slides, and static pages.
          </p>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("banners")}
            className={`
              whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2 transition-colors
              ${
                activeTab === "banners"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }
            `}
          >
            <Image size={18} />
            Banners & Sliders
          </button>

          <button
            onClick={() => setActiveTab("pages")}
            className={`
              whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2 transition-colors
              ${
                activeTab === "pages"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }
            `}
          >
            <FileText size={18} />
            Static Pages
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === "banners" ? (
          <div className="animate-in slide-in-from-left-4 fade-in duration-300">
            <AdminBanners />
          </div>
        ) : (
          <div className="animate-in slide-in-from-right-4 fade-in duration-300">
            <AdminPages />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCMS;
