import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Sparkles, Zap, Paintbrush, PenLine, Rocket, Heart,
    MessageCircle, ArrowLeft, Send, Loader2, Crown, Copy,
    Check, BarChart3, Download, Palette, Mic, MicOff,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import GlassCard from "../components/GlassCard";
import AnimatedButton from "../components/AnimatedButton";
import AnimatedText from "../components/AnimatedText";
import Loader from "../components/Loader";
import StripeModal from "../components/StripeModal";
import ParticleBackground from "../effects/ParticleBackground";
import { apiPost, apiGet, apiDelete } from "../hooks/useApi";
import Tilt from "react-parallax-tilt";
import { Toaster, toast } from "react-hot-toast";

const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-[var(--card-border)] rounded-xl ${className}`}></div>
);

function AILoader({ stage = "names" }) {
    const textSequence = {
        "names": ["Thinking...", "Analyzing industry trends...", "Generating Names..."],
        "logo": ["Thinking...", "Designing Visual Style...", "Generating 5 design concepts simultaneously...", "Crafting Identities...", "Rendering Master Assets..."],
        "marketing": ["Thinking...", "Analyzing target audience...", "Writing Marketing Copy..."],
        "startup": ["Thinking...", "Structuring pitch...", "Generating Startup Tools..."],
        "sentiment": ["Thinking...", "Processing language...", "Analyzing Sentiment..."]
    };

    const seq = textSequence[stage] || ["Thinking...", "Generating..."];
    const [step, setStep] = useState(0);

    useEffect(() => {
        const i = setInterval(() => setStep(s => (s + 1) % seq.length), 2000);
        return () => clearInterval(i);
    }, [seq.length]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-10">
            <Loader2 size={32} className="animate-spin text-[var(--primary)] mb-4" />
            <motion.p
                key={step}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-text-secondary font-bold text-sm"
            >
                {seq[step]}
            </motion.p>
        </motion.div>
    );
}

import { playSuccess, playClick, playPop } from "../effects/sounds";

const modules = [
    { id: "names", icon: "🧠", title: "Brand Name Generator", desc: "LLaMA 70B powered naming engine.", tag: "AI Powered", tagIcon: <Zap size={12} />, planRequired: "free" },
    { id: "logo", icon: "🎨", title: "Logo Studio", desc: "Stable Diffusion XL creates stunning logos.", tag: "Pro Feature", tagIcon: <Crown size={12} />, planRequired: "pro", pro: true },
    { id: "marketing", icon: "✍️", title: "Marketing Copy", desc: "Ad copy, social captions, product descriptions.", tag: "Pro Feature", tagIcon: <Crown size={12} />, planRequired: "pro", pro: true },
    { id: "startup", icon: "🚀", title: "Startup Tools", desc: "Elevator pitches, investor emails.", tag: "Enterprise", tagIcon: <Crown size={12} />, planRequired: "enterprise", enterprise: true },
    { id: "sentiment", icon: "📊", title: "Sentiment Analysis", desc: "Analyze customer reviews.", tag: "AI Powered", tagIcon: <Zap size={12} />, planRequired: "free" },
    { id: "colors", icon: "🎨", title: "Brand Colors", desc: "AI-curated color palettes.", tag: "AI Powered", tagIcon: <Zap size={12} />, planRequired: "free" },
    { id: "chat", icon: "💬", title: "AI Brand Consultant", desc: "Chat with IBM Granite.", tag: "Enterprise", tagIcon: <BarChart3 size={12} />, planRequired: "enterprise", enterprise: true },
];

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

// --- Suggestions Data ---
const SUGGESTIONS = {
    industry: [
        "SaaS", "E-commerce", "FinTech", "HealthCare", "EdTech",
        "Real Estate", "Fashion & Apparel", "Travel & Tourism",
        "Food & Beverage", "Gaming", "AI & Robotics", "Sustainability"
    ],
    tone: [
        "Modern", "Playful", "Luxurious", "Minimalist",
        "Trustworthy", "Bold", "Professional", "Friendly",
        "Innovative", "Elegant", "Energetic"
    ],
    logoStyle: [
        "Minimalist", "Modern Vector", "Tech / Geometric",
        "Luxury / Elegant", "Vintage / Retro", "Playful Mascot",
        "Abstract", "3D Render", "Typography Only"
    ]
};

export default function Dashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const path = location.pathname.split("/").pop();
    const view = path === "dashboard" ? "home" : path;

    const [showUpgrade, setShowUpgrade] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [copied, setCopied] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        { role: "ai", text: "👋 I'm your AI brand consultant. Ask me anything about branding, positioning, or growth strategy." },
    ]);
    const [userPlan, setUserPlan] = useState("free");
    const [effectivePlan, setEffectivePlan] = useState("free");
    const [usage, setUsage] = useState({ used: 0, limit: 10 });
    const [isImpersonated, setIsImpersonated] = useState(false);
    const [userEmail, setUserEmail] = useState("");

    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        // Check if token exists before anything
        const token = localStorage.getItem("access_token");
        if (!token) {
            navigate("/login");
            return;
        }

        const fetchPlan = async () => {
            try {
                const res = await apiGet("/api/me");
                setUserPlan(res.subscription_plan);
                setEffectivePlan(res.effective_plan || res.subscription_plan);
                setIsAdmin(res.is_admin);
                setUserEmail(res.email);
                if (res.usage) setUsage(res.usage);
            } catch (err) {
                console.error("Failed to fetch user data:", err);
                if (err.message?.includes("401") || err.message?.includes("credentials")) {
                    localStorage.removeItem("access_token");
                    navigate("/login");
                    return;
                }
            } finally {
                setInitialLoading(false);
            }
        };

        // Initial check from token (fast, but could be outdated)
        try {
            if (token && initialLoading) {
                const payload = JSON.parse(atob(token.split(".")[1]));
                if (payload.admin) setIsAdmin(true);
                setIsImpersonated(!!payload.is_impersonated);
            }
        } catch { }

        fetchPlan();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        navigate("/login");
    };

    const isUsageExceeded = usage.limit !== "Unlimited" && usage.used >= usage.limit;
    const blockGeneration = !isAdmin && effectivePlan !== "enterprise" && isUsageExceeded;

    const goTo = (m) => {
        playClick();
        if (!isAdmin) {
            if (m.planRequired === "enterprise" && effectivePlan !== "enterprise") {
                setShowUpgrade(true);
                return;
            }
            if (m.planRequired === "pro" && !["pro", "enterprise"].includes(effectivePlan)) {
                setShowUpgrade(true);
                return;
            }
        }
        navigate(`/dashboard/${m.id}`);
    };
    const goHome = () => {
        playClick();
        navigate("/dashboard");
    };

    async function callApi(endpoint, body, key) {
        setLoading(true);
        setResult(null);
        try {
            const data = await apiPost(endpoint, body);
            playSuccess();
            setResult({ key, data });
        } catch (err) {
            if (err.upgrade) { setShowUpgrade(true); }
            else { setResult({ key, error: err.message }); }
        } finally {
            setLoading(false);
        }
    }

    // ─── HOME VIEW ───
    function HomeView() {
        return (
            <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
                <motion.div variants={fadeUp} className="mb-10">
                    <h1 className="text-4xl font-black">
                        Welcome to the <span className="gradient-text">Universe</span>
                    </h1>
                    <p className="text-text-secondary mt-2">Choose a module to begin creating.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {modules.map((m, i) => (
                        <motion.div key={m.id} variants={fadeUp}>
                            <GlassCard onMouseEnter={() => playPop()} onClick={() => goTo(m)} className="group cursor-pointer h-full relative overflow-hidden">
                                {m.enterprise && effectivePlan !== "enterprise" && !isAdmin && (
                                    <div className="absolute inset-0 bg-[var(--bg)]/70 backdrop-blur-[3px] z-10 flex flex-col items-center justify-center">
                                        <Crown className="text-amber-400 mb-2" size={24} />
                                        <span className="text-[var(--text)] text-sm font-bold">Requires Enterprise</span>
                                    </div>
                                )}
                                {m.pro && !["pro", "enterprise"].includes(effectivePlan) && !isAdmin && (
                                    <div className="absolute inset-0 bg-[var(--bg)]/70 backdrop-blur-[3px] z-10 flex flex-col items-center justify-center">
                                        <Crown className="text-[var(--primary)] mb-2" size={24} />
                                        <span className="text-[var(--text)] text-sm font-bold">Requires Pro</span>
                                    </div>
                                )}
                                <div className="text-4xl mb-4">{m.icon}</div>
                                <h3 className="text-lg font-bold mb-2 group-hover:text-[var(--primary)] transition-colors">{m.title}</h3>
                                <p className="text-text-secondary text-sm mb-4 leading-relaxed">{m.desc}</p>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${m.enterprise ? "bg-amber-500/10 text-amber-400" : m.pro ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "bg-green-500/10 text-green-400"}`}>
                                    {m.tagIcon} {m.tag}
                                </span>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>

                <TeamManagement />
            </motion.div>
        );
    }

    function UsagePanel() {
        if (isAdmin || effectivePlan === "enterprise") return (
            <div className="mb-6">
                <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.01} transitionSpeed={2500}>
                    <GlassCard className="!p-4 flex items-center gap-4 border border-[var(--primary)]/20 shadow-[0_0_15px_rgba(124,58,237,0.1)]">
                        <div className="text-amber-400 bg-amber-400/10 p-2 rounded-xl"><Crown size={20} /></div>
                        <div>
                            <p className="text-xs text-text-muted uppercase tracking-wider font-bold">Usage Limits</p>
                            <p className="text-sm font-black gradient-text">Unlimited Access (Enterprise)</p>
                        </div>
                    </GlassCard>
                </Tilt>
            </div>
        );
        const limitStr = usage.limit || 10;
        const usedStr = usage.used || 0;
        const percent = Math.min(100, Math.round((usedStr / limitStr) * 100)) || 0;
        return (
            <div className="mb-6 flex gap-4">
                <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.01} transitionSpeed={2500} className="w-full">
                    <GlassCard className={`!p-5 flex-1 ${isUsageExceeded ? 'border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : ''}`}>
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider"><BarChart3 size={14} className="inline mr-1 mb-0.5 text-[var(--primary)]" /> Monthly Usage</p>
                            <p className={`text-sm font-black ${isUsageExceeded ? 'text-red-400' : 'text-[var(--text)]'}`}>{usedStr} / {limitStr}</p>
                        </div>
                        <div className="w-full bg-[var(--surface)] h-2.5 rounded-full overflow-hidden mb-2">
                            <div className={`h-full transition-all duration-1000 ${isUsageExceeded ? "bg-red-500" : "bg-[var(--primary)]"}`} style={{ width: `${percent}%` }}></div>
                        </div>
                        {isUsageExceeded ?
                            <div className="flex items-center justify-between text-xs mt-3"><span className="text-red-400 font-bold">Usage limit exceeded.</span> <button onClick={() => setShowUpgrade(true)} className="text-[var(--primary)] font-bold hover:underline">Upgrade Plan</button></div> :
                            <p className="text-xs text-text-muted mt-2">Resets next month.</p>
                        }
                    </GlassCard>
                </Tilt>
            </div>
        )
    }

    function TeamManagement() {
        const [team, setTeam] = useState(null);
        const [inviteEmail, setInviteEmail] = useState("");
        const [loadingTeam, setLoadingTeam] = useState(false);

        useEffect(() => {
            if (effectivePlan === "enterprise" || isAdmin) {
                apiGet('/api/team/').then(res => setTeam(res)).catch(() => setTeam(null));
            }
        }, [effectivePlan, isAdmin]);

        if (effectivePlan !== "enterprise" && !isAdmin) return null;

        const handleCreate = async () => {
            setLoadingTeam(true);
            try {
                await apiPost('/api/team/create', { team_name: "My Enterprise Team" });
                const res = await apiGet('/api/team/');
                setTeam(res);
            } catch (e) { alert(e.message); }
            setLoadingTeam(false);
        };

        const handleInvite = async (e) => {
            e.preventDefault();
            if (!inviteEmail) return;
            setLoadingTeam(true);
            try {
                await apiPost('/api/team/invite', { email: inviteEmail });
                const res = await apiGet('/api/team/');
                setTeam(res);
                setInviteEmail("");
            } catch (e) { alert(e.message); }
            setLoadingTeam(false);
        };

        const handleRemove = async (id) => {
            setLoadingTeam(true);
            try {
                await apiDelete(`/api/team/member/${id}`);
                const res = await apiGet('/api/team/');
                setTeam(res);
            } catch (e) { alert(e.message); }
            setLoadingTeam(false);
        };

        if (team === null) {
            return (
                <div className="mt-8">
                    <h2 className="text-xl font-bold mb-4">Team Management</h2>
                    <Tilt tiltMaxAngleX={2} tiltMaxAngleY={2} scale={1.01} transitionSpeed={2500}>
                        <GlassCard className="!p-6 flex items-center justify-between">
                            <div>
                                <p className="font-bold">Setup your Enterprise Team</p>
                                <p className="text-sm text-text-secondary">Invite members to collaborate under your plan.</p>
                            </div>
                            <AnimatedButton onClick={handleCreate} disabled={loadingTeam} className="!px-4 !py-2">
                                Create Team
                            </AnimatedButton>
                        </GlassCard>
                    </Tilt>
                </div>
            )
        }

        return (
            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Enterprise Team</h2>
                <Tilt tiltMaxAngleX={2} tiltMaxAngleY={2} scale={1.01} transitionSpeed={2500}>
                    <GlassCard className="!p-6">
                        <div className="flex justify-between items-center mb-6 border-b border-[var(--card-border)] pb-4">
                            <div>
                                <p className="font-bold text-lg">{team.team_name}</p>
                                <p className="text-sm text-text-secondary">{team.is_owner ? "You are the owner" : `Owned by ${team.owner_email}`}</p>
                            </div>
                        </div>

                        {team.is_owner && (
                            <form onSubmit={handleInvite} className="flex gap-2 mb-6">
                                <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} type="email" placeholder="user@example.com" required className="flex-1 bg-[var(--surface)] border border-[var(--card-border)] rounded-xl px-3 text-sm focus:border-[var(--primary)] outline-none" />
                                <AnimatedButton type="submit" disabled={loadingTeam} className="!px-4 !py-2 text-sm">Invite Member</AnimatedButton>
                            </form>
                        )}

                        {team.members && (
                            <div className="space-y-2">
                                {team.members.map(m => (
                                    <div key={m.user_id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface)] text-sm">
                                        <div>
                                            <p className="font-bold">{m.fullname || "User"}</p>
                                            <p className="text-xs text-text-muted">{m.email}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs uppercase font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-1 rounded">{m.role}</span>
                                            <button onClick={() => handleRemove(m.user_id)} disabled={loadingTeam} className="text-red-400 hover:text-red-300 transition-colors bg-red-400/10 p-1.5 rounded-lg"><Copy size={14} className="hidden" /> Remove</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </Tilt>
            </div>
        )
    }

    // ─── BACK HEADER ───
    function BackHeader({ title, subtitle }) {
        return (
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black"><span className="gradient-text">{title}</span></h1>
                    <p className="text-text-secondary text-sm mt-1">{subtitle}</p>
                </div>
                <AnimatedButton variant="ghost" onClick={goHome} className="!px-4 !py-2 text-sm">
                    <ArrowLeft size={16} /> Back
                </AnimatedButton>
            </div>
        );
    }

    // ─── BRAND NAMES ───
    function NamesView() {
        const [industry, setIndustry] = useState("");
        const [keywords, setKeywords] = useState("");
        const [tone, setTone] = useState("modern");

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <BackHeader title="Brand Name Generator" subtitle="AI-powered naming with LLaMA 70B" />
                <GlassCard tilt={false} className="max-w-2xl !p-8">
                    <form onSubmit={(e) => { e.preventDefault(); callApi("/api/generate-brand", { industry, keywords: keywords.split(",").map(k => k.trim()), tone }, "names"); }} className="space-y-4">
                        <Input placeholder="Industry (e.g. FinTech, HealthCare)" value={industry} onChange={setIndustry} suggestions={SUGGESTIONS.industry} />
                        <Input placeholder="Keywords (comma-separated)" value={keywords} onChange={setKeywords} />
                        <Input placeholder="Tone (modern, playful, luxurious...)" value={tone} onChange={setTone} suggestions={SUGGESTIONS.tone} />
                        <AnimatedButton type="submit" disabled={blockGeneration || loading} className={`w-full py-3.5 justify-center ${blockGeneration ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <><Sparkles size={16} /> Generate Names</>}
                        </AnimatedButton>
                        {blockGeneration && <p className="text-xs text-red-400 text-center font-bold">Generation disabled (usage limit reached)</p>}
                    </form>
                </GlassCard>
                {loading && <AILoader stage="names" />}
                {result?.key === "names" && !result.error && (
                    <div className="grid gap-3 max-w-2xl mt-6">
                        {result.data.names?.map((name, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                                <GlassCard tilt={false} className="flex items-center justify-between !p-4 cursor-pointer" onClick={() => { navigator.clipboard.writeText(name); setCopied(i); setTimeout(() => setCopied(null), 2000); }}>
                                    <span className="font-bold text-lg">{name}</span>
                                    {copied === i ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-text-muted" />}
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>
                )}
                <ErrorDisplay result={result} keyName="names" />
            </motion.div>
        );
    }

    // ─── LOGO ───
    function LogoView() {
        const [brand, setBrand] = useState("");
        const [industry, setIndustry] = useState("");
        const [keywords, setKeywords] = useState("");
        const [style, setStyle] = useState("minimalist");

        const styles = [
            { id: "corporate physical", label: "Real World Corporate", icon: "🏢" },
            { id: "glassmorphism", label: "3D Glassmorphism", icon: "💎" },
            { id: "minimalist iconic", label: "Minimalist Iconic", icon: "✨" },
            { id: "tech geometric", label: "Architecture / Tech", icon: "⬡" },
            { id: "premium luxury", label: "Luxury / Elegant", icon: "👑" },
            { id: "modern vector", label: "Modern Vector", icon: "📐" },
        ];

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <BackHeader title="Logo Studio" subtitle="Professional AI branding powered by Stable Diffusion XL" />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <GlassCard tilt={false} className="!p-8">
                            <form onSubmit={(e) => { e.preventDefault(); callApi("/api/generate-logo", { brand_name: brand, industry, keywords: keywords.split(",").map(k => k.trim()), style }, "logo"); }} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-text-muted mb-2 block uppercase tracking-wider">Brand Name</label>
                                        <Input placeholder="e.g. BrandNova" value={brand} onChange={setBrand} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-text-muted mb-2 block uppercase tracking-wider">Industry</label>
                                        <Input placeholder="e.g. SaaS, Finance, Cafe" value={industry} onChange={setIndustry} suggestions={SUGGESTIONS.industry} />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-text-muted mb-2 block uppercase tracking-wider">Core Keywords</label>
                                    <Input placeholder="e.g. speed, trust, organic, digital (comma separated)" value={keywords} onChange={setKeywords} />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-text-muted mb-3 block uppercase tracking-wider">Visual Style</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {styles.map(s => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => setStyle(s.id)}
                                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${style === s.id
                                                    ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]"
                                                    : "bg-[var(--surface)] border-[var(--card-border)] text-text-secondary hover:border-text-muted"
                                                    }`}
                                            >
                                                <span className="text-xl mb-1">{s.icon}</span>
                                                <span className="text-[10px] font-bold uppercase">{s.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <AnimatedButton type="submit" disabled={blockGeneration || loading} className={`w-full py-4 justify-center text-lg ${blockGeneration ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}>
                                    {loading ? <Loader2 size={24} className="animate-spin" /> : <><Paintbrush size={20} /> Design Your Logo</>}
                                </AnimatedButton>
                                {blockGeneration && <p className="text-xs text-red-400 text-center font-bold">Generation disabled (usage limit reached)</p>}
                            </form>
                        </GlassCard>
                    </div>

                    <div className="space-y-6">
                        <GlassCard tilt={false} className="!p-6 !bg-[var(--primary)]/5 !border-[var(--primary)]/20">
                            <h4 className="flex items-center gap-2 text-sm font-bold mb-4">
                                <Sparkles size={16} className="text-[var(--primary)]" /> Pro Design Tips
                            </h4>
                            <ul className="space-y-3 text-xs text-text-secondary">
                                <li className="flex gap-2 leading-relaxed"><span>•</span> We now generate <b>5 unique concepts</b> simultaneously for your brand.</li>
                                <li className="flex gap-2 leading-relaxed"><span>•</span> Use specific keywords like "gold", "matte black", or "geometric" for better control.</li>
                                <li className="flex gap-2 leading-relaxed"><span>•</span> <b>SDXL 1.0</b> engine is used to ensure sharp, vector-like precision.</li>
                            </ul>
                        </GlassCard>

                        {result?.key === "logo" && !result.error && result.data.logos && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    {result.data.logos.map((logo, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="group relative"
                                        >
                                            <GlassCard tilt={false} className="!p-2 hover:border-[var(--primary)] transition-all cursor-pointer overflow-hidden">
                                                <div className="aspect-square bg-white rounded-lg overflow-hidden flex items-center justify-center relative">
                                                    <img src={logo.image_url} alt={`Logo ${i + 1}`} className="w-full h-full object-contain p-2" />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 p-4">
                                                        <a href={logo.image_url} download={`${brand || 'logo'}_v${i + 1}.png`} onClick={(e) => e.stopPropagation()} className="w-full">
                                                            <button className="w-full py-2 px-4 bg-[var(--primary)] text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-lg">
                                                                <Download size={14} /> Download HD
                                                            </button>
                                                        </a>
                                                        <button
                                                            onClick={() => window.open(logo.image_url, '_blank')}
                                                            className="w-full py-2 px-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
                                                        >
                                                            <Sparkles size={14} /> Full Preview
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-[9px] mt-1.5 font-bold uppercase text-text-muted text-center">Concept {i + 1}</p>
                                            </GlassCard>
                                        </motion.div>
                                    ))}
                                </div>
                                <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--card-border)] text-center">
                                    <p className="text-[10px] text-text-muted italic leading-relaxed font-medium">Click any concept to download high-resolution PNG.</p>
                                </div>
                            </div>
                        )}
                        <ErrorDisplay result={result} keyName="logo" />
                    </div>
                </div>
            </motion.div>
        );
    }

    // ─── MARKETING ───
    function MarketingView() {
        const [brand, setBrand] = useState("");
        const [desc, setDesc] = useState("");
        const [type, setType] = useState("ad_copy");
        const [tone, setTone] = useState("bold");

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <BackHeader title="Marketing Copy Engine" subtitle="Generate ads, captions, product copy instantly" />
                <GlassCard tilt={false} className="max-w-2xl !p-8">
                    <form onSubmit={(e) => { e.preventDefault(); callApi("/api/generate-content", { brand_name: brand, description: desc, content_type: type, tone }, "marketing"); }} className="space-y-4">
                        <Input placeholder="Brand Name" value={brand} onChange={setBrand} />
                        <Textarea placeholder="Brand Description" value={desc} onChange={setDesc} />
                        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-[var(--surface)] border border-[var(--card-border)] rounded-xl px-4 py-3.5 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)] transition-colors">
                            <option value="ad_copy">Ad Copy</option>
                            <option value="product_desc">Product Description</option>
                            <option value="caption">Social Caption</option>
                            <option value="email">Email Campaign</option>
                        </select>
                        <Input placeholder="Tone (bold, witty, premium...)" value={tone} onChange={setTone} suggestions={SUGGESTIONS.tone} />
                        <AnimatedButton type="submit" disabled={blockGeneration || loading} className={`w-full py-3.5 justify-center ${blockGeneration ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <><PenLine size={16} /> Generate Copy</>}
                        </AnimatedButton>
                        {blockGeneration && <p className="text-xs text-red-400 text-center font-bold">Generation disabled (usage limit reached)</p>}
                    </form>
                </GlassCard>
                {loading && <AILoader stage="marketing" />}
                {result?.key === "marketing" && !result.error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 max-w-2xl">
                        <GlassCard tilt={false} className="!p-8">
                            <AnimatedText text={result.data.content} speed={0.012} className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap" />
                        </GlassCard>
                    </motion.div>
                )}
                <ErrorDisplay result={result} keyName="marketing" />
            </motion.div>
        );
    }

    // ─── STARTUP TOOLS ───
    function StartupView() {
        const [pName, setPName] = useState(""); const [problem, setProblem] = useState("");
        const [solution, setSolution] = useState(""); const [audience, setAudience] = useState("");
        const [startup, setStartup] = useState(""); const [investor, setInvestor] = useState("");
        const [metrics, setMetrics] = useState(""); const [ask, setAsk] = useState("");
        const [activeTool, setActiveTool] = useState("pitch");

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <BackHeader title="Startup Tools" subtitle="Pitch decks, investor outreach, growth strategy" />
                <div className="flex gap-3 mb-6">
                    {["pitch", "email"].map((t) => (
                        <button key={t} onClick={() => { setActiveTool(t); setResult(null); }}
                            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${activeTool === t ? "bg-[var(--primary)] text-white" : "bg-[var(--surface)] text-text-secondary hover:text-[var(--text)]"}`}>
                            {t === "pitch" ? "🚀 Pitch Generator" : "✉️ Investor Email"}
                        </button>
                    ))}
                </div>

                {activeTool === "pitch" ? (
                    <GlassCard tilt={false} className="max-w-2xl !p-8">
                        <form onSubmit={(e) => { e.preventDefault(); callApi("/api/generate-pitch", { product_name: pName, problem, solution, audience }, "pitch"); }} className="space-y-4">
                            <Input placeholder="Product Name" value={pName} onChange={setPName} />
                            <Textarea placeholder="The Problem" value={problem} onChange={setProblem} />
                            <Textarea placeholder="The Solution" value={solution} onChange={setSolution} />
                            <Input placeholder="Target Audience" value={audience} onChange={setAudience} suggestions={["Venture Capitalists", "Young Professionals", "Small Business Owners", "Stay-at-home Parents", "Tech Enthusiasts"]} />
                            <AnimatedButton type="submit" disabled={blockGeneration || loading} className={`w-full py-3.5 justify-center ${blockGeneration ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}>
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Rocket size={16} /> Generate Pitch</>}
                            </AnimatedButton>
                            {blockGeneration && <p className="text-xs text-red-400 text-center font-bold">Generation disabled (usage limit reached)</p>}
                        </form>
                    </GlassCard>
                ) : (
                    <GlassCard tilt={false} className="max-w-2xl !p-8">
                        <form onSubmit={(e) => { e.preventDefault(); callApi("/api/generate-investor-email", { startup_name: startup, investor_name: investor, key_metrics: metrics, ask }, "email"); }} className="space-y-4">
                            <Input placeholder="Startup Name" value={startup} onChange={setStartup} />
                            <Input placeholder="Investor Name" value={investor} onChange={setInvestor} />
                            <Input placeholder="Key Metrics (e.g. $10k MRR, 500 users)" value={metrics} onChange={setMetrics} />
                            <Input placeholder="Your Ask (e.g. 15 min call, $500k seed)" value={ask} onChange={setAsk} />
                            <AnimatedButton type="submit" disabled={blockGeneration || loading} className={`w-full py-3.5 justify-center ${blockGeneration ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}>
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} /> Draft Email</>}
                            </AnimatedButton>
                            {blockGeneration && <p className="text-xs text-red-400 text-center font-bold">Generation disabled (usage limit reached)</p>}
                        </form>
                    </GlassCard>
                )}
                {loading && <AILoader stage="startup" />}
                {result?.key === "pitch" && !result.error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 max-w-2xl">
                        <GlassCard tilt={false} className="!p-8"><AnimatedText text={result.data.pitch} speed={0.012} className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap" /></GlassCard>
                    </motion.div>
                )}
                {result?.key === "email" && !result.error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 max-w-2xl">
                        <GlassCard tilt={false} className="!p-8"><AnimatedText text={result.data.email} speed={0.012} className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap" /></GlassCard>
                    </motion.div>
                )}
                <ErrorDisplay result={result} keyName={activeTool} />
            </motion.div>
        );
    }

    // ─── SENTIMENT ───
    function SentimentView() {
        const [text, setText] = useState("");
        const [tone, setTone] = useState("professional");

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <BackHeader title="Sentiment Analyzer" subtitle="Analyze brand perception with NLP" />
                <GlassCard tilt={false} className="max-w-2xl !p-8">
                    <form onSubmit={(e) => { e.preventDefault(); callApi("/api/analyze-sentiment", { text, brand_tone: tone }, "sentiment"); }} className="space-y-4">
                        <Textarea placeholder="Paste a customer review or feedback..." value={text} onChange={setText} rows={4} />
                        <Input placeholder="Brand Tone (professional, playful...)" value={tone} onChange={setTone} suggestions={SUGGESTIONS.tone} />
                        <AnimatedButton type="submit" disabled={blockGeneration || loading} className={`w-full py-3.5 justify-center ${blockGeneration ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <><BarChart3 size={16} /> Analyze</>}
                        </AnimatedButton>
                        {blockGeneration && <p className="text-xs text-red-400 text-center font-bold">Generation disabled (usage limit reached)</p>}
                    </form>
                </GlassCard>
                {loading && <AILoader stage="sentiment" />}
                {result?.key === "sentiment" && !result.error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 max-w-2xl">
                        <GlassCard tilt={false} className="!p-8">
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-16 h-16 rounded-full border-[3px] flex items-center justify-center text-3xl ${result.data.sentiment === "Positive" ? "border-green-400" : result.data.sentiment === "Negative" ? "border-red-400" : "border-amber-400"}`}>
                                    {result.data.sentiment === "Positive" ? "😊" : result.data.sentiment === "Negative" ? "😞" : "😐"}
                                </div>
                                <div>
                                    <div className={`text-2xl font-black ${result.data.sentiment === "Positive" ? "text-green-400" : result.data.sentiment === "Negative" ? "text-red-400" : "text-amber-400"}`}>{result.data.sentiment}</div>
                                    <div className="text-text-muted text-sm">Confidence: {((result.data.confidence || 0) * 100).toFixed(0)}%</div>
                                </div>
                            </div>
                            <p className="text-text-secondary text-sm leading-relaxed">{result.data.tone_alignment}</p>
                        </GlassCard>
                    </motion.div>
                )}
                <ErrorDisplay result={result} keyName="sentiment" />
            </motion.div>
        );
    }
    function ColorsView() {
        const [industry, setIndustry] = useState("");
        const [tone, setTone] = useState("vibrant");

        const handleGenerate = (e) => {
            e.preventDefault();
            callApi("/api/get-colors", { industry, tone }, "colors");
        };

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <BackHeader title="Brand Colors" subtitle="Psychology-backed color recommendations" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <GlassCard tilt={false} className="!p-8 h-fit">
                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-text-muted mb-2 block uppercase tracking-wider">Industry</label>
                                <Input placeholder="e.g. Luxury Jewelry, Eco-Friendly Cafe" value={industry} onChange={setIndustry} suggestions={SUGGESTIONS.industry} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-text-muted mb-2 block uppercase tracking-wider">Brand Tone</label>
                                <Input placeholder="e.g. minimalist, bold, trustworthy" value={tone} onChange={setTone} suggestions={SUGGESTIONS.tone} />
                            </div>
                            <AnimatedButton type="submit" disabled={blockGeneration || loading} className="w-full py-3.5 justify-center">
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Palette size={16} /> Generate Palette</>}
                            </AnimatedButton>
                            {blockGeneration && <p className="text-xs text-red-400 text-center font-bold">Generation disabled (usage limit reached)</p>}
                        </form>
                    </GlassCard>

                    <div className="space-y-4">
                        {loading && <AILoader stage="colors" />}
                        {result?.key === "colors" && !result.error && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                <GlassCard tilt={false} className="!p-6">
                                    <h3 className="text-sm font-bold mb-6 text-text-secondary uppercase tracking-widest">Recommended Palette</h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        {result.data.colors?.map((hex, i) => (
                                            <div
                                                key={i}
                                                onClick={() => { navigator.clipboard.writeText(hex); toast.success(`Copied ${hex}`); }}
                                                className="flex items-center gap-4 p-3 rounded-2xl bg-[var(--surface)] border border-white/5 hover:border-[var(--primary)]/30 transition-all cursor-pointer group"
                                            >
                                                <div className="w-14 h-14 rounded-xl shadow-lg border border-black/10 group-hover:scale-110 transition-transform" style={{ backgroundColor: hex }}></div>
                                                <div className="flex-1">
                                                    <p className="font-mono font-bold text-lg">{hex}</p>
                                                    <p className="text-[10px] text-text-muted uppercase">Click to copy hex code</p>
                                                </div>
                                                <Copy size={16} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-text-muted mt-6 text-center italic">Colors are chosen based on industry color psychology standards.</p>
                                </GlassCard>
                            </motion.div>
                        )}
                        <ErrorDisplay result={result} keyName="colors" />
                    </div>
                </div>
            </motion.div>
        );
    }


    // ─── AI CHAT ───
    function ChatView() {
        const [input, setInput] = useState("");
        const [chatLoading, setChatLoading] = useState(false);

        const send = async (e) => {
            e.preventDefault();
            if (!input.trim() || chatLoading) return;
            const msg = input.trim();
            setInput("");
            setChatMessages((prev) => [...prev, { role: "user", text: msg }]);
            setChatLoading(true);
            try {
                const data = await apiPost("/api/chat", { message: msg });
                setChatMessages((prev) => [...prev, { role: "ai", text: data.response }]);
            } catch (err) {
                setChatMessages((prev) => [...prev, { role: "error", text: err.message }]);
            } finally {
                setChatLoading(false);
            }
        };

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <BackHeader title="AI Brand Consultant" subtitle="IBM Granite strategic advisor" />
                <GlassCard tilt={false} className="max-w-2xl !p-0 overflow-hidden">
                    <div className="h-[450px] overflow-y-auto p-6 flex flex-col gap-3">
                        <AnimatePresence>
                            {chatMessages.map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${m.role === "user"
                                        ? "self-end text-white rounded-br-sm"
                                        : m.role === "error"
                                            ? "bg-red-500/10 text-red-400 rounded-bl-sm"
                                            : "bg-[var(--surface)] text-text-secondary rounded-bl-sm"
                                        }`}
                                    style={m.role === "user" ? { background: "var(--gradient)" } : {}}
                                >
                                    {m.text}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {chatLoading && (
                            <div className="flex gap-1.5 self-start p-3">
                                {[0, 0.2, 0.4].map((d, i) => (
                                    <motion.span key={i} className="w-2 h-2 rounded-full bg-[var(--primary)]"
                                        animate={{ scale: [0.6, 1.2, 0.6], opacity: [0.4, 1, 0.4] }}
                                        transition={{ duration: 1.4, repeat: Infinity, delay: d }} />
                                ))}
                            </div>
                        )}
                    </div>
                    <form onSubmit={send} className="flex flex-col border-t border-[var(--card-border)] p-3 gap-2">
                        <div className="flex gap-2">
                            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about branding strategy..."
                                className="flex-1 bg-transparent border-none text-sm text-[var(--text)] placeholder:text-text-muted focus:outline-none px-2" />
                            <AnimatedButton type="submit" disabled={blockGeneration || chatLoading} className="!rounded-xl !px-4 !py-2.5">
                                <Send size={16} />
                            </AnimatedButton>
                        </div>
                        {blockGeneration && <p className="text-xs text-red-400 text-center font-bold">Generation disabled (usage limit reached)</p>}
                    </form>
                </GlassCard>
            </motion.div>
        );
    }

    // ─── SHARED INPUT ───
    function Input({ placeholder, value, onChange, type = "text", suggestions = [] }) {
        const [isListening, setIsListening] = useState(false);
        const listId = `suggestions-${placeholder.replace(/\s+/g, '-').toLowerCase()}`;

        const startListening = () => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                toast.error("Speech recognition not supported in this browser.");
                return;
            }
            const recognition = new SpeechRecognition();
            recognition.onstart = () => setIsListening(true);
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                onChange(transcript);
                setIsListening(false);
            };
            recognition.onerror = () => setIsListening(false);
            recognition.onend = () => setIsListening(false);
            recognition.start();
        };

        return (
            <div className="w-full relative group">
                <input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    list={suggestions.length > 0 ? listId : undefined}
                    required
                    className="w-full bg-[var(--surface)] border border-[var(--card-border)] rounded-xl px-4 py-3.5 pr-12 text-sm text-[var(--text)] placeholder:text-text-muted focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
                <button
                    type="button"
                    onClick={startListening}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${isListening ? 'text-red-400 bg-red-400/10' : 'text-text-muted hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 opacity-0 group-hover:opacity-100'}`}
                    title="Dictate"
                >
                    {isListening ? <MicOff size={16} className="animate-pulse" /> : <Mic size={16} />}
                </button>
                {suggestions.length > 0 && (
                    <datalist id={listId}>
                        {suggestions.map((s, i) => (
                            <option key={i} value={s} />
                        ))}
                    </datalist>
                )}
            </div>
        );
    }

    function Textarea({ placeholder, value, onChange, rows = 3 }) {
        const [isListening, setIsListening] = useState(false);

        const startListening = () => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                toast.error("Speech recognition not supported in this browser.");
                return;
            }
            const recognition = new SpeechRecognition();
            recognition.onstart = () => setIsListening(true);
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                onChange(value ? value + " " + transcript : transcript);
                setIsListening(false);
            };
            recognition.onerror = () => setIsListening(false);
            recognition.onend = () => setIsListening(false);
            recognition.start();
        };

        return (
            <div className="w-full relative group">
                <textarea
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={rows}
                    required
                    className="w-full bg-[var(--surface)] border border-[var(--card-border)] rounded-xl px-4 py-3.5 pr-12 text-sm text-[var(--text)] placeholder:text-text-muted focus:outline-none focus:border-[var(--primary)] transition-colors resize-none"
                />
                <button
                    type="button"
                    onClick={startListening}
                    className={`absolute right-3 top-4 p-2 rounded-lg transition-all ${isListening ? 'text-red-400 bg-red-400/10' : 'text-text-muted hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 opacity-0 group-hover:opacity-100'}`}
                    title="Dictate"
                >
                    {isListening ? <MicOff size={16} className="animate-pulse" /> : <Mic size={16} />}
                </button>
            </div>
        );
    }

    function ErrorDisplay({ result, keyName }) {
        if (!result?.error || result?.key !== keyName) return null;
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 max-w-2xl">
                <GlassCard tilt={false} className="!p-4 !border-red-500/20">
                    <p className="text-red-400 text-sm">❌ {result.error}</p>
                </GlassCard>
            </motion.div>
        );
    }

    // ─── VIEW ROUTER ───
    const views = {
        home: HomeView,
        names: NamesView,
        logo: LogoView,
        marketing: MarketingView,
        startup: StartupView,
        sentiment: SentimentView,
        colors: ColorsView,
        chat: ChatView,
    };

    const ActiveView = views[view] || HomeView;

    const stopImpersonation = () => {
        const originalToken = localStorage.getItem("original_access_token");
        if (originalToken) {
            localStorage.setItem("access_token", originalToken);
            localStorage.removeItem("original_access_token");
            window.location.href = "/admin";
        }
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen animated-bg text-[var(--text)] flex items-center justify-center">
                <ParticleBackground />
                <div className="flex flex-col items-center gap-4 relative z-10">
                    <Loader2 size={40} className="animate-spin text-[var(--primary)]" />
                    <p className="text-text-secondary text-sm font-bold">Loading your workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen animated-bg text-[var(--text)]">
            <Toaster position="top-right" toastOptions={{ className: 'glass-card text-sm', style: { background: 'var(--surface)', color: 'var(--text)' } }} />
            <ParticleBackground />

            {isImpersonated && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-red-500/90 text-white text-center py-2 text-sm font-bold backdrop-blur-sm flex items-center justify-center gap-4 shadow-lg">
                    <span>You are logged in as: {userEmail}</span>
                    <button onClick={stopImpersonation} className="bg-white text-red-600 px-3 py-1 rounded-full text-xs hover:bg-red-50 transition-colors">Exit Impersonation</button>
                </div>
            )}

            <Sidebar onLogout={handleLogout} isAdmin={isAdmin} />
            <StripeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} onSuccess={(plan) => setUserPlan(plan)} />

            <main className={`ml-[260px] p-8 relative z-10 min-h-screen ${isImpersonated ? 'pt-16' : ''}`}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={view}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {view !== "home" && <UsagePanel />}
                        <ActiveView />
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}

