import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE } from "../lib/api";
import { getToken } from "../lib/auth";

export default function View() {
  const { id } = useParams();
  const [status, setStatus] = useState("loading");
  const [payload, setPayload] = useState(null);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    const load = async () => {
      setStatus("loading");
      setMessage("");
      try {
        const response = await fetch(`${API_BASE}/v/${id}`, {
          headers: password
            ? {
                "x-linkvault-password": password,
              }
            : undefined,
        });
        if (response.status === 403) {
          let detail = "";
          try {
            const data = await response.json();
            detail = data?.error || "";
          } catch (err) {
            detail = "";
          }
          if (detail.toLowerCase().includes("password")) {
            setStatus("locked");
            setMessage("Incorrect password. Please try again.");
          } else {
            setStatus("error");
            setMessage("This link is invalid or was removed.");
          }
          return;
        }
        if (response.status === 401) {
          setStatus("locked");
          setMessage("This link is password-protected.");
          return;
        }
        if (response.status === 410) {
          setStatus("expired");
          setMessage(
            "This link has expired, was already used, or hit its limit."
          );
          return;
        }

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to load content.");
        }

        setPayload(data);
        const token = getToken();
        if (token) {
          const meRes = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (meRes.ok && data?.ownerId) {
            const meData = await meRes.json();
            setCanDelete(String(meData.user.id) === String(data.ownerId));
          } else {
            setCanDelete(false);
          }
        } else {
          setCanDelete(false);
        }
        setStatus("ready");
      } catch (err) {
        setStatus("error");
        setMessage(err.message || "Something went wrong.");
      }
    };

    load();
  }, [id, password]);

  if (status === "loading") {
    return (
      <section className="section-shell text-center">
        <p className="section-title">Preparing</p>
        <h2 className="mt-2 text-2xl font-display font-semibold">
          Loading secure link
        </h2>
        <p className="mt-3 text-slate-600">Please wait a moment.</p>
      </section>
    );
  }

  if (status === "error" || status === "expired") {
    return (
      <section className="section-shell text-center">
        <p className="section-title">
          {status === "expired" ? "Expired" : "Unavailable"}
        </p>
        <h2 className="mt-2 text-2xl font-display font-semibold">
          {status === "expired" ? "Link expired" : "Link not found"}
        </h2>
        <p className="mt-3 text-slate-600">{message}</p>
        <Link
          to="/"
          className="mt-6 inline-flex btn-primary"
        >
          Create a new link
        </Link>
      </section>
    );
  }

  if (status === "locked") {
    return (
      <section className="section-shell text-center">
        <p className="section-title">Protected</p>
        <h2 className="mt-2 text-2xl font-display font-semibold">
          Protected vault
        </h2>
        <p className="mt-3 text-slate-600">{message}</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setStatus("loading");
          }}
          className="mt-6 mx-auto max-w-sm space-y-4"
        >
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            className="input-field"
          />
          <button
            type="submit"
            className="w-full rounded-full bg-ink px-6 py-2 text-sm text-white hover:translate-y-[-1px] transition"
          >
            Unlock
          </button>
        </form>
        <Link
          to="/"
          className="mt-6 inline-flex btn-outline"
        >
          Create a new link
        </Link>
      </section>
    );
  }

  const handleDelete = async () => {
    setDeleteMessage("");
    try {
      const token = getToken();
      const headers = {};
      if (password) headers["x-linkvault-password"] = password;
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(`${API_BASE}/v/${id}`, {
        method: "DELETE",
        headers: Object.keys(headers).length ? headers : undefined,
      });

      if (response.status === 401) {
        let detail = "";
        try {
          const data = await response.json();
          detail = data?.error || "";
        } catch (err) {
          detail = "";
        }
        setDeleteMessage(
          detail || "Only the owner can delete this link."
        );
        return;
      }
      if (response.status === 403) {
        setDeleteMessage("Invalid link or incorrect password.");
        return;
      }
      if (!response.ok) {
        setDeleteMessage("Unable to delete the link.");
        return;
      }

      setStatus("expired");
      setMessage("This link has been deleted.");
    } catch (err) {
      setDeleteMessage("Unable to delete the link.");
    }
  };

  const expiry = payload?.expiresAt
    ? new Date(payload.expiresAt).toLocaleString()
    : "unknown";
  const viewLimit =
    payload?.maxViews !== null && payload?.maxViews !== undefined
      ? `${payload.viewCount}/${payload.maxViews} views`
      : null;
  const downloadLimit =
    payload?.maxDownloads !== null && payload?.maxDownloads !== undefined
      ? `${payload.downloadCount}/${payload.maxDownloads} downloads`
      : null;

  return (
    <section className="section-shell">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <p className="section-title">
            {payload?.type === "text" ? "Shared text" : "Shared file"}
          </p>
          <h2 className="text-3xl font-display font-semibold mt-2">
            {payload?.type === "text"
              ? "Secure note"
              : payload?.fileName || "Secure file"}
          </h2>
          <div className="mt-3 text-sm text-slate-600">
            Expires {expiry}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-full border border-red-200 px-5 py-2 text-sm text-red-600 hover:border-red-300"
            >
              Delete link
            </button>
          )}
          <Link to="/" className="btn-outline">
            Create another link
          </Link>
        </div>
      </div>
      {deleteMessage && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {deleteMessage}
        </div>
      )}

      {payload?.type === "text" ? (
        <div className="mt-8 space-y-5">
          {payload?.oneTime && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              One-time link.
            </div>
          )}
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-6">
            <pre className="whitespace-pre-wrap text-slate-700 text-sm">
              {payload.content}
            </pre>
          </div>
          {(viewLimit || downloadLimit) && (
            <div className="flex flex-wrap gap-2">
              {viewLimit && <span className="chip">{viewLimit}</span>}
              {downloadLimit && <span className="chip">{downloadLimit}</span>}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                navigator.clipboard.writeText(payload.content || "")
              }
              className="btn-primary"
            >
              Copy text
            </button>
            <Link to="/" className="btn-outline">
              Back to home
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {payload?.oneTime && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              One-time download.
            </div>
          )}
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-lg font-medium text-slate-700">
                {payload.fileName || "Download file"}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {payload.fileSize
                  ? `${Math.round(payload.fileSize / 1024)} KB`
                  : "Size unavailable"}
              </p>
            </div>
            <a
              href={`${API_BASE}${payload.downloadUrl}${
                password ? `?password=${encodeURIComponent(password)}` : ""
              }`}
              className="inline-flex btn-primary"
            >
              Download file
            </a>
          </div>
          {(viewLimit || downloadLimit) && (
            <div className="flex flex-wrap gap-2">
              {viewLimit && <span className="chip">{viewLimit}</span>}
              {downloadLimit && <span className="chip">{downloadLimit}</span>}
            </div>
          )}
          <Link to="/" className="btn-outline w-fit">
            Back to home
          </Link>
        </div>
      )}
    </section>
  );
}
