import React from "react";
import { CreditCard } from "lucide-react";

const AdminPayments: React.FC = () => {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-secondary flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-primary" />
            Payments
          </h1>
          <p className="mt-1 text-sm text-secondary/60">
            Monitor and manage payment transactions.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl bg-white p-12 text-center shadow-sm min-h-[400px]">
        <div className="rounded-full bg-sage-50 p-6 mb-6">
          <CreditCard size={64} className="text-secondary/40" />
        </div>
        <h2 className="text-xl font-semibold text-secondary mb-2">
          Payment Management Coming Soon
        </h2>
        <p className="max-w-md text-secondary/60">
          This feature is currently under development. You'll be able to view
          detailed transaction histories, manage refunds, and configure payment
          gateways soon.
        </p>
      </div>
    </div>
  );
};

export default AdminPayments;
