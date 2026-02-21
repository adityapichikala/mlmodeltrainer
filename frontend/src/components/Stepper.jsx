import { Check, Upload, Settings, Activity, BarChart3 } from 'lucide-react'

const steps = [
    { id: 0, label: 'Upload', icon: Upload },
    { id: 1, label: 'Configure', icon: Settings },
    { id: 2, label: 'Training', icon: Activity },
    { id: 3, label: 'Results', icon: BarChart3 },
]

export default function Stepper({ currentStep }) {
    return (
        <div className="flex items-center justify-center mb-10 px-4">
            {steps.map((step, idx) => {
                const Icon = step.icon
                const isCompleted = currentStep > step.id
                const isActive = currentStep === step.id

                return (
                    <div key={step.id} className="flex items-center">
                        <div className="flex flex-col items-center gap-2">
                            <div
                                className={`
                  w-11 h-11 rounded-full flex items-center justify-center
                  transition-all duration-300 font-semibold text-sm
                  ${isCompleted
                                        ? 'bg-[hsl(142_76%_45%)] text-white shadow-lg shadow-green-500/30'
                                        : isActive
                                            ? 'bg-[hsl(210_100%_60%)] text-white shadow-lg shadow-blue-500/30 scale-110'
                                            : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]'
                                    }
                `}
                            >
                                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                            </div>
                            <span
                                className={`text-xs font-medium transition-colors ${isActive ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'
                                    }`}
                            >
                                {step.label}
                            </span>
                        </div>

                        {idx < steps.length - 1 && (
                            <div
                                className={`h-0.5 w-16 md:w-24 mx-2 mb-6 rounded-full transition-all duration-500 ${currentStep > step.id
                                        ? 'bg-[hsl(142_76%_45%)]'
                                        : 'bg-[hsl(var(--border))]'
                                    }`}
                            />
                        )}
                    </div>
                )
            })}
        </div>
    )
}
