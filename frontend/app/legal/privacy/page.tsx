import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité | Flow IA',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-16 text-white/80">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.6em] text-white/40">Flow IA</p>
        <h1 className="font-display text-3xl text-white">Politique de confidentialité</h1>
        <p className="text-sm text-white/60">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold text-white">1. Données collectées</h2>
        <p>
          Nous collectons les informations nécessaires pour fournir la plateforme Flow IA : données de compte
          (nom, email), données de workspace, credentials chiffrés pour les réseaux sociaux connectés, contenus
          liés aux interactions sociales (likes, commentaires, messages) ainsi que les informations de leads
          captés (extractions IA, téléphone, email).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-white">2. Finalités</h2>
        <p>
          Les données sont utilisées pour : authentifier les utilisateurs, connecter les réseaux sociaux,
          récupérer et scorer les interactions, automatiser les conversations et synchroniser les leads vers vos
          outils (Sheets, Notion, webhooks). Nous n’utilisons jamais vos données à des fins publicitaires.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-white">3. Partage & stockage</h2>
        <p>
          Vos tokens OAuth sont chiffrés et stockés sur des serveurs sécurisés (Supabase / Postgres). Nous ne
          partageons vos données qu’avec les prestataires nécessaires (hébergement, analytics, API IA) et uniquement
          pour exécuter le service. Aucun revendeur tiers.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-white">4. Sécurité</h2>
        <p>
          Flow IA applique chiffrement AES-256 des secrets, HTTPS, contrôle d'accès par workspace, audits de logs
          et sauvegardes régulières. Chaque intégration est soumise aux quotas et politiques anti-spam des plateformes
          connectées.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-white">5. Droits des utilisateurs</h2>
        <p>
          Vous pouvez demander l’accès, la correction ou la suppression de vos données en écrivant à{' '}
          <a className="text-white underline" href="mailto:privacy@flowia.ai">
            privacy@flowia.ai
          </a>
          . Nous répondons sous 30 jours. Vous pouvez révoquer l'accès Flow IA dans les paramètres de chaque réseau
          social.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-white">6. Demande de suppression des données</h2>
        <p>
          Pour supprimer définitivement vos données collectées via Flow IA (comptes connectés, interactions,
          leads, conversations IA), envoyez un email à{' '}
          <a className="text-white underline" href="mailto:privacy@flowia.ai">
            privacy@flowia.ai
          </a>{' '}
          avec l’objet “Suppression des données – {`<nom du workspace>`}”. Nous effacerons toutes les données associées
          dans un délai maximum de 30 jours et vous notifierons lorsque l’opération est terminée. Vous pouvez
          également supprimer immédiatement vos connexions sociales depuis l’onglet “Comptes”.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-white">7. Contact</h2>
        <p>
          Flow IA – 42 rue des Créateurs, 75010 Paris, France. Email :{' '}
          <a className="text-white underline" href="mailto:hello@flowia.ai">
            hello@flowia.ai
          </a>
        </p>
      </section>
    </div>
  )
}

