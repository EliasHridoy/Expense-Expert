/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0F17",
        surface: "#141A24",
        "surface-alt": "#1C2433",
        emerald: "#10B981",
        cobalt: "#3B82F6",
        amber: "#F59E0B",
        coral: "#F43F5E",
        text: "#F8FAFC",
        muted: "#94A3B8"
      },
      fontFamily: {
        ui: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      }
    }
  },
  plugins: []
};
