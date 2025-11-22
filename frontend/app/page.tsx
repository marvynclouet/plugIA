import Link from 'next/link'
import { ArrowRight, Play, Check, Zap, Crown, Sparkles } from 'lucide-react'
import { 
  FaInstagram, 
  FaFacebook, 
  FaTiktok, 
  FaLinkedin, 
  FaTwitter,
  FaEnvelope,
  FaTable,
  FaBrain,
  FaSlack,
  FaLink
} from 'react-icons/fa'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/navbar'
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
    description: 'Connecte Flow IA à ton CRM ou ton stack no-code. Webhooks sécurisés + audit log.',
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
    actor: 'Flow IA DM',
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
    actor: 'Flow IA DM',
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
    badge: '1. Capter',
    copy: 'Ton contenu génère des interactions. Flow.IA les attrape toutes en temps réel, sans limite, sans oubli.',
    code: null,
  },
  {
    badge: '2. Engager',
    copy: "Une IA analyse chaque profil, ouvre la discussion, répond, pose les bonnes questions et mène la personne jusqu'à l'action.",
    code: null,
  },
  {
    badge: '3. Convertir',
    copy: 'Les prospects qualifiés (numéro, infos clés, intérêt) remontent automatiquement dans ton dashboard ou ton outil de gestion (Notion, Airtable, CRM, peu importe).',
    code: null,
  },
]

const connectors = [
  { name: 'Instagram', icon: FaInstagram, color: 'from-[#F58529] via-[#DD2A7B] to-[#515BD4]' },
  { name: 'Facebook', icon: FaFacebook, color: 'from-[#1877F2] to-[#42A5F5]' },
  { name: 'TikTok', icon: FaTiktok, color: 'from-[#25F4EE] to-[#FE2C55]' },
  { name: 'LinkedIn', icon: FaLinkedin, color: 'from-[#0077B5] to-[#00A0DC]' },
  { name: 'X / Twitter', icon: FaTwitter, color: 'from-[#4B4B4B] to-[#0F0F0F]' },
  { name: 'Gmail', icon: FaEnvelope, color: 'from-[#EA4335] to-[#FBBC04]' },
  { name: 'Google Sheets', icon: FaTable, color: 'from-[#0F9D58] to-[#34A853]' },
  { name: 'Notion', icon: FaBrain, color: 'from-[#000000] to-[#37352F]' },
  { name: 'Slack', icon: FaSlack, color: 'from-[#4A154B] to-[#E01E5A]' },
  { name: 'Webhook', icon: FaLink, color: 'from-[#7C5CFF] to-[#44E2FF]' },
]


