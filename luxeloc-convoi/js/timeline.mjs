// Shared by the picture (browser) and the score (Node): one beat grid for both. Drift phonk at 140 BPM.
//
// The film: the convoy rolls; as each car arrives the camera punches in on it, its name lights up as a hologram
// over the roof, then a run of its photos and clips, then back to the convoy for the next one. The RS4 and the
// RS7 are not in the convoy: they arrive after it on their own photo, with the same punch-in and hologram.
export const BPM = 140;
export const BEAT = 60 / BPM;          // 0.4286 s
export const BAR = BEAT * 4;
export const FPS = 60;
export const W = 1080;
export const H = 1920;
export const b = (n) => n * BEAT;

export const HOLO_BEATS = 2;           // punch-in + hologram
export const RUN_BEATS = 6;            // the run of photos / clips

// Convoy clip (assets/media/convoy: 7.55 s at 60 fps) and the moment each car is best framed in it.
export const CONVOY_LEN = 7.55;
// beats at which each car is hit (punch-in starts). Between two convoy cars the convoy plays again.
export const HITS = [2, 13, 23, 34, 45, 56, 66, 75];
export const ARRIVAL_PRE = 1;          // RS4 / RS7: their photo shows one beat before the punch-in
export const END_AT = 83;              // end card
export const DURATION = b(92);         // 39.4 s

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
    S.push({ kind: 'run', car: i, a: b(hb + HOLO_BEATS), z: b(hb + HOLO_BEATS + RUN_BEATS) });
    prevBeat = hb + HOLO_BEATS + RUN_BEATS;
    prevCar = i;
  });
  S.push({ kind: 'end', car: -1, a: b(END_AT), z: DURATION });
  return S;
}
