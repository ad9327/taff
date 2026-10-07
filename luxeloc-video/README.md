# LuxeLocResa93 — promo TikTok (9:16, 30,9 s)

Location de véhicules de prestige en Île-de-France. Même moteur que `rzed-video/` : chaque image est une fonction du
temps rendue dans Chrome headless, la musique est composée et synthétisée sur la même grille de tempo.

```bash
node tools/render.mjs            # out/luxelocresa93-promo.mp4 (1080×1920, 60 fps, -14 LUFS) + -web.mp4 + covers
node tools/capture.mjs sheet 0 8 18          # planche → out/sheet.png
node tools/capture.mjs still 1.2 5.6         # images pleine taille → out/stills/
node tools/capture.mjs verify                # chaque image doit être une fonction de t
node audio/score.mjs --report && node tools/master.mjs   # musique seule
```

## Modifier

- **Prix** : `js/copy.mjs`, champ `price` de chaque voiture (€ / jour) — l'étiquette « À partir de … € / jour »
  apparaît dès qu'un prix est renseigné.
- **Réseaux** : `js/copy.mjs`, `socials: [{ net: 'Snap', handle: '…' }, …]` — une pastille par réseau sur la carte de fin.
- **Ordre des voitures, noms** : `js/copy.mjs` (`cars`, `hookCars`).
- **Timing** : `js/timeline.mjs` (136 BPM, une voiture toutes les 6 temps).
- **Son** : `audio/score.mjs`.

Les photos du client sont dans `assets/cars/` (hors git) : `<voiture>_front.jpg` (plan principal, plaque couverte
par une plaque LUXELOCRESA93) et `<voiture>_in.jpg` / `gt3_rear.jpg` (second plan).

## Direction

**Le film en une ligne :** une barre de lumière de phares — l'accent de la marque — ouvre le logo et balaie l'écran
de haut en bas pour révéler chaque voiture du garage.

**Look :** noir profond, chrome et or (« Luxe »), noms des modèles en Michroma (large, automobile) avec un reflet
qui court sur les lettres, titres d'accroche en Anton, petits textes en Montserrat. Photos étalonnées ensemble
(contraste, saturation un peu basse) pour mêler jour et nuit.

| Temps (beats) | Secondes | À l'écran |
|---|---|---|
| 0–5,75 | 0–2,5 | ROULE EN [GT3 / RS6 / M5 / SL 63 / RS7 / RS4] — une voiture par temps |
| 5,75–8 | 2,5–3,5 | LOUE LA VOITURE / DE TES RÊVES. + compte-tours jusqu'à la zone rouge, rupteur |
| 8–16 | 3,5–7,1 | Drop : LUXELOC / RESA93 sur la barre de lumière, « Location de véhicules de prestige », Île-de-France |
| 16–58 | 7,1–25,6 | Le garage : RS4 Avant, RS5, RS6 Avant, RS7 Sportback, M5, SL 63, 911 GT3 (2 plans chacune) |
| 58,5–70 | 25,8–30,9 | RÉSERVE / TA VOITURE — EN DM, Île-de-France (+ réseaux quand confirmés) |

**Son :** phonk drift, 136 BPM, do# mineur — riff de cloche 808, 808 saturée avec glissés, clap au 3e temps, charlestons
en doubles croches et triolets. Sons de marque : montée en régime synchronisée à l'aiguille, rupteur, pétarades
d'échappement au drop, passage de vitesse sur chaque voiture, coup de gaz sur la GT3 et à la fin.

**En attente du client :** prix, kilométrage inclus, réseaux sociaux, logo éventuel.
