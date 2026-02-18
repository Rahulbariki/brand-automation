import { motion, AnimatePresence } from "framer-motion";
import { Crown, X } from "lucide-react";
import AnimatedButton from "./AnimatedButton";

export default function StripeModal({ open, onClose }) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[5000]"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.8, y: 30 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.8, y: 30 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="glass p-10 max-w-md w-[90%] text-center relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-text-muted hover:text-[var(--text)] transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl"
                            style={{ background: "var(--gradient)" }}>
                            <Crown size={28} className="text-white" />
                        </div>

                        <h2 className="text-2xl font-extrabold mb-2">
                            Upgrade to <span className="gradient-text">Pro</span>
                        </h2>
                        <p className="text-text-secondary text-sm mb-6">
                            Unlimited AI generations, HD logo exports, investor tools, and priority AI queue.
                        </p>

                        <div className="text-5xl font-black mb-1 gradient-text">$19</div>
                        <p className="text-text-muted text-sm mb-6">/month &bull; Cancel anytime</p>

                        <AnimatedButton onClick={onClose} className="w-full mb-3 py-3.5">
                            <Crown size={16} /> Go Pro Now
                        </AnimatedButton>
                        <AnimatedButton onClick={onClose} variant="ghost" className="w-full">
                            Maybe Later
                        </AnimatedButton>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
