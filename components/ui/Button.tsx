"use client"

import React from "react"
import Link from "next/link"

type ButtonVariant = "primary" | "outline" | "white" | "ghost"
type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

const baseClasses = "curved-button inline-flex items-center justify-center font-semibold transition-all"

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-gradient-to-r from-secondary-500 to-accent-500 text-white shadow-organic hover:shadow-floating",
  outline: "border-2 border-secondary-500 text-secondary-500 bg-white/80 backdrop-blur-sm hover:bg-secondary-500 hover:text-white",
  white: "bg-white text-accent-500 shadow-organic hover:shadow-floating",
  ghost: "text-accent-600 hover:text-white hover:bg-secondary-500/90",
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-5 py-3 text-sm",
  lg: "px-8 py-4",
}

export function Button({ href, variant = "primary", size = "md", fullWidth, className = "", children, ...props }: ButtonProps) {
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? "w-full" : "",
    className,
  ].filter(Boolean).join(" ")

  if (href) {
    return (
      <Link href={href} className={classes} {...(props as React.ComponentProps<typeof Link>)}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}

export default Button


