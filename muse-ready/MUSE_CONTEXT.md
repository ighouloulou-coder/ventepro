# Contexte du Projet Trade Link — Pour Meta Muse

## Aperçu général
**Trade Link** est une application de gestion des ventes et de prospection commerciale.
- Application web React + TypeScript + Vite
- Base de données: Firebase Firestore
- Fonctionnalités clés : Bon de livraison, transfert vers facture, gestion des produits/clients, export PDF
- 15 pages principales
- Build de production réussi (npm run build)

## Structure Technique
- **Frontend** : React 18, TypeScript, Framer Motion pour les animations
- **Base de données** : Firebase Firestore en temps réel
- **Export PDF** : jsPDF + jspdf-autotable
- **Routing** : React Router avec des transitions animées
- **État** : LocalStorage pour le stockage temporaire, Firebase pour la persistance

## Structure du Projet
```
src/
├── types/          # Types TypeScript complets (Product, Client, Invoice, Delivery)
├── services/       # Services Firebase, autoImport, pdfExport, storage
├── pages/          # 15 pages React (Dashboard, Products, Clients, Invoices, Deliveries, etc.)
├── components/       # Composants réutilisables (Layout, ErrorBoundary, Toast)
└── App.tsx       # Routage principal avecAnimatedRoutes
```

## Points d'Attention Importants ⚠️

1. **Configuration Firebase** :
   - Le fichier `src/services/firebase.ts` contient la configuration Firebase
   - **À ne modifier JAMAIS** sans comprendre les implications
   - Doit être remplacé par vos propres identifiants avant le déploiement
   - Utilisez des variables d'environnement en production

2. **Champ `poids_unitaire_kg`** :
   - Peut être `undefined` pour certains produits
   - Géré spécifiquement dans `pdfExport.ts` et `autoImport.ts`
   - Ne pas supprimer cette gestion sans casser l'export PDF

3. **Import automatique des produits** :
   - S'exécute une seule fois lors de la première connexion Firebase
   - Marqué par `tradelink_autimport_produits_v1` en localStorage
   - Ne pas appeler deux fois pour éviter les doublons

4. **Structure des données** :
   - Les interfaces TypeScript sont complètes et doivent être respectées
   - Les noms de collection Firebase sont constants (`tradelink_products`, etc.)

## Ce que Muse Peut Faire

### ✅ Autorisé
1. **Créer de nouvelles pages/ composants** - Dans le répertoire `src/pages/` ou `src/components/`
2. **Ajouter de nouvelles fonctions** - Dans `src/services/` (à condition de respecter la structure existante)
3. **Corriger des bugs** - Analyser et proposer des correctifs
4. **Modifier le UI** - Les composants et pages existants
5. **Ajouter de nouvelles features** - Nouveaux champs, nouvelles options, etc.
6. **Documenter le code** - Générer des README, des JSDoc, etc.
7. **Optimiser les performances** - Réduire le bundle size, améliorer le temps de chargement

### ❌ Interdit
1. **Modifier la configuration Firebase** - Ne touche jamais à `src/services/firebase.ts`
2. **Changer la structure de la BDD** - Ne modifie pas les noms de collection ni la structure des documents
3. **Touché à l'authentification** - Ne touche pas au système d'authentification Firebase
4. **Supprimer des fonctionnalités existantes** - Tout ce qui fonctionne doit rester
5. **Changer la logique business** sans validation
6. **Modifier les règles Firestore** sans autorisation explicite

## Tâches Prioritaires Recommandées

1. **Ajouter un champ "pays" aux clients** - Interface + Type + Sauvegarde Firestore
2. **Corriger le bug du transfert BL→facture** - OrderId undefined issue (déjà identifié et corrigé précédemment)
3. **Ajouter un graphique de ventes mensuelles** - Page Dashboard ou nouvelle page
4. **Exporter les données en CSV** - En complément de l'export PDF existant
5. **Améliorer la page de statistiques** - Plus de graphiques, filtres, etc.

## Commandes Muse Recommandées

```
# Analyse du code
"Muse, analyse le code de src/services/pdfExport.ts et suggère 3 améliorations"

# Créer une nouvelle feature
"Muse, ajoute un champ 'pays' au formulaire client et à la sauvegarde Firestore"

# Corriger un bug
"Muse, le transfert vers facture échoue quand orderId est undefined, trouve et corrige le bug"

# Ajouter une feature
"Muse, ajoute un graphique des ventes mensuelles sur la page Dashboard"

# Documenter
"Muse, génère une documentation JSDoc pour le service pdfExport.ts"
```

## Structure des Engagements

- **Vous** : Validez chaque modification avant incorporation
- **Muse** : Génère le code, les tests, la documentation
- **Processus** : Muse propose → Vous examinez → Vous intégrez → Muse teste
- **Git** : Toutes les modifications passent par des pull requests ou commits validés

## Contact / Support

En cas de doute sur ce que Muse peut ou ne peut pas faire, référez-vous à cette documentations et contactez l'équipe de développement pour clarification.

---

**Dernière mise à jour** : [Date du jour]
**Version du projet** : Version actuelle de Trade Link
**Version de Muse** : Dernière version disponible
