// Shared by the picture (browser) and the score (Node): one beat grid for both. Drift phonk at 136 BPM.
export const BPM = 136;
export const BEAT = 60 / BPM;          // 0.441 s
export const BAR = BEAT * 4;           // 1.765 s
export const FPS = 60;
export const W = 1080;
export const H = 1920;
export const b = (n) => n * BEAT;

// The garage: one car every 6 beats, the second shot on the 4th beat of each.
export const CAR_BEATS = 6;
export const GARAGE_START = 16;
export const N_CARS = 7;
export const carStart = (i) => b(GARAGE_START + i * CAR_BEATS);
export const GARAGE_END = GARAGE_START + N_CARS * CAR_BEATS;   // 58

export const DURATION = b(70);         // 30.88 s

export const CUE_BEATS = {
  flips: [0, 1, 2, 3, 4, 5],           // ROULE EN [GT3 / RS6 / M5 / SL 63 / RS7 / RS4], one car per beat
  dream: 5.75,                         // LOUE LA VOITURE / DE TES RÊVES. — the rev counter climbs
  limiter: 7.25,                       // needle on the red line, the limiter cuts in
  drop: 8,                             // LUXELOC RESA93
  tagline: 10.5, zone: 12,
  endIn: 58.5, endCta: 60, endZone: 61.5,
};
export const CUE = Object.fromEntries(Object.entries(CUE_BEATS).map(([k, v]) => [k, Array.isArray(v) ? v.map(b) : b(v)]));

// Transitions between scenes (the garage handles its own car-to-car wipes).
export const TRANS = [
  { from: 'hook', to: 'logo', kind: 'flash', at: b(7.9), dur: b(0.1) },
  { from: 'logo', to: 'garage', kind: 'beam', at: b(15.5), dur: b(0.5) },
  { from: 'garage', to: 'end', kind: 'beam', at: b(57.75), dur: b(0.75) },
];
