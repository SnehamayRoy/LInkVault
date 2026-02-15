import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Home from "./pages/Home.jsx";
import View from "./pages/View.jsx";
import Account from "./pages/Account.jsx";
import { AuthContext } from "./lib/authContext";
import { API_BASE } from "./lib/api";
import { clearToken, getToken } from "./lib/auth";

const Navigation = ({ user, onSignOut, theme, onToggleTheme }) => {
  const location = useLocation();
  const isViewer = location.pathname.startsWith("/v/");

  return (
    <header className="py-8 border-b border-white/60">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-ink text-white grid place-items-center font-bold text-lg">
            LV
          </div>
          <div>
            <p className="text-lg font-display font-semibold">LinkVault</p>
            <p className="text-sm text-slate-600">Secure sharing</p>
          </div>
        </Link>
        {!isViewer && (
          <div className="hidden md:flex items-center gap-3 text-sm text-slate-700">
            <Link to="/" className="nav-pill">
              Home
            </Link>
            <Link to="/account" className="nav-pill">
              {user ? "Account" : "Sign in"}
            </Link>
            <button
              type="button"
              onClick={onToggleTheme}
              className="nav-pill"
            >
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            {user && (
              <button
                type="button"
                onClick={() => {
                  clearToken();
                  onSignOut();
                }}
                className="nav-pill"
              >
                Sign out
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

const Footer = () => (
  <footer className="mt-16 pb-12 text-sm text-slate-600">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <span>LinkVault © 2026. Built for Design Lab.</span>
      <span>Share responsibly. Links expire automatically.</span>
    </div>
  </footer>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(
    localStorage.getItem("linkvault_theme") || "light"
  );

  useEffect(() => {
    const loadUser = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          clearToken();
          return;
        }
        const data = await response.json();
        setUser(data.user);
      } catch (err) {
        clearToken();
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("linkvault_theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <div
        className={`min-h-screen text-ink ${
          theme === "dark" ? "bg-hero-gradient-dark text-slate-100" : "bg-hero-gradient"
        }`}
      >
        <div className="mx-auto max-w-6xl px-6">
          <Navigation
            user={user}
            onSignOut={() => setUser(null)}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
          <div className="pb-6">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/v/:id" element={<View />} />
              <Route path="/account" element={<Account />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </div>
    </AuthContext.Provider>
  );
}
