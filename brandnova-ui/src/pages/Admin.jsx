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
import { apiGet } from "../hooks/useApi";

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

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const s = await apiGet("/api/admin/stats");
            setStats(s);
            const u = await apiGet("/api/admin/users");
            setUsers(u);
        } catch (err) {
            setError("Admin access required");
            setTimeout(() => navigate("/dashboard"), 2000);
        }
    }

    async function toggleRole(id, currentRole) {
        const newRole = currentRole === "admin" ? "user" : "admin";
        try {
            await fetch("http://127.0.0.1:8000" + `/api/admin/users/${id}/role`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                },
                body: JSON.stringify({ role: newRole }),
            });
            loadData();
        } catch { }
    }

    const filteredUsers = search
        ? users.filter((u) => u.email.toLowerCase().includes(search.toLowerCase()) || (u.fullname || "").toLowerCase().includes(search.toLowerCase()))
        : users;

    const statCards = stats ? [
        { label: "Total Users", icon: <Users size={20} />, value: stats.total_users, prefix: "" },
        { label: "Active Users", icon: <Activity size={20} />, value: stats.active_users, prefix: "" },
        { label: "Pro Users", icon: <Crown size={20} />, value: stats.pro_users, prefix: "" },
        { label: "Generations", icon: <BarChart3 size={20} />, value: stats.total_generations, prefix: "" },
        { label: "MRR", icon: <DollarSign size={20} />, value: Math.round(stats.mrr || 0), prefix: "$" },
        { label: "Conversion", icon: <TrendingUp size={20} />, value: Math.round(stats.conversion_rate || 0), suffix: "%" },
    ] : [];

    const style = getComputedStyle(document.documentElement);
    const primary = style.getPropertyValue("--primary")?.trim() || "#7c3aed";
    const accent = style.getPropertyValue("--accent2")?.trim() || "#ec4899";

    const lineData = {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
        datasets: [{
            label: "Users",
            data: [2, 5, 12, 25, 45, 80, stats?.total_users || 100],
            borderColor: primary,
            backgroundColor: primary + "22",
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: primary,
        }],
    };

    const doughnutData = {
        labels: ["Brand Names", "Logos", "Marketing", "Pitch", "Sentiment", "Chat"],
        datasets: [{
            data: [35, 15, 25, 10, 8, 7],
            backgroundColor: [primary, accent, "#f59e0b", "#10b981", "#06b6d4", "#8b5cf6"],
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
            <ParticleBackground />
            <Sidebar onLogout={() => { localStorage.removeItem("access_token"); navigate("/login"); }} />

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
                        {statCards.map((s, i) => (
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
                                <h3 className="text-sm font-bold mb-4">User Growth</h3>
                                {stats && <Line data={lineData} options={chartOptions} />}
                            </GlassCard>
                        </motion.div>
                        <motion.div variants={fadeUp}>
                            <GlassCard tilt={false} className="!p-6">
                                <h3 className="text-sm font-bold mb-4">Feature Usage</h3>
                                {stats && <Doughnut data={doughnutData} options={{ responsive: true, plugins: { legend: { position: "bottom", labels: { color: "#888", padding: 15 } } }, animation: { animateRotate: true, duration: 1500 } }} />}
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
                                        <th className="text-left py-3 text-text-muted font-semibold">Status</th>
                                        <th className="text-left py-3 text-text-muted font-semibold">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((u, i) => (
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
                                            <td className="py-3"><span className={u.is_active ? "text-green-400" : "text-red-400"}>● {u.is_active ? "Active" : "Inactive"}</span></td>
                                            <td className="py-3">
                                                <button onClick={() => toggleRole(u.id, u.role)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--surface)] hover:bg-[var(--card-hover)] transition-colors text-text-secondary hover:text-[var(--text)]">
                                                    {u.role === "admin" ? <><ArrowDown size={14} /> Demote</> : <><ArrowUp size={14} /> Promote</>}
                                                </button>
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
