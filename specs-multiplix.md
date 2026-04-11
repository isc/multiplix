# Multiplix — Spécifications fonctionnelles

**Application d'apprentissage des tables de multiplication basée sur la recherche en sciences cognitives**

Utilisatrice cible : Zoé, 8 ans, CE2 — Tables de 1 à 10

---

## 1. Principes scientifiques fondateurs

L'application repose sur quatre piliers issus de la littérature en psychologie cognitive et en didactique des mathématiques :

### 1.1 Répétition espacée (Spaced Repetition)

**Source :** Kang (2016), Cepeda et al. (2008), Rea & Modigliani (1985)

Chaque fait multiplicatif possède un état de maîtrise individuel. L'intervalle entre deux présentations d'un même fait augmente avec les succès consécutifs et se réduit en cas d'erreur. L'algorithme s'inspire du système de Leitner à 5 boîtes, adapté pour des enfants.

| Boîte | Intervalle de révision | Signification |
|-------|----------------------|---------------|
| 1 | Chaque séance | Nouveau ou échoué récemment |
| 2 | 1 jour | Répondu correctement 1 fois |
| 3 | 3 jours | Répondu correctement 2 fois consécutives |
| 4 | 7 jours | Répondu correctement 3 fois consécutives |
| 5 | 21 jours | Maîtrisé (révision de consolidation) |

**Règles :**
- Un succès fait monter le fait d'une boîte.
- Un échec renvoie le fait en boîte 1.
- Un fait est considéré "acquis" quand il atteint la boîte 5 et y est confirmé.
- Le temps de réponse est enregistré. Un succès lent (> 5 secondes) ne fait pas monter de boîte — l'objectif est le rappel automatique, pas le calcul mental.

### 1.2 Regroupement par faible similarité (Low-Interference Training)

**Source :** Dotan & Zviran-Ginat (2022), *Cognitive Research: Principles and Implications*

Les faits similaires (ex : 6×8=48 et 8×8=64) créent de l'interférence en mémoire lorsqu'ils sont présentés dans la même séance. L'application regroupe les faits de sorte qu'une séance ne contienne que des faits dissemblables entre eux.

**Commutativité :** a×b et b×a (ex : 6×7 et 7×6) sont traités comme un seul et même fait. L'application ne stocke qu'une entrée (avec a ≤ b par convention) mais pose la question dans les deux ordres.

**Critères de similarité entre deux faits a×b=c et d×e=f :**
- Opérande partagé (ex : 7×6 et 7×8) → similarité forte
- Résultat proche ou même dizaine (ex : 6×7=42 et 6×8=48) → similarité moyenne
- Chiffre partagé dans le résultat (ex : 8×8=64 et 8×6=48, tous deux avec un 8 en opérande et un 4 dans le résultat) → similarité moyenne

**Règle de séance :** Dans une séance donnée, deux faits ayant une similarité forte ne sont jamais présentés dans la même série de questions. Les faits similaires sont séparés par au moins 48h.

### 1.3 Entrelacement (Interleaving)

**Source :** Rohrer & Taylor (2007), Rohrer, Dedrick & Burgess (2014)

Au sein d'une séance, les questions alternent entre différentes tables plutôt que de travailler une seule table en bloc. L'entrelacement force la discrimination active et améliore les performances d'environ 30% par rapport à la pratique bloquée.

**Implémentation :** Chaque séance pioche dans les faits éligibles (selon l'algorithme de répétition espacée) et les mélange. Jamais deux questions consécutives de la même table.

### 1.4 Compréhension conceptuelle avant mémorisation

**Source :** Cowan et al. (2011), Brendefur et al. (2015)

Avant de demander un rappel pur, chaque nouveau fait est d'abord introduit visuellement (array/grille de points, lien avec l'addition répétée, commutativité). L'application ne demande jamais de mémoriser un fait qui n'a pas été conceptuellement présenté.

---

## 2. Architecture de l'application

### 2.1 Stack technique

| Composant | Choix | Justification |
|-----------|-------|---------------|
| Framework | React (JSX, single-file artifact ou PWA) | Interactivité riche, animations |
| Stockage | localStorage + export/import JSON | Persistance entre séances, pas de backend |
| Animations | CSS transitions + Framer Motion ou CSS keyframes | Feedback visuel motivant |
| PWA | Service Worker + manifest.json | Installable, fonctionne hors-ligne |
| Hébergement | GitHub Pages (repo `isc/multiplix`) | Gratuit, simple |

