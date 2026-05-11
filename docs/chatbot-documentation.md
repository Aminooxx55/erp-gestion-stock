# 🤖 Documentation — Chatbot IA (Assistant Stock)

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture](#2-architecture)
3. [Prérequis Azure](#3-prérequis-azure)
4. [Configuration Backend](#4-configuration-backend)
5. [Fichiers du projet](#5-fichiers-du-projet)
6. [Flux de données](#6-flux-de-données)
7. [Comment ça marche](#7-comment-ça-marche)
8. [Sécurité](#8-sécurité)
9. [Pour votre PFE](#9-pour-votre-pfe)

---

## 1. Vue d'ensemble

Le chatbot est un **assistant IA** intégré à l'application ERP de gestion de stock. Il utilise **Azure OpenAI** (modèle GPT-4.1-nano) pour répondre aux questions des utilisateurs sur :

- 📊 L'état actuel du stock
- ⚠️ Les alertes (ruptures, sous-seuil)
- 📥 Les mouvements récents (entrées/sorties)
- 💡 Les recommandations de réapprovisionnement

L'assistant a accès aux **données réelles** de la base de données à chaque requête, ce qui lui permet de donner des réponses précises et à jour.

---

## 2. Architecture

```
┌─────────────────────┐     ┌──────────────────────────┐     ┌─────────────────┐
│   Frontend React    │────▶│     Backend Express      │────▶│  Azure OpenAI   │
│   ChatbotWidget.jsx │◀────│   chatController.js      │◀────│  GPT-4.1-nano   │
│                     │     │   azureOpenAIService.js   │     │                 │
└─────────────────────┘     └──────────┬───────────────┘     └─────────────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │   PostgreSQL DB   │
                              │  (Produits, etc.) │
                              └──────────────────┘
```

**Le flux complet :**

1. L'utilisateur tape un message dans le widget
2. Le frontend envoie un `POST /api/chatbot/message` au backend
3. Le backend interroge la base de données pour obtenir le contexte d'inventaire
4. Le backend envoie le message + contexte à Azure OpenAI
5. L'IA génère une réponse basée sur les données réelles
6. La réponse est retournée au frontend et affichée dans le chat

---

## 3. Prérequis Azure

### Étape 1 : Créer une ressource Azure OpenAI

1. Aller sur [Azure Portal](https://portal.azure.com)
2. Créer une ressource **Azure OpenAI** (type : `Cognitive Services`)
3. Choisir la région **East US** et le tier **Standard S0**
4. Noter les informations suivantes :
   - **Endpoint** : `https://votre-resource.openai.azure.com/`
   - **API Key** : (dans l'onglet "Keys and Endpoint")

### Étape 2 : Déployer un modèle

1. Dans la ressource Azure OpenAI, aller dans **Model deployments**
2. Cliquer sur **+ Create deployment**
3. Sélectionner le modèle **gpt-4.1-nano** (le plus économique)
4. Nommer le déploiement (ex: `gpt-4.1-nano`)
5. Type : **Global Standard**
6. Cliquer sur **Deploy**

### Étape 3 : Variables d'environnement

Ajouter ces 4 variables dans le fichier `backend/.env` :

```env
AZURE_OPENAI_API_KEY=votre_clé_api
AZURE_OPENAI_ENDPOINT=https://votre-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4.1-nano
AZURE_OPENAI_API_VERSION=2024-12-01-preview
```

---

## 4. Configuration Backend

### Dépendance npm

Le SDK OpenAI est utilisé pour communiquer avec Azure :

```bash
cd backend
npm install openai
```

### Enregistrement de la route

Dans `backend/src/index.js`, la route du chatbot est enregistrée :

```javascript
// Ligne 31 — Route du chatbot IA
app.use('/api/chatbot', require('./routes/chatRoutes'));
```

---

## 5. Fichiers du projet

### Backend (4 fichiers)

| Fichier | Rôle |
|---------|------|
| `backend/.env` | Variables d'environnement Azure OpenAI |
| `backend/src/routes/chatRoutes.js` | Définition des 2 endpoints (status + message) |
| `backend/src/controllers/chatController.js` | Logique métier : construction du contexte + appel IA |
| `backend/src/services/azureOpenAIService.js` | Connexion Azure OpenAI + prompt système |

### Frontend (2 fichiers)

| Fichier | Rôle |
|---------|------|
| `frontend/src/components/ChatbotWidget.jsx` | Widget de chat flottant avec UI complète |
| `frontend/src/components/Layout.jsx` | Intègre le ChatbotWidget dans le layout principal |

---

### 5.1 — `chatRoutes.js` (Routes)

```javascript
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const rbac = require('../middlewares/rbac');
const { getStatus, sendMessage } = require('../controllers/chatController');

// GET /api/chatbot/status — Vérifie si Azure est configuré
router.get('/status', auth, rbac('admin', 'responsable', 'employe'), getStatus);

// POST /api/chatbot/message — Envoie un message à l'IA
router.post('/message', auth, rbac('admin', 'responsable', 'employe'), sendMessage);

module.exports = router;
```

**Points clés :**
- Les 2 routes sont protégées par `auth` (JWT) et `rbac` (rôles)
- Tous les rôles (admin, responsable, employe) peuvent utiliser le chatbot

---

### 5.2 — `chatController.js` (Contrôleur)

Ce fichier fait 2 choses principales :

**A. Construire le contexte d'inventaire (`buildInventoryContext`)** :
- Récupère tous les produits avec leur catégorie
- Calcule les indicateurs (ruptures, sous-seuil, stock total)
- Formate les alertes, mouvements récents et liste des produits
- Tout est envoyé en texte à l'IA pour qu'elle puisse répondre

**B. Gérer l'endpoint `sendMessage`** :
- Valide le message (non vide, longueur max 1200 caractères)
- Construit le contexte d'inventaire
- Appelle le service Azure OpenAI
- Retourne la réponse au frontend

---

### 5.3 — `azureOpenAIService.js` (Service IA)

Ce fichier gère la connexion avec Azure OpenAI :

**Prompt système** : C'est un texte envoyé à chaque requête qui dit à l'IA :
- Qui elle est (assistant stock)
- Comment se comporter (en français, concis, avec émojis)
- Les données d'inventaire en temps réel (nombre de produits, alertes, etc.)

```
// Structure du prompt système :
1. Identité de l'assistant
2. Règles de comportement
3. Contexte de l'utilisateur connecté (nom, rôle)
4. Données d'inventaire (temps réel depuis la BDD)
5. Alertes prioritaires
6. Détail par catégorie
7. Mouvements récents
8. Liste complète des produits
```

**Paramètres de l'appel API** :
- `temperature: 0.3` — Réponses assez déterministes (pas trop créatives)
- `max_tokens: 600` — Longueur max de la réponse

---

### 5.4 — `ChatbotWidget.jsx` (Frontend)

Le widget est un composant React qui inclut :

- **Bouton flottant** : En bas à droite, toujours visible
- **Fenêtre de chat** : S'ouvre/ferme avec animation (framer-motion)
- **Messages** : Bulles bleues (utilisateur) et grises (IA)
- **Rendu Markdown** : Les réponses IA sont rendues avec react-markdown
- **Suggestions** : Boutons de questions rapides au démarrage
- **Animation de frappe** : 3 points qui bougent pendant le chargement
- **Timestamps** : Heure affichée sous chaque message

**Intégration dans le Layout** (ligne 253 de `Layout.jsx`) :

```jsx
{user && <ChatbotWidget />}
```

Le widget est affiché seulement si un utilisateur est connecté.

---

## 6. Flux de données

```
Utilisateur tape "Quels produits sont en rupture ?"
                │
                ▼
    ChatbotWidget.jsx
    └── POST /api/chatbot/message
        body: { message: "Quels produits...", history: [...] }
                │
                ▼
    chatRoutes.js
    └── auth middleware → vérifie le JWT
    └── rbac middleware → vérifie le rôle
    └── chatController.sendMessage()
                │
                ▼
    chatController.js
    └── buildInventoryContext()
        ├── SELECT * FROM produits (avec catégorie)
        ├── COUNT(*) FROM categories
        ├── COUNT(*) FROM mouvements_stock
        └── SELECT derniers 10 mouvements
                │
                ▼
    azureOpenAIService.js
    └── askInventoryAssistant()
        ├── Construit le prompt système + données
        ├── Envoie à Azure OpenAI API
        └── Retourne la réponse
                │
                ▼
    Réponse JSON : { reply: "Voici les produits en rupture..." }
                │
                ▼
    ChatbotWidget.jsx affiche la réponse en Markdown
```

---

## 7. Comment ça marche

### L'IA connaît vos données grâce au "Prompt Système"

À chaque message, on envoie à l'IA un **prompt système** qui contient :

1. **Les instructions** : "Tu es un assistant stock, réponds en français..."
2. **Les données réelles** : Nombre de produits, alertes, mouvements récents...
3. **Le message de l'utilisateur**

L'IA n'a PAS accès directement à la base de données. On lui envoie un **résumé textuel** des données à chaque requête. C'est ce qu'on appelle le **RAG simplifié** (Retrieval-Augmented Generation).

### Exemple de prompt envoyé à l'IA :

```
Tu es ERP Stock Assistant, un assistant intelligent pour la gestion de stock.

## Règles
- Réponds toujours en français.
- Sois concis et professionnel.
...

## Données d'inventaire (temps réel)
- 📦 Produits : 25
- ❌ En rupture : 3
- ⚠️ Sous seuil : 5

## Alertes prioritaires
❌ Ciment Portland (CIM-001) — 0/50 kg
⚠️ Fer à béton (FER-003) — 12/20 unités

## Tous les produits
- Ciment Portland (CIM-001) | 0 kg | seuil: 50 | Matériaux | ❌ RUPTURE
- Fer à béton (FER-003) | 12 unités | seuil: 20 | Métaux | ⚠️ SOUS SEUIL
...
```

Grâce à ce contexte, l'IA peut répondre avec des données précises et à jour.

---

## 8. Sécurité

| Aspect | Implémentation |
|--------|----------------|
| **Authentification** | JWT requis (middleware `auth`) |
| **Autorisation** | RBAC — tous les rôles autorisés (middleware `rbac`) |
| **Validation** | Message max 1200 caractères, historique nettoyé |
| **Rate Limiting** | 100 requêtes/minute (global Express) |
| **Clé API** | Stockée dans `.env`, jamais exposée au frontend |
| **Données** | Le frontend n'envoie que le message, le contexte est construit côté serveur |

---

## 9. Pour votre PFE

### Technologies utilisées

| Technologie | Usage |
|-------------|-------|
| **Azure OpenAI** | Service d'IA cloud (GPT-4.1-nano) |
| **openai** (npm) | SDK officiel pour communiquer avec l'API |
| **react-markdown** | Rendu Markdown dans les bulles de chat |
| **framer-motion** | Animations (ouverture, messages, points de frappe) |

### Coût

- **GPT-4.1-nano** : Le modèle le moins cher d'Azure OpenAI
- Environ **$0.10 pour 1M tokens input** / **$0.40 pour 1M tokens output**
- Pour un projet PFE : quelques centimes au total

### Points forts à mentionner en soutenance

1. **IA contextuelle** : L'assistant connaît les données réelles du stock en temps réel
2. **Sécurité** : Authentification JWT + RBAC, validation des entrées
3. **UX moderne** : Animations, rendu Markdown, suggestions rapides
4. **Architecture propre** : Séparation Route → Contrôleur → Service
5. **Pattern RAG simplifié** : Injection de données métier dans le prompt système
