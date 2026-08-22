# 🤖 Bot Twitch - VentePro

## 📋 Installation

### 1. Installer les dépendances

```bash
cd "C:\Users\usre\Desktop\projet de prospections"
npm install
```

### 2. Créer votre application Twitch

1. Allez sur **https://dev.twitch.tv/console**
2. Connectez-vous avec votre compte Twitch
3. Cliquez sur **"Register Your Application"**
4. Remplissez :
   - **Name** : VenteProBot
   - **OAuth Redirect URL** : `http://localhost`
   - **Category** : Bot
5. Cliquez sur **"Create"**
6. Copiez le **Client ID**

### 3. Obtenir le Token OAuth

1. Allez sur **https://twitchapps.com/tmi/**
2. Cliquez sur **"Connect"**
3. Autorisez l'application
4. Copiez le **token** (commence par `oauth:xxxxx`)

### 4. Configurer le fichier .env

Ouvrez le fichier `.env` et remplissez :

```
TWITCH_USERNAME=votre_username
TWITCH_OAUTH=oauth:votre_token
TWITCH_CHANNEL=votre_channel
```

> ⚠️ Le **username** et le **channel** sont en **minuscules**

### 5. Lancer le bot

```bash
npm run bot
```

---

## 🎮 Commandes du Bot

| Commande | Description | Exemple |
|----------|-------------|---------|
| `!vente [montant] [desc]` | Enregistrer une vente | `!vente 250 Produit XYZ` |
| `!stats` | Voir les statistiques | `!stats` |
| `!dernières` | Dernières ventes | `!dernières` |
| `!bonjour` | Saluer le bot | `!bonjour` |
| `!aide` | Afficher l'aide | `!aide` |
| `!reset` | Réinitialiser le compteur du jour | `!reset` |
| `!uptime` | Temps de fonctionnement | `!uptime` |
| `!commands` | Nombre de commandes utilisées | `!commands` |

---

## 📊 Données

Les données de ventes sont sauvegardées dans :
```
data/sales.json
```

---

## 🔧 Dépannage

### Le bot ne se connecte pas ?

1. Vérifiez votre fichier `.env`
2. Assurez-vous que le token est valide (regénérez-le si nécessaire)
3. Vérifiez que le nom de chaîne est correct (en minuscules)

### Le bot ne répond pas ?

1. Vérifiez que le bot est bien connecté au chat
2. Tapez `!aide` pour tester
3. Regardez la console pour les erreurs

---

## 🚀 Lancer l'application et le bot

Terminal 1 - Application web :
```bash
npm run dev
```

Terminal 2 - Bot Twitch :
```bash
npm run bot
```

---

## 📱 depuis un smartphone

1. Ouvrez une app de terminal (Termux sur Android)
2. Installez Node.js : `pkg install nodejs`
3. Clonez le projet ou transférez les fichiers
4. Lancez le bot : `npm run bot`

---

Bonne utilisation ! 🎉
