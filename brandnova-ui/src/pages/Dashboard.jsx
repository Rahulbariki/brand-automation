import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Sparkles, Zap, Paintbrush, PenLine, Rocket, Heart,
    MessageCircle, ArrowLeft, Send, Loader2, Crown, Copy,
    Check, BarChart3, Download,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import GlassCard from "../components/GlassCard";
import AnimatedButton from "../components/AnimatedButton";
import AnimatedText from "../components/AnimatedText";
import Loader from "../components/Loader";
import StripeModal from "../components/StripeModal";
import ParticleBackground from "../effects/ParticleBackground";
import { apiPost } from "../hooks/useApi";

const modules = [
    { id: "names", icon: "🧠", title: "Brand Name Generator", desc: "LLaMA 70B powered naming engine — unique, memorable, instantly available.", tag: "AI Powered", tagIcon: <Zap size={12} /> },
    { id: "logo", icon: "🎨", title: "Logo Studio", desc: "Stable Diffusion XL creates stunning logos. Download in HD.", tag: "Pro Feature", tagIcon: <Crown size={12} />, pro: true },
    { id: "marketing", icon: "✍️", title: "Marketing Copy", desc: "Ad copy, social captions, product descriptions — any tone, any format.", tag: "AI Powered", tagIcon: <Zap size={12} /> },
    { id: "startup", icon: "🚀", title: "Startup Tools", desc: "Elevator pitches, investor emails, competitor analysis for founders.", tag: "New", tagIcon: <Sparkles size={12} /> },
    { id: "sentiment", icon: "📊", title: "Sentiment Analysis", desc: "Analyze customer reviews and align feedback with your brand tone.", tag: "AI Powered", tagIcon: <Zap size={12} /> },
    { id: "chat", icon: "💬", title: "AI Brand Consultant", desc: "Chat with IBM Granite for strategic branding and positioning advice.", tag: "IBM Granite", tagIcon: <BarChart3 size={12} /> },
];

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

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

    // Detect admin from JWT token
    useEffect(() => {
        try {
            const token = localStorage.getItem("access_token");
            if (token) {
                const payload = JSON.parse(atob(token.split(".")[1]));
                setIsAdmin(!!payload.admin);
            }
        } catch { }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        navigate("/login");
    };

    const goTo = (id) => navigate(`/dashboard/${id}`);
    const goHome = () => navigate("/dashboard");

    async function callApi(endpoint, body, key) {
        setLoading(true);
        setResult(null);
        try {
            const data = await apiPost(endpoint, body);
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
                            <GlassCard onClick={() => goTo(m.id)} className="group cursor-pointer h-full">
                                <div className="text-4xl mb-4">{m.icon}</div>
                                <h3 className="text-lg font-bold mb-2 group-hover:text-[var(--primary)] transition-colors">{m.title}</h3>
                                <p className="text-text-secondary text-sm mb-4 leading-relaxed">{m.desc}</p>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${m.pro ? "bg-amber-500/10 text-amber-400" : "bg-[var(--primary)]/10 text-[var(--primary)]"}`}>
                                    {m.tagIcon} {m.tag}
                                </span>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        );
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
                        <Input placeholder="Industry (e.g. FinTech, HealthCare)" value={industry} onChange={setIndustry} />
                        <Input placeholder="Keywords (comma-separated)" value={keywords} onChange={setKeywords} />
                        <Input placeholder="Tone (modern, playful, luxurious...)" value={tone} onChange={setTone} />
                        <AnimatedButton type="submit" disabled={loading} className="w-full py-3.5 justify-center">
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <><Sparkles size={16} /> Generate Names</>}
                        </AnimatedButton>
                    </form>
                </GlassCard>
                {loading && <Loader text="Generating brand names..." />}
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

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <BackHeader title="Logo Studio" subtitle="AI image generation with Stable Diffusion XL" />
                <GlassCard tilt={false} className="max-w-2xl !p-8">
                    <form onSubmit={(e) => { e.preventDefault(); callApi("/api/generate-logo", { brand_name: brand, industry, keywords: keywords.split(",").map(k => k.trim()), style }, "logo"); }} className="space-y-4">
                        <Input placeholder="Brand Name" value={brand} onChange={setBrand} />
                        <Input placeholder="Industry" value={industry} onChange={setIndustry} />
                        <Input placeholder="Keywords (comma-separated)" value={keywords} onChange={setKeywords} />
                        <Input placeholder="Style (minimalist, abstract, vintage)" value={style} onChange={setStyle} />
                        <AnimatedButton type="submit" disabled={loading} className="w-full py-3.5 justify-center">
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <><Paintbrush size={16} /> Generate Logo</>}
                        </AnimatedButton>
                    </form>
                </GlassCard>
                {loading && <Loader text="Creating your logo..." />}
                {result?.key === "logo" && !result.error && result.data.image_url && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 max-w-2xl">
                        <GlassCard tilt={false} className="text-center !p-8">
                            <img src={result.data.image_url} alt="Generated Logo" className="max-w-[400px] mx-auto rounded-2xl mb-4" />
                            <a href={result.data.image_url} download>
                                <AnimatedButton><Download size={16} /> Download HD</AnimatedButton>
                            </a>
                        </GlassCard>
                    </motion.div>
                )}
                <ErrorDisplay result={result} keyName="logo" />
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
                        <Input placeholder="Tone (bold, witty, premium...)" value={tone} onChange={setTone} />
                        <AnimatedButton type="submit" disabled={loading} className="w-full py-3.5 justify-center">
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <><PenLine size={16} /> Generate Copy</>}
                        </AnimatedButton>
                    </form>
                </GlassCard>
                {loading && <Loader text="Writing brilliant copy..." />}
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
                            <Input placeholder="Target Audience" value={audience} onChange={setAudience} />
                            <AnimatedButton type="submit" disabled={loading} className="w-full py-3.5 justify-center">
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Rocket size={16} /> Generate Pitch</>}
                            </AnimatedButton>
                        </form>
                    </GlassCard>
                ) : (
                    <GlassCard tilt={false} className="max-w-2xl !p-8">
                        <form onSubmit={(e) => { e.preventDefault(); callApi("/api/generate-investor-email", { startup_name: startup, investor_name: investor, key_metrics: metrics, ask }, "email"); }} className="space-y-4">
                            <Input placeholder="Startup Name" value={startup} onChange={setStartup} />
                            <Input placeholder="Investor Name" value={investor} onChange={setInvestor} />
                            <Input placeholder="Key Metrics (e.g. $10k MRR, 500 users)" value={metrics} onChange={setMetrics} />
                            <Input placeholder="Your Ask (e.g. 15 min call, $500k seed)" value={ask} onChange={setAsk} />
                            <AnimatedButton type="submit" disabled={loading} className="w-full py-3.5 justify-center">
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} /> Draft Email</>}
                            </AnimatedButton>
                        </form>
                    </GlassCard>
                )}
                {loading && <Loader />}
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
                        <Input placeholder="Brand Tone (professional, playful...)" value={tone} onChange={setTone} />
                        <AnimatedButton type="submit" disabled={loading} className="w-full py-3.5 justify-center">
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <><BarChart3 size={16} /> Analyze</>}
                        </AnimatedButton>
                    </form>
                </GlassCard>
                {loading && <Loader text="Analyzing sentiment..." />}
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
                    <form onSubmit={send} className="flex border-t border-[var(--card-border)] p-3 gap-2">
                        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about branding strategy..."
                            className="flex-1 bg-transparent border-none text-sm text-[var(--text)] placeholder:text-text-muted focus:outline-none px-2" />
                        <AnimatedButton type="submit" disabled={chatLoading} className="!rounded-xl !px-4 !py-2.5">
                            <Send size={16} />
                        </AnimatedButton>
                    </form>
                </GlassCard>
            </motion.div>
        );
    }

    // ─── SHARED INPUT ───
    function Input({ placeholder, value, onChange, type = "text" }) {
        return (
            <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} required
                className="w-full bg-[var(--surface)] border border-[var(--card-border)] rounded-xl px-4 py-3.5 text-sm text-[var(--text)] placeholder:text-text-muted focus:outline-none focus:border-[var(--primary)] transition-colors" />
        );
    }

    function Textarea({ placeholder, value, onChange, rows = 3 }) {
        return (
            <textarea placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} rows={rows} required
                className="w-full bg-[var(--surface)] border border-[var(--card-border)] rounded-xl px-4 py-3.5 text-sm text-[var(--text)] placeholder:text-text-muted focus:outline-none focus:border-[var(--primary)] transition-colors resize-none" />
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
        chat: ChatView,
    };

    const ActiveView = views[view] || HomeView;

    return (
        <div className="min-h-screen animated-bg text-[var(--text)]">
            <ParticleBackground />
            <Sidebar onLogout={handleLogout} isAdmin={isAdmin} />
            <StripeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />

            <main className="ml-[260px] p-8 relative z-10 min-h-screen">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={view}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ActiveView />
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
