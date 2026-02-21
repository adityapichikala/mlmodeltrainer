import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '@/context/AppContext'
import { useWebSocket, WS_STATUS } from '@/hooks/useWebSocket'
import { Terminal, Loader2, CheckCircle2, XCircle } from 'lucide-react'

function ProgressBar({ progress }) {
    return (
        <div className="w-full h-2 bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
            <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, hsl(210 100% 60%), hsl(271 91% 65%))',
                    boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)',
                }}
            />
        </div>
    )
}

const LOG_COLORS = {
    ERROR: 'text-red-400',
    WARNING: 'text-yellow-400',
    SUCCESS: 'text-green-400',
    INFO: 'text-gray-300',
}

export default function Training() {
    const navigate = useNavigate()
    const { taskId, setResults } = useAppContext()
    const { logs, status, results } = useWebSocket(taskId)
    const terminalRef = useRef(null)

    if (!taskId) {
        navigate('/')
        return null
    }

    // Auto-scroll terminal
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight
        }
    }, [logs])

    // Navigate to results on DONE
    useEffect(() => {
        if (status === WS_STATUS.DONE && results) {
            setResults(results)
            const timer = setTimeout(() => navigate('/results'), 1500)
            return () => clearTimeout(timer)
        }
    }, [status, results, navigate, setResults])

    // Estimate progress from log count (heuristic)
    const estimatedProgress = Math.min(
        status === WS_STATUS.DONE ? 100 : Math.floor((logs.length / 12) * 90),
        status === WS_STATUS.ERROR ? 100 : 95
    )

    const statusLabel = {
        [WS_STATUS.CONNECTING]: 'Connecting...',
        [WS_STATUS.CONNECTED]: 'Training in progress...',
        [WS_STATUS.DONE]: 'Training complete!',
        [WS_STATUS.ERROR]: 'Training failed',
        [WS_STATUS.CLOSED]: 'Connection closed',
    }[status] ?? 'Processing...'

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-1">Training</h2>
                    <p className="text-[hsl(var(--muted-foreground))]">
                        Task ID: <span className="font-mono text-xs text-[hsl(var(--primary))]">{taskId}</span>
                    </p>
                </div>

                {/* Status Banner */}
                <div className={`
          glass rounded-2xl p-5 mb-6 flex items-center gap-4
          ${status === WS_STATUS.DONE ? 'border-green-500/30' : ''}
          ${status === WS_STATUS.ERROR ? 'border-red-500/30' : ''}
        `}>
                    <div className="flex-shrink-0">
                        {status === WS_STATUS.DONE
                            ? <CheckCircle2 className="w-7 h-7 text-green-400" />
                            : status === WS_STATUS.ERROR
                                ? <XCircle className="w-7 h-7 text-red-400" />
                                : <Loader2 className="w-7 h-7 text-[hsl(var(--primary))] animate-spin" />
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[hsl(var(--foreground))]">{statusLabel}</p>
                        <div className="mt-2">
                            <ProgressBar progress={estimatedProgress} />
                        </div>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{estimatedProgress}% complete</p>
                    </div>
                </div>

                {/* Terminal */}
                <div className="rounded-2xl overflow-hidden border border-[hsl(var(--border))]">
                    {/* Terminal header */}
                    <div className="bg-[hsl(var(--card))] px-4 py-3 flex items-center gap-3 border-b border-[hsl(var(--border))]">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/70" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                            <div className="w-3 h-3 rounded-full bg-green-500/70" />
                        </div>
                        <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
                            <Terminal className="w-4 h-4" />
                            <span className="text-xs font-medium">automl worker — training log</span>
                        </div>
                    </div>

                    {/* Terminal body */}
                    <div
                        ref={terminalRef}
                        className="bg-[hsl(222_84%_3%)] font-mono text-sm p-5 h-96 overflow-y-auto space-y-1"
                        id="training-terminal"
                    >
                        {logs.length === 0 ? (
                            <span className="text-[hsl(var(--muted-foreground))] animate-pulse">
                                Waiting for worker to connect...
                            </span>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className="flex gap-2">
                                    <span className="text-[hsl(var(--muted-foreground))] select-none flex-shrink-0">
                                        {'>'}{String(i + 1).padStart(3, ' ')}
                                    </span>
                                    <span className={LOG_COLORS[log.type] || LOG_COLORS.INFO}>
                                        {log.message}
                                    </span>
                                </div>
                            ))
                        )}
                        {(status === WS_STATUS.CONNECTED || status === WS_STATUS.CONNECTING) && (
                            <div className="flex gap-2">
                                <span className="text-[hsl(var(--muted-foreground))] select-none">{'>'}</span>
                                <span className="text-[hsl(var(--primary))] animate-pulse">█</span>
                            </div>
                        )}
                    </div>
                </div>

                {status === WS_STATUS.DONE && (
                    <p className="text-center text-green-400 text-sm mt-4 animate-pulse">
                        Redirecting to results dashboard...
                    </p>
                )}
            </div>
        </div>
    )
}
