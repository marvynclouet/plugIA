import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-24 text-white/80">
      <div className="space-y-4">
        <Badge variant="ghost" className="text-white/60">
          À propos
        </Badge>
        <h1 className="font-display text-4xl text-white md:text-5xl">
          À propos de Flow.IA
        </h1>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardContent className="space-y-6 p-8">
          <p className="text-lg leading-relaxed">
            Flow.IA est une plateforme FaaS (Flow-as-a-Service) conçue pour une seule mission: transformer chaque interaction sociale en opportunité commerciale mesurable.
          </p>

          <p className="leading-relaxed">
            À l'heure où l'attention est la nouvelle monnaie, Flow.IA automatise l'acquisition en capturant en temps réel toutes les actions qui gravitent autour de ton contenu: likes, commentaires, partages, abonnements, tags et messages privés.
          </p>

          <p className="leading-relaxed">
            Chaque interaction déclenche un "flow", une séquence intelligente basée sur ton intention: attirer, qualifier, filtrer ou convertir. Une IA conversationnelle prend ensuite le relais pour ouvrir la discussion, analyser le profil, poser les bonnes questions et guider la personne jusqu'à l'objectif final: laisser son numéro, rejoindre une liste, réserver un appel ou acheter.
          </p>

          <p className="leading-relaxed">
            Flow.IA élimine l'effort humain répétitif et te donne une vue d'ensemble claire et centralisée. Tous les leads, toutes les conversations, toutes les données importantes remontent automatiquement dans ton dashboard ou ton écosystème (CRM, Notion, Airtable, Google Sheets…). Tu sais d'où vient chaque prospect, ce qu'il a dit, son niveau d'intérêt et ce qu'il faut faire ensuite.
          </p>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
            <p className="font-semibold text-white mb-3">Flow.IA n'est pas un bot classique.</p>
            <p className="leading-relaxed">
              C'est une mécanique d'acquisition autonome, capable de suivre le rythme de tes contenus et d'absorber des volumes que personne ne peut gérer manuellement. C'est un système pensé pour les créateurs, formateurs, artistes, coachs, marques et entrepreneurs qui veulent scaler sans sacrifier leur temps.
            </p>
          </div>

          <div className="space-y-4">
            <p className="font-semibold text-white">L'objectif est simple:</p>
            <ul className="space-y-2 list-disc list-inside text-white/80">
              <li>rendre ton audience exploitable,</li>
              <li>transformer ton engagement en résultats concrets,</li>
              <li>et construire une machine d'acquisition qui tourne 24/7 sans dépendre de toi.</li>
            </ul>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/10">
            <p className="text-lg font-semibold text-white">Flow.IA, c'est l'automatisation intelligente.</p>
            <p className="text-lg font-semibold text-white">C'est la fin des messages manqués.</p>
            <p className="text-lg font-semibold text-white">C'est la naissance d'une acquisition qui ne s'arrête jamais.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

