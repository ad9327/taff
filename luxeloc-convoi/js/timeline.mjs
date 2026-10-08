// Shared by the picture (browser) and the score (Node): one beat grid for both. Drift phonk at 140 BPM.
//
// The film: the convoy rolls; as each car arrives the camera punches in on it, its name lights up as a hologram
// over the roof, then a run of its photos and clips, then back to the convoy for the next one. The RS4 and the
// RS7 are not in the convoy: they arrive after it on their own photo, with the same punch-in and hologram.
import { CARS, runBeats } from './copy.mjs';

export const BPM = 140;
export const BEAT = 60 / BPM;          // 0.4286 s
export const BAR = BEAT * 4;
export const FPS = 60;
export const W = 1080;
export const H = 1920;
export const b = (n) => n * BEAT;


export const HOLO_BEATS = 3;           // punch-in + hologram + the specs

// Convoy clip (assets/media/convoy: 7.55 s at 60 fps) and the moment each car is best framed in it.
export const CONVOY_LEN = 7.55;
export const ARRIVAL_PRE = 1;          // RS4 / RS7: their photo shows one beat before the punch-in
// beats the convoy rolls between two convoy cars (keeps it close to real speed)
const GAPS = [3, 2, 3, 3, 3];
// beat at which each car is hit (punch-in starts), the end card, the length
export const RUN_END = [];
export const HITS = [];
{
  let hb = 2;
  CARS.forEach((c, i) => {
    HITS.push(hb);
    const end = hb + HOLO_BEATS + runBeats(c);
    RUN_END.push(end);
    const next = CARS[i + 1];
    if (!next) return;
    if (next.convoy) hb = end + GAPS[i];
    else if (c.convoy) hb = end + 1 + ARRIVAL_PRE;      // the convoy rolls out a beat, then the arrival's photo
    else hb = end + ARRIVAL_PRE;
  });
}
export const END_AT = RUN_END[RUN_END.length - 1];
export const DURATION = b(END_AT + 12);

// Segments, in order: { kind: 'play' | 'holo' | 'run' | 'arrive' | 'end', car, a, z (seconds), c0, c1 (convoy s) }
export function segments(convoyHits) {
  const S = [];
  let prevBeat = 0, prevC = 0, prevCar = -1;
  HITS.forEach((hb, i) => {
    const arrival = convoyHits[i] == null;
    if (!arrival) {
      S.push({ kind: 'play', car: i, from: prevCar, a: b(prevBeat), z: b(hb), c0: prevC, c1: convoyHits[i] });
      prevC = convoyHits[i];
    } else {
      if (prevCar >= 0 && convoyHits[prevCar] != null) {
        // the convoy rolls on a beat after the last convoy car, then the first arrival's photo comes in
        S.push({ kind: 'play', car: -1, from: prevCar, a: b(prevBeat), z: b(hb - ARRIVAL_PRE), c0: prevC, c1: Math.min(CONVOY_LEN - 0.05, prevC + 0.45) });
      }
      S.push({ kind: 'arrive', car: i, a: b(hb - ARRIVAL_PRE), z: b(hb) });
    }
    S.push({ kind: 'holo', car: i, a: b(hb), z: b(hb + HOLO_BEATS) });
    S.push({ kind: 'run', car: i, a: b(hb + HOLO_BEATS), z: b(RUN_END[i]) });
    prevBeat = RUN_END[i];
    prevCar = i;
  });
  S.push({ kind: 'end', car: -1, a: b(END_AT), z: DURATION });
  return S;
}
