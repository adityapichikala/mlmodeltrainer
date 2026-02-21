import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
    const [uploadData, setUploadData] = useState(null) // { filename, columns, preview, row_count }
    const [taskId, setTaskId] = useState(null)
    const [results, setResults] = useState(null)

    return (
        <AppContext.Provider value={{ uploadData, setUploadData, taskId, setTaskId, results, setResults }}>
            {children}
        </AppContext.Provider>
    )
}

export function useAppContext() {
    const ctx = useContext(AppContext)
    if (!ctx) throw new Error('useAppContext must be used inside AppProvider')
    return ctx
}
