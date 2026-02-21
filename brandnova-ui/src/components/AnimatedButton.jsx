import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { playClick } from "../effects/sounds";

export default function AnimatedButton({
    children,
    onClick,
    className = "",
    variant = "primary",
    disabled = false,
    type = "button",
    magnetic = true
}) {
    const ref = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouse = (e) => {
        if (!magnetic || disabled || !ref.current) return;
        const { clientX, clientY } = e;
        const { height, width, left, top } = ref.current.getBoundingClientRect();
        const middleX = clientX - (left + width / 2);
        const middleY = clientY - (top + height / 2);
        setPosition({ x: middleX * 0.3, y: middleY * 0.3 });
    };

    const reset = () => {
        setPosition({ x: 0, y: 0 });
    };

    const handleClick = (e) => {
        if (!disabled) {
            playClick();
            if (onClick) onClick(e);
        }
    };

    const base =
        variant === "primary"
            ? "glow-btn text-white font-semibold shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] border border-white/10 bg-[var(--gradient)]"
            : variant === "outline" || variant === "ghost"
                ? "bg-[var(--surface)] border border-[var(--card-border)] text-[var(--text)] hover:bg-[var(--card-hover)] backdrop-blur-md"
                : "bg-transparent text-[var(--text)] hover:text-white";

    return (
        <motion.button
            ref={ref}
            type={type}
            disabled={disabled}
            onMouseMove={handleMouse}
            onMouseLeave={reset}
            animate={{ x: position.x, y: position.y }}
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className={`
        inline-flex items-center justify-center gap-2
        px-6 py-3 rounded-[24px] font-semibold text-sm
        transition-colors duration-300 relative overflow-hidden
        disabled:opacity-50 disabled:cursor-not-allowed
        ${base} ${className}
      `}
        >
            {/* Subtle inner hover glow */}
            <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity pointer-events-none rounded-[24px]" />
            <span className="relative z-10 flex items-center justify-center gap-2 px-1">{children}</span>
        </motion.button>
    );
}
