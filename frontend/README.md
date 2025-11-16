# VistaFlow Frontend

Interface web pour VistaFlow - Plateforme SaaS de gestion des interactions social media.

## 🚀 Démarrage

### Installation

1. **Installer les dépendances**
```bash
npm install
```

2. **Configurer les variables d'environnement**
```bash
cp .env.local.example .env.local
# Éditer .env.local avec vos valeurs
```

3. **Démarrer le serveur de développement**
```bash
npm run dev
```

L'application sera accessible sur http://localhost:3000

## 📚 Structure

```
app/
├── login/              # Page de connexion/inscription
├── dashboard/          # Dashboard principal
│   ├── accounts/       # Gestion des comptes sociaux
│   ├── leads/          # Dashboard des leads
│   └── integrations/   # Configuration des intégrations
└── layout.tsx          # Layout principal

lib/
├── api.ts              # Client API axios
└── auth.ts             # Fonctions d'authentification
```

## 🎨 Technologies

- **Next.js 14** (App Router)
- **React Query** pour la gestion des données
- **Tailwind CSS** pour le styling
- **TypeScript** pour le typage

## 📱 Pages

- `/login` - Connexion/Inscription
- `/dashboard` - Vue d'ensemble
- `/dashboard/accounts` - Comptes sociaux
- `/dashboard/leads` - Gestion des leads
- `/dashboard/integrations` - Intégrations

