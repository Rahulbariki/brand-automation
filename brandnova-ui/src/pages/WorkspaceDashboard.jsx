import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, Plus, Download, ChevronRight, Check } from "lucide-react";
import Sidebar from "../components/Sidebar";
import GlassCard from "../components/GlassCard";
import AnimatedButton from "../components/AnimatedButton";
import AnimatedText from "../components/AnimatedText";
import ParticleBackground from "../effects/ParticleBackground";
import { apiGet, apiPost } from "../hooks/useApi";
import { Toaster, toast } from "react-hot-toast";
import Tilt from "react-parallax-tilt";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function WorkspaceDashboard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [workspace, setWorkspace] = useState(null);
    const [assets, setAssets] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                setIsAdmin(!!payload.admin);
            } catch { }
        }
    }, []);

    // Assistant state
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef(null);

    // Generation state
    const [genType, setGenType] = useState("ig_bio");
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        loadWorkspace();
    }, [id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function loadWorkspace() {
        try {
            const data = await apiGet(`/api/workspaces/${id}`);
            setWorkspace(data.workspace);
            setAssets(data.assets);
            setTimeline(data.timeline);
            setMessages([{ role: 'ai', text: `Hi! I'm your Granite AI consultant for ${data.workspace.brand_name}. What do you want to work on today?` }]);
        } catch (err) {
            toast.error("Failed to load workspace");
            navigate("/workspaces");
        } finally {
            setLoading(false);
        }
    }

    const handleChat = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || chatLoading) return;
        const msg = chatInput;
        setMessages(m => [...m, { role: 'user', text: msg }]);
        setChatInput("");
        setChatLoading(true);
        try {
            const res = await apiPost(`/api/workspaces/${id}/assistant`, { prompt: msg });
            setMessages(m => [...m, { role: 'ai', text: res.reply }]);
            refreshTimeline(); // update timeline with assistant usage
        } catch (err) {
            toast.error("Assistant failed to reply");
        } finally {
            setChatLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        toast.loading("Generating asset...", { id: 'gen' });
        try {
            const res = await apiPost(`/api/workspaces/${id}/generate`, { asset_type: genType });
            toast.success("Asset added to workspace", { id: 'gen' });
            loadWorkspace(); // Reload to get new asset and timeline
        } catch (err) {
            toast.error(err.message || "Failed to generate", { id: 'gen' });
        } finally {
            setGenerating(false);
        }
    };

    const refreshTimeline = async () => {
        try {
            const data = await apiGet(`/api/workspaces/${id}`);
            setTimeline(data.timeline);
        } catch { }
    };

    const handleExport = () => {
        const API_BASE = window.location.hostname === "localhost" ? "http://127.0.0.1:8000" : window.location.origin;
        window.location.href = `${API_BASE}/api/workspaces/${id}/export/zip?token=${localStorage.getItem('access_token')}`;
    };

    if (loading) return (
        <div className="min-h-screen animated-bg flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
        </div>
    );
    if (!workspace) return null;

    return (
        <div className="min-h-screen animated-bg text-[var(--text)] pb-20">
            <Toaster position="top-right" toastOptions={{ className: 'glass-card text-sm', style: { background: 'var(--surface)', color: 'var(--text)' } }} />
            <ParticleBackground />
            <Sidebar onLogout={() => { localStorage.removeItem("access_token"); navigate("/login"); }} isAdmin={isAdmin} />

            <main className="ml-[260px] p-8 relative z-10 w-full max-w-[1400px]">
                <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>

                    {/* Header */}
                    <motion.div variants={fadeUp} className="flex justify-between items-start mb-8 border-b border-[var(--card-border)] pb-6">
                        <div>
                            <button onClick={() => navigate("/workspaces")} className="text-sm font-bold text-text-muted hover:text-[var(--text)] mb-4 transition-colors">
                                <ArrowLeft size={16} className="inline mr-1 mb-0.5" /> Back to Brands
                            </button>
                            <h1 className="text-4xl font-black gradient-text mb-2">{workspace.brand_name}</h1>
                            <p className="text-text-secondary">{workspace.tagline}</p>
                        </div>
                        <div className="flex gap-3">
                            <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.05}>
                                <div className="text-center px-4 py-2 bg-[var(--surface)] border border-[var(--primary)]/50 rounded-xl">
                                    <p className="text-[10px] text-text-muted uppercase font-bold">Health Score</p>
                                    <p className="text-xl font-black text-[var(--primary)]">{workspace.health_score}/100</p>
                                </div>
                            </Tilt>
                            <AnimatedButton onClick={handleExport} variant="outline" className="h-fit py-3">
                                <Download size={16} className="inline mr-2" /> Export Bundle
                            </AnimatedButton>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                        {/* Main Pillar - Brand Identity & Assets */}
                        <div className="xl:col-span-2 space-y-8">

                            <motion.div variants={fadeUp}>
                                <GlassCard tilt={false} className="!p-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/10 blur-[50px] rounded-full pointer-events-none"></div>
                                    <h3 className="text-xl font-bold mb-6 border-b border-[var(--card-border)] pb-4">Brand Identity</h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-xs text-text-muted uppercase font-bold mb-1">Color Palette</p>
                                            <div className="flex gap-3 mt-2">
                                                {workspace.color_palette.map(c => (
                                                    <div key={c} className="group relative">
                                                        <div className="w-10 h-10 rounded-full border-2 border-white/20 shadow-md cursor-pointer transition-transform hover:scale-110" style={{ backgroundColor: c }} onClick={() => { navigator.clipboard.writeText(c); toast.success('Copied hex code'); }}></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-text-muted uppercase font-bold mb-1">Typography</p>
                                            <p className="text-lg font-bold">{workspace.fonts.join("  &  ")}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-xs text-text-muted uppercase font-bold mb-2">Brand Story</p>
                                            <AnimatedText text={workspace.brand_story} speed={0.01} className="text-sm text-text-secondary leading-relaxed bg-[var(--surface)] p-4 rounded-xl border border-[var(--card-border)]" />
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-xs text-text-muted uppercase font-bold mb-2">Logo Generation Prompt</p>
                                            <p className="text-sm font-mono text-text-muted bg-black/30 p-4 rounded-xl">{workspace.logo_prompt}</p>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>

                            <motion.div variants={fadeUp}>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold">Content Assets</h3>
                                    <div className="flex gap-2">
                                        <select value={genType} onChange={e => setGenType(e.target.value)} className="bg-[var(--surface)] text-sm border border-[var(--card-border)] rounded-lg px-3 py-1.5 focus:border-[var(--primary)] outline-none">
                                            <option value="ig_bio">Instagram Bio</option>
                                            <option value="tw_bio">Twitter Bio</option>
                                            <option value="li_about">LinkedIn About</option>
                                            <option value="ad_copy">Ad Copy</option>
                                            <option value="prod_desc">Product Desc</option>
                                        </select>
                                        <AnimatedButton onClick={handleGenerate} disabled={generating} className="!px-4 !py-1.5 text-xs">
                                            <Plus size={14} className="inline mr-1" /> Generate
                                        </AnimatedButton>
                                    </div>
                                </div>

                                {assets.length === 0 ? (
                                    <GlassCard className="text-center py-10 !text-text-muted text-sm border-dashed">No assets generated yet.</GlassCard>
                                ) : (
                                    <div className="space-y-4">
                                        {assets.map(a => (
                                            <Tilt key={a.id} tiltMaxAngleX={2} tiltMaxAngleY={2} scale={1.01}>
                                                <GlassCard className="!p-5 border-l-4 border-[var(--primary)]">
                                                    <div className="flex justify-between text-xs text-text-muted mb-2 font-bold uppercase">
                                                        <span>{a.asset_type.replace('_', ' ')}</span>
                                                        <span>{new Date(a.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-sm whitespace-pre-wrap">{a.content}</p>
                                                </GlassCard>
                                            </Tilt>
                                        ))}
                                    </div>
                                )}
                            </motion.div>

                        </div>

                        {/* Right Sidebar - Assistant & Timeline */}
                        <div className="space-y-8 flex flex-col max-h-[1000px]">

                            {/* Granite Assistant */}
                            <motion.div variants={fadeUp} className="flex-1 flex flex-col h-[500px]">
                                <GlassCard tilt={false} className="flex-1 flex flex-col !p-0 overflow-hidden relative border border-[var(--primary)]/30">
                                    <div className="p-4 bg-[var(--primary)]/10 border-b border-[var(--primary)]/20 flex items-center gap-3">
                                        <div className="p-2 bg-[var(--primary)] rounded-lg text-white"><MessageSquare size={16} /></div>
                                        <div>
                                            <h4 className="font-bold text-sm">IBM Granite</h4>
                                            <p className="text-[10px] text-text-muted">Brand Consultant</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                        {messages.map((m, i) => (
                                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`p-3 rounded-2xl max-w-[85%] text-sm ${m.role === 'user' ? 'bg-[var(--primary)] text-white rounded-br-none' : 'bg-[var(--surface)] border border-[var(--card-border)] rounded-bl-none text-text-secondary'}`}>
                                                    {m.text}
                                                </div>
                                            </div>
                                        ))}
                                        {chatLoading && (
                                            <div className="flex justify-start">
                                                <div className="p-3 rounded-2xl bg-[var(--surface)] text-text-muted text-xs animate-pulse">Thinking...</div>
                                            </div>
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <div className="p-4 bg-[var(--surface)] border-t border-[var(--card-border)]">
                                        <form onSubmit={handleChat} className="flex gap-2">
                                            <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask to improve tagline..." className="flex-1 bg-transparent border-none outline-none text-sm px-2 text-[var(--text)]" />
                                            <button disabled={chatLoading} type="submit" className="text-[var(--primary)] p-2 hover:bg-[var(--primary)]/10 rounded-full transition-colors"><ChevronRight size={20} /></button>
                                        </form>
                                    </div>
                                </GlassCard>
                            </motion.div>

                            {/* Timeline */}
                            <motion.div variants={fadeUp} className="flex-1">
                                <GlassCard tilt={false} className="!p-6 h-[400px] flex flex-col overflow-hidden">
                                    <h3 className="text-sm font-bold mb-4 uppercase text-text-muted tracking-wider">Activity Timeline</h3>
                                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 timeline-scroll">
                                        {timeline.map((t, i) => (
                                            <div key={t.id} className="relative pl-6">
                                                <div className="absolute left-[3px] top-1.5 w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></div>
                                                {i !== timeline.length - 1 && <div className="absolute left-[5px] top-3 w-[1px] h-full bg-[var(--card-border)]"></div>}
                                                <p className="text-xs font-bold">{t.action.replace('_', ' ')}</p>
                                                <p className="text-[10px] text-text-muted">{t.details} • {new Date(t.created_at).toLocaleDateString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </GlassCard>
                            </motion.div>

                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
