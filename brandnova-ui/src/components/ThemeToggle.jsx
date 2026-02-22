import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ direction = "down" }) {
    const { theme, setTheme, themes } = useTheme();
    const [open, setOpen] = useState(false);
    const ref = useRef();

    useEffect(() => {
        const close = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <motion.button
                whileHover={{ rotate: 30 }}
                onClick={() => setOpen(!open)}
                className="w-10 h-10 flex items-center justify-center rounded-full
                   bg-[var(--card)] border border-[var(--card-border)]
                   text-text-secondary hover:text-[var(--primary)] transition-colors interactive cursor-pointer"
                aria-label="Toggle Theme"
            >
                <Palette size={18} />
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: direction === "up" ? 10 : -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: direction === "up" ? 10 : -10, scale: 0.95 }}
                        className={`absolute ${direction === "up" ? "bottom-full mb-3 left-0" : "top-full mt-3 right-0"} glass p-2 min-w-[180px] z-50`}
                    >
                        {themes.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => { setTheme(t.id); setOpen(false); }}
                                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium cursor-pointer
                  transition-colors ${theme === t.id
                                        ? "text-[var(--primary)] bg-[var(--surface)]"
                                        : "text-text-secondary hover:text-[var(--text)] hover:bg-[var(--surface)]"
                                    }`}
                            >
                                <span
                                    className="w-5 h-5 rounded-full flex-shrink-0 border-2 border-[var(--card-border)]"
                                    style={{ background: t.swatch }}
                                />
                                {t.emoji} {t.name}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
