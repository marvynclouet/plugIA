import Link from 'next/link'
import { ArrowRight, Play } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const logos = ['openai', 'notion', 'slack', 'hubspot', 'salesforce', 'stripe']

const features = [
  {
    title: 'Agents sociaux autonomes',
    description: 'Détectent les signaux chauds, personnalisent les DM et respectent les règles de chaque plateforme.',
  },
  {
    title: 'Console unifiée',
    description: 'Vue Pulse qui mixe interactions, scoring, séquences DM et push vers Sheets/Notion.',
  },
  {
    title: 'API & webhooks',
    description: 'Connecte VistaFlow à ton CRM ou ton stack no-code. Webhooks sécurisés + audit log.',
  },
]

const chatDemo = [
  {
    actor: 'Fan TikTok',
    tone: 'text-[#66E4FF]',
    tag: 'Commentaire',
    text: '“Hey c’est lourd ce que tu fais 🔥 je veux apprendre”',
  },
  {
    actor: 'VistaFlow DM',
    tone: 'text-white',
    tag: 'DM IA #1',
    text: '“Yo Léo ! Merci pour le love. Tu veux qu’on t’envoie la formation ? 👇”',
  },
  {
    actor: 'Fan TikTok',
    tone: 'text-[#66E4FF]',
    tag: 'Réponse',
    text: '“Yes go, j’ai 5k followers mais besoin de process 🙏”',
  },
  {
    actor: 'VistaFlow DM',
    tone: 'text-white',
    tag: 'DM IA #2',
    text: '“Drop ton 06 ou WhatsApp et on t’ajoute dans la session privée.”',
  },
  {
    actor: 'Fan TikTok',
    tone: 'text-[#66E4FF]',
    tag: 'Lead capté',
    text: '+33 6 45 32 10 98',
  },
]

const steps = [
  {
    badge: 'Step 1',
    title: 'Onboard tes réseaux',
    copy: 'Instagram, TikTok, LinkedIn, X en OAuth officiel. Tokens chiffrés AES-256.',
    code: `await vistaflow.connect({
  platform: 'instagram',
  workspaceId: 'crew-studio',
})`,
  },
  {
    badge: 'Step 2',
    title: 'Définis ton ton & prompts',
    copy: 'Choisis ton ton (pro, chill, hype), les triggers et le nombre de follow-ups IA.',
    code: `vistaflow.sequence({
  trigger: ['comment', 'story_reply'],
  maxMessages: 3,
  persona: 'mentor_tiktok_fr',
})`,
  },
  {
    badge: 'Step 3',
    title: 'Sync vers tes outils',
    copy: 'Chaque info captée file en direct vers Sheets, Notion, CRM ou webhook.',
    code: `vistaflow.sync({
  destination: 'notion',
  databaseId: 'lead-pulse',
  auto: true,
})`,
  },
]

const connectors = [
  { name: 'Instagram', emoji: '📸' },
  { name: 'TikTok', emoji: '🎵' },
  { name: 'LinkedIn', emoji: '💼' },
  { name: 'X / Twitter', emoji: '🐦' },
  { name: 'Gmail', emoji: '✉️' },
  { name: 'Google Sheets', emoji: '📊' },
  { name: 'Notion', emoji: '🧠' },
  { name: 'Slack', emoji: '💬' },
  { name: 'Webhook', emoji: '🔗' },
]

const testimonials = [
  {
    author: 'Lou, CEO @ Studio Pulse',
    message:
      'VistaFlow nous a fait gagner 11h par semaine. 32 leads par campagne TikTok, 18% de conversion sur WhatsApp.',
  },
  {
    author: 'Eliott, Growth @ Label 808',
    message:
      "Les DM auto sont plus humains que nos messages manuels. On récupère des numéros + consentements en 2 échanges.",
  },
  {
    author: 'Cam, Community Builder',
    message:
      'Anti-spam intégré. On respecte les quotas Meta/X tout en gardant un pipeline plein. On pilote tout depuis Pulse.',
  },
]

