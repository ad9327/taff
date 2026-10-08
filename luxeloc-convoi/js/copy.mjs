// Everything written on screen, and each car's media. Prices and deposits: the client's own rate cards.
// Photos and clips live in assets/media (out of git).
export const COPY = {
  brandTop: 'LUXELOC',
  brandBottom: 'RESA93',
  brand: 'LUXELOCRESA93',
  tagline: 'Location de véhicules de prestige',
  zone: 'Île-de-France',
  fleet: '8 véhicules de prestige',
  priceUnit: '/ 24H',
  endTitle: ['RÉSERVE', 'TA VOITURE'],
  docsTitle: 'À FOURNIR :',
  docs: ['PERMIS DE CONDUIRE', "CARTE D'IDENTITÉ", 'JUSTIFICATIF DE DOMICILE'],
  contact: ['CONTACTEZ-NOUS', 'DÈS MAINTENANT'],
  // the accounts shown on the phone (the client's own screenshots) and on the end card
  socials: [
    { net: 'snap', handle: 'luxeloccresa75x' },
    { net: 'whatsapp', handle: 'Luxeloccresa75x' },
  ],
  phoneTitle: ['RÉSERVE EN', 'UN MESSAGE'],
  phoneSnap: ['AJOUTE-NOUS SUR SNAPCHAT', 'luxeloccresa75x'],
  phoneWa: ['ÉCRIS-NOUS SUR WHATSAPP', 'Luxeloccresa75x'],
};

// convoy: the frame (original 24 fps index) where the car is hit, and its box in the 720×1280 source.
// arrival: the photo the car arrives on, and its box in that 1080×1920 photo.
// shots: the run, each [source, beats] — a photo name (assets/media/cars) or a clip (assets/media/clips, 60 fps
// frames; from = first frame, zoom/focus = reframing). The cars with video get a longer run.
const clip = (name, o = {}) => ({ clip: name, ...o });
// rates: [title, sub-title, € ] as on the client's cards; caution in €
const WE = 'VEN. 18H – LUN. 9H';
const rates3 = (day, weDay, we) => [['24H', 'EN SEMAINE', day], ['24H', 'WEEK-END', weDay], ['WEEK-END', WE, we]];
export const CARS = [
  { id: 'sl', make: 'MERCEDES-AMG', model: 'SL 63 S E PERFORMANCE', specs: '816 CH · V8 BITURBO HYBRIDE · 0–100 : 2,9 S',
    rates: rates3(900, 1200, 2500), caution: 15000,
    convoy: { frame: 23, box: [57, 624, 311, 748] },
    shots: [['sl_a', 1.5], [clip('sl_night', { frames: 108 }), 2], ['sl_b', 1], [clip('sl_drive', { frames: 108 }), 2], ['sl_e', 1.5]] },
  { id: 'm5', make: 'BMW', model: 'M5 TOURING', specs: '727 CH · V8 BITURBO HYBRIDE · 1 000 NM · M XDRIVE',
    rates: rates3(700, 900, 2200), caution: 10000,
    convoy: { frame: 53, box: [34, 604, 309, 749] },
    shots: [['m5_a', 1.5], [clip('m5_walk', { frames: 96, zoom: 1.2, focus: [540, 300] }), 2], [clip('m5_hood', { frames: 66, from: 12 }), 2], ['m5_d', 1], ['m5_f', 1.5]] },
  { id: 'golf', make: 'VOLKSWAGEN', model: 'GOLF 8 R 20 YEARS', specs: '333 CH · 4MOTION · 0–100 : 4,6 S',
    rates: [['24H', 'EN SEMAINE', 250], ['WEEK-END', WE, 900]], caution: 4000,
    convoy: { frame: 76, box: [57, 598, 355, 749] },
    shots: [['golf_f', 1.5], [clip('golf_side', { frames: 108 }), 2], ['golf_mad', 1], [clip('golf_dash', { frames: 96 }), 2], ['golf_a', 1.5]] },
  { id: 'gt3', make: 'PORSCHE', model: '911 GT3', specs: null,
    rates: rates3(1400, 1800, 4500), caution: 20000,
    convoy: { frame: 103, box: [76, 598, 420, 754] },
    shots: [['gt3_c', 2], ['gt3_e', 1], ['gt3_d', 1], ['gt3_rear', 1], ['gt3_f', 1]] },
  { id: 'rs5', make: 'AUDI', model: 'RS5 SPORTBACK', specs: '450 CH · V6 BITURBO · QUATTRO',
    rates: rates3(450, 700, 1600), caution: 7000,
    convoy: { frame: 131, box: [98, 601, 533, 777] },
    shots: [['rs5_a', 2], ['rs5_d', 1], ['rs5_c', 1], ['rs5_e', 1], ['rs5_b', 1]] },
  { id: 'rs6', make: 'AUDI', model: 'RS6 AVANT', specs: 'V8 BITURBO · QUATTRO · PERFORMANCE',
    rates: rates3(700, 900, 2200), caution: 10000,
    convoy: { frame: 166, box: [192, 585, 720, 777] },
    shots: [['rs6_a', 2], ['rs6_c', 1], ['rs6_e', 1], ['rs6_d', 1], ['rs6_b', 1]] },
  { id: 'rs4', make: 'AUDI', model: 'RS4 AVANT', specs: '450 CH · V6 BITURBO · QUATTRO',
    rates: rates3(450, 700, 1600), caution: 7000,
    arrival: { photo: 'rs4_b', box: [95, 600, 1075, 1140] },
    shots: [['rs4_front', 2], ['rs4_c', 1], ['rs4_a', 1], ['rs4_in', 2]] },
  { id: 'rs7', make: 'AUDI', model: 'RS7 SPORTBACK', specs: '600 CH · V8 BITURBO · 800 NM · 0–100 : 3,6 S · QUATTRO',
    rates: rates3(700, 900, 2200), caution: 10000,
    arrival: { photo: 'rs7_b', box: [16, 700, 1030, 1200] },
    shots: [['rs7_a', 1.5], [clip('rs7_pan', { frames: 108 }), 2], ['rs7_c', 1], ['rs7_d', 1.5], ['rs7_e', 2]] },
];

// a run's shots as [start, end] in beats from its start, and its length
export const shotSpans = (car) => { let a = 0; return car.shots.map(([, d]) => [a, (a += d)]); };
export const runBeats = (car) => car.shots.reduce((n, [, d]) => n + d, 0);

export const convoyTime = (car) => (car.convoy ? car.convoy.frame / 24 : null);
export const minPrice = Math.min(...CARS.map((c) => c.rates[0][2]));
export const euros = (n) => `${n >= 10000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : n}€`;   // as on the client's cards: 900€, 1400€, 15 000€
