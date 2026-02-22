import { motion } from "framer-motion";
import { useLocation, Link } from "react-router-dom";
import {
    Home, Lightbulb, Paintbrush, PenLine, Rocket,
    Heart, MessageCircle, Shield, LogOut, Palette, Folder
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { playClick, playPop } from "../effects/sounds";

const links = [
    { to: "/workspaces", icon: Folder, label: "Brand Workspaces" },
    { to: "/dashboard", icon: Home, label: "Creative World" },
    { to: "/dashboard/names", icon: Lightbulb, label: "Brand Names" },
    { to: "/dashboard/logo", icon: Paintbrush, label: "Logo Studio" },
    { to: "/dashboard/marketing", icon: PenLine, label: "Marketing" },
    { to: "/dashboard/startup", icon: Rocket, label: "Startup Tools" },
    { to: "/dashboard/sentiment", icon: Heart, label: "Sentiment" },
    { to: "/dashboard/chat", icon: MessageCircle, label: "AI Consultant" },
];

export default function Sidebar({ onLogout, isAdmin = false }) {
    const { pathname } = useLocation();

    return (
        <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed left-0 top-0 bottom-0 w-[260px] z-40
                 glass !rounded-none border-r border-[var(--card-border)]
                 flex flex-col py-5 px-3"
        >
            {/* Logo */}
            <Link to="/" onClick={playClick} onMouseEnter={playPop} className="flex items-center gap-2.5 px-3 pb-5 mb-3 border-b border-[var(--card-border)] interactive">
                <span className="w-9 h-9 flex items-center justify-center rounded-xl text-sm"
                    style={{ background: "var(--gradient)" }}>✦</span>
                <span className="text-lg font-extrabold gradient-text">BrandNova</span>
            </Link>

            {/* Nav Links */}
            <nav className="flex flex-col gap-1 flex-1">
                {links.map(({ to, icon: Icon, label }) => {
                    const active = pathname === to;
                    return (
                        <Link
                            key={to}
                            to={to}
                            onClick={playClick}
                            onMouseEnter={playPop}
                            className={`
                flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200 relative interactive
                ${active
                                    ? "bg-[var(--surface)] text-[var(--text)]"
                                    : "text-text-secondary hover:text-[var(--text)] hover:bg-[var(--surface)]"
                                }
              `}
                        >
                            {active && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full"
                                    style={{ background: "var(--gradient)" }}
                                />
                            )}
                            <Icon size={18} />
                            {label}
                        </Link>
                    );
                })}

                {/* Admin Link — only visible to admins */}
                {isAdmin && (
                    <Link
                        to="/admin"
                        className={`
                            flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium
                            transition-all duration-200 relative interactive mt-2
                            ${pathname === "/admin"
                                ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                                : "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                            }
                        `}
                    >
                        <Shield size={18} />
                        Admin Panel
                    </Link>
                )}
            </nav>

            {/* Bottom */}
            <div className="pt-3 mt-3 border-t border-[var(--card-border)] space-y-2">
                <div className="px-3 relative">
                    <ThemeToggle direction="up" />
                </div>
                <button
                    onClick={onLogout}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium
                     text-red-400 hover:bg-red-500/10 transition-colors w-full interactive cursor-pointer"
                >
                    <LogOut size={18} /> Logout
                </button>
            </div>
        </motion.aside>
    );
}
