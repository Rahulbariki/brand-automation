import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation, Link } from "react-router-dom";
import {
    Home, Lightbulb, Paintbrush, PenLine, Rocket,
    Heart, MessageCircle, Shield, LogOut, Palette, Folder, Sparkles
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
    { to: "/dashboard/colors", icon: Palette, label: "Brand Colors" },
    { to: "/dashboard/chat", icon: MessageCircle, label: "AI Consultant" },
];

export default function Sidebar({ onLogout, isAdmin = false }) {
    const { pathname } = useLocation();
    const [recentWS, setRecentWS] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (token) {
            import("../hooks/useApi").then(({ apiGet }) => {
                apiGet("/api/workspaces").then(data => setRecentWS(data.slice(0, 3))).catch(() => { });
            });
        }
    }, [pathname]);

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
            <nav className="flex flex-col gap-1 overflow-y-auto pr-1 scrollbar-hide">
                <div className="mb-2 px-3 text-[10px] uppercase font-bold text-text-muted tracking-widest">Main</div>
                {links.slice(0, 2).map(({ to, icon: Icon, label }) => {
                    const active = pathname === to;
                    return (
                        <Link
                            key={to}
                            to={to}
                            onClick={playClick}
                            onMouseEnter={playPop}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative interactive ${active ? "bg-[var(--surface)] text-[var(--text)] shadow-sm" : "text-text-secondary hover:text-[var(--text)] hover:bg-[var(--surface)]"}`}
                        >
                            {active && <motion.div layoutId="sidebar-active" className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full" style={{ background: "var(--gradient)" }} />}
                            <Icon size={18} />
                            {label}
                        </Link>
                    )
                })}

                <div className="mt-6 mb-2 px-3 text-[10px] uppercase font-bold text-text-muted tracking-widest flex justify-between items-center">
                    <span>AI Studio</span>
                    <Sparkles size={10} className="text-[var(--primary)]" />
                </div>
                {links.slice(2).map(({ to, icon: Icon, label }) => {
                    const active = pathname === to;
                    return (
                        <Link
                            key={to}
                            to={to}
                            onClick={playClick}
                            onMouseEnter={playPop}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative interactive ${active ? "bg-[var(--surface)] text-[var(--text)] shadow-sm" : "text-text-secondary hover:text-[var(--text)] hover:bg-[var(--surface)]"}`}
                        >
                            {active && <motion.div layoutId="sidebar-active" className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full" style={{ background: "var(--gradient)" }} />}
                            <Icon size={18} />
                            {label}
                        </Link>
                    );
                })}

                {/* Recent Workspaces */}
                {recentWS.length > 0 && (
                    <>
                        <div className="mt-8 mb-2 px-3 text-[10px] uppercase font-bold text-text-muted tracking-widest">Recent Brands</div>
                        {recentWS.map(ws => (
                            <Link
                                key={ws.id}
                                to={`/workspaces/${ws.id}`}
                                onClick={playClick}
                                onMouseEnter={playPop}
                                className={`flex items-center justify-between px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 hover:bg-[var(--surface)] text-text-secondary hover:text-[var(--text)] group`}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shrink-0" />
                                    <span className="truncate">{ws.project_name}</span>
                                </div>
                                <span className="text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity text-[var(--primary)]">{ws.health_score}%</span>
                            </Link>
                        ))}
                    </>
                )}

                {/* Admin Link — only visible to admins */}
                {isAdmin && (
                    <Link
                        to="/admin"
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative interactive mt-8 ${pathname === "/admin" ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"}`}
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
