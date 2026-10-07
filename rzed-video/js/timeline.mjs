// Shared by the picture (browser) and the score (Node): one beat grid for both.
export const BPM = 140;
export const BEAT = 60 / BPM;          // 0.4286 s
export const BAR = BEAT * 4;           // 1.7143 s
export const FPS = 60;
export const W = 1080;
export const H = 1920;

export const b = (n) => n * BEAT;      // beats → seconds

// Scene windows in beats. Neighbours overlap across each transition.
export const SCENES_BEATS = {
  hook:     [0, 9],
  logo:     [7.5, 21],
  services: [19.5, 37],
  chat:     [35.5, 49],
  tarifs:   [47.5, 56],
  packs:    [55.5, 64],
  end:      [63.5, 76],
};
export const S = Object.fromEntries(
  Object.entries(SCENES_BEATS).map(([k, [a, z]]) => [k, [b(a), b(z)]]),
);

export const DURATION = b(76);         // 32.57 s, 19 bars

// Named hits in beats. Picture and sound both read these.
export const CUE_BEATS = {
  hook1: 0, hook2: 2, hook3: 4,        // TON SON / MÉRITE UN / VRAI STUDIO.
  ringForm: 5.5,                       // the ring closes around the words
  tapeStop: 6.5,                       // tape-stop + silence before the drop
  drop: 8,                             // RZED RECORDS
  studioLabel: 11, pill1: 13, pill2: 14, tagline: 16,
  servicesIn: 20,
  card1: 21, card2: 24, card3: 27, card4: 30, grid: 33,
  chatIn: 36, phoneIn: 37,
  msg1: 38, msg2: 39.5, msg3: 41, msg4: 42.5, msg5: 44,
  tarifsIn: 48,
  price1: 49, price2: 50.5, price3: 52,
  packsIn: 56,
  pack1: 57, pack2: 58.5, pack3: 60, packCta: 61.5,
  endIn: 64,
  endPhone: 65.5, endSocial: 67, endMail: 67.75, endAddr: 68.5,
};
export const CUE = Object.fromEntries(Object.entries(CUE_BEATS).map(([k, v]) => [k, b(v)]));

// Fast moves: the score puts a whoosh on each, the background warps.
export const WHIPS = [
  { at: b(7.25), dur: b(0.75), kind: 'iris' },     // hook → logo (into the drop)
  { at: b(19.5), dur: b(0.5), kind: 'up' },        // logo → services
  { at: b(35.5), dur: b(0.5), kind: 'up' },        // services → chat
  { at: b(47.5), dur: b(0.5), kind: 'iris' },      // chat → tarifs
  { at: b(55.5), dur: b(0.5), kind: 'left' },      // tarifs → packs
  { at: b(63.5), dur: b(0.5), kind: 'iris' },      // packs → end
];

// Energy per scene (from the brief: a TikTok promo for a rap studio → groove from bar 1).
export const ENERGY = {
  hook: 'high', logo: 'high', services: 'high', chat: 'mid-high', tarifs: 'high', packs: 'high', end: 'high',
};
