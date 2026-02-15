import { useEffect, useState } from "react";
import { API_BASE } from "../lib/api";
import { clearToken, getToken, setToken } from "../lib/auth";
import { useAuth } from "../lib/authContext";

export default function Account() {
  const { user, setUser } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [vaults, setVaults] = useState([]);
  const [loadingVaults, setLoadingVaults] = useState(false);

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch(`${API_BASE}/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }
      setToken(data.token);
      setUser(data.user);
      setForm({ name: "", email: "", password: "" });
    } catch (err) {
      setError(err.message || "Authentication failed.");
    }
  };

  const fetchVaults = async () => {
    const token = getToken();
    if (!token) return;
    setLoadingVaults(true);
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
      setLoadingVaults(false);
    }
  };

  const handleDelete = async (id) => {
    const token = getToken();
    if (!token) return;
    await fetch(`${API_BASE}/me/vaults/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchVaults();
  };

  useEffect(() => {
    if (user) {
      fetchVaults();
    }
  }, [user]);

  if (!user) {
    return (
      <section className="section-shell max-w-lg mx-auto">
        <p className="section-title">Account</p>
        <h2 className="text-3xl font-display font-semibold mt-2">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="mt-2 text-slate-600">
          Sign in to manage your vault links and access control.
        </p>

        <div className="mt-6 flex rounded-full bg-slate-100 p-1 w-fit">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`px-4 py-2 text-sm rounded-full transition ${
              mode === "login" ? "bg-white text-ink shadow" : "text-slate-500"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`px-4 py-2 text-sm rounded-full transition ${
              mode === "register"
                ? "bg-white text-ink shadow"
                : "text-slate-500"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "register" && (
            <div>
              <label className="text-sm font-medium text-slate-600">Name</label>
              <input
                value={form.name}
                onChange={handleChange("name")}
                className="mt-2 input-field"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-slate-600">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              className="mt-2 input-field"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              className="mt-2 input-field"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-2xl bg-ink text-white py-3 font-semibold tracking-wide hover:translate-y-[-1px] transition"
          >
            {mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="section-shell">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="section-title">Account</p>
          <h2 className="text-3xl font-display font-semibold mt-2">
            Your vaults
          </h2>
          <p className="mt-2 text-slate-600">
            Signed in as {user.name} ({user.email})
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            clearToken();
            setUser(null);
          }}
          className="btn-outline"
        >
          Sign out
        </button>
      </div>

      <div className="mt-6">
        {loadingVaults ? (
          <p className="text-slate-600">Loading your links...</p>
        ) : vaults.length === 0 ? (
          <p className="text-slate-600">No vaults yet. Create one!</p>
        ) : (
          <div className="grid gap-4">
            {vaults.map((item) => (
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
                <div className="flex gap-3">
                  <a
                    href={`/v/${item.id}`}
                    className="btn-outline"
                  >
                    Open
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-600 hover:border-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
