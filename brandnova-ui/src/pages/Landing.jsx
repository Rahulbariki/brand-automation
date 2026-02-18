import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    Zap, Sparkles, PenLine, Rocket, Heart, MessageCircle,
    ArrowRight, Check, ChevronDown,
} from "lucide-react";
import Navbar from "../components/Navbar";
import GlassCard from "../components/GlassCard";
import AnimatedButton from "../components/AnimatedButton";
import ParticleBackground from "../effects/ParticleBackground";

const typeWords = ["Brand Names", "Logos", "Marketing Copy", "Pitch Decks", "Strategies"];

const features = [
    { icon: <Sparkles size={24} />, title: "Brand Name Generator", desc: "LLaMA 70B powered naming engine — unique, memorable, instantly available." },
    { icon: <Zap size={24} />, title: "Logo Studio", desc: "Stable Diffusion XL creates stunning logos. Download in HD." },
    { icon: <PenLine size={24} />, title: "Marketing Engine", desc: "Ad copy, captions, emails — any tone, any format, any language." },
    { icon: <Rocket size={24} />, title: "Startup Tools", desc: "Elevator pitches, investor emails, competitor analysis for founders." },
    { icon: <Heart size={24} />, title: "Sentiment Analysis", desc: "NLP-powered brand perception insights with tone alignment." },
    { icon: <MessageCircle size={24} />, title: "AI Consultant", desc: "Strategic branding advice from IBM Granite AI." },
];

const steps = [
    { num: "01", title: "Describe Your Vision", desc: "Enter your industry, style, and keywords." },
    { num: "02", title: "AI Creates Instantly", desc: "Our multi-model AI stack generates world-class results." },
    { num: "03", title: "Export & Launch", desc: "Download, iterate, and build your brand." },
];

const plans = [
    { name: "Free", price: "0", features: ["5 generations/day", "Brand names", "Marketing copy", "Basic sentiment"], cta: "Start Free" },
    { name: "Growth", price: "19", features: ["Unlimited generations", "HD logo exports", "Startup tools", "AI Consultant", "Priority queue"], cta: "Go Pro", popular: true },
    { name: "Enterprise", price: "49", features: ["Everything in Growth", "Custom models", "API access", "Dedicated support", "White label"], cta: "Contact Sales" },
];

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

export default function Landing() {
    const [wordIndex, setWordIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setWordIndex((i) => (i + 1) % typeWords.length), 2500);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen animated-bg text-[var(--text)]">
            <ParticleBackground />
            <Navbar />

            {/* ═══ HERO ═══ */}
            <section className="relative min-h-screen flex items-center justify-center text-center px-6 pt-20">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
                    className="max-w-4xl relative z-10"
                >
                    <motion.div variants={fadeUp} className="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-semibold bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)]">
                        ✦ AI-Powered Brand Intelligence
                    </motion.div>
                    <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-black leading-[1.1] mb-6">
                        Create Stunning{" "}
                        <span className="gradient-text relative">
                            <motion.span
                                key={wordIndex}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                {typeWords[wordIndex]}
                            </motion.span>
                        </span>
                        <br />in Seconds
                    </motion.h1>
                    <motion.p variants={fadeUp} className="text-lg text-text-secondary max-w-2xl mx-auto mb-10">
                        BrandNova is the AI creative platform for founders, marketers, and designers.
                        Generate brand assets 100x faster with LLaMA&nbsp;70B + Stable&nbsp;Diffusion&nbsp;XL.
                    </motion.p>
                    <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 flex-wrap">
                        <Link to="/signup">
                            <AnimatedButton className="px-8 py-4 text-base">
                                <Sparkles size={18} /> Start Creating Free
                            </AnimatedButton>
                        </Link>
                        <a href="#features">
                            <AnimatedButton variant="ghost" className="px-8 py-4 text-base">
                                See Features <ArrowRight size={16} />
                            </AnimatedButton>
                        </a>
                    </motion.div>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 text-text-muted"
                >
                    <ChevronDown size={24} />
                </motion.div>
            </section>

            {/* ═══ FEATURES ═══ */}
            <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
                    <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black text-center mb-4">
                        Everything Your Brand <span className="gradient-text">Needs</span>
                    </motion.h2>
                    <motion.p variants={fadeUp} className="text-text-secondary text-center mb-16 max-w-xl mx-auto">Six AI-powered modules. One creative platform.</motion.p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((f, i) => (
                            <motion.div key={i} variants={fadeUp}>
                                <GlassCard className="h-full">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-[var(--primary)]" style={{ background: "var(--primary-glow)" }}>
                                        {f.icon}
                                    </div>
                                    <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                                    <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ═══ HOW IT WORKS ═══ */}
            <section id="how" className="py-32 px-6 max-w-5xl mx-auto">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={{ visible: { transition: { staggerChildren: 0.15 } } }}>
                    <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black text-center mb-16">
                        Three Steps. <span className="gradient-text">Zero Friction.</span>
                    </motion.h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {steps.map((s, i) => (
                            <motion.div key={i} variants={fadeUp}>
                                <GlassCard className="text-center h-full">
                                    <div className="text-5xl font-black gradient-text mb-4">{s.num}</div>
                                    <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                                    <p className="text-text-secondary text-sm">{s.desc}</p>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ═══ PRICING ═══ */}
            <section id="pricing" className="py-32 px-6 max-w-6xl mx-auto">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={{ visible: { transition: { staggerChildren: 0.15 } } }}>
                    <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black text-center mb-16">
                        Simple, <span className="gradient-text">Transparent</span> Pricing
                    </motion.h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map((p, i) => (
                            <motion.div key={i} variants={fadeUp}>
                                <GlassCard className={`text-center h-full relative ${p.popular ? "!border-[var(--primary)]/40 shadow-[0_0_40px_var(--primary-glow)]" : ""}`}>
                                    {p.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white" style={{ background: "var(--gradient)" }}>
                                            Most Popular
                                        </div>
                                    )}
                                    <h3 className="text-lg font-bold mb-2">{p.name}</h3>
                                    <div className="text-5xl font-black gradient-text mb-1">${p.price}</div>
                                    <p className="text-text-muted text-sm mb-6">/month</p>
                                    <ul className="space-y-3 mb-8 text-left">
                                        {p.features.map((f, fi) => (
                                            <li key={fi} className="flex items-center gap-2 text-text-secondary text-sm">
                                                <Check size={16} className="text-[var(--primary)] flex-shrink-0" /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link to="/signup">
                                        <AnimatedButton variant={p.popular ? "primary" : "ghost"} className="w-full justify-center">
                                            {p.cta}
                                        </AnimatedButton>
                                    </Link>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ═══ FOOTER ═══ */}
            <footer className="py-12 px-6 border-t border-[var(--card-border)]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <span className="gradient-text font-bold text-lg">✦ BrandNova</span>
                    <p className="text-text-muted text-sm">&copy; 2026 BrandNova. Built with AI.</p>
                </div>
            </footer>
        </div>
    );
}
