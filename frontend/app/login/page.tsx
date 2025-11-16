'use client'

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Zap } from 'lucide-react'

import { login, register } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

const highlights = [
  'Détecte les fans ultra engagés 💜',
  'Automatise tes DM multi-plateformes ⚡️',
  'Connecte Instagram, TikTok, LinkedIn & X',
]

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await register(email, password, name)
      }
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_farthest-corner,_rgba(87,67,255,0.25),_transparent_40%),radial-gradient(circle_at_top,_rgba(65,225,255,0.18),_transparent_35%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-16 md:flex-row md:items-center md:gap-12">
        <div className="md:w-1/2 space-y-8">
          <Badge variant="neon" className="w-fit">
            <Sparkles className="mr-2 h-4 w-4" />
            Nouvelle génération
          </Badge>
          <div className="space-y-4">
            <h1 className="font-display text-4xl leading-tight text-white md:text-5xl">
              VistaFlow ✨ <br /> Ton copilote IA pour convertir tes interactions socials en leads chauds.
            </h1>
            <p className="text-lg text-white/70">
              Analyse chaque like, DM et commentaire en temps réel. Automatise des conversations ultra personnalisées
              pour capturer numéros, emails et insights business.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {highlights.map((item) => (
              <Card key={item} className="border-white/5 bg-white/5">
                <CardContent className="flex items-start gap-3 p-4">
                  <span className="mt-1 rounded-full bg-white/10 p-1.5">
                    <Zap className="h-4 w-4 text-[#66E4FF]" />
                  </span>
                  <p className="text-sm text-white/80">{item}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="md:w-1/2">
          <Card className="bg-[#0f1629]/80 p-8">
            <div className="text-center space-y-2">
              <p className="text-sm uppercase tracking-[0.3em] text-white/40">
                {isLogin ? 'Re-bienvenue' : 'Onboard en 60s'}
              </p>
              <h2 className="font-display text-2xl text-white">
                {isLogin ? 'Connexion 🔐' : "Créer mon cockpit 🚀"}
              </h2>
              <p className="text-sm text-white/60">
                {isLogin
                  ? 'Reprends tes conversations là où tu les as laissées'
                  : 'Connecte ton premier réseau et active les DM IA'}
              </p>
            </div>
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Pseudo ou Nom</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="@maviecreative"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="studio@vistaflow.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-white/40">8 caractères minimum, un emoji 👉 😉</p>
              </div>

              <Button type="submit" disabled={loading} className="w-full text-base">
                {loading ? 'Chargement...' : isLogin ? 'Se connecter' : "Lancer VistaFlow"}
              </Button>

              <div className="text-center text-sm text-white/60">
                {isLogin ? "Pas encore de compte ?" : 'Déjà onboard ?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setError('')
                  }}
                  className="text-[#66E4FF] underline-offset-4 hover:underline"
                >
                  {isLogin ? "Je crée mon accès" : "Je me connecte"}
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}

