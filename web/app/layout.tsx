import React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Fira_Code } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira-code",
})

export const metadata: Metadata = {
  title: "ClawBridge Console",
  description: "AI Gateway & Model Router Console",
}

export const viewport: Viewport = {
  themeColor: "#f48120",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className="dark">
      <body className={`${inter.variable} ${firaCode.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
