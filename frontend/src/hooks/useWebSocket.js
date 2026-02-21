import { useState, useEffect, useRef, useCallback } from 'react'

export const WS_STATUS = {
    CONNECTING: 'CONNECTING',
    CONNECTED: 'CONNECTED',
    DONE: 'DONE',
    ERROR: 'ERROR',
    CLOSED: 'CLOSED',
}

export function useWebSocket(taskId) {
    const [logs, setLogs] = useState([])
    const [status, setStatus] = useState(WS_STATUS.CONNECTING)
    const [results, setResults] = useState(null)
    const wsRef = useRef(null)

    const connect = useCallback(() => {
        if (!taskId) return
        const ws = new WebSocket(`ws://localhost:8000/ws/${taskId}`)
        wsRef.current = ws
        setStatus(WS_STATUS.CONNECTING)

        ws.onopen = () => {
            setStatus(WS_STATUS.CONNECTED)
        }

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                if (data.type === 'DONE') {
                    setStatus(WS_STATUS.DONE)
                    if (data.results) setResults(data.results)
                    setLogs((prev) => [...prev, { type: 'SUCCESS', message: data.message || '✅ Training complete!' }])
                } else if (data.type === 'ERROR') {
                    setStatus(WS_STATUS.ERROR)
                    setLogs((prev) => [...prev, { type: 'ERROR', message: data.message }])
                } else if (data.type === 'LOG') {
                    setLogs((prev) => [...prev, { type: data.level || 'INFO', message: data.message }])
                }
            } catch {
                setLogs((prev) => [...prev, { type: 'INFO', message: event.data }])
            }
        }

        ws.onerror = () => {
            setStatus(WS_STATUS.ERROR)
            setLogs((prev) => [...prev, { type: 'ERROR', message: '⚠️ WebSocket connection error.' }])
        }

        ws.onclose = () => {
            setStatus((prev) => prev === WS_STATUS.DONE || prev === WS_STATUS.ERROR ? prev : WS_STATUS.CLOSED)
        }
    }, [taskId])

    useEffect(() => {
        connect()
        return () => {
            if (wsRef.current) wsRef.current.close()
        }
    }, [connect])

    return { logs, status, results }
}