const pricingPlans = [
  {
    name: 'Freemium',
    price: '0€',
    period: '',
    description: 'Le minimum vital pour accrocher',
    features: [
      '1 compte social connecté',
      '50 interactions/mois',
      '10 DM automatiques/mois',
      'Export CSV basique',
      'Dashboard simple',
    ],
    cta: 'Commencer gratuitement',
    popular: false,
    icon: Sparkles,
  },
  {
    name: 'Premium',
    price: '14,99€',
    period: '/mois',
    description: 'Le plan VOLUME (et rentable)',
    features: [
      '3 comptes sociaux',
      '500 interactions/mois',
      '200 DM automatiques/mois',
      'IA conversationnelle basique',
      'Export Google Sheets',
      'Templates personnalisés',
      'Support email',
    ],
    cta: 'Essayer Premium',
    popular: true,
    icon: Zap,
    highlight: 'Plan effet boule de neige',
  },
  {
    name: 'Ultra Premium',
    price: '29,99€',
    period: '/mois',
    annualPrice: '299€',
    annualPeriod: '/an',
    description: 'Le plan qui imprime des billets',
    features: [
      'Comptes sociaux illimités',
      'Interactions illimitées',
      'DM illimités',
      'IA conversationnelle avancée',
      'CRM IA intégré',
      'Scénarios multi-étapes',
      'Intégrations (Notion, Zapier, Webhooks)',
      'Support prioritaire',
      'Templates premium',
    ],
    cta: 'Passer Ultra Premium',
    popular: false,
    icon: Crown,
  },
]

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <div className="space-y-24 pt-40 pb-16 px-4">
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
              Flow.IA capte automatiquement tous les likes, commentaires, abonnements, partages et messages sur tes réseaux sociaux, puis engage la conversation avec une IA calibrée pour qualifier, filtrer et récupérer les numéros directement dans ton dashboard.
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

      <section id="features" className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-3">
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
          <p className="text-xs uppercase tracking-[0.6em] text-white/40">How Flow IA works</p>
          <h2 className="font-display text-3xl text-white">3 étapes pour automatiser tes interactions sociales</h2>
        </div>
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {steps.map((step, idx) => (
            <Card key={idx} className="border-white/10 bg-white/5">
              <CardHeader>
                <Badge variant="ghost">{step.badge}</Badge>
                <CardDescription className="text-white/80">{step.copy}</CardDescription>
              </CardHeader>
            </Card>
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

      <section id="pricing" className="mx-auto max-w-7xl space-y-10 px-4">
        <div className="text-center space-y-3">
          <Badge variant="ghost" className="text-white/60">
            💰 Tarification
          </Badge>
          <h2 className="font-display text-4xl text-white md:text-5xl">
            Plans calibrés pour maximiser ton MRR
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Prix psychologiquement optimaux. Accessibles aux créateurs, rentables pour les pros.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {pricingPlans.map((plan) => {
            const Icon = plan.icon
            return (
              <Card
                key={plan.name}
                className={cn(
                  'relative border-white/10 bg-white/5 transition-all hover:border-white/20',
                  plan.popular && 'border-[#7C5CFF]/50 bg-gradient-to-br from-[#7C5CFF]/10 to-[#44E2FF]/5 shadow-[0_20px_60px_rgba(124,92,255,0.3)]'
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-[#7C5CFF] to-[#44E2FF] text-white border-0">
                      {plan.highlight}
                    </Badge>
                  </div>
                )}
                <CardHeader className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-xl',
                      plan.name === 'Freemium' && 'bg-white/10',
                      plan.name === 'Premium' && 'bg-gradient-to-br from-[#7C5CFF] to-[#44E2FF]',
                      plan.name === 'Ultra Premium' && 'bg-gradient-to-br from-[#FFD700] to-[#FFA500]'
                    )}>
                      <Icon className={cn(
                        'h-6 w-6',
                        plan.name === 'Freemium' && 'text-white/70',
                        plan.name === 'Premium' && 'text-white',
                        plan.name === 'Ultra Premium' && 'text-white'
                      )} />
                    </div>
                    <div>
                      <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
                      <CardDescription className="text-xs">{plan.description}</CardDescription>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-4xl font-bold text-white">{plan.price}</span>
                      {plan.period && <span className="text-white/60">{plan.period}</span>}
                    </div>
                    {plan.annualPrice && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-white/60">ou</span>
                        <span className="font-semibold text-white">{plan.annualPrice}</span>
                        <span className="text-white/60">{plan.annualPeriod}</span>
                        <Badge variant="ghost" className="text-xs text-green-400 border-green-400/20">
                          -17%
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-white/80">
                        <Check className="h-5 w-5 flex-shrink-0 text-[#7C5CFF] mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className={cn(
                      'w-full',
                      plan.popular && 'bg-gradient-to-r from-[#7C5CFF] to-[#44E2FF] hover:opacity-90 text-white border-0'
                    )}
                    variant={plan.popular ? 'default' : plan.name === 'Freemium' ? 'outline' : 'default'}
                  >
                    <Link href="/login">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-12 rounded-2xl border border-white/10 bg-black/40 p-6 text-center">
          <p className="text-sm text-white/60">
            <span className="font-semibold text-white">Projection réaliste mois 12 :</span> 150 Premium + 80 Ultra Premium = <span className="text-[#7C5CFF] font-bold">~4600€/mois</span>
          </p>
          <p className="mt-2 text-xs text-white/40">
            Sans pub violente. Seulement du contenu bien calibré + une landing propre.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111827] to-[#070B13] p-10 text-center">
        <p className="text-xs uppercase tracking-[0.6em] text-white/40">Prêt à scaler ton crew ?</p>
        <h3 className="mt-4 font-display text-3xl text-white">Flow IA Crew Access</h3>
        <p className="mt-3 text-white/70">Plan Beta limité. Support white-glove + templates AI personnalisés.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button asChild>
            <Link href="/login">Onboard maintenant</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="mailto:hey@flowia.ai">Parler avec nous</Link>
          </Button>
        </div>
      </section>
    </div>
    </>
  )
}

