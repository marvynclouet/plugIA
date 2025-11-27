export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1e] via-[#0f1629] to-[#1a1f35] text-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">Suppression de vos données</h1>
            <p className="text-white/70 text-lg">
              Flow IA respecte votre vie privée et vous permet de supprimer vos données à tout moment.
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl p-8 border border-white/10 space-y-6">
            <h2 className="text-2xl font-semibold">Comment supprimer vos données</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">Option 1 : Via votre compte</h3>
                <ol className="list-decimal list-inside space-y-2 text-white/80 ml-4">
                  <li>Connectez-vous à votre compte Flow IA</li>
                  <li>Allez dans <strong>Paramètres</strong> → <strong>Compte</strong></li>
                  <li>Cliquez sur <strong>Supprimer mon compte</strong></li>
                  <li>Confirmez la suppression</li>
                </ol>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">Option 2 : Par email</h3>
                <p className="text-white/80 mb-2">
                  Envoyez une demande de suppression à :
                </p>
                <a 
                  href="mailto:privacy@flowia.com?subject=Demande de suppression de données"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  privacy@flowia.com
                </a>
                <p className="text-white/60 text-sm mt-2">
                  Indiquez votre adresse email associée à votre compte dans votre demande.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-8 border border-white/10 space-y-4">
            <h2 className="text-2xl font-semibold">Quelles données sont supprimées ?</h2>
            <ul className="list-disc list-inside space-y-2 text-white/80 ml-4">
              <li>Vos informations de compte (email, nom, mot de passe)</li>
              <li>Vos workspaces et leurs configurations</li>
              <li>Vos comptes sociaux connectés (tokens OAuth supprimés)</li>
              <li>Vos interactions et données collectées</li>
              <li>Vos leads et conversations</li>
              <li>Toutes les données associées à votre compte</li>
            </ul>
            <p className="text-white/60 text-sm mt-4">
              <strong>Note :</strong> La suppression est définitive et irréversible. 
              Toutes vos données seront supprimées dans un délai de 30 jours maximum.
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-semibold mb-4">Délai de traitement</h2>
            <p className="text-white/80">
              Votre demande sera traitée dans un délai de <strong>30 jours maximum</strong>. 
              Vous recevrez une confirmation par email une fois la suppression effectuée.
            </p>
          </div>

          <div className="bg-blue-500/10 rounded-2xl p-6 border border-blue-500/30">
            <h3 className="text-lg font-semibold mb-2">Besoin d'aide ?</h3>
            <p className="text-white/80">
              Si vous avez des questions concernant la suppression de vos données, 
              contactez-nous à <a href="mailto:support@flowia.com" className="text-blue-400 hover:text-blue-300 underline">support@flowia.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}



