import { motion } from "framer-motion";

export default function AnimatedButton({
    children,
    onClick,
    className = "",
    variant = "primary",
    disabled = false,
    type = "button",
}) {
    const base =
        variant === "primary"
            ? "glow-btn text-white font-semibold"
            : "bg-[var(--card)] border border-[var(--card-border)] text-[var(--text)] hover:bg-[var(--card-hover)]";

    return (
        <motion.button
            type={type}
            disabled={disabled}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            className={`
        inline-flex items-center justify-center gap-2
        px-6 py-3 rounded-full font-semibold text-sm
        transition-all duration-300 relative overflow-hidden
        disabled:opacity-50 disabled:cursor-not-allowed
        ${base} ${className}
      `}
        >
            {children}
        </motion.button>
    );
}
