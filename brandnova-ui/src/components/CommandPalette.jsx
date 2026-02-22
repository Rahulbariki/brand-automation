import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    Search, Command, Zap, Paintbrush, PenLine,
    Rocket, Heart, Palette, MessageCircle, X,
    Layout, Sun, Moon, Sparkles, Home
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const navigate = useNavigate();
    const { setTheme, themes } = useTheme();

    const items = [
        { id: 'dashboard', label: 'Go Home', icon: Home, category: 'Navigation', shortcut: 'H', action: () => navigate('/dashboard') },
        { id: 'workspaces', label: 'Brand Workspaces', icon: Layout, category: 'Navigation', shortcut: 'W', action: () => navigate('/workspaces') },

        { id: 'names', label: 'Brand Name Generator', icon: Zap, category: 'AI Tools', shortcut: 'N', action: () => navigate('/dashboard/names') },
        { id: 'logo', label: 'Logo Studio', icon: Paintbrush, category: 'AI Tools', shortcut: 'L', action: () => navigate('/dashboard/logo') },
        { id: 'marketing', label: 'Marketing Copy', icon: PenLine, category: 'AI Tools', shortcut: 'M', action: () => navigate('/dashboard/marketing') },
        { id: 'startup', label: 'Startup Tools', icon: Rocket, category: 'AI Tools', shortcut: 'S', action: () => navigate('/dashboard/startup') },
        { id: 'sentiment', label: 'Sentiment Analysis', icon: Heart, category: 'AI Tools', shortcut: 'V', action: () => navigate('/dashboard/sentiment') },
        { id: 'colors', label: 'Brand Colors', icon: Palette, category: 'AI Tools', shortcut: 'C', action: () => navigate('/dashboard/colors') },
        { id: 'chat', label: 'AI Branding Consultant', icon: MessageCircle, category: 'AI Tools', action: () => navigate('/dashboard/chat') },
    ];

    // Add themes to items
    const themeItems = themes.map(t => ({
        id: `theme-${t.id}`,
        label: `Switch to ${t.name} Theme`,
        icon: Sparkles,
        category: 'Personalization',
        action: () => setTheme(t.id)
    }));

    const allItems = [...items, ...themeItems];
    const filtered = query === "" ? allItems : allItems.filter(i =>
        i.label.toLowerCase().includes(query.toLowerCase()) ||
        i.category.toLowerCase().includes(query.toLowerCase())
    );

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            setIsOpen(prev => !prev);
        }
        if (e.key === 'Escape') setIsOpen(false);
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
                onClick={() => setIsOpen(false)}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--card-border)] rounded-3xl shadow-2xl overflow-hidden pointer-events-auto relative z-10"
            >
                <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--card-border)]">
                    <Search className="text-text-muted" size={20} />
                    <input
                        autoFocus
                        placeholder="Search for tools, workspaces, or themes..."
                        className="bg-transparent border-none outline-none text-lg flex-1 text-[var(--text)] placeholder:text-text-muted"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-active)] border border-[var(--card-border)] text-[10px] font-bold text-text-muted">
                        <Command size={10} /> K
                    </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto p-3 scrollbar-hide">
                    {filtered.length === 0 ? (
                        <div className="py-12 text-center text-text-muted">
                            <p>No results found for "{query}"</p>
                        </div>
                    ) : (
                        <div className="space-y-4 pb-2">
                            {['Navigation', 'AI Tools', 'Personalization'].map(cat => {
                                const catItems = filtered.filter(i => i.category === cat);
                                if (catItems.length === 0) return null;
                                return (
                                    <div key={cat} className="space-y-1">
                                        <p className="px-4 py-1 text-[10px] font-bold text-text-muted uppercase tracking-widest">{cat}</p>
                                        {catItems.map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => { item.action(); setIsOpen(false); }}
                                                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] group transition-all text-left"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <item.icon size={18} className="text-text-muted group-hover:text-[var(--primary)]" />
                                                    <span className="text-sm font-medium">{item.label}</span>
                                                </div>
                                                {item.shortcut && (
                                                    <span className="text-[10px] font-mono text-text-muted px-2 py-0.5 rounded border border-[var(--card-border)] group-hover:border-[var(--primary)]/30 group-hover:text-[var(--primary)]">
                                                        {item.shortcut}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="px-6 py-3 border-t border-[var(--card-border)] bg-[var(--surface-active)] flex items-center justify-between text-[10px] text-text-muted font-bold">
                    <div className="flex gap-4">
                        <span>↑↓ to navigate</span>
                        <span>↵ to select</span>
                        <span>esc to close</span>
                    </div>
                    <div className="text-[var(--primary)]">✦ BrandNova Global Search</div>
                </div>
            </motion.div>
        </div>
    );
}
