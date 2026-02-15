/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0b12",
        mist: "#f5f7ff",
        glow: "#e6f4ff",
        aurora: "#79e2f2",
        ember: "#ff8a5b",
        sun: "#ffd6a5",
        sky: "#9ad4ff",
      },
      fontFamily: {
        display: ["\"Space Grotesk\"", "sans-serif"],
        body: ["\"Plus Jakarta Sans\"", "sans-serif"],
      },
      boxShadow: {
        soft: "0 20px 60px -20px rgba(21, 24, 48, 0.35)",
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(900px 520px at 8% 0%, rgba(255, 200, 155, 0.55), transparent 55%), radial-gradient(900px 600px at 92% 20%, rgba(150, 210, 255, 0.55), transparent 60%), radial-gradient(800px 500px at 50% 90%, rgba(196, 255, 232, 0.45), transparent 55%), linear-gradient(180deg, #f8f6ff 0%, #edf4ff 100%)",
        "hero-gradient-dark":
          "radial-gradient(900px 520px at 10% 0%, rgba(88, 120, 255, 0.25), transparent 55%), radial-gradient(900px 600px at 90% 20%, rgba(80, 214, 180, 0.2), transparent 60%), linear-gradient(180deg, #0c0f1f 0%, #11162a 100%)",
      },
    },
  },
  plugins: [],
};
