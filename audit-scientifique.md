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

**Sources :**
- Cowan, R., Donlan, C., Shepherd, D.-L., Cole-Fletcher, R., Saxton, M., & Hurry, J. (2011). *Basic calculation proficiency and mathematics achievement in elementary school children.* Journal of Educational Psychology.
- Brendefur, J., Strother, S., Thiede, K., Lane, C., & Surges-Prokop, M. J. (2015). *A Professional Development Program to Improve Math Skills Among Preschool Children in Head Start.* Boise State ScholarWorks. <https://scholarworks.boisestate.edu/cifs_facpubs/150/>
- Wichita Public Schools (2014). *Multiplication Fact Strategies* (séquence Van de Walle / DMT). <https://teachers.stjohns.k12.fl.us/ford-t/files/2021/09/Multiplication-Fact-Strategies.pdf>
- DMT Institute. *Drills vs. Strategies: Building Flexible Thinking with Multiplication Facts.* <https://mathsuccess.dmtinstitute.com/p/drills-vs-strategies-building-flexible>

**Statut : conforme (2026-04-13, révisé après vérification des sources canoniques)**

### Conformité

L'introduction de chaque nouveau fait inclut :
- Grille de points (array) animée rangée par rangée
- Explication par addition répétée ("3 × 7, c'est 7 + 7 + 7 = 21")
- Démonstration de la commutativité par rotation de la grille (sauf pour les carrés)
- **Stratégie de dérivation** adaptée au fait (cf. tableau ci-dessous)
- En cas d'erreur, la grille de points est montrée avec la bonne réponse ; la stratégie est également rappelée **tant que le fait est en boîte Leitner ≤ 2** (phase d'apprentissage). Au-delà, on vise le rappel direct et on retire l'échafaudage — conforme à la séquence « comprendre → pratiquer → automatiser » décrite par Brendefur.

### Séquence canonique d'introduction

L'ordre d'introduction des nouveaux faits suit la séquence Van de Walle / Wichita (2014) : Doubles → Fives → Nines → Squares → Derived. Cette séquence privilégie les **anchor facts** (faits mémorables et faciles à apprendre) qui servent ensuite de base aux dérivations. Implémenté dans `factStage()` (`src/lib/sessionComposer.ts`).

### Stratégies par fait

| Pivot | Astuce | Source canonique |
|-------|--------|-------------------|
| × 9 | near-ten : n × 10 − n | Wichita 2014, p. 8 |
| × 5 | skip-count : compter par 5 | Wichita 2014, p. 4 |
| × 3 | double-add : n × 2 + n | Van de Walle (derived from doubles) |
| × 4 | double-double : (n × 2) × 2 | Wichita 2014, p. 6 |
| × 6 | five-plus-one : n × 5 + n | Wichita 2014, p. 10 |
| × 7 | five-plus-two : n × 5 + n × 2 | Wichita 2014, p. 12 |
| × 8 | double-double-double : ((n × 2) × 2) × 2 | Wichita 2014, p. 11 |

Faits de base exclus (table de 2 et 3 × 3) : grille + addition répétée suffisent.

### Corrections appliquées le 2026-04-13

Vérification croisée avec la séquence canonique : 4 divergences identifiées et corrigées.

1. **×5 : « moitié de × 10 » → skip counting.** L'astuce de la moitié de ×10 nécessite la division, opération que l'enfant maîtrise mal en début de CE2. Le skip counting (5, 10, 15, 20…) est l'anchor naturel et figure dans toute la littérature canonique.
2. **×8 : « × 10 − × 2 » → double-double-double.** Le doublement triple (8 = 2³) s'appuie directement sur l'anchor des doubles, déjà maîtrisé en stage 1. C'est la stratégie systématiquement enseignée par Van de Walle / Wichita.
3. **Squares ajoutés comme stage d'introduction.** Les carrés (4×4, 6×6, 7×7, 8×8, 9×9) sont des anchor facts mémorables et servent d'appui pour les voisins (6×7 ≈ 6×6 + 6, etc.). Désormais introduits avant les "derived" facts.
4. **Ordre canonique d'introduction.** Avant : tri par produit croissant. Après : Doubles → Fives → Nines → Squares → Derived (puis produit croissant à stage égal).

