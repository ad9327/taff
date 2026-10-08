# LuxeLocResa93 — le convoi (TikTok 9:16, 60,9 s)

Le convoi roule. À chaque voiture qui arrive : la visée se verrouille, la caméra zoome d'un coup sur elle, son nom
s'allume en hologramme au-dessus du toit et ses caractéristiques montent en HUD sous elle, puis défilent ses photos
et vidéos, avec la fiche tarifs bleue (prix + caution). Ensuite on revient au convoi jusqu'à la suivante. La RS4 et la RS7 ne sont pas dans le convoi : elles arrivent après, sur leur photo, avec
le même zoom et le même hologramme. Puis le téléphone (cinématique Higgsfield) se lève sous RÉSERVE EN UN MESSAGE,
son écran s'allume sur le profil Snapchat du client puis glisse sur sa conversation WhatsApp, où une demande de
réservation se tape en direct (champ qui grandit, bulles, « en train d'écrire », accusés de lecture, défilement ;
`js/scenes/chat.js`, texte dans `COPY.chat`). Carte de fin : RÉSERVE TA VOITURE, dès 250 €, les documents à fournir, CONTACTEZ-NOUS DÈS MAINTENANT et les réseaux.

Même moteur que `luxeloc-video/` : chaque image est une fonction du temps rendue dans Chrome headless, la musique
est composée et synthétisée sur la même grille de tempo.

```bash
node tools/render.mjs                         # out/luxelocresa93-convoi.mp4 (1080×1920, 60 fps, -14 LUFS) + -web.mp4 + covers
node tools/capture.mjs still 1.5 2.8          # images pleine taille → out/stills/
node tools/capture.mjs sheet 0.5 5.3 36       # planche → out/sheet.png
node tools/capture.mjs verify                 # chaque image doit être une fonction de t
node audio/score.mjs --report --holo && node tools/master.mjs   # musique seule
```

## Modifier

- **Prix, caution, caractéristiques, noms, photos de chaque voiture** : `js/copy.mjs` (`CARS` : `rates`, `caution`,
  `specs`). Les prix et cautions viennent des fiches du client ; `specs: null` = pas de ligne de caractéristiques.
- **Réseaux, textes** : `js/copy.mjs` (`COPY`).
- **Timing** : `js/timeline.mjs` (140 BPM ; 3 temps d'hologramme, puis le défilé dont chaque plan a sa durée en temps
  dans `CARS[].shots` — 8 temps pour les voitures qui ont des vidéos, 6 pour les autres ; tout le reste se recalcule).
- **Son** : `audio/score.mjs` (un moteur par voiture dans `ENGINES`).

## Médias (hors git : `assets/media/`)

| Dossier | Contenu |
|---|---|
| `convoy/` | la vidéo Higgsfield du convoi passée en 1080×1920 et 60 i/s (interpolation) |
| `freeze/` | l'image du convoi au moment du zoom pour chaque voiture, agrandie ×3, plaque couverte |
| `cars/` | les photos du défilé (story Snapchat du client recadrée, ses photos, plaques couvertes par une plaque LUXELOCRESA93) |
| `phone/`, `phone_on/`, `phone_hold/` | la cinématique du téléphone recadrée en 9:16 et 60 i/s (`tools/clean-phone-status.py` efface la fausse barre d'état), puis l'écran allumé incrusté image par image (`tools/bake-phone.py <snap.png> <whatsapp.png>`) |
| `wa/` | morceaux de l'image WhatsApp tenue (fond d'écran, bandeau « Aujourd'hui », notice, barre de saisie) sur lesquels la conversation est dessinée |
| `clips/` | extraits vidéo en images 60 i/s : `sl_night`, `sl_drive` (SL, recadré sans le logo LUXELOC75), `m5_walk` (plaque suivie et couverte), `m5_hood`, `golf_side`, `golf_dash`, `rs7_pan` |

Ordre dans le convoi : SL 63 S E Performance, M5 Touring, Golf 8 R, 911 GT3, RS5, RS6 Avant ; puis RS4 Avant et RS7 Sportback.

## Direction

**Le film en une ligne :** la visée d'un HUD verrouille chaque voiture du convoi et la projette en hologramme.

**Look :** le convoi réel, la marque en chrome et or (LUXELOC / RESA93), l'hologramme en cyan (lignes de balayage,
fantôme chromatique, tranches de glitch à l'apparition), les prix en or Anton. Noms des modèles en Michroma.

**Son :** phonk drift, 140 BPM, do# mineur. Le rythme tombe sur le premier zoom ; pendant chaque hologramme la batterie
passe en demi-temps, la 808 s'efface et on entend le moteur de la voiture (V8, flat-six, quatre-cylindres avec
pétarades Akrapovič). Tic sur chaque coupe du défilé, balayage descendant au retour vers le convoi.
