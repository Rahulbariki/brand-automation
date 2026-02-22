import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Search, ArrowUp, ArrowDown, Users, Activity, Crown, BarChart3, DollarSign, TrendingUp } from "lucide-react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import GlassCard from "../components/GlassCard";
import AnimatedButton from "../components/AnimatedButton";
import Sidebar from "../components/Sidebar";
import ParticleBackground from "../effects/ParticleBackground";
import { apiGet, apiPost } from "../hooks/useApi";
import { Toaster, toast } from "react-hot-toast";

const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-[var(--card-border)] rounded-xl ${className}`}></div>
);

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

function AnimatedCounter({ target, prefix = "", suffix = "" }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);

    useEffect(() => {
        if (!target) return;
        let start = 0;
        const duration = 1500;
        const step = Math.max(1, Math.floor(target / (duration / 16)));
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(start);
        }, 16);
        return () => clearInterval(timer);
    }, [target]);

    return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

export default function Admin() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const s = await apiGet("/api/admin/analytics");
            setStats(s);
            const u = await apiGet("/api/admin/users");
            setUsers(u);
        } catch (err) {
            setError(err.message || "Admin access required");
            setTimeout(() => navigate("/dashboard"), 3000);
        } finally {
            setLoading(false);
        }
    }

    async function toggleRole(id, currentRole) {
        const newRole = currentRole === "admin" ? "user" : "admin";
        try {
            await fetch(`/api/admin/users/${id}/toggle-admin`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                },
            });
            loadData();
        } catch { }
    }

    async function updatePlan(id, newPlan) {
        try {
            const res = await fetch(`/api/admin/users/${id}/set-plan`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                },
                body: JSON.stringify({ subscription_plan: newPlan }),
            });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data.detail || "Update failed");
            } else {
                toast.success("User plan updated!");
            }
            loadData();
        } catch (err) { toast.error(err.message); }
    }

    async function impersonateUser(id) {
        try {
            const res = await fetch(`/api/admin/impersonate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                },
                body: JSON.stringify({ user_id: id }),
            });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data.detail || "Impersonation failed");
                return;
            }
            const data = await res.json();
            // Store original token
            localStorage.setItem("original_access_token", localStorage.getItem("access_token"));
            // Replace with impersonated token
            localStorage.setItem("access_token", data.impersonation_token);
            toast.success("Impersonation successful");
            setTimeout(() => navigate("/dashboard"), 1000);
        } catch (err) { toast.error(err.message); }
    }

    const filteredUsers = search
        ? users.filter((u) => u.email.toLowerCase().includes(search.toLowerCase()) || (u.fullname || "").toLowerCase().includes(search.toLowerCase()))
        : users;

    const statCards = stats ? [
        { label: "Total Users", icon: <Users size={20} />, value: stats.total_users, prefix: "" },
        { label: "Active 30d Users", icon: <Activity size={20} />, value: stats.active_users, prefix: "" },
        { label: "Pro Users", icon: <Crown size={20} />, value: stats.plan_distribution?.pro || 0, prefix: "" },
        { label: "Enterprise Users", icon: <Crown size={20} />, value: stats.plan_distribution?.enterprise || 0, prefix: "" },
        { label: "Generations", icon: <BarChart3 size={20} />, value: stats.total_generated_content, prefix: "" },
        { label: "API Requests", icon: <TrendingUp size={20} />, value: stats.total_branding_requests, prefix: "" },
    ] : [];

    const style = getComputedStyle(document.documentElement);
    const primary = style.getPropertyValue("--primary")?.trim() || "#7c3aed";
    const accent = style.getPropertyValue("--accent2")?.trim() || "#ec4899";

    const contentGrowth = stats?.monthly_growth?.content || [];
    const requestGrowth = stats?.monthly_growth?.requests || [];

    const labels = [...new Set([...contentGrowth.map(c => c.month), ...requestGrowth.map(r => r.month)])].sort();

    const lineData = {
        labels: labels.length ? labels : ["Jan", "Feb", "Mar"],
        datasets: [{
            label: "API Requests (Usage)",
            data: labels.length ? labels.map(l => requestGrowth.find(r => r.month === l)?.count || 0) : [10, 50, 100],
            borderColor: primary,
            backgroundColor: primary + "22",
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: primary,
        }, {
            label: "Generations",
            data: labels.length ? labels.map(l => contentGrowth.find(r => r.month === l)?.count || 0) : [5, 20, 45],
            borderColor: accent,
            backgroundColor: accent + "22",
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: accent,
        }],
    };

    const doughnutData = {
        labels: ["Free", "Pro", "Enterprise"],
        datasets: [{
            data: stats ? [stats.plan_distribution?.free || 0, stats.plan_distribution?.pro || 0, stats.plan_distribution?.enterprise || 0] : [70, 20, 10],
            backgroundColor: ["#06b6d4", primary, "#f59e0b"],
            borderWidth: 0,
            spacing: 3,
        }],
    };

    const chartOptions = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            x: { ticks: { color: "#666" }, grid: { color: "rgba(255,255,255,0.04)" } },
            y: { ticks: { color: "#666" }, grid: { color: "rgba(255,255,255,0.04)" } },
        },
        animation: { duration: 1500, easing: "easeOutQuart" },
    };

    if (error) {
        return (
            <div className="min-h-screen animated-bg flex items-center justify-center text-red-400">
                <GlassCard className="text-center !p-10"><p className="text-lg font-bold">{error}</p><p className="text-sm text-text-muted mt-2">Redirecting...</p></GlassCard>
            </div>
        );
    }

    return (
        <div className="min-h-screen animated-bg text-[var(--text)]">
            <Toaster position="top-right" toastOptions={{ className: 'glass-card text-sm', style: { background: 'var(--surface)', color: 'var(--text)' } }} />
            <ParticleBackground />
            <Sidebar isAdmin={true} onLogout={() => { localStorage.removeItem("access_token"); navigate("/login"); }} />

            <main className="ml-[260px] p-8 relative z-10">
                <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
                    <motion.div variants={fadeUp} className="flex items-start justify-between mb-10">
                        <div>
                            <h1 className="text-4xl font-black"><span className="gradient-text">Admin</span> Command Center</h1>
                            <p className="text-text-secondary mt-2">Platform analytics & user management</p>
                        </div>
                        <AnimatedButton variant="ghost" onClick={() => navigate("/dashboard")} className="!px-4 !py-2 text-sm">
                            <ArrowLeft size={16} /> Dashboard
                        </AnimatedButton>
                    </motion.div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
                        {loading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />) : statCards.map((s, i) => (
                            <motion.div key={i} variants={fadeUp}>
                                <GlassCard className="text-center !p-5 h-full">
                                    <div className="text-[var(--primary)] mb-2">{s.icon}</div>
                                    <div className="text-2xl font-black">
                                        <AnimatedCounter target={s.value} prefix={s.prefix || ""} suffix={s.suffix || ""} />
                                    </div>
                                    <div className="text-text-muted text-xs mt-1">{s.label}</div>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                        <motion.div variants={fadeUp}>
                            <GlassCard tilt={false} className="!p-6">
                                <h3 className="text-sm font-bold mb-4">Monthly Usage & Growth</h3>
                                {loading ? <Skeleton className="h-64" /> : <Line data={lineData} options={{ ...chartOptions, plugins: { legend: { display: true, position: 'bottom' } } }} />}
                            </GlassCard>
                        </motion.div>
                        <motion.div variants={fadeUp}>
                            <GlassCard tilt={false} className="!p-6">
                                <h3 className="text-sm font-bold mb-4">Plan Distribution</h3>
                                {loading ? <Skeleton className="h-64 w-64 mx-auto rounded-full" /> : <Doughnut data={doughnutData} options={{ responsive: true, plugins: { legend: { position: "bottom", labels: { color: "#888", padding: 15 } } }, animation: { animateRotate: true, duration: 1500 } }} />}
                            </GlassCard>
                        </motion.div>
                    </div>

                    {/* Users Table */}
                    <motion.div variants={fadeUp}>
                        <GlassCard tilt={false} className="!p-6 overflow-x-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold">User Management</h3>
                                <div className="relative max-w-[250px]">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..."
                                        className="bg-[var(--surface)] border border-[var(--card-border)] rounded-xl pl-9 pr-4 py-2.5 text-sm w-full text-[var(--text)] focus:outline-none focus:border-[var(--primary)] transition-colors" />
                                </div>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--card-border)]">
                                        <th className="text-left py-3 text-text-muted font-semibold">ID</th>
                                        <th className="text-left py-3 text-text-muted font-semibold">Email</th>
                                        <th className="text-left py-3 text-text-muted font-semibold">Name</th>
                                        <th className="text-left py-3 text-text-muted font-semibold">Role</th>
                                        <th className="text-left py-3 text-text-muted font-semibold">Plan</th>
                                        <th className="text-left py-3 text-text-muted font-semibold">Status</th>
                                        <th className="text-left py-3 text-text-muted font-semibold">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="border-b border-[var(--card-border)] animate-pulse">
                                                <td colSpan="7" className="py-4">
                                                    <Skeleton className="h-4 w-full" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : filteredUsers.map((u, i) => (
                                        <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                            className="border-b border-[var(--card-border)] hover:bg-[var(--surface)] transition-colors">
                                            <td className="py-3 text-text-muted font-mono">#{u.id}</td>
                                            <td className="py-3">{u.email}</td>
                                            <td className="py-3 text-text-secondary">{u.fullname || "—"}</td>
                                            <td className="py-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === "admin" ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "bg-[var(--surface)] text-text-secondary"}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <select
                                                    value={u.subscription_plan || "free"}
                                                    onChange={(e) => updatePlan(u.id, e.target.value)}
                                                    className="bg-[var(--surface)] text-xs border border-[var(--card-border)] rounded px-2 py-1 outline-none"
                                                >
                                                    <option value="free">Free</option>
                                                    <option value="pro">Pro</option>
                                                    <option value="enterprise">Enterprise</option>
                                                </select>
                                            </td>
                                            <td className="py-3"><span className={u.is_active ? "text-green-400" : "text-red-400"}>● {u.is_active ? "Active" : "Inactive"}</span></td>
                                            <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => toggleRole(u.id, u.role)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--surface)] hover:bg-[var(--card-hover)] transition-colors text-text-secondary hover:text-[var(--text)]">
                                                        {u.role === "admin" ? <><ArrowDown size={14} /> Demote</> : <><ArrowUp size={14} /> Promote</>}
                                                    </button>
                                                    <button onClick={() => impersonateUser(u.id)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors">
                                                        <Users size={14} /> Impersonate
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </GlassCard>
                    </motion.div>
                </motion.div>
            </main>
        </div>
    );
}
