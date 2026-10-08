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
// shots: the run — photo names (assets/media/cars) or { clip } (assets/media/clips, 60 fps frames).
export const CARS = [
  { id: 'sl', make: 'MERCEDES-AMG', model: 'SL 805', price: 900,
    convoy: { frame: 23, box: [57, 624, 311, 748] },
    shots: ['sl_a', 'sl_b', 'sl_c', 'sl_e', 'sl_f'] },
  { id: 'm5', make: 'BMW', model: 'M5 TOURING', price: 700,
    convoy: { frame: 53, box: [34, 604, 309, 749] },
    shots: ['m5_a', { clip: 'm5_walk', frames: 96, zoom: 1.2, focus: [540, 300] }, 'm5_c', 'm5_d', 'm5_f'] },
  { id: 'golf', make: 'VOLKSWAGEN', model: 'GOLF 8 R', price: 250,
    convoy: { frame: 76, box: [57, 598, 355, 749] },
    shots: ['golf_f', 'golf_b', 'golf_mad', { clip: 'golf_dash', frames: 96 }, 'golf_a'] },
  { id: 'gt3', make: 'PORSCHE', model: '911 GT3', price: 1400,
    convoy: { frame: 103, box: [76, 598, 420, 754] },
    shots: ['gt3_c', 'gt3_e', 'gt3_d', 'gt3_rear', 'gt3_f'] },
  { id: 'rs5', make: 'AUDI', model: 'RS5', price: 450,
    convoy: { frame: 131, box: [98, 601, 533, 777] },
    shots: ['rs5_a', 'rs5_d', 'rs5_c', 'rs5_e', 'rs5_b'] },
  { id: 'rs6', make: 'AUDI', model: 'RS6 AVANT', price: 700,
    convoy: { frame: 166, box: [192, 585, 720, 777] },
    shots: ['rs6_a', 'rs6_c', 'rs6_e', 'rs6_d', 'rs6_b'] },
  { id: 'rs4', make: 'AUDI', model: 'RS4 AVANT', price: 450,
    arrival: { photo: 'rs4_b', box: [95, 600, 1075, 1140] },
    shots: ['rs4_front', 'rs4_c', 'rs4_a', 'rs4_in'] },
  { id: 'rs7', make: 'AUDI', model: 'RS7 SPORTBACK', price: 700,
    arrival: { photo: 'rs7_b', box: [16, 700, 1030, 1200] },
    shots: ['rs7_a', 'rs7_c', 'rs7_e', 'rs7_d'] },
];

export const convoyTime = (car) => (car.convoy ? car.convoy.frame / 24 : null);
export const minPrice = Math.min(...CARS.map((c) => c.price));
