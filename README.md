# VALYDIUM Launcher — projet Windows

Interface Electron VALYDIUM et détection du Launcher Minecraft officiel.

## Inclus
- `index.html` : interface VALYDIUM avec minerai violet, boutons JOUER/FERMER et adresse `join1.severoo.com:55230`.
- `main.js` : recherche du launcher Minecraft dans les emplacements Windows habituels. Si aucun chemin n’est détecté, une fenêtre permet de sélectionner manuellement `MinecraftLauncher.exe` ou `Minecraft.exe`. Le chemin choisi est enregistré localement pour les lancements suivants.
- `preload.js` : pont IPC sécurisé.
- `package.json` : configuration Electron Builder.
- `.github/workflows/build-windows.yml` : compilation Windows sur GitHub Actions.

## Construire avec GitHub
1. Décompresse le ZIP et envoie **le contenu** dans ton dépôt GitHub en conservant les dossiers.
2. Ouvre l'onglet **Actions** et lance le workflow `Build Windows` (ou pousse un commit).
3. Télécharge l'artefact `.exe` généré par le workflow.

## Important : limite de l'auto-connexion
Ce projet détecte et ouvre le Launcher Minecraft, mais **ne rejoint pas encore automatiquement le serveur**. Le protocole `minecraft://` ne fournit pas de mécanisme fiable pour lancer une session Java authentifiée et imposer l'adresse du serveur. Un véritable auto-join demande un moteur de lancement Minecraft Java avec authentification Microsoft officielle et arguments Quick Play, configuré pour l'application. Le projet ne lit ni ne stocke les mots de passe ou jetons Microsoft.

Serveur cible : `join1.severoo.com:55230` — Java Edition 1.21.1.
