import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CloudUpload, FileText, AlertCircle, Loader2 } from 'lucide-react'
import { uploadCSV } from '@/lib/api'
import { useAppContext } from '@/context/AppContext'

export default function Upload() {
    const navigate = useNavigate()
    const { setUploadData } = useAppContext()
    const [dragging, setDragging] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [fileName, setFileName] = useState(null)

    const handleFile = useCallback(async (file) => {
        if (!file) return
        if (!file.name.endsWith('.csv')) {
            setError('Only .csv files are supported.')
            return
        }
        setError(null)
        setFileName(file.name)
        setLoading(true)
        try {
            const res = await uploadCSV(file)
            setUploadData(res.data)
            navigate('/configure')
        } catch (err) {
            setError(err.response?.data?.detail || 'Upload failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [navigate, setUploadData])

    const onDrop = useCallback((e) => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files[0]
        handleFile(file)
    }, [handleFile])

    const onInputChange = (e) => handleFile(e.target.files[0])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-5xl font-bold gradient-text mb-3">AutoML Studio</h1>
                    <p className="text-[hsl(var(--muted-foreground))] text-lg">
                        Upload a CSV, select a target, and let AI train your model.
                    </p>
                </div>

                {/* Drop Zone */}
                <label
                    htmlFor="csv-input"
                    onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    className={`
            relative flex flex-col items-center justify-center gap-5
            rounded-2xl border-2 border-dashed p-16 cursor-pointer
            transition-all duration-300
            ${dragging
                            ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] scale-[1.01]'
                            : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.6)] hover:bg-white/[0.02]'
                        }
            ${loading ? 'pointer-events-none opacity-70' : ''}
          `}
                >
                    <div className={`
            w-20 h-20 rounded-2xl flex items-center justify-center
            transition-all duration-300
            ${dragging ? 'gradient-bg scale-110' : 'bg-[hsl(var(--secondary))]'}
          `}>
                        {loading
                            ? <Loader2 className="w-9 h-9 text-[hsl(var(--primary))] animate-spin" />
                            : <CloudUpload className="w-9 h-9 text-[hsl(var(--primary))]" />
                        }
                    </div>

                    <div className="text-center">
                        {loading ? (
                            <p className="text-[hsl(var(--foreground))] font-semibold text-lg">Uploading {fileName}...</p>
                        ) : fileName ? (
                            <>
                                <div className="flex items-center gap-2 justify-center text-[hsl(var(--primary))] font-semibold text-lg">
                                    <FileText className="w-5 h-5" />
                                    {fileName}
                                </div>
                                <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">Click to change file</p>
                            </>
                        ) : (
                            <>
                                <p className="text-[hsl(var(--foreground))] font-semibold text-lg">
                                    Drop your CSV here
                                </p>
                                <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
                                    or <span className="text-[hsl(var(--primary))]">click to browse</span>
                                </p>
                            </>
                        )}
                        <p className="text-[hsl(var(--muted-foreground)/0.6)] text-xs mt-3">
                            Accepts .csv files · Any size · Dirty data OK
                        </p>
                    </div>
                    <input
                        id="csv-input"
                        type="file"
                        accept=".csv"
                        className="sr-only"
                        onChange={onInputChange}
                    />
                </label>

                {/* Error */}
                {error && (
                    <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-[hsl(var(--destructive)/0.15)] border border-[hsl(var(--destructive)/0.3)] text-[hsl(var(--destructive))]">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {/* Tips */}
                <div className="mt-8 grid grid-cols-3 gap-4">
                    {[
                        { label: 'Any Format', desc: 'Handles mixed types, nulls, and categorical data' },
                        { label: 'Auto-Detect', desc: 'Regression vs Classification decided for you' },
                        { label: 'Real-Time', desc: 'Live training progress streamed to your browser' },
                    ].map((tip) => (
                        <div key={tip.label} className="glass rounded-xl p-4 text-center">
                            <p className="font-semibold text-sm text-[hsl(var(--foreground))] mb-1">{tip.label}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">{tip.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
