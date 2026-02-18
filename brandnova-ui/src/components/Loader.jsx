import { motion } from "framer-motion";

export default function Loader({ text = "AI is thinking..." }) {
    return (
        <div className="flex flex-col items-center gap-6 py-12">
            {/* Dual Ring */}
            <div className="relative w-20 h-20">
                <motion.div
                    className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[var(--primary)] border-r-[var(--accent2)]"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                    className="absolute inset-[6px] rounded-full border-[3px] border-transparent border-b-[var(--primary)]"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
            </div>

            {/* Pulsing Dots */}
            <div className="flex gap-1.5">
                {[0, 0.2, 0.4].map((delay, i) => (
                    <motion.span
                        key={i}
                        className="w-2 h-2 rounded-full bg-[var(--primary)]"
                        animate={{ scale: [0.6, 1.2, 0.6], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.4, repeat: Infinity, delay }}
                    />
                ))}
            </div>

            {/* Text */}
            <motion.p
                className="text-text-secondary text-sm font-medium"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                {text}
            </motion.p>
        </div>
    );
}
