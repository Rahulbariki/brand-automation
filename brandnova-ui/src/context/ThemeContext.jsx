import { createContext, useState, useEffect, useContext } from "react";
import cosmic from "../themes/cosmic";
import aurora from "../themes/aurora";
import sunset from "../themes/sunset";
import minimal from "../themes/minimal";
import light from "../themes/light";

export const ThemeContext = createContext();

const themes = { cosmic, aurora, sunset, minimal, light };

const themeList = [
    { id: "cosmic", name: "Cyberpunk", emoji: "🌌", swatch: "linear-gradient(135deg,#7c3aed,#ec4899)" },
    { id: "aurora", name: "Gradient Neon", emoji: "⚡", swatch: "linear-gradient(135deg,#10b981,#06b6d4)" },
    { id: "sunset", name: "Glass", emoji: "🪟", swatch: "linear-gradient(135deg,#f43f5e,#f59e0b)" },
    { id: "minimal", name: "Dark / Light", emoji: "⬛", swatch: "linear-gradient(135deg,#ffffff,#888888)" },
    { id: "light", name: "Clean Light", emoji: "☀️", swatch: "linear-gradient(135deg,#6366f1,#8b5cf6)" },
];

export default function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => localStorage.getItem("bn-theme") || "aurora");

    useEffect(() => {
        const selected = themes[theme];
        if (!selected) return;
        Object.keys(selected).forEach((key) => {
            document.documentElement.style.setProperty(`--${key}`, selected[key]);
        });
        localStorage.setItem("bn-theme", theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, themes: themeList }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
