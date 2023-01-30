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
      },
      typography: {
        DEFAULT: {
          css: {
            color: 'var(--text)',
            a: { color: 'var(--text)' },
            strong: { color: 'var(--text)' },
            th: { color: 'var(--text)' },
            h1: { color: 'var(--text)' },
            h2: { color: 'var(--text)' },
            h3: { color: 'var(--text)' },
            h4: { color: 'var(--text)' },
            h5: { color: 'var(--text)' },
            h6: { color: 'var(--text)' },
          }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}
