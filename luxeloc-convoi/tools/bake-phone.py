# Bakes the phone cinematic's lit screen: the client's Snapchat profile and WhatsApp chat, warped onto the phone's
# screen in every frame where it faces the camera, plus the held last frame in each screen state.
#   python3 -I tools/bake-phone.py <snapchat.png> <whatsapp.png>
# reads  assets/media/phone/NNNN.jpg   (the Higgsfield clip, 9:16 crop at 60 fps; frame n = source 1.4 s + n/60)
# writes assets/media/phone_on/NNNN.jpg (screen lighting up on the Snapchat profile, frames 178…213)
#        assets/media/phone_hold/{snap,wa,swipe_00…14}.jpg (the last frame, held)
import os, sys
import numpy as np
import cv2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
M = os.path.join(ROOT, 'assets/media')
SNAP, WA = sys.argv[1], sys.argv[2]

# the screen's corners (TL, TR, BR, BL) in the 1080×1920 crop, per source frame (24 fps), measured from the bezel
# highlights; 106–110 are interpolated (a glare throws the detection off there); corner radius last.
Q = {
    105: [[190.6, 186.6], [896.8, 165.7], [877.8, 1700.9], [171.1, 1659.8]],
    111: [[170.0, 172.7], [913.1, 164.8], [902.2, 1695.7], [167.9, 1679.1]],
    112: [[167.0, 171.6], [914.2, 165.6], [904.8, 1697.1], [167.9, 1683.8]],
    113: [[164.4, 170.9], [914.9, 166.4], [907.0, 1698.4], [168.4, 1687.7]],
    114: [[164.9, 169.6], [915.3, 166.8], [909.0, 1699.0], [168.6, 1690.3]],
    115: [[165.7, 167.6], [915.6, 166.6], [910.0, 1698.2], [169.1, 1691.7]],
    116: [[166.9, 165.5], [915.7, 166.2], [910.9, 1697.4], [169.4, 1693.1]],
    117: [[166.8, 163.9], [915.7, 165.9], [911.3, 1696.5], [170.2, 1694.3]],
    118: [[166.6, 162.7], [915.4, 165.7], [911.8, 1695.6], [170.8, 1695.6]],
    119: [[166.5, 162.2], [914.8, 165.8], [912.1, 1694.9], [171.3, 1696.8]],
    120: [[166.4, 162.0], [914.1, 166.5], [912.4, 1694.9], [171.5, 1698.5]],
    121: [[166.4, 162.0], [913.5, 167.0], [912.8, 1695.2], [171.5, 1699.5]],
}
R = {105: 88.7, 111: 92.8}
KEYS = sorted(Q)

def quad(fs):
    fs = min(max(fs, KEYS[0]), KEYS[-1])
    for a, b in zip(KEYS, KEYS[1:]):
        if a <= fs <= b:
            u = (fs - a) / (b - a)
            return np.array(Q[a]) * (1 - u) + np.array(Q[b]) * u
    return np.array(Q[KEYS[-1]])

def radius(fs):
    return 88.7 + (93.6 - 88.7) * min(1, max(0, (fs - 105) / 8))

CW, CH = 750, 1539            # content size (the screen's aspect)

def load_snap():
    im = cv2.imread(SNAP)
    h, w = im.shape[:2]
    need = int(round(w * CH / CW))
    top = min(50, h - need)
    im = im[top:top + need]
    return cv2.resize(im, (CW, CH), interpolation=cv2.INTER_AREA)

def load_wa():
    im = cv2.imread(WA)
    h, w = im.shape[:2]
    need = int(round(h * CW / CH))
    x0 = (w - need) // 2
    im = im[:, x0:x0 + need].copy()
    im[:44] = 0                # the status bar is cut in the screenshot; the phone's own notch sits there
    return cv2.resize(im, (CW, CH), interpolation=cv2.INTER_AREA)

def rounded_mask(r):
    m = np.zeros((CH, CW), np.uint8)
    r = int(round(r))
    cv2.rectangle(m, (r, 0), (CW - r, CH), 255, -1)
    cv2.rectangle(m, (0, r), (CW, CH - r), 255, -1)
    for cx, cy in [(r, r), (CW - r, r), (CW - r, CH - r), (r, CH - r)]:
        cv2.circle(m, (cx, cy), r, 255, -1, lineType=cv2.LINE_AA)
    return m

