import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell,
} from 'recharts'

const API_URL = 'http://localhost:8000'

const HEATMAP_COLORS = [
    'rgba(108, 92, 231, 0.05)',
    'rgba(108, 92, 231, 0.15)',
    'rgba(108, 92, 231, 0.3)',
    'rgba(108, 92, 231, 0.5)',
    'rgba(108, 92, 231, 0.7)',
    'rgba(108, 92, 231, 0.85)',
    'rgba(108, 92, 231, 1)',
]

function getHeatmapColor(value, maxVal) {
    if (maxVal === 0) return HEATMAP_COLORS[0]
    const ratio = value / maxVal
    const idx = Math.min(Math.floor(ratio * (HEATMAP_COLORS.length - 1)), HEATMAP_COLORS.length - 1)
    return HEATMAP_COLORS[idx]
}

export default function Classification() {
    const navigate = useNavigate()
    const [status, setStatus] = useState('idle')
    const [data, setData] = useState(null)
    const [visibleLogs, setVisibleLogs] = useState([])
    const logRef = useRef(null)

    const startTraining = async () => {
        setStatus('training')
        setVisibleLogs([])
        setData(null)

        try {
            const res = await fetch(`${API_URL}/api/classification/train`)
            const result = await res.json()
            setData(result)

            result.logs.forEach((log, i) => {
                setTimeout(() => {
                    setVisibleLogs(prev => [...prev, log])
                }, i * 300)
            })

            setTimeout(() => setStatus('done'), result.logs.length * 300 + 200)
        } catch (err) {
            setVisibleLogs(prev => [...prev, `❌ Error: ${err.message}`])
            setStatus('idle')
        }
    }

    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
    }, [visibleLogs])

    const maxCMVal = data?.confusion_matrix
        ? Math.max(...data.confusion_matrix.matrix.flat())
        : 1

    return (
        <div className="page-wrapper">
            <button className="back-btn" onClick={() => navigate('/')}>← Back to Home</button>

            <div style={{ marginTop: '16px', marginBottom: '32px' }} className="fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                    }}>🏷️</div>
                    <div>
                        <h1 style={{ fontSize: '32px', fontWeight: 800 }} className="gradient-text-purple">Classification</h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                            Iris Dataset • Classify flowers into 3 species
                        </p>
                    </div>
                </div>
            </div>

            {status === 'idle' && (
                <div style={{ textAlign: 'center', padding: '48px 0' }} className="fade-in">
                    <button className="btn-primary" onClick={startTraining} style={{ fontSize: '16px', padding: '16px 48px' }}>
                        🚀 Start Training
                    </button>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '12px' }}>
                        Trains 6 models: Logistic Regression, Decision Tree, Random Forest, SVM, KNN, Gradient Boosting
                    </p>
                </div>
            )}

            {visibleLogs.length > 0 && (
                <div className="fade-in" style={{ marginBottom: '32px' }}>
                    <div className="section-title">
                        {status === 'training' && <div className="pulse-dot" />}
                        <span>{status === 'training' ? 'Training in Progress...' : 'Training Log'}</span>
                    </div>
                    <div className="log-container" ref={logRef}>
                        {visibleLogs.map((log, i) => (
                            <div key={i} className="log-entry" style={{ animationDelay: `${i * 0.05}s` }}>{log}</div>
                        ))}
                    </div>
                </div>
            )}

            {status === 'done' && data && (
                <div className="fade-in">
                    {/* Dataset Info */}
                    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
                        <div className="section-title">📋 Dataset Info</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                            <div className="metric-card">
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '4px' }}>Dataset</div>
                                <div style={{ fontSize: '16px', fontWeight: 700 }}>{data.dataset.name}</div>
                            </div>
                            <div className="metric-card">
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '4px' }}>Samples</div>
                                <div style={{ fontSize: '16px', fontWeight: 700 }}>{data.dataset.samples}</div>
                            </div>
                            <div className="metric-card">
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '4px' }}>Features</div>
                                <div style={{ fontSize: '16px', fontWeight: 700 }}>{data.dataset.features}</div>
                            </div>
                            <div className="metric-card">
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '4px' }}>Classes</div>
                                <div style={{ fontSize: '16px', fontWeight: 700 }}>{data.dataset.classes}</div>
                            </div>
                            <div className="metric-card">
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '4px' }}>Best Model</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-accent-purple)' }}>{data.best_model}</div>
                            </div>
                        </div>
                    </div>

                    {/* Model Comparison Table */}
                    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
                        <div className="section-title">📊 Model Comparison</div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="metrics-table">
                                <thead>
                                    <tr>
                                        <th>Model</th>
                                        <th>Accuracy</th>
                                        <th>Precision</th>
                                        <th>Recall</th>
                                        <th>F1 Score</th>
                                        <th>Train Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.metrics.map(m => (
                                        <tr key={m.model} className={m.model === data.best_model ? 'best-row' : ''}>
                                            <td>
                                                {m.model === data.best_model && <span style={{ marginRight: '8px' }}>🏆</span>}
                                                {m.model}
                                            </td>
                                            <td>{(m.accuracy * 100).toFixed(1)}%</td>
                                            <td>{(m.precision * 100).toFixed(1)}%</td>
                                            <td>{(m.recall * 100).toFixed(1)}%</td>
                                            <td>{(m.f1_score * 100).toFixed(1)}%</td>
                                            <td>{m.train_time}s</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                        {/* Confusion Matrix */}
                        {data.confusion_matrix && (
                            <div className="chart-container">
                                <div className="section-title" style={{ fontSize: '16px' }}>🔢 Confusion Matrix (Best Model)</div>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                    {data.confusion_matrix.labels.map(l => (
                                        <span key={l} className="badge badge-purple">{l}</span>
                                    ))}
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: `80px repeat(${data.confusion_matrix.labels.length}, 1fr)`,
                                    gap: '4px',
                                }}>
                                    {/* Header row */}
                                    <div />
                                    {data.confusion_matrix.labels.map(l => (
                                        <div key={`h-${l}`} style={{
                                            textAlign: 'center', fontSize: '11px', fontWeight: 600,
                                            color: 'var(--color-text-muted)', padding: '8px 4px',
                                        }}>
                                            {l}
                                        </div>
                                    ))}
                                    {/* Data rows */}
                                    {data.confusion_matrix.matrix.map((row, ri) => (
                                        <>
                                            <div key={`l-${ri}`} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                                                fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)',
                                                paddingRight: '8px',
                                            }}>
                                                {data.confusion_matrix.labels[ri]}
                                            </div>
                                            {row.map((val, ci) => (
                                                <div
                                                    key={`${ri}-${ci}`}
                                                    className="confusion-cell"
                                                    style={{
                                                        background: getHeatmapColor(val, maxCMVal),
                                                        color: val / maxCMVal > 0.5 ? '#fff' : 'var(--color-text-secondary)',
                                                    }}
                                                >
                                                    {val}
                                                </div>
                                            ))}
                                        </>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Per-class Metrics */}
                        {data.per_class_metrics && (
                            <div className="chart-container">
                                <div className="section-title" style={{ fontSize: '16px' }}>📌 Per-Class Performance</div>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={data.per_class_metrics} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(108, 92, 231, 0.1)" />
                                        <XAxis dataKey="class" tick={{ fill: '#9090c0', fontSize: 12 }} />
                                        <YAxis tick={{ fill: '#9090c0', fontSize: 12 }} domain={[0, 1]} />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'rgba(26, 26, 58, 0.95)',
                                                border: '1px solid rgba(108, 92, 231, 0.3)',
                                                borderRadius: '8px',
                                                color: '#e8e8ff',
                                            }}
                                        />
                                        <Bar dataKey="precision" name="Precision" fill="#6c5ce7" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="recall" name="Recall" fill="#4facfe" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="f1_score" name="F1 Score" fill="#f093fb" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Feature Importance */}
                    {data.feature_importance && data.feature_importance.length > 0 && (
                        <div className="chart-container" style={{ marginBottom: '24px' }}>
                            <div className="section-title" style={{ fontSize: '16px' }}>📌 Feature Importance</div>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={data.feature_importance} layout="vertical" margin={{ top: 10, right: 20, bottom: 10, left: 120 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(108, 92, 231, 0.1)" />
                                    <XAxis type="number" tick={{ fill: '#9090c0', fontSize: 12 }} />
                                    <YAxis dataKey="feature" type="category" tick={{ fill: '#9090c0', fontSize: 11 }} width={120} />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'rgba(26, 26, 58, 0.95)',
                                            border: '1px solid rgba(108, 92, 231, 0.3)',
                                            borderRadius: '8px',
                                            color: '#e8e8ff',
                                        }}
                                    />
                                    <Bar dataKey="importance" radius={[0, 6, 6, 0]}>
                                        {data.feature_importance.map((_, i) => (
                                            <Cell key={i} fill={`hsl(${260 + i * 20}, 70%, ${60 - i * 5}%)`} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    <div style={{ textAlign: 'center', paddingTop: '16px' }}>
                        <button className="btn-secondary" onClick={() => { setStatus('idle'); setData(null); setVisibleLogs([]) }}>
                            🔄 Train Again
                        </button>
                    </div>
                </div>
            )}

            {status === 'training' && !data && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                    <div className="spinner" />
                </div>
            )}
        </div>
    )
}
