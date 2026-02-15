import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Store,
  DollarSign,
  CreditCard,
  Mail,
  MessageSquare,
  Bell,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Shield,
  Smartphone,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const API_URL = "http://localhost:3000/api";

interface Setting {
  id: string;
  key: string;
  value: string;
  category: string;
  description: string | null;
  isPublic: boolean;
}

const AdminSettings: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>("STORE");
  const [settings, setSettings] = useState<Record<string, Setting[]>>({});
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [setupPassword, setSetupPassword] = useState("");
  const [setup2faLoading, setSetup2faLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [verify2faLoading, setVerify2faLoading] = useState(false);
  const [twoFactorSetupVerified, setTwoFactorSetupVerified] =
    useState<boolean>(false);
  const [currentAdminPassword, setCurrentAdminPassword] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [confirmAdminPassword, setConfirmAdminPassword] = useState("");
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordResetMessage, setPasswordResetMessage] = useState("");
  const [passwordResetError, setPasswordResetError] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [manualEntryKey, setManualEntryKey] = useState("");
  const [setupMessage, setSetupMessage] = useState("");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    fetchSettings();
    fetch2faStatus();

    const query = new URLSearchParams(location.search);
    if (query.get("setup2fa") === "1") {
      setActiveTab("GENERAL");
      setSetupMessage("Please configure 2FA now to secure admin access.");
    }
  }, []);

  const fetch2faStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/auth/2fa/status`);
      const enabled = !!response.data?.enabled;
      setTwoFactorEnabled(enabled);
      setTwoFactorSetupVerified(enabled);
    } catch {
      setTwoFactorEnabled(false);
      setTwoFactorSetupVerified(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_URL}/settings/grouped`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const groupedSettings = response.data as Record<string, Setting[]>;
      setSettings(groupedSettings);

      // Initialize form data
      const initialData: Record<string, string> = {};
      Object.values(groupedSettings)
        .flat()
        .forEach((setting) => {
          initialData[setting.key] = setting.value;
        });
      setFormData(initialData);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("accessToken");

      // Prepare updates only for the active category
      const categorySettings = settings[activeTab] || [];
      const updates = categorySettings.map((setting) => ({
        key: setting.key,
        value: formData[setting.key] || setting.value,
      }));

      await axios.put(`${API_URL}/settings/bulk`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Simple toast could be added here
      fetchSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    // Reset form data to original values
    const categorySettings = settings[activeTab] || [];
    const resetData = { ...formData };
    categorySettings.forEach((setting) => {
      resetData[setting.key] = setting.value;
    });
    setFormData(resetData);
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSetup2fa = async () => {
    if (!setupPassword) {
      setSetupMessage("Enter admin password to set up 2FA.");
      return;
    }

    try {
      setSetup2faLoading(true);
      setSetupMessage("");
      const response = await axios.post(`${API_URL}/admin/auth/2fa/setup`, {
        password: setupPassword,
      });

      setQrCodeDataUrl(response.data?.qrCodeDataUrl || "");
      setManualEntryKey(response.data?.manualEntryKey || "");
      setTwoFactorCode("");
      setTwoFactorSetupVerified(false);
      setTwoFactorEnabled(true);
      setSetupMessage(
        "QR generated. Scan it and verify with one 6-digit code.",
      );
    } catch (error: any) {
      setSetupMessage(error.response?.data?.message || "Failed to set up 2FA");
    } finally {
      setSetup2faLoading(false);
    }
  };

  const handleVerify2faSetup = async () => {
    if (!setupPassword) {
      setSetupMessage("Enter admin password first.");
      return;
    }

    if (!twoFactorCode.trim()) {
      setSetupMessage("Enter the 6-digit code from your authenticator app.");
      return;
    }

    try {
      setVerify2faLoading(true);
      setSetupMessage("");

      await axios.post(`${API_URL}/admin/auth/login`, {
        password: setupPassword,
        twoFactorCode,
      });

      setTwoFactorSetupVerified(true);
      setSetupMessage("2FA setup is done and verified successfully.");
      setSetupPassword("");
      setTwoFactorCode("");
      setQrCodeDataUrl("");
      setManualEntryKey("");
    } catch (error: any) {
      setSetupMessage(error.response?.data?.message || "Invalid 2FA code");
    } finally {
      setVerify2faLoading(false);
    }
  };

  const handleResetAdminPassword = async () => {
    setPasswordResetMessage("");
    setPasswordResetError("");

    if (!currentAdminPassword || !newAdminPassword || !confirmAdminPassword) {
      setPasswordResetError("Please fill all password fields.");
      return;
    }

    if (newAdminPassword.length < 8) {
      setPasswordResetError("New password must be at least 8 characters.");
      return;
    }

    if (newAdminPassword !== confirmAdminPassword) {
      setPasswordResetError("New password and confirm password do not match.");
      return;
    }

    try {
      setPasswordResetLoading(true);
      const token = localStorage.getItem("accessToken");

      const response = await axios.post(
        `${API_URL}/admin/auth/reset-password`,
        {
          currentPassword: currentAdminPassword,
          newPassword: newAdminPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setPasswordResetMessage(
        response.data?.message || "Admin password reset successfully.",
      );
      setCurrentAdminPassword("");
      setNewAdminPassword("");
      setConfirmAdminPassword("");
    } catch (error: any) {
      setPasswordResetError(
        error.response?.data?.message || "Failed to reset admin password",
      );
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const renderInput = (setting: Setting) => {
    const isPassword =
      setting.key.toLowerCase().includes("password") ||
      setting.key.toLowerCase().includes("secret") ||
      setting.key.toLowerCase().includes("token");
    const isBoolean = setting.value === "true" || setting.value === "false";
    const isNumber = !isNaN(Number(setting.value)) && setting.value !== "";

    if (isBoolean) {
      return (
        <div className="flex items-center">
          <button
            type="button"
            role="switch"
            aria-checked={formData[setting.key] === "true"}
            onClick={() =>
              setFormData({
                ...formData,
                [setting.key]:
                  formData[setting.key] === "true" ? "false" : "true",
              })
            }
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              formData[setting.key] === "true" ? "bg-primary" : "bg-sage-200"
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                formData[setting.key] === "true"
                  ? "translate-x-5"
                  : "translate-x-0"
              }`}
            />
          </button>
          <span className="ml-3 text-sm text-secondary/70">
            {formData[setting.key] === "true" ? "Enabled" : "Disabled"}
          </span>
        </div>
      );
    }

    if (isPassword) {
      return (
        <div className="relative rounded-lg shadow-sm">
          <input
            type={showPasswords[setting.key] ? "text" : "password"}
            value={formData[setting.key] || ""}
            onChange={(e) =>
              setFormData({ ...formData, [setting.key]: e.target.value })
            }
            placeholder={setting.description || ""}
            className="block w-full rounded-lg border-0 py-2 px-3 pr-10 text-secondary ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-sage-50/30"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-secondary/40 hover:text-secondary"
            onClick={() => togglePasswordVisibility(setting.key)}
          >
            {showPasswords[setting.key] ? (
              <EyeOff size={16} />
            ) : (
              <Eye size={16} />
            )}
          </button>
        </div>
      );
    }

    if (isNumber) {
      return (
        <input
          type="number"
          value={formData[setting.key] || ""}
          onChange={(e) =>
            setFormData({ ...formData, [setting.key]: e.target.value })
          }
          placeholder={setting.description || ""}
          className="block w-full rounded-lg border-0 py-2 px-3 text-secondary ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-sage-50/30"
        />
      );
    }

    if (setting.value.length > 100) {
      return (
        <textarea
          value={formData[setting.key] || ""}
          onChange={(e) =>
            setFormData({ ...formData, [setting.key]: e.target.value })
          }
          placeholder={setting.description || ""}
          rows={3}
          className="block w-full rounded-lg border-0 py-2 px-3 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-sage-50/30"
        />
      );
    }

    return (
      <input
        type="text"
        value={formData[setting.key] || ""}
        onChange={(e) =>
          setFormData({ ...formData, [setting.key]: e.target.value })
        }
        placeholder={setting.description || ""}
        className="block w-full rounded-lg border-0 py-2 px-3 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-sage-50/30"
      />
    );
  };

  const tabs = [
    {
      id: "STORE",
      label: "Store Details",
      icon: Store,
      desc: "Manage store name, contact details, and address",
    },
    {
      id: "TAX",
      label: "Tax Settings",
      icon: DollarSign,
      desc: "Configure VAT, GST and other tax rates",
    },
    {
      id: "PAYMENT",
      label: "Payment Gateways",
      icon: CreditCard,
      desc: "Setup Stripe, PayPal and other providers",
    },
    {
      id: "EMAIL",
      label: "Email Config",
      icon: Mail,
      desc: "SMTP settings for system emails",
    },
    {
      id: "SMS",
      label: "SMS Config",
      icon: MessageSquare,
      desc: "SMS gateway configuration",
    },
    {
      id: "NOTIFICATIONS",
      label: "Notifications",
      icon: Bell,
      desc: "Alert preferences and triggers",
    },
    {
      id: "GENERAL",
      label: "General & Security",
      icon: Shield,
      desc: "Security, 2FA, and other misc settings",
    },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-secondary flex items-center gap-2">
            <SettingsIcon className="h-8 w-8 text-primary" />
            System Settings
          </h1>
          <p className="mt-1 text-sm text-secondary/70">
            Manage your store configurations, integrations, and security
            preferences.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-secondary shadow-sm hover:bg-sage-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={`mr-2 ${saving ? "animate-spin" : ""}`}
            />
            Reset Changes
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-primary/20"
          >
            <Save size={16} className="mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="flex flex-col space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? "bg-primary/5 text-primary ring-1 ring-primary/10"
                      : "text-secondary/70 hover:bg-sage-50 hover:text-secondary"
                  }`}
                >
                  <Icon
                    className={`flex-shrink-0 -ml-1 mr-3 h-5 w-5 ${
                      isActive
                        ? "text-primary"
                        : "text-secondary/40 group-hover:text-secondary/60"
                    }`}
                  />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-64 rounded-xl bg-white shadow-sm">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-secondary/60 text-sm">Loading settings...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tab Header inside Content (Optional, adds context) */}
              <div className="pb-2 border-b border-sage-200 sm:hidden lg:block">
                <h2 className="text-lg font-medium text-secondary">
                  {tabs.find((t) => t.id === activeTab)?.label}
                </h2>
                <p className="text-sm text-secondary/60">
                  {tabs.find((t) => t.id === activeTab)?.desc}
                </p>
              </div>

              {/* 2FA Special Section */}
              {activeTab === "GENERAL" && (
                <div className="space-y-6">
                  <div className="rounded-xl bg-primary/5 p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Smartphone size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold leading-6 text-secondary">
                          Admin 2FA Security
                        </h3>
                        <p className="mt-1 text-sm text-secondary/70">
                          Secure your account using an authenticator app (Google
                          Authenticator, Authy, etc).
                        </p>

                        <div className="mt-6 space-y-4 max-w-lg">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium leading-6 text-secondary">
                              Confirmation Password
                            </label>
                            <input
                              type="password"
                              value={setupPassword}
                              onChange={(e) => setSetupPassword(e.target.value)}
                              placeholder="Enter current admin password"
                              className="block w-full rounded-lg border-0 py-2 px-3 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-white/50"
                            />
                          </div>

                          {setupMessage && (
                            <div
                              className={`p-3 rounded-lg text-sm flex items-center gap-2 ${setupMessage.includes("success") || twoFactorSetupVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                            >
                              <AlertCircle size={16} />
                              {setupMessage}
                            </div>
                          )}

                          {!twoFactorSetupVerified && qrCodeDataUrl && (
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                              <div className="flex justify-center mb-4">
                                <img
                                  src={qrCodeDataUrl}
                                  alt="2FA QR Code"
                                  className="w-48 h-48 rounded-lg"
                                />
                              </div>
                              <p className="text-xs text-center text-secondary/60 mb-4">
                                Scan using your authenticator app
                              </p>

                              <div className="p-3 bg-sage-50 rounded mb-4">
                                <p className="text-xs text-secondary/60 font-mono text-center break-all">
                                  {manualEntryKey}
                                </p>
                              </div>

                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="000 000"
                                  maxLength={6}
                                  className="block w-full text-center tracking-widest text-lg rounded-lg border-0 py-2 text-secondary ring-1 ring-inset ring-sage-200 focus:ring-2 focus:ring-inset focus:ring-primary"
                                  value={twoFactorCode}
                                  onChange={(e) =>
                                    setTwoFactorCode(
                                      e.target.value
                                        .replace(/[^0-9]/g, "")
                                        .slice(0, 6),
                                    )
                                  }
                                />
                                <button
                                  onClick={handleVerify2faSetup}
                                  disabled={verify2faLoading}
                                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 whitespace-nowrap"
                                >
                                  {verify2faLoading ? "..." : "Verify"}
                                </button>
                              </div>
                            </div>
                          )}

                          {twoFactorSetupVerified && !qrCodeDataUrl && (
                            <div className="flex items-center gap-2 text-emerald-600 font-medium bg-emerald-50 px-4 py-3 rounded-lg">
                              <CheckCircle2 size={18} />
                              2FA is enabled and verified.
                            </div>
                          )}

                          {!qrCodeDataUrl && !twoFactorSetupVerified && (
                            <button
                              onClick={handleSetup2fa}
                              disabled={setup2faLoading}
                              className="inline-flex items-center rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            >
                              {setup2faLoading
                                ? "Generating..."
                                : twoFactorEnabled
                                  ? "Regenerate Keys"
                                  : "Start Setup"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-6 shadow-sm border border-sage-100">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-sage-100 rounded-lg text-secondary">
                        <Shield size={24} />
                      </div>
                      <div className="flex-1 max-w-lg">
                        <h3 className="text-base font-semibold leading-6 text-secondary">
                          Reset Admin Password
                        </h3>
                        <p className="mt-1 text-sm text-secondary/70">
                          Change your admin login password for the panel.
                        </p>

                        <div className="mt-5 space-y-3">
                          <input
                            type="password"
                            value={currentAdminPassword}
                            onChange={(e) =>
                              setCurrentAdminPassword(e.target.value)
                            }
                            placeholder="Current password"
                            className="block w-full rounded-lg border-0 py-2 px-3 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-sage-50/30"
                          />
                          <input
                            type="password"
                            value={newAdminPassword}
                            onChange={(e) =>
                              setNewAdminPassword(e.target.value)
                            }
                            placeholder="New password (min 8 chars)"
                            className="block w-full rounded-lg border-0 py-2 px-3 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-sage-50/30"
                          />
                          <input
                            type="password"
                            value={confirmAdminPassword}
                            onChange={(e) =>
                              setConfirmAdminPassword(e.target.value)
                            }
                            placeholder="Confirm new password"
                            className="block w-full rounded-lg border-0 py-2 px-3 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-sage-50/30"
                          />

                          {passwordResetError && (
                            <div className="rounded-lg bg-rose-50 text-rose-700 px-3 py-2 text-sm">
                              {passwordResetError}
                            </div>
                          )}
                          {passwordResetMessage && (
                            <div className="rounded-lg bg-emerald-50 text-emerald-700 px-3 py-2 text-sm">
                              {passwordResetMessage}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={handleResetAdminPassword}
                            disabled={passwordResetLoading}
                            className="inline-flex items-center rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50"
                          >
                            {passwordResetLoading
                              ? "Updating..."
                              : "Reset Admin Password"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Settings Form */}
              <div className="bg-white rounded-xl shadow-sm divide-y divide-sage-100">
                {(settings[activeTab] || []).length > 0
                  ? (settings[activeTab] || []).map((setting, index) => (
                      <div
                        key={setting.key}
                        className="p-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6"
                      >
                        <div className="sm:col-span-3">
                          <label
                            htmlFor={setting.key}
                            className="block text-sm font-medium leading-6 text-secondary"
                          >
                            {setting.key
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </label>
                          {setting.description && (
                            <p className="mt-1 text-sm text-secondary/60">
                              {setting.description}
                            </p>
                          )}
                        </div>
                        <div className="sm:col-span-3">
                          {renderInput(setting)}
                        </div>
                      </div>
                    ))
                  : activeTab !== "GENERAL" && (
                      <div className="p-12 text-center">
                        <div className="mx-auto h-12 w-12 text-sage-300">
                          <SettingsIcon className="h-full w-full" />
                        </div>
                        <h3 className="mt-2 text-sm font-semibold text-secondary">
                          No settings found
                        </h3>
                        <p className="mt-1 text-sm text-secondary/60">
                          There are no configurable settings in this category
                          yet.
                        </p>
                      </div>
                    )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
