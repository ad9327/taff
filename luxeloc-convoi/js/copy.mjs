// Everything written on screen, and each car's media. Prices: the client's own Snapchat rate cards
// (24h en semaine, lundi au jeudi). Photos and clips live in assets/media (out of git).
export const COPY = {
  brandTop: 'LUXELOC',
  brandBottom: 'RESA93',
  brand: 'LUXELOCRESA93',
  tagline: 'Location de véhicules de prestige',
  zone: 'Île-de-France',
  fleet: '8 véhicules de prestige',
  pricePrefix: 'À partir de',
  priceUnit: '/ 24H',
  endTitle: ['RÉSERVE', 'TA VOITURE'],
  endCta: 'EN DM',
  socials: [
    { net: 'snap', handle: 'Luxeloc75' },
    { net: 'tiktok', handle: 'luxeloc75' },
    { net: 'insta', handle: 'LuxeLoc75' },
  ],
};

// convoy: the frame (original 24 fps index) where the car is hit, and its box in the 720×1280 source.
// arrival: the photo the car arrives on, and its box in that 1080×1920 photo.
// shots: the run, each [source, beats] — a photo name (assets/media/cars) or a clip (assets/media/clips, 60 fps
// frames; from = first frame, zoom/focus = reframing). The cars with video get a longer run.
const clip = (name, o = {}) => ({ clip: name, ...o });
export const CARS = [
  { id: 'sl', make: 'MERCEDES-AMG', model: 'SL 805', price: 900,
    convoy: { frame: 23, box: [57, 624, 311, 748] },
    shots: [['sl_a', 1.5], [clip('sl_night', { frames: 108 }), 2], ['sl_b', 1], [clip('sl_drive', { frames: 108 }), 2], ['sl_e', 1.5]] },
  { id: 'm5', make: 'BMW', model: 'M5 TOURING', price: 700,
    convoy: { frame: 53, box: [34, 604, 309, 749] },
    shots: [['m5_a', 1.5], [clip('m5_walk', { frames: 96, zoom: 1.2, focus: [540, 300] }), 2], [clip('m5_hood', { frames: 66, from: 12 }), 2], ['m5_d', 1], ['m5_f', 1.5]] },
  { id: 'golf', make: 'VOLKSWAGEN', model: 'GOLF 8 R', price: 250,
    convoy: { frame: 76, box: [57, 598, 355, 749] },
    shots: [['golf_f', 1.5], [clip('golf_side', { frames: 108 }), 2], ['golf_mad', 1], [clip('golf_dash', { frames: 96 }), 2], ['golf_a', 1.5]] },
  { id: 'gt3', make: 'PORSCHE', model: '911 GT3', price: 1400,
    convoy: { frame: 103, box: [76, 598, 420, 754] },
    shots: [['gt3_c', 2], ['gt3_e', 1], ['gt3_d', 1], ['gt3_rear', 1], ['gt3_f', 1]] },
  { id: 'rs5', make: 'AUDI', model: 'RS5', price: 450,
    convoy: { frame: 131, box: [98, 601, 533, 777] },
    shots: [['rs5_a', 2], ['rs5_d', 1], ['rs5_c', 1], ['rs5_e', 1], ['rs5_b', 1]] },
  { id: 'rs6', make: 'AUDI', model: 'RS6 AVANT', price: 700,
    convoy: { frame: 166, box: [192, 585, 720, 777] },
    shots: [['rs6_a', 2], ['rs6_c', 1], ['rs6_e', 1], ['rs6_d', 1], ['rs6_b', 1]] },
  { id: 'rs4', make: 'AUDI', model: 'RS4 AVANT', price: 450,
    arrival: { photo: 'rs4_b', box: [95, 600, 1075, 1140] },
    shots: [['rs4_front', 2], ['rs4_c', 1], ['rs4_a', 1], ['rs4_in', 2]] },
  { id: 'rs7', make: 'AUDI', model: 'RS7 SPORTBACK', price: 700,
    arrival: { photo: 'rs7_b', box: [16, 700, 1030, 1200] },
    shots: [['rs7_a', 1.5], [clip('rs7_pan', { frames: 108 }), 2], ['rs7_c', 1], ['rs7_d', 1.5], ['rs7_e', 2]] },
];

// a run's shots as [start, end] in beats from its start, and its length
export const shotSpans = (car) => { let a = 0; return car.shots.map(([, d]) => [a, (a += d)]); };
export const runBeats = (car) => car.shots.reduce((n, [, d]) => n + d, 0);

export const convoyTime = (car) => (car.convoy ? car.convoy.frame / 24 : null);
export const minPrice = Math.min(...CARS.map((c) => c.price));
