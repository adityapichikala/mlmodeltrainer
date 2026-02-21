import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '@/context/AppContext'
import { startTraining } from '@/lib/api'
import { ChevronDown, Play, AlertCircle, Table } from 'lucide-react'

export default function Configure() {
    const navigate = useNavigate()
    const { uploadData, setTaskId } = useAppContext()
    const [targetCol, setTargetCol] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    if (!uploadData) {
        navigate('/')
        return null
    }

    const { columns, preview, filename, row_count } = uploadData

    const handleTrain = async () => {
        if (!targetCol) { setError('Please select a target column.'); return }
        setError(null)
        setLoading(true)
        try {
            const res = await startTraining(filename, targetCol)
            setTaskId(res.data.task_id)
            navigate('/training')
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to start training.')
            setLoading(false)
        }
    }

    const previewCols = columns.slice(0, 8)
    const previewRows = preview.slice(0, 8)

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-1">Configure Training</h2>
                    <p className="text-[hsl(var(--muted-foreground))]">
                        <span className="text-[hsl(var(--primary))]">{filename.split('_').slice(1).join('_') || filename}</span>
                        &nbsp;·&nbsp;{row_count} rows&nbsp;·&nbsp;{columns.length} columns
                    </p>
                </div>

                {/* Preview Table */}
                <div className="glass rounded-2xl overflow-hidden mb-6">
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-[hsl(var(--border))]">
                        <Table className="w-4 h-4 text-[hsl(var(--primary))]" />
                        <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                            Data Preview (first 8 rows)
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[hsl(var(--border))]">
                                    {previewCols.map((col) => (
                                        <th
                                            key={col.name}
                                            className={`px-4 py-3 text-left font-medium transition-colors ${col.name === targetCol
                                                    ? 'text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)]'
                                                    : 'text-[hsl(var(--muted-foreground))]'
                                                }`}
                                        >
                                            <div>{col.name}</div>
                                            <div className="text-xs font-normal opacity-60">{col.dtype}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {previewRows.map((row, i) => (
                                    <tr
                                        key={i}
                                        className={`border-b border-[hsl(var(--border)/0.5)] transition-colors ${i % 2 === 0 ? 'bg-white/[0.01]' : ''
                                            }`}
                                    >
                                        {previewCols.map((col) => (
                                            <td
                                                key={col.name}
                                                className={`px-4 py-2.5 text-[hsl(var(--foreground))] ${col.name === targetCol ? 'bg-[hsl(var(--primary)/0.05)]' : ''
                                                    }`}
                                            >
                                                {String(row[col.name] ?? '')}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {columns.length > 8 && (
                        <p className="text-xs text-center py-2 text-[hsl(var(--muted-foreground))]">
                            +{columns.length - 8} more columns not shown
                        </p>
                    )}
                </div>

                {/* Target Column Selector */}
                <div className="glass rounded-2xl p-6 mb-6">
                    <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-3">
                        Select Target Column <span className="text-[hsl(var(--destructive))]">*</span>
                    </label>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">
                        The column you want the model to predict. Regression or classification is auto-detected.
                    </p>
                    <div className="relative max-w-sm">
                        <select
                            id="target-col-select"
                            value={targetCol}
                            onChange={(e) => { setTargetCol(e.target.value); setError(null) }}
                            className={`
                w-full appearance-none bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]
                border rounded-xl px-4 py-3 pr-10 text-sm cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)]
                transition-colors
                ${targetCol ? 'border-[hsl(var(--primary)/0.5)]' : 'border-[hsl(var(--border))]'}
              `}
                        >
                            <option value="">-- Choose a column --</option>
                            {columns.map((col) => (
                                <option key={col.name} value={col.name}>
                                    {col.name} ({col.dtype})
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))] pointer-events-none" />
                    </div>

                    {targetCol && (
                        <div className="mt-4 flex items-start gap-3 p-4 rounded-xl gradient-bg border border-[hsl(var(--primary)/0.2)]">
                            <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] mt-1.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-[hsl(var(--foreground))]">Target: <span className="text-[hsl(var(--primary))]">{targetCol}</span></p>
                                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                                    Problem type (Regression vs Classification) will be auto-detected from this column's data.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-[hsl(var(--destructive)/0.15)] border border-[hsl(var(--destructive)/0.3)] text-[hsl(var(--destructive))]">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 rounded-xl border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] text-sm font-medium hover:bg-white/[0.03] transition-colors"
                    >
                        ← Back
                    </button>
                    <button
                        id="start-training-btn"
                        onClick={handleTrain}
                        disabled={!targetCol || loading}
                        className={`
              flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold
              transition-all duration-200
              ${targetCol && !loading
                                ? 'bg-[hsl(var(--primary))] text-white hover:bg-[hsl(210_100%_55%)] shadow-lg shadow-blue-500/20 hover:scale-[1.02]'
                                : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] cursor-not-allowed'
                            }
            `}
                    >
                        <Play className="w-4 h-4" />
                        {loading ? 'Starting...' : 'Start Training'}
                    </button>
                </div>
            </div>
        </div>
    )
}
