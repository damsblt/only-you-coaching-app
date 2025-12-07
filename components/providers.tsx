"use client"

import { SimpleAuthProvider } from "./providers/SimpleAuthProvider"
import { ThemeProvider } from "./providers/ThemeProvider"
import { ReactNode } from "react"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SimpleAuthProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        {children}
      </ThemeProvider>
    </SimpleAuthProvider>
  )
}

