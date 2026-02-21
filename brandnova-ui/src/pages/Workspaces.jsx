import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, ArrowRight, FolderSearch, Activity } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import GlassCard from "../components/GlassCard";
import AnimatedButton from "../components/AnimatedButton";
import ParticleBackground from "../effects/ParticleBackground";
import BrandWizard from "../components/BrandWizard";
import { apiGet } from "../hooks/useApi";
import Tilt from "react-parallax-tilt";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function Workspaces() {
    const navigate = useNavigate();
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showWizard, setShowWizard] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        loadData();
        const token = localStorage.getItem("access_token");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                setIsAdmin(!!payload.admin);
            } catch { }
        }
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const data = await apiGet("/api/workspaces");
            setWorkspaces(data);
        } catch (err) {
            console.error("Failed to fetch workspaces", err);
        } finally {
            setLoading(false);
        }
    }

    const SkeletonCard = () => (
        <GlassCard className="!p-6 h-48 animate-pulse flex flex-col justify-between">
            <div>
                <div className="h-6 w-32 bg-[var(--card-border)] rounded mb-3"></div>
                <div className="h-4 w-48 bg-[var(--card-border)] rounded"></div>
            </div>
            <div className="flex justify-between items-end">
                <div className="flex gap-2">
                    <div className="h-6 w-16 bg-[var(--card-border)] rounded-full"></div>
                    <div className="h-6 w-16 bg-[var(--card-border)] rounded-full"></div>
                </div>
                <div className="h-8 w-8 bg-[var(--card-border)] rounded-full"></div>
            </div>
        </GlassCard>
    );

    return (
        <div className="min-h-screen animated-bg text-[var(--text)]">
            <ParticleBackground />
            <Sidebar onLogout={() => { localStorage.removeItem("access_token"); navigate("/login"); }} isAdmin={isAdmin} />

            <main className="ml-[260px] p-8 relative z-10 w-full max-w-[1200px]">
                <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>

                    <motion.div variants={fadeUp} className="flex justify-between items-end mb-12">
                        <div>
                            <h1 className="text-4xl font-black mb-2">My <span className="gradient-text">Brands</span></h1>
                            <p className="text-text-secondary text-sm">Manage all your projects and workspace assets.</p>
                        </div>
                        <AnimatedButton onClick={() => setShowWizard(true)}>
                            <Plus size={16} className="inline mr-1" /> Create Brand Project
                        </AnimatedButton>
                    </motion.div>

                    {workspaces.length === 0 && !loading ? (
                        <motion.div variants={fadeUp} className="flex flex-col items-center justify-center py-20">
                            <GlassCard tilt={false} className="max-w-md text-center !p-12">
                                <div className="mx-auto bg-[var(--surface)] text-[var(--primary)] p-4 rounded-full w-fit mb-6">
                                    <FolderSearch size={40} />
                                </div>
                                <h3 className="text-xl font-bold mb-3">No brands yet</h3>
                                <p className="text-sm text-text-secondary mb-8">Start your first project using our AI-powered Brand Architect Wizard to generate a complete identity.</p>
                                <AnimatedButton onClick={() => setShowWizard(true)}>
                                    Start the Wizard <Sparkles size={16} className="inline ml-1" />
                                </AnimatedButton>
                            </GlassCard>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => <motion.div key={i} variants={fadeUp}><SkeletonCard /></motion.div>)
                            ) : (
                                workspaces.map(ws => (
                                    <motion.div key={ws.id} variants={fadeUp}>
                                        <Tilt tiltMaxAngleX={3} tiltMaxAngleY={3} scale={1.02} transitionSpeed={2000}>
                                            <GlassCard className="!p-6 h-full flex flex-col justify-between group cursor-pointer" onClick={() => navigate(`/workspaces/${ws.id}`)}>
                                                <div>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h3 className="font-bold text-lg group-hover:text-[var(--primary)] transition-colors">{ws.project_name}</h3>
                                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border border-[var(--card-border)] ${ws.health_score > 80 ? 'text-green-400 bg-green-400/10' : 'text-amber-400 bg-amber-400/10'}`}>
                                                            {ws.health_score} <Activity size={10} className="inline ml-1" />
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-text-secondary line-clamp-2">{ws.tagline || "Brand setup in progress..."}</p>
                                                </div>
                                                <div className="mt-6 flex items-end justify-between">
                                                    <div className="flex gap-2">
                                                        {ws.color_palette && (ws.color_palette.slice(0, 3)).map(c => (
                                                            <div key={c} className="w-5 h-5 rounded-full border border-white/10" style={{ backgroundColor: c }}></div>
                                                        ))}
                                                    </div>
                                                    <div className="text-text-muted group-hover:text-[var(--primary)] transition-colors p-2 bg-[var(--surface)] rounded-full">
                                                        <ArrowRight size={16} />
                                                    </div>
                                                </div>
                                            </GlassCard>
                                        </Tilt>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    )}
                </motion.div>
            </main>

            <BrandWizard
                isOpen={showWizard}
                onClose={() => setShowWizard(false)}
                onSuccess={(id) => { setShowWizard(false); navigate(`/workspaces/${id}`); }}
            />
        </div>
    );
}

import { Sparkles } from "lucide-react";
