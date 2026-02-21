import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import Navbar from "../components/Navbar";
import AnimatedButton from "../components/AnimatedButton";
import ParticleBackground from "../effects/ParticleBackground";
import { login, googleLogin } from "../hooks/useApi";
import { supabase } from "../utils/supabase";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                try {
                    setLoading(true);
                    const data = await googleLogin(session.access_token);
                    localStorage.setItem("access_token", data.access_token);
                    navigate("/dashboard");
                } catch (err) {
                    setError(err.message || "Google login failed");
                } finally {
                    setLoading(false);
                }
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                try {
                    setLoading(true);
                    const data = await googleLogin(session.access_token);
                    localStorage.setItem("access_token", data.access_token);
                    navigate("/dashboard");
                } catch (err) {
                    setError(err.message || "Google login failed");
                } finally {
                    setLoading(false);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + "/login"
            }
        });
        if (error) setError(error.message);
    };

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

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[var(--card-border)]"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[var(--bg)] px-4 text-text-muted">Or continue with</span>
                    </div>
                </div>

                <AnimatedButton
                    variant="outline"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full py-3.5 justify-center gap-3"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.14-4.53z"
                        />
                    </svg>
                    Google
                </AnimatedButton>

                <p className="text-center text-text-muted text-sm mt-6">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-[var(--primary)] hover:underline font-semibold">Create one</Link>
                </p>
            </motion.div>
        </div>
    );
}
