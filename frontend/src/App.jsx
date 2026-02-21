import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AppProvider, useAppContext } from '@/context/AppContext'
import Stepper from '@/components/Stepper'
import Upload from '@/pages/Upload'
import Configure from '@/pages/Configure'
import Training from '@/pages/Training'
import Results from '@/pages/Results'

const STEP_MAP = { '/': 0, '/configure': 1, '/training': 2, '/results': 3 }

function Layout() {
  const location = useLocation()
  const step = STEP_MAP[location.pathname] ?? 0

  return (
    <div className="min-h-screen" style={{ background: 'hsl(222 84% 5%)' }}>
      {/* Top bar */}
      <header className="border-b border-[hsl(var(--border))] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-bg border border-[hsl(var(--primary)/0.3)] flex items-center justify-center">
            <span className="text-sm font-bold gradient-text">A</span>
          </div>
          <span className="font-semibold text-[hsl(var(--foreground))]">AutoML Studio</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]">
            beta
          </span>
        </div>
      </header>

      {/* Stepper */}
      <div className="max-w-6xl mx-auto pt-8 px-6">
        <Stepper currentStep={step} />
      </div>

      {/* Page */}
      <Routes>
        <Route path="/" element={<Upload />} />
        <Route path="/configure" element={<Configure />} />
        <Route path="/training" element={<Training />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AppProvider>
  )
}
