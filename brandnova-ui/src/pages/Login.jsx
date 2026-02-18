import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import Navbar from "../components/Navbar";
import AnimatedButton from "../components/AnimatedButton";
import ParticleBackground from "../effects/ParticleBackground";
import { login } from "../hooks/useApi";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const data = await login(email, password);
            localStorage.setItem("access_token", data.access_token);
            navigate("/dashboard");
        } catch (err) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen animated-bg text-[var(--text)] flex items-center justify-center">
            <ParticleBackground />
            <Navbar />

            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="glass w-full max-w-md p-10 relative z-10 mt-16"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold mb-2">
                        Welcome <span className="gradient-text">Back</span>
                    </h1>
                    <p className="text-text-secondary text-sm">Sign in to your creative universe</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 text-red-400 text-sm text-center"
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="relative">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-[var(--surface)] border border-[var(--card-border)] rounded-xl
                         pl-12 pr-4 py-3.5 text-sm text-[var(--text)] placeholder:text-text-muted
                         focus:outline-none focus:border-[var(--primary)] transition-colors"
                        />
                    </div>
                    <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-[var(--surface)] border border-[var(--card-border)] rounded-xl
                         pl-12 pr-4 py-3.5 text-sm text-[var(--text)] placeholder:text-text-muted
                         focus:outline-none focus:border-[var(--primary)] transition-colors"
                        />
                    </div>
                    <AnimatedButton type="submit" disabled={loading} className="w-full py-3.5 justify-center">
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <><ArrowRight size={16} /> Sign In</>}
                    </AnimatedButton>
                </form>

                <p className="text-center text-text-muted text-sm mt-6">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-[var(--primary)] hover:underline font-semibold">Create one</Link>
                </p>
            </motion.div>
        </div>
    );
}
