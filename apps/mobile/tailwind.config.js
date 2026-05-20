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
        primary: "#7C3AED",
        secondary: "#EC4899",
        accent: "#F0ABFC",
        surface: {
          light: "#F4F1FA",
          dark: "#1A1426",
        },
        bg: {
          light: "#FAFAFA",
          dark: "#0F0B1A",
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
