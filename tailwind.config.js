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
      },
      boxShadow: {
        'right': '2px 0px 10px black'
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}
