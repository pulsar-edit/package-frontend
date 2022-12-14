/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./ejs-views/**/*.ejs"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        primary: "var(--primary)",
        accent: "var(--accent)",
        secondary: "var(--secondary)",
        text: "var(--text)"
      }
    },
  },
  plugins: [],
}
