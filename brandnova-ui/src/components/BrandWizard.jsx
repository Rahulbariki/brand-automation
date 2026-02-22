import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Sparkles, X, Check } from "lucide-react";
import GlassCard from "./GlassCard";
import AnimatedButton from "./AnimatedButton";
import { apiPost } from "../hooks/useApi";

export default function BrandWizard({ isOpen, onClose, onSuccess }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Wizard state
    const [formData, setFormData] = useState({
        project_name: "",
        industry: "",
        tone: "Modern & Professional",
        audience: "",
        vibe: "Minimalist",
    });

    if (!isOpen) return null;

    const handleNext = () => setStep(s => Math.min(5, s + 1));
    const handlePrev = () => setStep(s => Math.max(1, s - 1));

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await apiPost("/api/workspaces/wizard", formData);
            onSuccess(res.workspace_id);
        } catch (err) {
            alert(err.message || "Failed to create workspace");
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <GlassCard className="w-full max-w-2xl !p-0 overflow-hidden relative">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-[var(--card-border)] bg-[var(--surface)]">
                    <div>
                        <h2 className="text-xl font-bold gradient-text">AI Brand Builder</h2>
                        <p className="text-xs text-text-secondary">Step {step} of 5</p>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-[var(--text)] transition-colors bg-[var(--card-hover)] p-2 rounded-full">
                        <X size={16} />
                    </button>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-[var(--surface)] w-full">
                    <div className="h-full bg-[var(--primary)] transition-all duration-300" style={{ width: `${(step / 5) * 100}%` }}></div>
                </div>

                {/* Content */}
                <div className="p-8 min-h-[300px] flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <h3 className="text-2xl font-bold mb-4">Describe your brand</h3>
                                <p className="text-sm text-text-secondary mb-6">What is the working name of your project?</p>
                                <input autoFocus value={formData.project_name} onChange={(e) => updateField('project_name', e.target.value)} placeholder="e.g. Acme Corp" className="w-full bg-[var(--surface)] border border-[var(--card-border)] rounded-xl px-4 py-3 focus:border-[var(--primary)] text-[var(--text)] outline-none" />
                            </motion.div>
                        )}
                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <h3 className="text-2xl font-bold mb-4">What's your industry?</h3>
                                <p className="text-sm text-text-secondary mb-6">This helps the AI tune its language appropriately.</p>
                                <input autoFocus value={formData.industry} onChange={(e) => updateField('industry', e.target.value)} placeholder="e.g. Healthcare, Fintech, Fashion" className="w-full bg-[var(--surface)] border border-[var(--card-border)] rounded-xl px-4 py-3 focus:border-[var(--primary)] text-[var(--text)] outline-none" />
                            </motion.div>
                        )}
                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <h3 className="text-2xl font-bold mb-4">Who is your audience?</h3>
                                <p className="text-sm text-text-secondary mb-6">Define who you are talking to.</p>
                                <input autoFocus value={formData.audience} onChange={(e) => updateField('audience', e.target.value)} placeholder="e.g. Gen Z skateboarders, Enterprise executives" className="w-full bg-[var(--surface)] border border-[var(--card-border)] rounded-xl px-4 py-3 focus:border-[var(--primary)] text-[var(--text)] outline-none" />
                            </motion.div>
                        )}
                        {step === 4 && (
                            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <h3 className="text-2xl font-bold mb-4">Select your Tone</h3>
                                <p className="text-sm text-text-secondary mb-6">How should your brand sound when it speaks?</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Modern & Professional', 'Playful & Witty', 'Luxurious & Premium', 'Bold & Disruptive'].map(t => (
                                        <button key={t} onClick={() => updateField('tone', t)} className={`p-4 rounded-xl border text-sm font-bold transition-all text-left ${formData.tone === t ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' : 'border-[var(--card-border)] hover:bg-[var(--surface)] text-[var(--text)]'}`}>
                                            {t}
                                            {formData.tone === t && <Check size={16} className="inline float-right text-[var(--primary)]" />}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                        {step === 5 && (
                            <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <h3 className="text-2xl font-bold mb-4">Select the Vibe</h3>
                                <p className="text-sm text-text-secondary mb-6">What aesthetic represents your brand visually?</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Minimalist & Clean', 'Cyberpunk & Neon', 'Vintage & Retro', 'Corporate & Trustworthy'].map(v => (
                                        <button key={v} onClick={() => updateField('vibe', v)} className={`p-4 rounded-xl border text-sm font-bold transition-all text-left ${formData.vibe === v ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' : 'border-[var(--card-border)] hover:bg-[var(--surface)] text-[var(--text)]'}`}>
                                            {v}
                                            {formData.vibe === v && <Check size={16} className="inline float-right text-[var(--primary)]" />}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-[var(--card-border)] bg-[var(--surface)] flex justify-between items-center">
                    <button onClick={handlePrev} disabled={step === 1 || loading} className={`text-sm font-bold px-4 py-2 text-text-muted hover:text-[var(--text)] transition-colors ${step === 1 ? 'invisible' : ''}`}>
                        <ArrowLeft size={16} className="inline mr-1 mb-0.5" /> Back
                    </button>

                    {step < 5 ? (
                        <AnimatedButton onClick={handleNext} disabled={!formData.project_name && step === 1} className="!px-6">
                            Next <ArrowRight size={16} className="inline ml-1 mb-0.5" />
                        </AnimatedButton>
                    ) : (
                        <AnimatedButton onClick={handleSubmit} disabled={loading} className="!px-6">
                            {loading ? <span className="animate-pulse">Building Brand...</span> : <><Sparkles size={16} className="inline mr-2 mb-0.5" /> Build Brand</>}
                        </AnimatedButton>
                    )}
                </div>
            </GlassCard>
        </div>
    );
}
