import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, X, Tag } from "lucide-react";
import AnimatedButton from "./AnimatedButton";
import { apiPost } from "../hooks/useApi";

export default function StripeModal({ open, onClose, onSuccess }) {
    const [couponCode, setCouponCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    const handleCoupon = async () => {
        if (!couponCode) return;
        setLoading(true);
        setMsg(null);
        try {
            const res = await apiPost('/api/apply-coupon', { coupon_code: couponCode });
            setMsg({ type: "success", text: res.message });
            if (onSuccess) onSuccess(res.plan);
            setTimeout(() => {
                onClose();
                setMsg(null);
                setCouponCode("");
            }, 2000);
        } catch (e) {
            setMsg({ type: "error", text: e.message });
        } finally {
            setLoading(false);
        }
    };

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
                            Upgrade to <span className="gradient-text">Pro</span> / Enterprise
                        </h2>
                        <p className="text-text-secondary text-sm mb-6">
                            Unlimited AI generations, HD logo exports, investor tools, and priority AI queue. Complete feature access.
                        </p>

                        {/* Coupon Section */}
                        <div className="mb-6 border-b border-[var(--card-border)] pb-6">
                            <label className="block text-sm font-bold text-left mb-2 text-text-secondary"><Tag size={14} className="inline mr-1" /> Apply Coupon</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter coupon code"
                                    className="flex-1 bg-[var(--surface)] text-sm px-3 py-2 rounded-lg border border-[var(--card-border)] focus:outline-none focus:border-[var(--primary)]"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                />
                                <AnimatedButton variant="ghost" className="!px-4 !py-2" onClick={handleCoupon} disabled={loading}>
                                    Apply
                                </AnimatedButton>
                            </div>
                            {msg && (
                                <p className={`mt-2 text-sm text-left ${msg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                    {msg.text}
                                </p>
                            )}
                        </div>

                        <div className="text-5xl font-black mb-1 gradient-text">$19</div>
                        <p className="text-text-muted text-sm mb-6">/month &bull; Cancel anytime</p>

                        <AnimatedButton onClick={onClose} className="w-full mb-3 py-3.5">
                            <Crown size={16} /> Go Pro via Stripe
                        </AnimatedButton>
                        <AnimatedButton onClick={onClose} variant="ghost" className="w-full text-amber-400">
                            Upgrade to Enterprise (Contact Us)
                        </AnimatedButton>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