### 2.2 Structure des données

```typescript
interface MultiFact {
  a: number;           // premier opérande (2-10)
  b: number;           // second opérande (2-10), toujours a ≤ b (commutativité)
  product: number;     // résultat
  box: 1 | 2 | 3 | 4 | 5;  // boîte Leitner
  lastSeen: string;    // ISO date de dernière présentation
  nextDue: string;     // ISO date de prochaine révision
  history: Attempt[];  // historique des tentatives
  introduced: boolean; // le fait a-t-il été présenté conceptuellement ?
}

interface Attempt {
  date: string;
  correct: boolean;
  responseTimeMs: number;
  answeredWith: number | null;  // ce que l'enfant a répondu
}

interface UserProfile {
  name: string;
  startDate: string;
  facts: MultiFact[];
  totalSessions: number;
  currentStreak: number;     // jours consécutifs
  longestStreak: number;
  badges: Badge[];
  mascotLevel: number;       // évolution du personnage
}

interface Badge {
  id: string;
  name: string;
  description: string;
  earnedDate: string;
  icon: string;
}
```

### 2.3 Inventaire des faits

En exploitant la commutativité (a×b = b×a), on réduit les 100 faits (1-10 × 1-10) aux faits uniques :

- Tables de 1 et 10 : triviaux → traités à part (règle, pas mémorisation)
- Carrés : 2×2, 3×3, ..., 9×9 → 8 faits
- Faits non-carrés (a < b, 2 ≤ a ≤ 9, a < b ≤ 9) → 28 faits
- **Total à mémoriser : 36 faits** (après exclusion des ×1 et ×10)

Les faits ×1 et ×10 sont enseignés comme des **règles** (pas de la mémorisation) lors de la phase d'introduction.

---

## 3. Parcours utilisateur

### 3.1 Premier lancement

1. Écran d'accueil avec le personnage mascotte (voir §4)
2. Saisie du prénom → "Salut Zoé !"
3. Explication ludique : "Je suis [Mascotte]. On va apprendre les multiplications ensemble, 5 minutes par jour !"
4. Test de positionnement rapide (optionnel) : 15 faits mélangés, pas de timer visible → détermine quels faits sont déjà connus pour démarrer à la bonne boîte
5. Introduction de la règle ×1 et ×10 (animation)
6. Première séance avec les 4 premiers faits (les plus simples : 2×2, 2×3, 2×4, 2×5)

### 3.2 Séance quotidienne (5 minutes)

**Structure d'une séance :**

```
[Accueil]          → Personnage + rappel de la streak + badge du jour si applicable
    ↓
[Intro]            → Si nouveaux faits à introduire (max 2 par séance) :
                     affichage visuel (grille de points), explication, 
                     puis première question immédiate
    ↓
[Pratique]         → Jusqu'à 12-15 questions (mix de révisions dues + faits récents)
                     Entrelacement automatique, pas de chrono visible
                     Feedback immédiat après chaque réponse
                     Note : si moins de faits sont disponibles, la séance est
                     plus courte — pas de répétition de remplissage (voir §6.2)
    ↓
[Récap]            → Score de la séance, encouragement adapté, 
                     animation de progression, badge éventuel
    ↓
[Fin]              → "À demain !" + mascotte
```

**Durée cible :** 4-6 minutes. L'application ne coupe pas en plein milieu d'une question mais affiche un indicateur de progression (barre ou étoiles à remplir).

### 3.3 Déroulement d'une question

1. Affichage de la question : "6 × 7 = ?"
   - Les opérandes peuvent être présentés dans les deux ordres (6×7 ou 7×6) même si le fait est stocké une seule fois
2. L'enfant tape sa réponse sur un pavé numérique intégré (gros boutons tactiles)
3. Validation automatique à 2 chiffres, ou bouton "OK" pour les résultats < 10
4. **Feedback immédiat :**
   - **Correct + rapide (< 3s) :** Animation joyeuse, son positif, +1 étoile dorée
   - **Correct + lent (3-5s) :** "Bravo !", mais pas de montée de boîte
   - **Correct + très lent (> 5s) :** "Bien ! Essaie d'aller un peu plus vite la prochaine fois"
   - **Incorrect :** Pas de son négatif, la bonne réponse s'affiche avec la grille de points, puis re-pose la question 2-3 questions plus tard dans la même séance

