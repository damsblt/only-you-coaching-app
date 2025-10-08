import React from "react"

interface SectionProps {
  className?: string
  title?: string
  subtitle?: string
  children: React.ReactNode
  gradient?: "soft" | "neutral" | "elegant" | "pinkYellow"
}

const gradientClasses: Record<NonNullable<SectionProps["gradient"]>, string> = {
  soft: "bg-soft-gradient",
  neutral: "bg-neutral-50",
  elegant: "bg-elegant-gradient",
  pinkYellow: "bg-gradient-to-br from-pink-50 to-yellow-50",
}

export function Section({ className = "", title, subtitle, children, gradient = "neutral" }: SectionProps) {
  return (
    <section className={`py-20 relative overflow-hidden ${gradientClasses[gradient]} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <div className="organic-text-container bg-white/60 backdrop-blur-sm inline-block">
                <h2 className="text-3xl md:text-4xl font-bold text-accent-500 mb-4">{title}</h2>
              </div>
            )}
            {subtitle && (
              <p className="text-xl text-accent-600 max-w-3xl mx-auto mt-6">{subtitle}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}

export default Section


