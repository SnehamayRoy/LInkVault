import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../lib/api";
import { getToken } from "../lib/auth";
import { useAuth } from "../lib/authContext";

const toLocalInputValue = (date) => {
  const pad = (v) => String(v).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const quickExpiry = [
  { label: "10 min", minutes: 10 },
  { label: "1 hour", minutes: 60 },
  { label: "12 hours", minutes: 720 },
  { label: "1 day", minutes: 1440 },
];

export default function Home() {
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [expiresAt, setExpiresAt] = useState("");
  const [password, setPassword] = useState("");
  const [oneTime, setOneTime] = useState(false);
  const [maxViews, setMaxViews] = useState("");
  const [maxDownloads, setMaxDownloads] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vaults, setVaults] = useState([]);
  const [vaultsLoading, setVaultsLoading] = useState(false);
  const { user } = useAuth();

  const linkPreview = useMemo(() => {
    if (!link) return "";
    return link.replace(/^https?:\/\//, "");
  }, [link]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLink("");

    if (mode === "text" && !text.trim()) {
      setError("Please add some text to share.");
      return;
    }
    if (mode === "file" && !file) {
      setError("Please select a file to upload.");
      return;
    }

    const form = new FormData();
    if (mode === "text") {
      form.append("text", text.trim());
    } else if (file) {
      form.append("file", file);
    }

    if (expiresAt) {
      form.append("expiresAt", new Date(expiresAt).toISOString());
    }
    if (password.trim()) {
      form.append("password", password.trim());
    }
    if (oneTime) {
      form.append("oneTime", "true");
    }
    if (maxViews.trim()) {
      form.append("maxViews", maxViews.trim());
    }
    if (maxDownloads.trim()) {
      form.append("maxDownloads", maxDownloads.trim());
    }

    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
        body: form,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      const shareLink = `${window.location.origin}/v/${data.id}`;
      setLink(shareLink);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setError("");
    setLink("");
    if (nextMode === "text") {
      setFile(null);
    } else {
      setText("");
    }
  };

  const handleQuickExpiry = (minutes) => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutes);
    setExpiresAt(toLocalInputValue(date));
  };

  const fetchVaults = async () => {
    const token = getToken();
    if (!token) return;
    setVaultsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/me/vaults`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setVaults(data.items || []);
      }
    } catch (err) {
      // ignore
    } finally {
      setVaultsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchVaults();
    } else {
      setVaults([]);
    }
  }, [user]);

  return (
    <main className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-start">
      <section className="space-y-6">
        <div className="section-shell min-h-[360px]">
          <div className="max-w-2xl">
            <span className="accent-badge">LinkVault</span>
            <h1 className="mt-4 text-4xl md:text-5xl font-display font-semibold leading-tight">
              Private sharing, designed to disappear.
            </h1>
            <p className="mt-4 text-slate-700 text-lg">
              Share text or files with a single link. Set an expiry and stay in
              control.
            </p>
            <div className="mt-6 flex items-center gap-4 text-sm text-slate-600">
              <span className="px-3 py-1 rounded-full border border-slate-200">
                No login required
              </span>
              <span className="px-3 py-1 rounded-full border border-slate-200">
                Auto‑expiry
              </span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="soft-card p-6">
            <p className="section-title">Upload</p>
            <p className="mt-3 text-slate-700">Text or file.</p>
          </div>
          <div className="soft-card p-6">
            <p className="section-title">Share</p>
            <p className="mt-3 text-slate-700">One private link.</p>
          </div>
          <div className="soft-card p-6">
            <p className="section-title">Expire</p>
            <p className="mt-3 text-slate-700">Automatic cleanup.</p>
          </div>
        </div>

        {user && (
          <div className="soft-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-title">My Links</p>
                <p className="text-base text-slate-700">Recent uploads.</p>
              </div>
              <button
                type="button"
                onClick={fetchVaults}
                className="btn-outline"
              >
                Refresh
              </button>
            </div>

            <div className="mt-4">
              {vaultsLoading ? (
                <p className="text-slate-600">Loading your links...</p>
              ) : vaults.length === 0 ? (
                <p className="text-slate-600">No vaults yet.</p>
              ) : (
                <div className="grid gap-3">
                  {vaults.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-white/90 p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm uppercase tracking-widest text-slate-500">
                          {item.type} • {item.id}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          Expires: {new Date(item.expiresAt).toLocaleString()}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                          {item.oneTime && <span className="chip">One-time</span>}
                          {item.maxViews && (
                            <span className="chip">
                              Views: {item.viewCount}/{item.maxViews}
                            </span>
                          )}
                          {item.maxDownloads && (
                            <span className="chip">
                              Downloads: {item.downloadCount}/{item.maxDownloads}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <a href={`/v/${item.id}`} className="btn-outline">
                          Open
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="section-shell sticky top-6">
        <div className="flex items-center justify-between">
          <h2 className="card-title">Create a secure link</h2>
          <div className="flex rounded-full bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => handleModeChange("text")}
              className={`px-4 py-2 text-sm rounded-full transition ${
                mode === "text"
                  ? "bg-white text-ink shadow"
                  : "text-slate-500"
              }`}
            >
              Text
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("file")}
              className={`px-4 py-2 text-sm rounded-full transition ${
                mode === "file"
                  ? "bg-white text-ink shadow"
                  : "text-slate-500"
              }`}
            >
              File
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {user && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Signed in as {user.name}. Your uploads will be linked to your
              account.
            </div>
          )}
          {mode === "text" ? (
            <div>
              <label className="text-sm font-medium text-slate-600">
                Paste your text
              </label>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Share notes, snippets, or instructions..."
                rows={8}
                className="mt-2 textarea-field"
              />
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-slate-600">
                Upload a file
              </label>
              <div className="mt-2 flex flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/90 p-5">
                <input
                  type="file"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  className="text-sm text-slate-600"
                />
                {file && (
                  <p className="text-sm text-slate-500">
                    Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  Max size: 10 MB. Allowed: PDF, PNG, JPG, TXT, ZIP, DOCX, XLSX.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-600">
              Expiry date & time (optional)
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              className="mt-2 input-field"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {quickExpiry.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => handleQuickExpiry(option.minutes)}
                  className="chip hover:border-slate-300 transition"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600">
              Protect with password (optional)
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 4 characters"
              className="mt-2 input-field"
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-700">
                One-time view link
              </p>
              <p className="text-xs text-slate-500">
                Link is consumed after first access.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOneTime((prev) => !prev)}
              className={`h-8 w-14 rounded-full p-1 transition ${
                oneTime ? "bg-ink" : "bg-slate-200"
              }`}
            >
              <span
                className={`block h-6 w-6 rounded-full bg-white transition ${
                  oneTime ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-600">
                Max views (optional)
              </label>
              <input
                type="number"
                min="1"
                value={maxViews}
                onChange={(event) => setMaxViews(event.target.value)}
                placeholder="e.g. 5"
                className="mt-2 input-field"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">
                Max downloads (optional)
              </label>
              <input
                type="number"
                min="1"
                value={maxDownloads}
                onChange={(event) => setMaxDownloads(event.target.value)}
                placeholder="e.g. 2"
                className="mt-2 input-field"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-ink text-white py-3 font-semibold tracking-wide transition hover:translate-y-[-1px] hover:shadow-lg disabled:opacity-60"
          >
            {loading ? "Generating link..." : "Generate link"}
          </button>
        </form>

        {link && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-700">
              Your link is ready
            </p>
            <div className="mt-2 flex flex-col gap-3">
              <code className="rounded-xl bg-white p-3 text-sm text-slate-700">
                {linkPreview}
              </code>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(link)}
                  className="rounded-full bg-emerald-600 px-4 py-2 text-sm text-white hover:shadow"
                >
                  Copy link
                </button>
                <a
                  href={link}
                  className="rounded-full border border-emerald-300 px-4 py-2 text-sm text-emerald-700 hover:border-emerald-400"
                >
                  Open viewer
                </a>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
