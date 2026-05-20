/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#C8911A",
        secondary: "#D4A830",
        accent: "#E8C86A",
        surface: {
          light: "#221D12",
          dark: "#1A1610",
        },
        bg: {
          light: "#0D0B07",
          dark: "#0A0907",
        },
      },
      fontFamily: {
        heading: ["PlusJakartaSans_700Bold"],
        "heading-semi": ["PlusJakartaSans_600SemiBold"],
        body: ["Inter_400Regular"],
        "body-medium": ["Inter_500Medium"],
        "body-semi": ["Inter_600SemiBold"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
        "4xl": "24px",
      },
    },
  },
  plugins: [],
};
