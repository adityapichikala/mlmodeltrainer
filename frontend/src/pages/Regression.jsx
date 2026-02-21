import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts'

const API_URL = 'http://localhost:8000'

export default function Regression() {
    const navigate = useNavigate()
    const [status, setStatus] = useState('idle') // idle | training | done
    const [data, setData] = useState(null)
    const [visibleLogs, setVisibleLogs] = useState([])
    const logRef = useRef(null)

    const startTraining = async () => {
        setStatus('training')
        setVisibleLogs([])
        setData(null)

        try {
            const res = await fetch(`${API_URL}/api/regression/train`)
            const result = await res.json()
            setData(result)

            // Animate logs one by one
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
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight
        }
    }, [visibleLogs])

    return (
        <div className="page-wrapper">
            {/* Back + Title */}
            <button className="back-btn" onClick={() => navigate('/')}>
                ← Back to Home
            </button>

            <div style={{ marginTop: '16px', marginBottom: '32px' }} className="fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #4facfe, #00d2ff)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                    }}>📈</div>
                    <div>
                        <h1 style={{ fontSize: '32px', fontWeight: 800 }} className="gradient-text-blue">Regression</h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                            California Housing Dataset • Predict median house values
                        </p>
                    </div>
                </div>
            </div>

            {/* Start Button */}
            {status === 'idle' && (
                <div style={{ textAlign: 'center', padding: '48px 0' }} className="fade-in">
                    <button className="btn-primary" onClick={startTraining} style={{ fontSize: '16px', padding: '16px 48px' }}>
                        🚀 Start Training
                    </button>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '12px' }}>
                        Trains 4 models: Linear Regression, Decision Tree, Random Forest, Gradient Boosting
                    </p>
                </div>
            )}

            {/* Training Logs */}
            {visibleLogs.length > 0 && (
                <div className="fade-in" style={{ marginBottom: '32px' }}>
                    <div className="section-title">
                        {status === 'training' && <div className="pulse-dot" />}
                        <span>{status === 'training' ? 'Training in Progress...' : 'Training Log'}</span>
                    </div>
                    <div className="log-container" ref={logRef}>
                        {visibleLogs.map((log, i) => (
                            <div key={i} className="log-entry" style={{ animationDelay: `${i * 0.05}s` }}>
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Results */}
            {status === 'done' && data && (
                <div className="fade-in">
                    {/* Dataset Info */}
                    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
                        <div className="section-title">📋 Dataset Info</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                            <div className="metric-card">
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '4px' }}>Dataset</div>
                                <div style={{ fontSize: '16px', fontWeight: 700 }}>{data.dataset.name}</div>
                            </div>
                            <div className="metric-card">
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '4px' }}>Samples</div>
                                <div style={{ fontSize: '16px', fontWeight: 700 }}>{data.dataset.samples.toLocaleString()}</div>
                            </div>
                            <div className="metric-card">
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '4px' }}>Features</div>
                                <div style={{ fontSize: '16px', fontWeight: 700 }}>{data.dataset.features}</div>
                            </div>
                            <div className="metric-card">
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '4px' }}>Best Model</div>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-accent-blue)' }}>{data.best_model}</div>
                            </div>
                        </div>
                    </div>

                    {/* Metrics Table */}
                    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
                        <div className="section-title">📊 Model Comparison</div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="metrics-table">
                                <thead>
                                    <tr>
                                        <th>Model</th>
                                        <th>R² Score</th>
                                        <th>RMSE</th>
                                        <th>MAE</th>
                                        <th>Train Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.metrics.map((m) => (
                                        <tr key={m.model} className={m.model === data.best_model ? 'best-row' : ''}>
                                            <td>
                                                {m.model === data.best_model && <span style={{ marginRight: '8px' }}>🏆</span>}
                                                {m.model}
                                            </td>
                                            <td>{m.r2}</td>
                                            <td>{m.rmse}</td>
                                            <td>{m.mae}</td>
                                            <td>{m.train_time}s</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Charts */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                        {/* Predicted vs Actual */}
                        <div className="chart-container">
                            <div className="section-title" style={{ fontSize: '16px' }}>🎯 Predicted vs Actual</div>
                            <ResponsiveContainer width="100%" height={350}>
                                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(108, 92, 231, 0.1)" />
                                    <XAxis
                                        dataKey="actual" name="Actual" type="number"
                                        tick={{ fill: '#9090c0', fontSize: 12 }}
                                        label={{ value: 'Actual Value', position: 'bottom', fill: '#9090c0', fontSize: 12 }}
                                    />
                                    <YAxis
                                        dataKey="predicted" name="Predicted" type="number"
                                        tick={{ fill: '#9090c0', fontSize: 12 }}
                                        label={{ value: 'Predicted', angle: -90, position: 'left', fill: '#9090c0', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'rgba(26, 26, 58, 0.95)',
                                            border: '1px solid rgba(108, 92, 231, 0.3)',
                                            borderRadius: '8px',
                                            color: '#e8e8ff',
                                        }}
                                    />
                                    <Scatter data={data.chart_data} fill="#4facfe" fillOpacity={0.6} r={4} />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Feature Importance */}
                        {data.feature_importance && data.feature_importance.length > 0 && (
                            <div className="chart-container">
                                <div className="section-title" style={{ fontSize: '16px' }}>📌 Feature Importance</div>
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={data.feature_importance} layout="vertical" margin={{ top: 10, right: 20, bottom: 10, left: 80 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(108, 92, 231, 0.1)" />
                                        <XAxis type="number" tick={{ fill: '#9090c0', fontSize: 12 }} />
                                        <YAxis dataKey="feature" type="category" tick={{ fill: '#9090c0', fontSize: 12 }} width={80} />
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
                                                <Cell key={i} fill={`hsl(${220 + i * 15}, 80%, ${60 - i * 2}%)`} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Train Again */}
                    <div style={{ textAlign: 'center', paddingTop: '16px' }}>
                        <button className="btn-secondary" onClick={() => { setStatus('idle'); setData(null); setVisibleLogs([]) }}>
                            🔄 Train Again
                        </button>
                    </div>
                </div>
            )}

            {/* Loading Spinner */}
            {status === 'training' && !data && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                    <div className="spinner" />
                </div>
            )}
        </div>
    )
}
