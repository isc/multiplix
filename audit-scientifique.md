# Audit scientifique — Multiplix

Audit de conformité entre l'implémentation, les spécifications et la littérature scientifique citée.

Date de l'audit : 2026-04-11

---

## 1. Répétition espacée

**Papiers :** Kang (2016), Cepeda et al. (2008), Rea & Modigliani (1985)

**Statut : conforme**

- Système Leitner 5 boîtes avec intervalles croissants (0, 1, 3, 7, 21 jours)
- Erreur → retour en boîte 1
- Succès rapide → promotion, succès lent → pas de promotion
- Pas de massed practice : le nombre de questions par séance est limité par le nombre de faits distincts disponibles, pas artificiellement gonflé par des répétitions
- Une seule séance par jour
- Les révisions bonus ne modifient pas l'état Leitner, préservant le calendrier de répétition espacée

---

## 2. Low-interference training (similarité)

**Papier :** Dotan & Zviran-Ginat (2022)

**Statut : conforme, avec divergence documentée sur la métrique**

### Métrique de similarité

Le papier utilise le nombre de paires de chiffres communes entre deux faits (opérandes et résultat confondus, positions ignorées). L'implémentation utilise une métrique catégorielle :

- **Strong** : opérande partagé
- **Medium** : même dizaine au résultat, ou chiffre partagé dans le résultat
- **None** : sinon

La divergence principale : des faits comme 8x7=56 et 8x3=24 ont 0 paires de chiffres communes (métrique du papier) mais partagent l'opérande 8 (strong dans notre système). Notre métrique est **plus conservatrice**, alignée avec la littérature sur les erreurs de récupération (Campbell, 1987). Note ajoutée dans les specs §1.2.

### Contrainte 48h pour les nouvelles introductions

Le papier montre que l'interférence vient de la similarité **intra-groupe** (faits appris la même semaine), pas de la similarité avec les faits des semaines précédentes. Notre contrainte de 48h entre introductions de faits similaires est un garde-fou supplémentaire non directement supporté par le papier, mais cohérent avec la fragilité de l'encodage initial (boîte 1-2).

Pas de changement prévu.

---

## 3. Entrelacement

**Papiers :** Rohrer & Taylor (2007), Rohrer, Dedrick & Burgess (2014)

**Statut : conforme**

- Jamais deux questions consécutives de la même table
- Jamais deux questions consécutives avec similarité forte
- Algorithme greedy d'entrelacement

### Point mineur

Les révisions bonus (ajoutées en fin de séance quand peu de faits sont disponibles) ne passent pas par la fonction d'entrelacement. Deux bonus consécutifs pourraient être de la même table. Impact limité car ce cas ne se produit qu'en début d'apprentissage (peu de faits introduits).

**Action possible (faible priorité)** : passer les bonus reviews par l'entrelacement.

---

## 4. Compréhension conceptuelle avant mémorisation

**Papiers :** Cowan et al. (2011), Brendefur et al. (2015)

**Statut : conforme dans l'esprit, simplifié**

L'introduction de chaque nouveau fait inclut :
- Grille de points (array) animée rangée par rangée
- Explication par addition répétée ("3 x 7, c'est 7 + 7 + 7 = 21")
- Démonstration de la commutativité par rotation de la grille (sauf pour les carrés)
- En cas d'erreur, la grille de points est montrée avec la bonne réponse (rappel conceptuel)

Brendefur et al. préconisent une approche strategy-based plus riche (décomposition, doubling, etc.), pas uniquement une visualisation. Notre introduction est plus simple — compromis raisonnable pour une app autonome sans accompagnement adulte.

Pas de changement prévu.

---

## 5. Seuils de temps de réponse

**Statut : contradiction dans les specs résolue (2026-04-11)**

### Problème identifié

Les specs contenaient une contradiction entre §1.1 ("> 5 secondes ne fait pas monter de boîte") et §3.3 ("3-5s : pas de montée de boîte"). L'implémentation suivait §1.1 (seuil à 5s).

### Résolution

Les specs §3.3 ont été alignées sur §1.1 et l'implémentation :

| Temps de réponse | Feedback | Promotion Leitner |
|-----------------|----------|-------------------|
| < 3s | Étoile dorée, animation joyeuse | Oui |
| 3-5s | "Bravo !" | Oui |
| > 5s | "Essaie plus vite la prochaine fois" | Non |

### Justification des seuils actuels

Les seuils de la littérature (rappel automatique < 1-2s) sont mesurés à l'oral. Notre pavé numérique ajoute un surcoût moteur de ~1-1,5s (balayage visuel + motricité fine d'un enfant de 8 ans). Les seuils actuels compensent ce surcoût.

### Lien avec l'interface vocale

Si l'application évolue vers une interface vocale (voir section 7), les seuils devront être révisés à la baisse pour s'aligner avec les mesures de la recherche :

| Mode d'entrée | Seuil "rapide" | Seuil "pas de promotion" |
|---------------|----------------|--------------------------|
| Pavé numérique (actuel) | < 3s | > 5s |
| Vocal (futur) | < 2s | > 3s |

