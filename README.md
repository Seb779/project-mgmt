# HERMES Portal

Portail de gestion de projet basé sur la méthodologie HERMES 5.1 (standard suisse).

## Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Backend | FastAPI (Python 3.12) + SQLModel |
| Base de données | PostgreSQL 16 + pgvector |
| Cache / Queue | Redis 7 |
| IA | Claude API (Anthropic) |
| Génération docs | python-docx + docxtpl |
| Déploiement | Docker Compose + Nginx |

## Lancement rapide (développement)

```bash
# 1. Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env : ANTHROPIC_API_KEY, mots de passe, URL

# 2. Démarrer tous les services
docker compose up -d

# 3. Vérifier que tout est opérationnel
curl http://localhost/api/health

# 4. Accéder au portail
open http://localhost
```

## Structure du projet

```
hermes-portal/
├── frontend/                 # Next.js 14
│   └── src/
│       ├── app/              # Pages (App Router)
│       │   ├── page.tsx      # Dashboard portefeuille
│       │   ├── planner/      # Kanban planner
│       │   └── documents/    # Générateur docs
│       ├── components/
│       │   ├── dashboard/    # KpiCard, ProjectTable
│       │   └── ui/           # Sidebar, boutons
│       └── lib/
│           └── api.ts        # Client API + types
│
├── backend/                  # FastAPI
│   └── app/
│       ├── main.py           # Point d'entrée
│       ├── core/             # Config, DB, sécurité
│       ├── models/           # Project, Deliverable, User
│       ├── api/routes/       # /projects, /deliverables
│       └── services/
│           └── ai_document_service.py  # Génération IA via Claude
│
├── nginx/
│   └── nginx.conf            # Reverse proxy
├── docker-compose.yml
└── .env.example
```

## Phases HERMES implémentées

```
Initialisation → Conception → Réalisation → Déploiement → Clôture
```

## Flux de génération de documents IA

1. Le CP crée une card livrable de type `HERMES_DOC` dans le Planner
2. En déplaçant la card vers le bucket **"À valider"**, la règle paramétrée se déclenche
3. Le backend appelle `ai_document_service.generate_hermes_document()`
4. Claude génère chaque section du document selon les données du projet
5. Le document Word est généré via `docxtpl` à partir du template HERMES
6. Le CP reçoit une notification et peut télécharger le document

## Templates HERMES disponibles

- `mandat_initialisation` — Mandat d'initialisation (phase Initialisation)
- `mandat_projet` — Mandat de projet (phase Conception)
- `planning_jalons` — Planning avec jalons (toutes phases)

Ajouter les fichiers `.docx` dans `backend/app/templates/` en utilisant
les variables `{{ section_name }}` pour les zones générées par l'IA.

## Déploiement Infomaniak VPS

```bash
# Sur le VPS
git clone <repo>
cd hermes-portal
cp .env.example .env
# Éditer .env avec les valeurs de production

docker compose -f docker-compose.yml up -d --build

# SSL (Let's Encrypt via certbot)
docker run -it --rm -v ./nginx/ssl:/etc/letsencrypt certbot/certbot \
  certonly --standalone -d votre-domaine.ch
# Puis décommenter les lignes SSL dans nginx/nginx.conf
docker compose restart nginx
```

## Prochaines étapes

- [ ] Planner Kanban (drag & drop avec @hello-pangea/dnd)
- [ ] Générateur de documents avec interface IA chat
- [ ] Authentification JWT + gestion des rôles RBAC
- [ ] Templates Word HERMES réels à intégrer
- [ ] Notifications temps réel (WebSocket)
- [ ] Export PDF des documents
