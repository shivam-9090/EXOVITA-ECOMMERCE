import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail, Megaphone, Users, Send, Tag } from "lucide-react";
import { ADMIN_API_URL } from "../admin/apiBase";

type Tab = "broadcast" | "discount";

interface AudienceCount {
  all: number;
  customers: number;
}

const AdminNotifications: React.FC = () => {
  const [tab, setTab] = useState<Tab>("broadcast");
  const [audience, setAudience] = useState<"all" | "customers">("customers");
  const [audienceCount, setAudienceCount] = useState<AudienceCount | null>(
    null,
  );
  const [sending, setSending] = useState(false);

  // Broadcast form
  const [bcSubject, setBcSubject] = useState("");
  const [bcTitle, setBcTitle] = useState("");
  const [bcBody, setBcBody] = useState("");
  const [bcCtaText, setBcCtaText] = useState("");
  const [bcCtaUrl, setBcCtaUrl] = useState("");

  // Discount form
  const [dcSubject, setDcSubject] = useState("");
  const [dcHeadline, setDcHeadline] = useState("");
  const [dcMessage, setDcMessage] = useState("");
  const [dcCode, setDcCode] = useState("");
  const [dcPercent, setDcPercent] = useState("");
  const [dcCtaText, setDcCtaText] = useState("Shop Now");
  const [dcCtaUrl, setDcCtaUrl] = useState("https://exovitaherbal.com/shop");
  const [dcExpires, setDcExpires] = useState("");

  useEffect(() => {
    fetchAudienceCount();
  }, []);

  const fetchAudienceCount = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        `${ADMIN_API_URL}/admin/notifications/audience-count`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setAudienceCount(data);
      }
    } catch {
      // silent
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bcSubject || !bcTitle || !bcBody) {
      toast.error("Please fill in Subject, Title, and Body.");
      return;
    }
    setSending(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        `${ADMIN_API_URL}/admin/notifications/broadcast`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subject: bcSubject,
            title: bcTitle,
            body: bcBody,
            ctaText: bcCtaText || undefined,
            ctaUrl: bcCtaUrl || undefined,
            audience,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      toast.success(
        `Broadcast sent! ${data.sent} delivered, ${data.failed} failed.`,
      );
      setBcSubject("");
      setBcTitle("");
      setBcBody("");
      setBcCtaText("");
      setBcCtaUrl("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send broadcast.");
    } finally {
      setSending(false);
    }
  };

  const handleDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dcSubject || !dcHeadline || !dcMessage) {
      toast.error("Please fill in Subject, Headline, and Message.");
      return;
    }
    setSending(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${ADMIN_API_URL}/admin/notifications/discount`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: dcSubject,
          headline: dcHeadline,
          message: dcMessage,
          discountCode: dcCode || undefined,
          discountPercent: dcPercent ? Number(dcPercent) : undefined,
          ctaText: dcCtaText || undefined,
          ctaUrl: dcCtaUrl || undefined,
          expiresAt: dcExpires || undefined,
          audience,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      toast.success(
        `Discount email sent! ${data.sent} delivered, ${data.failed} failed.`,
      );
      setDcSubject("");
      setDcHeadline("");
      setDcMessage("");
      setDcCode("");
      setDcPercent("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send discount email.");
    } finally {
      setSending(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-sage-200 bg-white px-4 py-2.5 text-sm text-secondary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition";
  const labelCls =
    "block text-xs font-semibold text-secondary/70 uppercase tracking-wider mb-1.5";
  const activeTab =
    "bg-white text-primary shadow-sm font-semibold border border-sage-200";
  const inactiveTab = "text-secondary/60 hover:text-secondary font-medium";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary tracking-tight">
            Email Notifications
          </h1>
          <p className="mt-1 text-sm text-secondary/60">
            Send announcements, discounts, and promotions to your customers.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-sage-50 border border-sage-200 px-4 py-2">
          <Users size={16} className="text-primary" />
          <span className="text-sm text-secondary/70">
            {audienceCount ? (
              <>
                <strong className="text-secondary">
                  {audienceCount.customers} customers
                </strong>{" "}
                · {audienceCount.all} total users
              </>
            ) : (
              "Loading…"
            )}
          </span>
        </div>
      </div>

      {/* Audience Selector */}
      <div className="rounded-xl border border-sage-200 bg-white p-5 shadow-sm">
        <p className={labelCls}>Target Audience</p>
        <div className="flex gap-3 mt-1">
          {(["customers", "all"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAudience(a)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition ${
                audience === a
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-white text-secondary/70 border-sage-200 hover:border-primary hover:text-primary"
              }`}
            >
              <Users size={14} />
              {a === "customers"
                ? `Customers (${audienceCount?.customers ?? "…"})`
                : `All Users (${audienceCount?.all ?? "…"})`}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-secondary/50">
          Only verified email addresses will receive the message.
        </p>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-sage-200 bg-sage-50 overflow-hidden shadow-sm">
        <div className="flex border-b border-sage-200 bg-sage-50 p-1 gap-1">
          <button
            onClick={() => setTab("broadcast")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm transition ${tab === "broadcast" ? activeTab : inactiveTab}`}
          >
            <Megaphone size={15} />
            Announcement
          </button>
          <button
            onClick={() => setTab("discount")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm transition ${tab === "discount" ? activeTab : inactiveTab}`}
          >
            <Tag size={15} />
            Discount / Promo
          </button>
        </div>

        <div className="p-6 bg-white">
          {/* ── Broadcast Form ── */}
          {tab === "broadcast" && (
            <form onSubmit={handleBroadcast} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Email Subject *</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. New Arrivals at Exovita Herbal"
                    value={bcSubject}
                    onChange={(e) => setBcSubject(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    Email Title (shown in body) *
                  </label>
                  <input
                    className={inputCls}
                    placeholder="e.g. Exciting News for You!"
                    value={bcTitle}
                    onChange={(e) => setBcTitle(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>
                  Message Body * (HTML allowed)
                </label>
                <textarea
                  className={`${inputCls} min-h-[140px] resize-y`}
                  placeholder="Write your message here. You can use basic HTML like <strong>, <br/>, <p>, <a href='...'>link</a> etc."
                  value={bcBody}
                  onChange={(e) => setBcBody(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Button Text (optional)</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. Shop Now"
                    value={bcCtaText}
                    onChange={(e) => setBcCtaText(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Button Link (optional)</label>
                  <input
                    className={inputCls}
                    placeholder="https://exovitaherbal.com/shop"
                    value={bcCtaUrl}
                    onChange={(e) => setBcCtaUrl(e.target.value)}
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-sage-100 flex justify-end">
                <button
                  type="submit"
                  disabled={sending}
                  className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <Send size={15} />
                  {sending
                    ? "Sending…"
                    : `Send to ${audience === "customers" ? (audienceCount?.customers ?? "…") : (audienceCount?.all ?? "…")} users`}
                </button>
              </div>
            </form>
          )}

          {/* ── Discount Form ── */}
          {tab === "discount" && (
            <form onSubmit={handleDiscount} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Email Subject *</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. Exclusive 20% Off — This Weekend Only!"
                    value={dcSubject}
                    onChange={(e) => setDcSubject(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Headline *</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. Special Offer Just for You"
                    value={dcHeadline}
                    onChange={(e) => setDcHeadline(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Message *</label>
                <textarea
                  className={`${inputCls} min-h-[120px] resize-y`}
                  placeholder="Describe the offer. e.g. Use the code below to enjoy 20% off your next order on all herbal products..."
                  value={dcMessage}
                  onChange={(e) => setDcMessage(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelCls}>Discount Code</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. HERBAL20"
                    value={dcCode}
                    onChange={(e) => setDcCode(e.target.value.toUpperCase())}
                  />
                </div>
                <div>
                  <label className={labelCls}>Discount %</label>
                  <input
                    className={inputCls}
                    type="number"
                    placeholder="e.g. 20"
                    min={1}
                    max={100}
                    value={dcPercent}
                    onChange={(e) => setDcPercent(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Expiry Date</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. March 10, 2026"
                    value={dcExpires}
                    onChange={(e) => setDcExpires(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Button Text</label>
                  <input
                    className={inputCls}
                    placeholder="Shop Now"
                    value={dcCtaText}
                    onChange={(e) => setDcCtaText(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Button Link</label>
                  <input
                    className={inputCls}
                    placeholder="https://exovitaherbal.com/shop"
                    value={dcCtaUrl}
                    onChange={(e) => setDcCtaUrl(e.target.value)}
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-sage-100 flex justify-end">
                <button
                  type="submit"
                  disabled={sending}
                  className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <Mail size={15} />
                  {sending
                    ? "Sending…"
                    : `Send Promo to ${audience === "customers" ? (audienceCount?.customers ?? "…") : (audienceCount?.all ?? "…")} users`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-xl border border-sage-200 bg-sage-50/50 px-5 py-4">
        <p className="text-xs text-secondary/60 leading-6">
          <strong className="text-secondary">Note:</strong> Emails are sent
          individually with a 300ms delay between each send to avoid SMTP rate
          limits. For large audiences (100+ users), the process may take a few
          minutes in the background. Failed sends are logged on the server.
        </p>
      </div>
    </div>
  );
};

export default AdminNotifications;