Voir `specs-multiplix.md` §3.4bis pour le détail des stratégies et leur priorité.

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

**Statut : conforme (implémentation alignée le 2026-04-11, commit `484bc72`)**

### Problème initial

L'écran de récap affichait un score brut ("8/12 bonnes réponses") et des étoiles conditionnées au ratio de réussite (0-3 étoiles). Les messages d'encouragement variaient selon le score ("Incroyable !" pour > 90% vs. "Bravo pour tes efforts !" pour < 50%).

Ce type de feedback est classifié comme **ego-involving** par Butler (1988). Son étude montre que les enfants de 10-11 ans qui reçoivent des commentaires individuels (task-involving) ont de meilleures performances ET une meilleure motivation intrinsèque que ceux qui reçoivent des notes. De plus, notes + commentaires = aussi mauvais que notes seules — l'enfant ne voit que la note.

Hattie & Timperley (2007) distinguent 4 niveaux de feedback par efficacité décroissante : process > self-regulation > task > self. Un score "8/12" est du feedback task-level agrégé qui pousse l'enfant vers des **performance goals** plutôt que des **mastery goals**.

### Changements effectués

| Élément | Avant | Après |
|---------|-------|-------|
| Score brut | "8/12 bonnes réponses" | Supprimé de la vue enfant |
| Étoiles | 0-3 basées sur le ratio | Supprimées |
| Message | Variable selon le score | Constant et chaleureux ("Bravo, tu as bien travaillé !") |
| Faits promus | Affiché | Mis en avant (pill "progrès") |
| Nouveaux faits | Affiché | Pill "nouveau(x)" |
| Progression globale | Non affiché | "Tu connais X faits sur Y" + barre de progression |
| Score brut | — | Disponible dans le dashboard parent |

Cf. `src/screens/RecapScreen.tsx`.

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

**Text-to-speech (l'app pose la question à l'oral)** — **fait** (2026-04-13) :
- Audios pré-générés via Mistral Voxtral TTS (voix française), stockés dans `public/audio/tts/` et servis offline par la PWA — pas de `SpeechSynthesis` runtime pour garantir une voix stable et enfantine.
- Couvre : énoncé de la question (`q-A-B`), introduction d'un nouveau fait (`intro-A-B`), commutativité (`comm-A-B`), astuce de dérivation (`strategy-A-B`), phrases statiques du parcours de bienvenue et du récap.
- Canal auditif supplémentaire utile pour les lecteurs hésitants et pour l'automatisation orale.
- Cf. specs §3.6 et `scripts/generate-tts.mjs`.

**Speech-to-text (l'enfant répond à voix haute)** — à explorer :
- Alignerait les temps de réponse avec ceux de la recherche (rappel automatique < 1-2s à l'oral).
- Vocabulaire restreint (nombres de 1 à 81 en français) favorable à la reconnaissance.
- Risques : qualité de reconnaissance sur voix d'enfant, bruit ambiant, mode offline (la SpeechRecognition API de Chrome passe par le cloud).

### Plan restant

1. ~~**Court terme** : ajouter le TTS pour la lecture des questions~~ → fait.
2. **Moyen terme** : prototyper la reconnaissance vocale comme option alternative au pavé numérique, avec seuils de temps adaptés au mode d'entrée (cf. tableau §5 « Vocal (futur) »).
3. Le pavé numérique reste le mode par défaut et le fallback.

### Contraintes techniques identifiées (STT)

- **Offline** : SpeechRecognition (Chrome) nécessite une connexion. Safari fait du on-device mais l'API est moins fiable. Problématique pour notre PWA offline-first.
- **Voix d'enfant** : les modèles de reconnaissance sont entraînés sur des voix adultes. Risque de faux négatifs frustrants.
- **Bruit de fond** : environnement domestique non contrôlé.

---

*Ce document évolue avec le projet. Les points résolus sont marqués comme tels avec leur date de résolution.*
