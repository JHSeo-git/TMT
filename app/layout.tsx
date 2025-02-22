import "./globals.css"

import type { Metadata } from "next"
import { Geist_Mono } from "next/font/google"
import localFont from "next/font/local"
import { ViewTransitions } from "next-view-transitions"

import { cn } from "@/lib/utils"

const pretendard = localFont({
  src: "./PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-family-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: {
    default: "TMT",
    template: "%s | TMT",
  },
  description: "Too many thoughts",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ViewTransitions>
      <html lang="ko">
        <body className={cn("antialiased", pretendard.className, geistMono.variable)}>
          <div className="bg-background text-foreground flex min-h-screen flex-col justify-between p-8 pt-0 pb-0 md:pt-8">
            <main className="mx-auto w-full max-w-[60ch]">{children}</main>
            <Footer />
          </div>
        </body>
      </html>
    </ViewTransitions>
  )
}

const links = [{ name: "github", url: "https://github.com/JHSeo-git/TMT/issues" }]

function Footer() {
  return (
    <footer className="mt-14 flex h-[var(--footer-height)] items-center justify-center">
      <div className="flex justify-center space-x-4 tracking-tight">
        {links.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 transition-colors duration-200 hover:text-blue-500"
          >
            {link.name}
          </a>
        ))}
      </div>
    </footer>
  )
}