### 3.4 Introduction d'un nouveau fait

Quand l'algorithme décide d'introduire un nouveau fait :

1. **Affichage visuel :** Grille de points (array) animée — ex : 3 rangées de 7 points qui apparaissent une par une
2. **Lien avec l'addition :** "3 × 7, c'est 7 + 7 + 7 = 21"
3. **Commutativité :** La grille pivote de 90° → "7 × 3, c'est pareil ! C'est aussi 21"
4. **Première question :** Posée immédiatement après l'introduction
5. **Re-test :** Posée à nouveau 2-3 questions plus tard dans la séance

**Rythme d'introduction :** Maximum 2 nouveaux faits par séance. Un nouveau fait n'est introduit que si les faits précédemment introduits sont au moins en boîte 2.

---

## 4. Gamification

### 4.1 Personnage mascotte

Un petit animal/créature qui évolue avec la progression de Zoé :

| Niveau | Apparence | Débloqué quand |
|--------|-----------|----------------|
| 1 | Œuf | Début |
| 2 | Bébé créature | 5 faits en boîte 2+ |
| 3 | Créature enfant | 15 faits en boîte 3+ |
| 4 | Créature ado | 25 faits en boîte 4+ |
| 5 | Créature adulte | 36 faits en boîte 5 (tout maîtrisé) |

La mascotte réagit aux réponses (saute de joie, fait la moue, encourage) et a des animations d'idle sur l'écran d'accueil.

### 4.2 Badges

| Badge | Condition | Icône |
|-------|-----------|-------|
| Premier pas | Terminer la 1ère séance | 🌱 |
| Régulier·e | 7 jours consécutifs | 🔥 |
| Machine | 10 réponses correctes d'affilée dans une séance | ⚡ |
| Exploratrice | Avoir vu tous les faits au moins une fois | 🗺️ |
| Table de [N] | Maîtriser tous les faits d'une table | ⭐ |
| Mathématicienne | Tous les faits en boîte 5 | 🏆 |
| Véloce | 5 réponses < 2s d'affilée | 🚀 |
| Persévérante | Revenir après 3+ jours d'absence | 💪 |
| Flamme éternelle | 30 jours consécutifs | 🌟 |

### 4.3 Streak (série de jours)

- Compteur de jours consécutifs affiché sur l'écran d'accueil
- Animation de flamme qui grandit avec la streak
- Si l'enfant manque un jour : message bienveillant ("Tu m'as manqué ! On s'y remet ?"), pas de punition, la streak repart de 1 mais les progrès sur les faits sont conservés

### 4.4 Célébration de table complète

