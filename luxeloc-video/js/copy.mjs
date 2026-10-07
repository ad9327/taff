// Every word on screen. Prices, mileage and social handles are pending from the client: a car's price
// tag appears as soon as `price` is set (€ per day), and the end card lists handles once `socials` is filled.
export const COPY = {
  brandTop: 'LUXELOC',
  brandBottom: 'RESA93',
  tagline: 'Location de véhicules de prestige',
  zone: 'Île-de-France',

  hookLead: 'ROULE EN',
  hookCars: [
    { name: 'GT3', shot: 'gt3_front' },
    { name: 'RS6', shot: 'rs6_front' },
    { name: 'M5', shot: 'm5_front' },
    { name: 'SL 63', shot: 'sl63_front' },
    { name: 'RS7', shot: 'rs7_front' },
    { name: 'RS4', shot: 'rs4_front' },
  ],
  hookEnd: ['LOUE LA VOITURE', 'DE TES RÊVES.'],

  // the garage, in order of appearance (the GT3 closes it)
  cars: [
    { make: 'AUDI', model: 'RS4 AVANT', shots: ['rs4_front', 'rs4_in'], price: null },
    { make: 'AUDI', model: 'RS5', shots: ['rs5_front', 'rs5_in'], price: null },
    { make: 'AUDI', model: 'RS6 AVANT', shots: ['rs6_front', 'rs6_in'], price: null },
    { make: 'AUDI', model: 'RS7 SPORTBACK', shots: ['rs7_front', 'rs7_in'], price: null },
    { make: 'BMW', model: 'M5', shots: ['m5_front', 'm5_in'], price: null },
    { make: 'MERCEDES-AMG', model: 'SL 63', shots: ['sl63_front', 'sl63_in'], price: null },
    { make: 'PORSCHE', model: '911 GT3', shots: ['gt3_front', 'gt3_rear'], price: null },
  ],
  pricePrefix: 'À partir de',
  priceSuffix: '€ / jour',

  endTitle: ['RÉSERVE', 'TA VOITURE'],
  endCta: 'EN DM',
  socials: [],                         // e.g. [{ net: 'Snap', handle: '…' }] once confirmed
  endBg: 'gt3_rear',
};
