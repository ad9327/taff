# RZED Records — promo TikTok (9:16, 32,6 s)

Vidéo de présentation du studio RZED Records, entièrement en motion design codé : chaque image est une
fonction du temps rendue dans Chrome headless, la musique est composée et synthétisée pour cette vidéo
sur la même grille de tempo que l'image.

## Rendu

```bash
node tools/render.mjs            # final : out/rzed-records-promo.mp4 (1080×1920, 60 fps, -14 LUFS) + -web.mp4 + covers
node tools/render.mjs --draft    # brouillon rapide 540×960 30 fps avec le son
node tools/capture.mjs sheet 0 6 18          # planche de 18 images entre 0 et 6 s → out/sheet.png
node tools/capture.mjs still 2.0 7.6         # images pleine taille → out/stills/
node tools/capture.mjs verify                # chaque image doit être une fonction de t
node audio/score.mjs --report && node tools/master.mjs   # musique seule → out/music.wav
```

Besoins : Node 22, ffmpeg, Playwright + Chromium (aucun paquet npm à installer dans le projet).

## Modifier

- **Textes, prix, contacts** : `js/copy.mjs`
- **Timing** (tempo, moments clés) : `js/timeline.mjs` — l'image et le son lisent les mêmes repères
- **Son** : `audio/score.mjs` (arrangement), `audio/synth.mjs` (instruments)
- **Plans Higgsfield / logo** : `assets/media.json` (voir plus bas)

### Ajouter les plans Higgsfield ou le vrai logo

`assets/media.json` déclare les médias optionnels ; sans lui, les cartes affichent leurs animations codées.

```json
{
  "logo":     { "type": "img",  "src": "assets/img/logo.png" },
  "mic":      { "type": "clip", "dir": "assets/clips/mic", "fps": 24, "frames": 120 },
  "singer":   { "type": "img",  "src": "assets/img/singer.jpg" },
  "console":  { "type": "img",  "src": "assets/img/console.jpg" },
  "monitors": { "type": "img",  "src": "assets/img/monitors.jpg" },
  "pads":     { "type": "img",  "src": "assets/img/pads.jpg" }
}
```

Le plus simple : `node tools/add-media.mjs <nom> <fichier>` (image ou clip ; un clip est interpolé à 60 fps
et découpé en images). Exemple : `node tools/add-media.mjs logo logo-rzed.png`.

Les fichiers Higgsfield (images, clips) ne sont pas versionnés : ils restent dans le compte Higgsfield du client.

## Direction

**Le film en une ligne :** un anneau de lumière bleue — le cercle de l'emblème RZED — referme l'accroche,
s'ouvre sur le logo au drop, et sert de transition et de surlignage jusqu'à la carte de fin.

**Ce que j'ai lu :** la planche de l'ancienne vidéo (bleu nuit étoilé, titres condensés en étiquettes bleues
et blanches, cartes en verre, téléphones, prix en gros) et la demande « une belle vidéo de présentation »
pour TikTok, dans le style de la référence @mnkgraph (non visionnée : TikTok est bloqué depuis l'environnement).

**Énergie :** haute dès la première mesure (promo TikTok, rap) ; respiration seulement sur l'arrêt de bande
avant le drop ; la section chat est un cran plus douce (mélodie à l'octave basse, pad plus présent).

**Look :** espace bleu profond avec étoiles en vol (traînées sur les transitions), nébuleuses bleues, cartes en verre,
étiquettes deux tons (bleu `#1f5fff` / blanc), accent cyan `#4cb8ff` sur le mot clé, Anton (titres) + Montserrat (texte).

**Interdits :** compteur de scènes, HUD décoratif, faux témoignages, logos de plateformes redessinés,
chiffres non publiés.

### Déroulé (140 BPM, 1 temps = 0,429 s)

| Temps (beats) | Secondes | À l'écran | Entrée → sortie |
|---|---|---|---|
| 0–8 | 0,0–3,4 | TON SON / MÉRITE UN / VRAI **STUDIO.** — un mot-ligne par temps fort, l'anneau se referme | slam + blur → arrêt de bande, iris par l'anneau |
| 8–19,5 | 3,4–8,4 | **DROP** : emblème RZED RECORDS, rayons, onde de choc ; STUDIO D'ENREGISTREMENT, Livry-Gargan (93), Ouvert 7j/7 · 24h/24, « La qualité pro accessible à tous » | flash → poussée vers le haut |
| 19,5–35,5 | 8,4–15,2 | TOUT POUR / TON SON : 4 cartes (Enregistrement, Mixage, Mastering, Beatmaking) animées sur le beat, puis grille 2×2 | cartes distribuées en 3D → poussée vers le haut |
| 35,5–47,5 | 15,2–20,4 | ÉCRIS-NOUS. : téléphone, conversation de réservation (70 € les 2h), WhatsApp · Appel · DM | bulles en ressort → iris |
| 47,5–55,5 | 20,4–23,8 | NOS TARIFS : 1h 35 €, 2h 70 €, 3h 100 € (compteurs + onde) | lignes alternées → poussée à gauche |
| 55,5–63,5 | 23,8–27,2 | NOS PACKS : 10h 300 €, 20h 580 €, 30h 850 € + « Réserve en DM ou au 07 69 69 36 56 » | → iris sur l'emblème |
| 63,5–76 | 27,2–32,6 | RÉSERVE / TA SESSION, 07 69 69 36 56, @rzed_records, e-mail, adresse — tenu 3,2 s après le dernier élément | arrêt de bande final |

### Son

- **Genre :** trap sombre, 140 BPM (half-time, rolls de charleston en triples croches et triolets), fa mineur.
- **Harmonie :** iv–V sur l'accroche (Si♭m – Do) pour que le drop tombe sur la tonique ; puis Fm – D♭ – B♭m – C.
- **Instruments :** 808 saturée avec glissés, kick court, snare + clap sur le 3e temps, charlestons type 808, cloche FM, pad scié filtré.
- **Logo sonore :** do – la♭ – fa (cloche) sur le drop, repris sur la carte de fin.
- **Sons « studio » :** arrêt de bande (tape stop) avant le drop et à la fin, craquement de vinyle sur l'intro.
- **SFX :** impacts sur chaque mot de l'accroche, whooshes sur chaque transition, « pops » de messages, tics de compteur + « ding » à l'atterrissage des prix.
- **Niveau :** -14 LUFS intégrés, crête vraie ≤ -1 dBTP (deux passes loudnorm).

## Sessions

- 2026-10-07 — vidéo refaite de zéro à partir de la planche du client ; plans Higgsfield générés (4 images) mais
  non téléchargeables (CDN Higgsfield bloqué par le réseau de l'environnement) → cartes de services en
  animations codées. À faire quand le domaine est autorisé : intégrer les images / clips Higgsfield et le vrai logo.
- 2026-10-07 (suite) — le CDN Higgsfield restant bloqué ici, la version avec visuels est rendue dans le bac à sable
  Higgsfield (même code, cloné depuis cette branche) : clip Kling 3.0 du micro sur l'accroche (7,5 crédits),
  4 photos sur les cartes de services (animations réduites à un accent sur le beat quand une photo est présente).
  La vidéo est déposée dans les médias Higgsfield du client.
- 2026-10-07 (logo) — vrai logo RZED Records intégré (drop, carte de fin, avatar du chat) avec un reflet qui le balaie
  après chaque apparition. Rendu complet (photos + clip + logo) refait dans le bac à sable Higgsfield et déposé
  dans les médias du client ; la copie de `out/` dans ce dépôt est la version sans photos.