Quand tous les faits d'une table passent en boîte 4+ :
- Animation spéciale (feu d'artifice, confettis)
- La table s'illumine sur la grille de progression
- Badge spécifique

---

## 5. Suivi de progression

### 5.1 Vue enfant : la carte au trésor

Une grille visuelle 9×9 (tables 2 à 10) où chaque case représente un fait :

| Couleur | Signification |
|---------|---------------|
| Gris | Pas encore introduit |
| Rouge | Boîte 1 (difficile / erreur récente) |
| Orange | Boîte 2 |
| Jaune | Boîte 3 |
| Vert clair | Boîte 4 |
| Vert + étoile | Boîte 5 (maîtrisé) |

La grille est symétrique (commutativité) : les deux cases (a,b) et (b,a) ont toujours la même couleur. En tapant sur une case, l'enfant voit le fait et la grille de points associée.

### 5.2 Vue parent : tableau de bord

Accessible via un code/geste (ex : appui long sur le logo), sans mot de passe complexe.

**Indicateurs :**
- Nombre de faits par boîte (histogramme)
- Faits les plus difficiles (boîte 1 depuis le plus longtemps, ou le plus d'erreurs)
- Temps de réponse moyen par table
- Historique des séances (date, durée, score)
- Streak actuelle et plus longue
- Graphe d'évolution : nombre de faits maîtrisés (boîte 4+) au fil du temps

**Actions parent :**
- Réinitialiser un fait ou une table (avec confirmation)
- Exporter les données (JSON)
- Importer les données (pour changer de téléphone)

*Note : les paramètres (nombre de questions par séance, seuil de vitesse) ne sont pas exposés car leurs valeurs par défaut sont issues de la littérature scientifique (§1.1) et ne devraient pas être modifiées sans expertise.*

---

## 6. Algorithme de sélection des questions

### 6.1 Priorité de sélection pour une séance

À chaque séance, l'algorithme compose la liste de questions ainsi :

```
1. Faits en boîte 1 dont nextDue ≤ maintenant        (priorité haute)
2. Faits en boîte 2-3 dont nextDue ≤ maintenant       (priorité moyenne)
3. Faits en boîte 4-5 dont nextDue ≤ maintenant       (priorité basse)
4. Nouveaux faits à introduire (max 2)                 (si rien d'urgent)
```

### 6.2 Contraintes de composition

- **Anti-interférence :** Deux faits partageant un opérande ne sont jamais adjacents dans la file de questions (quand c'est possible)
- **Entrelacement :** Jamais deux questions de la même table d'affilée
- **Équilibre :** Si > 15 faits sont éligibles, on priorise les boîtes basses
- **Réintroduction après erreur :** Un fait raté est re-posé 2-3 questions plus tard dans la même séance (et revient en boîte 1 pour les séances suivantes)
- **Variation d'ordre :** Un même fait est parfois posé comme a×b, parfois comme b×a
- **Pas de répétition de remplissage :** Le nombre 12-15 est un objectif, pas un minimum absolu. Il dérive de la durée cible de 5 minutes (~20-30 s par question avec feedback). Si le nombre de faits distincts disponibles est inférieur à 12, la séance est plus courte plutôt que de répéter les mêmes faits en boucle. La littérature (Cepeda et al. 2008, Rea & Modigliani 1985) montre que c'est la régularité des sessions et les intervalles de révision qui comptent, pas le nombre de questions par session. La répétition massive (massed practice) dans une même séance est contre-productive.
- **Révision bonus :** Quand aucun fait n'est dû et qu'aucun nouveau fait ne peut être introduit (contrainte de similarité 48h), la séance est complétée avec des révisions bonus piochées parmi tous les faits introduits, en priorisant les boîtes les plus basses puis les dates de révision les plus proches. Les révisions bonus donnent un feedback normal (son, mascotte, score) mais **ne modifient pas l'état Leitner** (boîte, nextDue, lastSeen, historique). Cela garantit une séance chaque jour sans perturber le calendrier de répétition espacée.

### 6.3 Calcul de nextDue

```javascript
function computeNextDue(box, lastSeen) {
  const intervals = {
    1: 0,      // immédiat (prochaine séance)
    2: 1,      // 1 jour
    3: 3,      // 3 jours
    4: 7,      // 1 semaine
    5: 21      // 3 semaines
  };
  return addDays(lastSeen, intervals[box]);
}
```

---

## 7. Interface utilisateur

### 7.1 Écrans

| Écran | Contenu |
|-------|---------|
| Accueil | Mascotte animée, prénom, streak, bouton "C'est parti !" |
| Séance — Intro | Grille de points animée pour un nouveau fait |
| Séance — Question | Question en gros, pavé numérique, barre de progression |
| Séance — Feedback correct | Animation joyeuse, mascotte contente |
| Séance — Feedback incorrect | Bonne réponse affichée avec grille, ton bienveillant |
| Récap séance | Score, étoiles gagnées, badge éventuel, bouton "À demain" |
| Progression | Grille colorée des faits |
| Badges | Collection de badges obtenus |
| Parent | Dashboard détaillé (accès protégé) |

### 7.2 Principes d'interface

- **Mobile-first :** Conçu pour un écran de téléphone tenu verticalement
- **Gros boutons :** Zone de tap minimum 48×48px, pavé numérique avec touches de 60×60px minimum
- **Pas de chrono visible :** Le temps est mesuré en arrière-plan mais jamais montré à l'enfant (éviter l'anxiété)
- **Couleurs vives** mais pas agressives, mode clair uniquement
- **Police ronde et lisible :** type Nunito, Quicksand ou Baloo
- **Encouragements systématiques :** Aucun message négatif. Les erreurs sont traitées comme des opportunités d'apprentissage
- **Pas de publicité, pas de lien externe**

### 7.3 Sons

- Réponse correcte : son court et joyeux (type xylophone montant)
- Réponse incorrecte : son neutre et doux (pas de buzzer)
- Badge obtenu : fanfare courte
- Évolution de la mascotte : mélodie spéciale
- **Option de couper le son** toujours accessible

---

## 8. Fonctionnalités PWA / hors-ligne

- **Service Worker** pour le fonctionnement offline complet
- **manifest.json** pour l'installation sur l'écran d'accueil
- Icône d'app avec la mascotte
- Toutes les données en localStorage, aucune dépendance réseau
- Export/import JSON pour la sauvegarde et le transfert

---

## 9. Périmètre — Ce que l'application ne fait PAS

- Pas de division, addition ou soustraction (focus unique)
- Pas de comptes utilisateurs / backend / authentification
- Pas de classement entre enfants (pas de compétition)
- Pas de mode examen chronométré
- Pas de récompenses payantes
- Pas de collecte de données personnelles

---

## 10. Métriques de succès

L'application est considérée comme ayant atteint son objectif quand :

| Métrique | Cible |
|----------|-------|
| Faits en boîte 4+ | 36/36 |
| Temps de réponse moyen | < 3 secondes |
| Taux de bonne réponse (boîte 4+) | > 95% |
| Durée estimée pour atteindre l'objectif | 6-10 semaines à raison de 5 séances/semaine |

---

## 11. Évolutions possibles (V2)

- Extension aux tables de 11 et 12
- Mode défi : séance bonus optionnelle le week-end
- Personnalisation de la mascotte (couleur, accessoires gagnés)
- Intégration Strava-like : partage de la streak avec un parent
- Mode multi-enfant (plusieurs profils sur le même appareil)
- Lien division : une fois un fait maîtrisé en multiplication, introduction du fait de division associé

---

## 12. Références

- Brendefur, J., Strother, S., Thiede, K., & Appleton, S. (2015). Developing multiplication fact fluency. *Advances in Social Sciences Research Journal, 2*(8). [doi:10.14738/assrj.28.1396](https://doi.org/10.14738/assrj.28.1396)

- Cepeda, N. J., Vul, E., Rohrer, D., Wixted, J. T., & Pashler, H. (2008). Spacing effects in learning: A temporal ridgeline of optimal retention. *Psychological Science, 19*(11), 1095–1102. [doi:10.1111/j.1467-9280.2008.02209.x](https://doi.org/10.1111/j.1467-9280.2008.02209.x)

- Cowan, R., Donlan, C., Shepherd, D.-L., Cole-Fletcher, R., Saxton, M., & Hurry, J. (2011). Basic calculation proficiency and mathematics achievement in elementary school children. *Journal of Educational Psychology, 103*(4), 786–803. [doi:10.1037/a0024556](https://doi.org/10.1037/a0024556)

- Dotan, D., & Zviran-Ginat, S. (2022). Elementary math in elementary school: The effect of interference on learning the multiplication table. *Cognitive Research: Principles and Implications, 7*, 101. [doi:10.1186/s41235-022-00451-0](https://doi.org/10.1186/s41235-022-00451-0)

- Kang, S. H. K. (2016). Spaced repetition promotes efficient and effective learning. *Policy Insights from the Behavioral and Brain Sciences, 3*(1), 12–19. [doi:10.1177/2372732215624708](https://doi.org/10.1177/2372732215624708)

- Rea, C. P., & Modigliani, V. (1985). The effect of expanded versus massed practice on the retention of multiplication facts and spelling lists. *Human Learning, 4*, 11–18.

- Rohrer, D., Dedrick, R. F., & Burgess, K. (2014). The benefit of interleaved mathematics practice is not limited to superficially similar kinds of problems. *Psychonomic Bulletin & Review, 21*(5), 1323–1330. [doi:10.3758/s13423-014-0588-3](https://doi.org/10.3758/s13423-014-0588-3)

- Rohrer, D., & Taylor, K. (2007). The shuffling of mathematics problems improves learning. *Instructional Science, 35*, 481–498. [doi:10.1007/s11251-007-9015-8](https://doi.org/10.1007/s11251-007-9015-8)

---

*Document de spécifications — v1.0 — Avril 2026*