def composite(frame, content, q, r, alpha=1.0):
    src = np.float32([[0, 0], [CW, 0], [CW, CH], [0, CH]])
    Hm = cv2.getPerspectiveTransform(src, np.float32(q))
    H, W = frame.shape[:2]
    warped = cv2.warpPerspective(content, Hm, (W, H), flags=cv2.INTER_CUBIC)
    mask = cv2.warpPerspective(rounded_mask(r * CW / (q[1][0] - q[0][0])), Hm, (W, H), flags=cv2.INTER_LINEAR)
    a = (mask.astype(np.float32) / 255.0 * 0.97 * alpha)[..., None]
    # keep a trace of the glass: the original frame's highlights stay on top, faintly
    glass = np.clip(cv2.GaussianBlur(frame, (0, 0), 18).astype(np.float32) - 40, 0, 255) * 0.25   # broad glare only
    out = frame.astype(np.float32) * (1 - a) + (warped.astype(np.float32) + glass) * a
    return np.clip(out, 0, 255).astype(np.uint8)

snap, wa = load_snap(), load_wa()
os.makedirs(os.path.join(M, 'phone_on'), exist_ok=True)
os.makedirs(os.path.join(M, 'phone_hold'), exist_ok=True)
N = len([f for f in os.listdir(os.path.join(M, 'phone')) if f.endswith('.jpg')])
ON = 178                       # source frame ~105: the screen lights up
for n in range(ON, N):
    fs = 24 * (1.4 + n / 60)
    fr = cv2.imread(os.path.join(M, 'phone', f'{n + 1:04d}.jpg'))
    a = min(1.0, (n - ON + 1) / 9)
    lit = cv2.addWeighted(snap, 1.0, np.full_like(snap, 255), 0.35 * (1 - a), 0)   # a white bloom as it powers on
    cv2.imwrite(os.path.join(M, 'phone_on', f'{n + 1:04d}.jpg'), composite(fr, lit, quad(fs), radius(fs), a), [cv2.IMWRITE_JPEG_QUALITY, 93])

last = cv2.imread(os.path.join(M, 'phone', f'{N:04d}.jpg'))
fsl = 24 * (1.4 + (N - 1) / 60)
ql, rl = quad(fsl), radius(fsl)
cv2.imwrite(os.path.join(M, 'phone_hold', 'snap.jpg'), composite(last, snap, ql, rl), [cv2.IMWRITE_JPEG_QUALITY, 93])
cv2.imwrite(os.path.join(M, 'phone_hold', 'wa.jpg'), composite(last, wa, ql, rl), [cv2.IMWRITE_JPEG_QUALITY, 93])
for i in range(15):
    u = (i + 1) / 16
    e = u * u * (3 - 2 * u)
    sx = int(round(CW * e))
    both = np.zeros_like(snap)
    both[:, :CW - sx] = snap[:, sx:]
    both[:, CW - sx:] = wa[:, :sx]
    cv2.imwrite(os.path.join(M, 'phone_hold', f'swipe_{i:02d}.jpg'), composite(last, both, ql, rl), [cv2.IMWRITE_JPEG_QUALITY, 93])
print('frames', N, 'lit from', ON, 'hold quad', np.round(ql, 1).tolist())

# pieces of the held WhatsApp frame for the live chat drawn over it (js/scenes/chat.js), in output pixels
WAF = cv2.imread(os.path.join(M, 'phone_hold', 'wa.jpg'))
os.makedirs(os.path.join(M, 'wa'), exist_ok=True)
for name, (x0, y0, x1, y1) in {
    'wall': (168, 730, 912, 1170),     # the doodle wallpaper, nothing on it
    'notice': (222, 496, 860, 726),    # the encryption notice bubble
    'chip': (420, 420, 652, 476),      # "Aujourd'hui"
    'bar': (168, 1176, 912, 1272),     # the input bar
}.items():
    cv2.imwrite(os.path.join(M, 'wa', f'{name}.jpg'), WAF[y0:y1, x0:x1], [cv2.IMWRITE_JPEG_QUALITY, 95])
# the whole chat area with the chip and the notice painted out with wallpaper from lower down: the fixed
# wallpaper behind the scrolling list, identical to the frame wherever nothing scrolls over it
wall = WAF[398:1176, 168:912].copy()
for (x0, y0, x1, y1), sy in [((420, 420, 652, 476), 1000), ((222, 496, 860, 726), 760)]:
    wall[y0 - 398:y1 - 398, x0 - 168:x1 - 168] = WAF[sy:sy + (y1 - y0), x0:x1]
cv2.imwrite(os.path.join(M, 'wa', 'wallfull.jpg'), wall, [cv2.IMWRITE_JPEG_QUALITY, 95])
