import { useNavigate } from 'react-router-dom'
import { useAppContext } from '@/context/AppContext'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import {
    Trophy, TrendingUp, Brain, RotateCcw,
    Target, Percent, Activity
} from 'lucide-react'

function MetricCard({ label, value, icon: Icon, color = 'blue' }) {
    const colorMap = {
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        green: 'text-green-400 bg-green-500/10 border-green-500/20',
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    }
    return (
        <div className={`glass rounded-2xl p-5 border ${colorMap[color]}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
                <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{value}</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">{label}</p>
        </div>
    )
}

const CHART_COLORS = [
    '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
    '#ef4444', '#06b6d4', '#84cc16', '#ec4899',
]

function ConfusionMatrix({ data }) {
    if (!data) return null
    const { labels, matrix } = data
    const max = Math.max(...matrix.flat())

    return (
        <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[hsl(var(--primary))]" />
                Confusion Matrix
            </h3>
            <div className="overflow-x-auto">
                <table className="border-collapse mx-auto">
                    <thead>
                        <tr>
                            <th className="p-2 text-xs text-[hsl(var(--muted-foreground))]">Actual ↓ / Pred →</th>
                            {labels.map((l) => (
                                <th key={l} className="p-2 text-xs font-medium text-[hsl(var(--primary))]">{l}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {matrix.map((row, i) => (
                            <tr key={i}>
                                <td className="p-2 text-xs font-medium text-[hsl(var(--primary))] text-right pr-3">{labels[i]}</td>
                                {row.map((val, j) => {
                                    const intensity = max > 0 ? val / max : 0
                                    const isCorrect = i === j
                                    return (
                                        <td key={j} className="p-1">
                                            <div
                                                className="w-14 h-14 rounded-lg flex items-center justify-center text-sm font-bold transition-all"
                                                style={{
                                                    backgroundColor: isCorrect
                                                        ? `rgba(16, 185, 129, ${0.15 + intensity * 0.7})`
                                                        : `rgba(239, 68, 68, ${intensity * 0.5})`,
                                                    color: intensity > 0.5 ? 'white' : 'hsl(var(--foreground))',
                                                    border: isCorrect ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(239,68,68,0.2)',
                                                }}
                                            >
                                                {val}
                                            </div>
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default function Results() {
    const navigate = useNavigate()
    const { results, taskId } = useAppContext()

    if (!results) {
        navigate('/')
        return null
    }

    const { metrics, feature_importance, confusion_matrix, best_model_name } = results
    const isClassification = metrics.problem_type === 'classification'

    const fmt = (v) => (v != null ? (v * 100).toFixed(1) + '%' : 'N/A')
    const fmtNum = (v) => (v != null ? v.toFixed(4) : 'N/A')

    const metricCards = isClassification
        ? [
            { label: 'Accuracy', value: fmt(metrics.accuracy), icon: Percent, color: 'blue' },
            { label: 'F1 Score', value: fmt(metrics.f1_score), icon: Target, color: 'green' },
            { label: 'AUC', value: metrics.auc ? fmt(metrics.auc) : 'N/A', icon: TrendingUp, color: 'purple' },
        ]
        : [
            { label: 'R² Score', value: fmtNum(metrics.r2), icon: TrendingUp, color: 'blue' },
            { label: 'RMSE', value: fmtNum(metrics.rmse), icon: Activity, color: 'orange' },
            { label: 'MAE', value: fmtNum(metrics.mae), icon: Target, color: 'green' },
        ]

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
                    <div>
                        <h2 className="text-3xl font-bold gradient-text mb-1">Results Dashboard</h2>
                        <p className="text-[hsl(var(--muted-foreground))] text-sm">
                            Task: <span className="font-mono text-xs text-[hsl(var(--primary))]">{taskId}</span>
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm font-medium text-[hsl(var(--muted-foreground))] hover:bg-white/[0.03] hover:text-[hsl(var(--foreground))] transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                        New Training
                    </button>
                </div>

                {/* Best model badge */}
                <div className="glass rounded-2xl p-5 mb-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl gradient-bg border border-[hsl(var(--primary)/0.3)] flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-[hsl(var(--primary))]" />
                    </div>
                    <div>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-widest font-medium">Best Model</p>
                        <p className="text-xl font-bold text-[hsl(var(--foreground))]">{best_model_name}</p>
                    </div>
                    <div className="ml-auto px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide
            bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.3)]">
                        {metrics.problem_type}
                    </div>
                </div>

                {/* Metrics */}
                <div className={`grid gap-4 mb-6 ${metricCards.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                    {metricCards.map((m) => (
                        <MetricCard key={m.label} {...m} />
                    ))}
                </div>

                {/* Feature Importance + Confusion Matrix */}
                <div className={`grid gap-6 ${confusion_matrix ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                    {/* Feature Importance */}
                    {feature_importance && feature_importance.length > 0 && (
                        <div className="glass rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
                                <Brain className="w-5 h-5 text-[hsl(var(--accent))]" />
                                Feature Importance
                            </h3>
                            <ResponsiveContainer width="100%" height={Math.min(feature_importance.length * 36, 360)}>
                                <BarChart
                                    data={feature_importance.slice(0, 10)}
                                    layout="vertical"
                                    margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                    <XAxis
                                        type="number"
                                        tick={{ fill: 'hsl(215 20% 65%)', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="feature"
                                        width={110}
                                        tick={{ fill: 'hsl(215 20% 65%)', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'hsl(222 47% 9%)',
                                            border: '1px solid hsl(217 33% 18%)',
                                            borderRadius: '8px',
                                            color: 'hsl(210 40% 98%)',
                                            fontSize: '12px',
                                        }}
                                        formatter={(v) => [v.toFixed(4), 'Importance']}
                                    />
                                    <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                                        {feature_importance.slice(0, 10).map((_, i) => (
                                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Confusion Matrix */}
                    {isClassification && <ConfusionMatrix data={confusion_matrix} />}
                </div>
            </div>
        </div>
    )
}