---

## 6. Strictesse de `shouldIntroduceNew`

**Statut : choix de design, pas d'action immédiate**

La condition "tous les faits introduits doivent être en boîte 2+" pour introduire de nouveaux faits est stricte. Si un enfant maîtrise 30 faits mais fait une erreur sur un seul, aucun nouveau fait ne sera introduit avant que ce fait ne remonte en boîte 2.

Ce n'est pas issu des papiers cités — c'est un choix de design qui privilégie la consolidation. Avantage : l'enfant n'est pas submergé de faits non maîtrisés. Inconvénient : une erreur d'inattention sur un fait déjà bien connu bloque les introductions.

**Action possible (priorité moyenne)** : assouplir la condition pour n'exiger la boîte 2+ que sur les faits introduits dans les N dernières séances, ou exiger qu'au moins 90% des faits soient en boîte 2+ plutôt que 100%.

---

## 7. Feedback de fin de séance (récap)

**Papiers :** Butler (1988), Hattie & Timperley (2007)

**Statut : non conforme → specs mises à jour (2026-04-11), implémentation à modifier**

### Problème identifié

L'écran de récap affiche un score brut ("8/12 bonnes réponses") et des étoiles conditionnées au ratio de réussite (0-3 étoiles). Les messages d'encouragement varient aussi selon le score ("Incroyable !" pour > 90% vs. "Bravo pour tes efforts !" pour < 50%).

Ce type de feedback est classifié comme **ego-involving** par Butler (1988). Son étude montre que les enfants de 10-11 ans qui reçoivent des commentaires individuels (task-involving) ont de meilleures performances ET une meilleure motivation intrinsèque que ceux qui reçoivent des notes. De plus, notes + commentaires = aussi mauvais que notes seules — l'enfant ne voit que la note.

Hattie & Timperley (2007) distinguent 4 niveaux de feedback par efficacité décroissante : process > self-regulation > task > self. Un score "8/12" est du feedback task-level agrégé qui pousse l'enfant vers des **performance goals** plutôt que des **mastery goals**.

### Ce qui est déjà bien

- Les stats "faits promus" et "nouveaux faits" sont orientées progrès
- Les badges récompensent l'effort et la maîtrise, pas la performance
- L'évolution de la mascotte est liée à la progression globale

### Changements à implémenter

| Élément | Avant | Après |
|---------|-------|-------|
| Score brut | "8/12 bonnes réponses" | Supprimé de la vue enfant |
| Étoiles | 0-3 basées sur le ratio | Supprimées |
| Message | Variable selon le score | Constant et chaleureux |
| Faits promus | Affiché | Mis en avant |
| Progression globale | Non affiché | "Tu connais X faits sur 36" |
| Score brut | — | Disponible dans le dashboard parent |

### Impact sur les specs

- §3.2 mis à jour (description du récap)
- §3.5 ajouté (détail du récap de séance)
- §7.1 mis à jour (tableau des écrans)
- §7.2 : nouveau principe "Feedback orienté progrès, pas performance"
- Références Butler (1988) et Hattie & Timperley (2007) ajoutées

---

## 8. Piste d'évolution : interface vocale

### Constat

Le mode d'entrée (pavé numérique) ajoute un surcoût moteur qui éloigne les temps de réponse mesurés de ceux de la littérature scientifique. L'objectif pédagogique est le rappel automatique des faits multiplicatifs, pas la manipulation d'un clavier.

### Deux axes

**Speech-to-text (l'enfant répond à voix haute)** :
- Aligne les temps de réponse avec ceux de la recherche
- Vocabulaire restreint (nombres de 1 à 81 en français) favorable à la reconnaissance
- Risques : qualité de reconnaissance sur voix d'enfant, bruit ambiant, mode offline (la SpeechRecognition API de Chrome passe par le cloud)

**Text-to-speech (l'app pose la question à l'oral)** :
- "Combien font 6 fois 7 ?" en plus de l'affichage visuel
- Canal auditif supplémentaire, utile pour les lecteurs hésitants
- SpeechSynthesis API : bien supportée, fonctionne offline
- Faible risque technique

### Plan suggéré

1. **Court terme** : ajouter le TTS pour la lecture des questions (faible risque, gain pédagogique)
2. **Moyen terme** : prototyper la reconnaissance vocale comme option alternative au pavé numérique, avec seuils de temps adaptés au mode d'entrée
3. Le pavé numérique reste le mode par défaut et le fallback

### Contraintes techniques identifiées

- **Offline** : SpeechRecognition (Chrome) nécessite une connexion. Safari fait du on-device mais l'API est moins fiable. Problématique pour notre PWA offline-first.
- **Voix d'enfant** : les modèles de reconnaissance sont entraînés sur des voix adultes. Risque de faux négatifs frustrants.
- **Bruit de fond** : environnement domestique non contrôlé.

---

*Ce document évolue avec le projet. Les points résolus sont marqués comme tels avec leur date de résolution.*
