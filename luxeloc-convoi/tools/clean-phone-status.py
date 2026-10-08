# Removes the generated phone's fake status bar ("7Re", signal, battery): small bright blobs sitting on the dark
# glass are inpainted with the glass around them. Runs in place on assets/media/phone/NNNN.jpg, frames 90…end.
import os
import numpy as np
import cv2

D = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets/media/phone')
files = sorted(f for f in os.listdir(D) if f.endswith('.jpg'))
done = 0
for f in files[89:]:
    p = os.path.join(D, f)
    im = cv2.imread(p)
    g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    band = np.zeros_like(g)
    band[60:420, 60:1020] = 1                      # where the top of the screen can be while the phone rises
    mask = np.zeros_like(g)
    # dark glass: anything bright; grey glass (a glare): only the white of the glyphs
    for thr, bg_max, contrast, hmin in [(120, 150, 60, 1), (205, 200, 25, 9)]:
        m = ((g > thr) & (band > 0)).astype(np.uint8)
        n, lab, st, _ = cv2.connectedComponentsWithStats(m)
        for i in range(1, n):
            x, y, w, h, a = st[i]
            if w > 140 or h > 60 or h < hmin or a < 4:   # glyph-sized (the bezel's thin highlights stay)
                continue
            x0, y0, x1, y1 = max(0, x - 14), max(0, y - 14), x + w + 14, y + h + 14
            ring = g[y0:y1, x0:x1].astype(float)
            inner = lab[y0:y1, x0:x1] == i
            bg, fg = ring[~inner].mean(), ring[inner].mean()
            if bg > bg_max or fg - bg < contrast:  # not text on glass: part of the bezel or the background
                continue
            mask[lab == i] = 255
    if mask.any():
        mask = cv2.dilate(mask, np.ones((5, 5), np.uint8))
        im = cv2.inpaint(im, mask, 6, cv2.INPAINT_TELEA)
        cv2.imwrite(p, im, [cv2.IMWRITE_JPEG_QUALITY, 93])
        done += 1
print('cleaned', done, 'frames')
