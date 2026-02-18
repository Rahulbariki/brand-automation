import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import AnimatedButton from "./AnimatedButton";

export default function Navbar() {
    const { pathname } = useLocation();
    const isAuth = pathname === "/login" || pathname === "/signup";

    return (
        <motion.nav
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="fixed top-0 w-full z-50 backdrop-blur-xl bg-[var(--bg)]/60 border-b border-[var(--card-border)]"
        >
            <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3.5">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 interactive">
                    <span className="w-9 h-9 flex items-center justify-center rounded-xl text-sm"
                        style={{ background: "var(--gradient)" }}>
                        ✦
                    </span>
                    <span className="text-lg font-extrabold gradient-text">BrandNova</span>
                </Link>

                {/* Center Links (Landing only) */}
                {!isAuth && (
                    <div className="hidden md:flex items-center gap-8">
                        {pathname === "/" ? (
                            <>
                                <a href="#features" className="text-text-secondary text-sm font-medium hover:text-[var(--text)] transition-colors interactive">Features</a>
                                <a href="#how" className="text-text-secondary text-sm font-medium hover:text-[var(--text)] transition-colors interactive">How It Works</a>
                                <a href="#pricing" className="text-text-secondary text-sm font-medium hover:text-[var(--text)] transition-colors interactive">Pricing</a>
                            </>
                        ) : null}
                    </div>
                )}

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    {pathname === "/" && (
                        <>
                            <Link to="/login">
                                <AnimatedButton variant="ghost" className="text-sm px-4 py-2">Login</AnimatedButton>
                            </Link>
                            <Link to="/signup">
                                <AnimatedButton className="text-sm px-4 py-2">Get Started</AnimatedButton>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </motion.nav>
    );
}
