# Langues de la suite Conox

Le sélecteur commun est un menu déroulant. La langue choisie reste commune au simulateur, à la revue de cas et au jeu, sans réinitialiser l’outil ouvert. Les textes des repères saisis par l’utilisateur ne sont pas traduits.

Les langues proposées sont : allemand, français, anglais, italien, espagnol, portugais, néerlandais, danois, suédois, norvégien, finnois, islandais, estonien, letton, lituanien, polonais, tchèque, slovaque, slovène, croate, bosnien, serbe, macédonien, albanais, roumain, hongrois, bulgare, grec, turc, ukrainien, russe, biélorusse, maltais, irlandais, arménien, géorgien et azéri. Ce périmètre couvre les principales langues nationales d’Europe, y compris le Caucase ; il ne prétend pas couvrir chaque langue régionale ou minoritaire.

Les catalogues allemand, français et anglais existants sont conservés. Les 34 catalogues supplémentaires sont des traductions automatiques préparées le 5 novembre 2026 à partir des textes anglais publics du dépôt, via Google Translate. Les formulations médicales n’ont pas été validées par un professionnel natif de chaque langue. Une relecture linguistique et pédagogique est nécessaire avant de les présenter comme des traductions validées.

Les fichiers JSON sont hébergés avec le site et chargés uniquement au choix de la langue. Aucune traduction à la volée, aucun envoi des cas ou de leur contenu à un service externe. Les identifiants, paramètres d’interpolation, réponses correctes, sources et règles du jeu restent inchangés.

`src/i18n/catalog.js` définit les langues et leur chargement. `src/i18n/europe/` contient les catalogues supplémentaires. `scripts/i18n/source-en.json` est l’instantané anglais utilisé pour cette génération. Le script de génération ne s’exécute jamais dans le site. Les tests vérifient la couverture des textes, les paramètres et les identifiants techniques.

Dans la revue de cas, Espace lance ou met en pause. Les flèches gauche et droite déplacent de cinq secondes ; Maj avec une flèche déplace de trente secondes. Le maintien d’une flèche répète le déplacement et conserve l’état lecture/pause, sauf si la fin du passage est atteinte. Ces raccourcis fonctionnent dans la vue normale et en plein écran. Les champs, menus et fenêtres de dialogue conservent leurs commandes habituelles.
