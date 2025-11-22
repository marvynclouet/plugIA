'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sparkles, Menu, X } from 'lucide-react'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7C5CFF] to-[#44E2FF]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-xl font-semibold text-white">VistaFlow</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link href="#features" className="text-sm text-white/70 hover:text-white transition-colors">
            Fonctionnalités
          </Link>
          <Link href="#pricing" className="text-sm text-white/70 hover:text-white transition-colors">
            Tarification
          </Link>
          <Link href="/legal/privacy" className="text-sm text-white/70 hover:text-white transition-colors">
            Confidentialité
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild className="hidden md:inline-flex">
            <Link href="/login">Connexion</Link>
          </Button>
          <Button asChild className="hidden md:inline-flex gap-2">
            <Link href="/login">
              Commencer
              <span className="ml-1">→</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-black/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-4 px-4 py-6">
            <Link
              href="#features"
              className="text-sm text-white/70 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Fonctionnalités
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-white/70 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tarification
            </Link>
            <Link
              href="/legal/privacy"
              className="text-sm text-white/70 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Confidentialité
            </Link>
            <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
              <Button variant="ghost" asChild className="w-full justify-start">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  Connexion
                </Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  Commencer
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

