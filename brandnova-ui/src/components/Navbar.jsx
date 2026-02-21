import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import AnimatedButton from "./AnimatedButton";

export default function Navbar() {
    const { pathname } = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const isAuth = pathname === "/login" || pathname === "/signup";

    const navLinks = [
        { name: "Features", href: "#features" },
        { name: "How It Works", href: "#how" },
        { name: "Pricing", href: "#pricing" },
    ];

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

                {/* Center Links (Landing only) - Desktop */}
                {!isAuth && (
                    <div className="hidden md:flex items-center gap-8">
                        {pathname === "/" ? (
                            navLinks.map((link) => (
                                <a key={link.name} href={link.href} className="text-text-secondary text-sm font-medium hover:text-[var(--text)] transition-colors interactive">{link.name}</a>
                            ))
                        ) : null}
                    </div>
                )}

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    <ThemeToggle />

                    {pathname === "/" && (
                        <div className="hidden md:flex items-center gap-3">
                            <Link to="/login">
                                <AnimatedButton variant="ghost" className="text-sm px-4 py-2">Login</AnimatedButton>
                            </Link>
                            <Link to="/signup">
                                <AnimatedButton className="text-sm px-4 py-2">Get Started</AnimatedButton>
                            </Link>
                        </div>
                    )}

                    {/* Mobile Toggle */}
                    {!isAuth && (
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 md:hidden text-text-secondary hover:text-[var(--text)]"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && !isAuth && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-t border-[var(--card-border)] bg-[var(--bg)]/95 backdrop-blur-2xl overflow-hidden"
                    >
                        <div className="flex flex-col p-6 gap-4">
                            {pathname === "/" && navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className="text-text-secondary font-bold text-lg py-2"
                                >
                                    {link.name}
                                </a>
                            ))}
                            <div className="pt-4 flex flex-col gap-3">
                                <Link to="/login" onClick={() => setIsOpen(false)}>
                                    <AnimatedButton variant="ghost" className="w-full justify-center py-4">Login</AnimatedButton>
                                </Link>
                                <Link to="/signup" onClick={() => setIsOpen(false)}>
                                    <AnimatedButton className="w-full justify-center py-4">Get Started</AnimatedButton>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
