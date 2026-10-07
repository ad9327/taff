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
  chat:     [35.5, 53],
  tarifs:   [51.5, 60],
  packs:    [59.5, 68],
  end:      [67.5, 80],
};
export const S = Object.fromEntries(
  Object.entries(SCENES_BEATS).map(([k, [a, z]]) => [k, [b(a), b(z)]]),
);

export const DURATION = b(80);         // 34.29 s, 20 bars

// Named hits in beats. Picture and sound both read these.
export const CUE_BEATS = {
  hook1: 0, hook2: 2, hook3: 4,        // TON SON / MÉRITE UN / VRAI STUDIO.
  ringForm: 5.5,                       // the ring closes around the words
  tapeStop: 6.5,                       // tape-stop + silence before the drop
  drop: 8,                             // RZED RECORDS
  studioLabel: 11, pill1: 13, pill2: 14, tagline: 16,
  servicesIn: 20,
  card1: 21, card2: 24, card3: 27, card4: 30, grid: 33,
  chatIn: 36, phoneIn: 37,                      // phone opens on the TikTok profile
  instaIn: 39.5, snapIn: 42, chatScreen: 44.5,  // swipes to Instagram, Snapchat, then the chat
  msg1: 45, msg2: 46.25, msg3: 47.5, msg4: 48.75, msg5: 50,
  tarifsIn: 52,
  price1: 53, price2: 54.5, price3: 56,
  packsIn: 60,
  pack1: 61, pack2: 62.5, pack3: 64, packCta: 65.5,
  endIn: 68,
  endPhone: 69.5, endSocial: 71, endMail: 71.75, endAddr: 72.5,
};
export const CUE = Object.fromEntries(Object.entries(CUE_BEATS).map(([k, v]) => [k, b(v)]));

// Fast moves: the score puts a whoosh on each, the background warps.
export const WHIPS = [
  { at: b(7.25), dur: b(0.75), kind: 'iris' },     // hook → logo (into the drop)
  { at: b(19.5), dur: b(0.5), kind: 'up' },        // logo → services
  { at: b(35.5), dur: b(0.5), kind: 'up' },        // services → chat
  { at: b(51.5), dur: b(0.5), kind: 'iris' },      // chat → tarifs
  { at: b(59.5), dur: b(0.5), kind: 'left' },      // tarifs → packs
  { at: b(67.5), dur: b(0.5), kind: 'iris' },      // packs → end
];

// Energy per scene (from the brief: a TikTok promo for a rap studio → groove from bar 1).
export const ENERGY = {
  hook: 'high', logo: 'high', services: 'high', chat: 'mid-high', tarifs: 'high', packs: 'high', end: 'high',
};