export default function LandingPage() {
  return (
    <div className="space-y-24 py-16">
      <section className="relative mx-auto max-w-6xl overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-br from-[#0C0F17] via-[#090B12] to-[#05070C] px-8 py-16 shadow-[0_40px_120px_rgba(4,7,18,0.65)]">
        <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Badge variant="ghost" className="w-fit text-white/60">
              ⚡ Social AI Orchestrator
            </Badge>
            <h1 className="font-display text-4xl leading-tight text-white md:text-5xl">
              Convertis tes interactions socials en pipeline qualifié.
            </h1>
            <p className="text-lg text-white/70">
              VistaFlow analyse likes, DM, stories, commente en ton nom, récupère les numéros et push vers tes outils.
              100% API officielles, 0 bannissement.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="gap-2">
                <Link href="/login">
                  Commencer maintenant
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="subtle" asChild className="gap-2">
                <Link href="/dashboard">
                  Voir Pulse
                  <Play className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="rounded-[32px] border border-white/5 bg-black/40 p-6">
            <div className="mb-4 flex items-center justify-between text-xs text-white/40">
              <span>chatflow.ts</span>
              <span>Live DM</span>
            </div>
            <div className="space-y-4">
              {chatDemo.map((msg, idx) => (
                <div
                  key={msg.text}
                  className={cn(
                    'rounded-3xl border border-white/10 px-4 py-3 text-sm text-white/80 shadow-[0_15px_40px_rgba(5,7,20,0.6)]',
                    idx % 2 === 0 ? 'ml-0 mr-6 bg-white/5' : 'ml-6 mr-0 bg-[#141A29]'
                  )}
                >
                  <div className="mb-1 flex items-center justify-between text-xs text-white/40">
                    <span className={msg.tone}>{msg.actor}</span>
                    <span>{msg.tag}</span>
                  </div>
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-10 top-1/2 h-64 w-64 translate-y-[-50%] rounded-full bg-[#7C5CFF]/30 blur-[120px]" />
      </section>

      <section className="space-y-6 px-4">
        <p className="text-center text-xs uppercase tracking-[0.6em] text-white/30">Loved by modern teams</p>
        <div className="flex flex-wrap items-center justify-center gap-6 text-white/40">
          {logos.map((logo) => (
            <span key={logo} className="text-sm tracking-widest uppercase">
              {logo}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="space-y-10 px-4">
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.6em] text-white/40">How VistaFlow works</p>
          <h2 className="font-display text-3xl text-white">3 étapes pour automatiser tes interactions sociales</h2>
        </div>
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <Card key={step.title} className="border-white/10 bg-white/5">
              <CardHeader>
                <Badge variant="ghost">{step.badge}</Badge>
                <CardTitle className="text-white">{step.title}</CardTitle>
                <CardDescription>{step.copy}</CardDescription>
              </CardHeader>
              <CardContent className="rounded-2xl bg-black/60 p-4 font-mono text-xs text-white/80">
                <pre>{step.code}</pre>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl rounded-[32px] border border-white/10 bg-white/5 p-10 px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div key={testimonial.author} className="space-y-3 rounded-3xl border border-white/5 bg-black/30 p-6">
              <p className="text-base text-white/80">{testimonial.message}</p>
              <p className="text-sm text-white/40">{testimonial.author}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl rounded-[32px] border border-white/10 bg-white/5 p-10 px-6">
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-white/40">Connectors</p>
            <h3 className="font-display text-2xl text-white">Tout l’écosystème social & CRM, plug-and-play</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {connectors.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white/70"
              >
                <span className="text-2xl">{item.emoji}</span>
                <p>{item.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111827] to-[#070B13] p-10 text-center">
        <p className="text-xs uppercase tracking-[0.6em] text-white/40">Prêt à scaler ton crew ?</p>
        <h3 className="mt-4 font-display text-3xl text-white">VistaFlow Crew Access</h3>
        <p className="mt-3 text-white/70">Plan Beta limité. Support white-glove + templates AI personnalisés.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button asChild>
            <Link href="/login">Onboard maintenant</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="mailto:hey@vistaflow.ai">Parler avec nous</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

