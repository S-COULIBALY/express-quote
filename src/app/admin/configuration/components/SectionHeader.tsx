import { ReactNode } from "react"

interface SectionHeaderProps {
  icon: ReactNode
  title: string
  description: string
  color: "blue" | "green" | "purple"
}

export function SectionHeader({ icon, title, description, color }: SectionHeaderProps) {
  const colorStyles = {
    blue: "from-blue-50 to-blue-100/50 text-blue-600",
    green: "from-green-50 to-green-100/50 text-green-600",
    purple: "from-purple-50 to-purple-100/50 text-purple-600"
  }

  return (
    <div className="flex items-center gap-4 mb-8">
      <div className={`p-3 bg-gradient-to-br ${colorStyles[color]} rounded-xl shadow-inner`}>
        <div className="h-6 w-6 opacity-90">
          {icon}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="text-gray-600 text-sm mt-1">
          {description}
        </p>
      </div>
    </div>
  )
} 