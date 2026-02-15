import React from "react";
import { UserCog } from "lucide-react";

const AdminRoles: React.FC = () => {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <UserCog className="h-8 w-8 text-primary" />
            Roles & Permissions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage user roles and access permissions.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-900/5 min-h-[400px]">
        <div className="rounded-full bg-slate-50 p-6 mb-6">
          <UserCog size={64} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Role Management Coming Soon
        </h2>
        <p className="max-w-md text-slate-500">
          This feature is currently under development. You'll be able to create
          custom roles, assign granular permissions, and manage admin access
          levels soon.
        </p>
      </div>
    </div>
  );
};

export default AdminRoles;
