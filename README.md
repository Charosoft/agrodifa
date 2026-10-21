# AGRODIFA

Site de vente et de gestion agro-pastoral. *Mangez bio vous épargne de l'hôpital…*

## Structure

```
agrodifa/
├── frontend/          React + Vite + TypeScript + Tailwind  (→ Vercel)
│   ├── public/        robots.txt, sitemap.xml, favicon, og-image.jpg
│   ├── src/
│   │   ├── components/   ui/, layout/, home/, products/, cart/, admin/
│   │   ├── pages/        public/ (site client), admin/ (espace propriétaire)
│   │   ├── hooks/        logique réutilisable (ex : useUsdRate)
│   │   ├── lib/          supabase.ts, format.ts
│   │   ├── types/        types TypeScript des tables
│   │   └── context/      état global (panier, session)
│   ├── vercel.json    routage SPA + en-têtes
│   └── .env.example
├── backend/           Node + Express + TypeScript  (→ Render)
│   ├── src/
│   │   ├── config/       env.ts (validation), supabase.ts (client admin)
│   │   ├── routes/       une route REST par ressource
│   │   ├── middleware/   gestion d'erreurs, (bientôt) authentification
│   │   ├── schemas/      validation des entrées (zod)
│   │   └── services/     logique métier
│   └── .env.example
└── .gitignore
```

## Démarrage

### 1. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local     # puis remplir l'URL et la clé publique Supabase
npm run dev                    # http://localhost:5173
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env           # puis remplir l'URL et la clé SECRÈTE Supabase
npm run dev                    # http://localhost:4000/api/health
```

## Règles d'or
- Le fichier `.env` / `.env.local` ne va **jamais** sur GitHub.
- La clé `service_role` (secrète) reste **uniquement** dans le backend.
- Tous les prix en base sont en **CDF** ; le dollar est calculé avec le taux du propriétaire.
