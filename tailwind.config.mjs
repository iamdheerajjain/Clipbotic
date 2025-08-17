/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}", // app directory
    "./components/**/*.{js,ts,jsx,tsx}", // components folder
    "./_components/**/*.{js,ts,jsx,tsx}", // optional underscore folder
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
