"""Builds the Play Store images from the raw phone screenshots.

    python release/_src/build_images.py

Needs Google Chrome (headless, used as the renderer) and Pillow (to drop the alpha
channel, which Play rejects). Edit the captions below and re-run to regenerate.
"""
import os
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

RELEASE = Path(__file__).resolve().parent.parent
RAW = RELEASE / 'screenshots' / 'raw'
OUT_SHOTS = RELEASE / 'screenshots' / 'play-store'
OUT_GFX = RELEASE / 'graphics'
CHROME = os.environ.get('CHROME', r'C:\Program Files\Google\Chrome\Application\chrome.exe')

BG, CARD, ACCENT, MUTED = '#0F0F13', '#1A1A20', '#FF6FA8', '#9A9AA5'
STATUS_BAR = 136  # px in a 1080x2400 capture; cropped so personal status icons never ship

BRAIN_PATH = ('M12,4.6 C10.6,3 8.1,3 6.8,4.6 C5.1,4.7 4,6.2 4.3,7.7 C3,8.6 2.8,10.5 3.7,11.6 '
              'C3,12.8 3.4,14.4 4.6,15.1 C4.6,16.9 6.2,18.2 7.9,17.9 C8.8,19.1 10.6,19.4 12,18.4 Z '
              'M7,8.6 C8.5,8.6 9.1,9.6 9.1,10.6 M6.2,13.2 C7.6,13.2 8.6,13.7 9,14.6')


def brain(size, stroke=1.6):
    """The app's brain mark (same path as res/drawable/ic_brain.xml)."""
    p = (f'<path d="{BRAIN_PATH}" fill="none" stroke="{ACCENT}" stroke-width="{stroke}" '
         f'stroke-linecap="round" stroke-linejoin="round"/>')
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">'
            f'{p}<g transform="translate(24,0) scale(-1,1)">{p}</g></svg>')


BASE_CSS = f'''
* {{ margin:0; padding:0; box-sizing:border-box; }}
html, body {{ background:{BG}; overflow:hidden; }}
body {{ font-family:'Segoe UI','Roboto',sans-serif; color:#fff; }}
b {{ color:{ACCENT}; font-weight:inherit; }}
'''


def render(html, out, w, h):
    """HTML -> PNG through headless Chrome, then flattened to RGB (no alpha)."""
    with tempfile.TemporaryDirectory() as d:
        page = Path(d) / 'page.html'
        shot = Path(d) / 'shot.png'
        page.write_text(html, encoding='utf-8')
        subprocess.run([
            CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
            '--force-device-scale-factor=1', f'--user-data-dir={Path(d) / "profile"}',
            f'--window-size={w},{h}', f'--screenshot={shot}', page.as_uri(),
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)
        im = Image.open(shot).convert('RGB')
        assert im.size == (w, h), f'{out.name}: got {im.size}, wanted {(w, h)}'
        out.parent.mkdir(parents=True, exist_ok=True)
        im.save(out, optimize=True)
    if out.is_relative_to(RELEASE):
        print('wrote', out.relative_to(RELEASE))


# ---------------------------------------------------------------- screenshots (1080x1920, 9:16)

PHONE_W = 800                      # width of the screenshot inside the canvas
SCALE = PHONE_W / 1080
# The counter pill in a raw capture: centred, just under the status bar (see OverlayController.kt).
PILL = dict(left=434, top=144, right=646, bottom=232, radius=44)


def phone(raw, blur_feed=False):
    """A raw capture with the status bar cropped off; optionally everything but the pill blurred."""
    src = (RAW / raw).as_uri()
    h = int((2400 - STATUS_BAR) * SCALE)
    img = (f'<img src="{src}" style="position:absolute;left:0;top:{-STATUS_BAR * SCALE:.1f}px;'
           f'width:{PHONE_W}px;{{extra}}">')
    layers = img.format(extra='filter:blur(16px) saturate(1.1);transform:scale(1.06);' if blur_feed else '')
    if blur_feed:
        p = PILL
        clip = (f'inset({p["top"] * SCALE:.1f}px {(1080 - p["right"]) * SCALE:.1f}px '
                f'{(2400 - p["bottom"]) * SCALE:.1f}px {p["left"] * SCALE:.1f}px round {p["radius"] * SCALE:.1f}px)')
        layers += img.format(extra=f'clip-path:{clip};')
        # Magnified copy of the pill so the counter reads at thumbnail size.
        k = SCALE * 2.7
        zw, zh = (p['right'] - p['left']) * k, (p['bottom'] - p['top']) * k
        top = (p['bottom'] - STATUS_BAR) * SCALE
        layers += (f'<div style="position:absolute;left:{PHONE_W / 2 - 1:.0f}px;top:{top:.0f}px;width:3px;'
                   f'height:{250 - top:.0f}px;background:{ACCENT};opacity:.55;"></div>'
                   f'<div style="position:absolute;left:{(PHONE_W - zw) / 2:.0f}px;top:250px;width:{zw:.0f}px;'
                   f'height:{zh:.0f}px;border-radius:{zh / 2:.0f}px;border:4px solid {ACCENT};'
                   f'background:url({src}) -{p["left"] * k:.0f}px -{p["top"] * k:.0f}px / {1080 * k:.0f}px auto no-repeat;'
                   f'box-shadow:0 20px 90px rgba(255,111,168,.45);"></div>')
    return (f'<div style="position:relative;width:{PHONE_W}px;height:{h}px;overflow:hidden;'
            f'border-radius:56px 56px 0 0;border:3px solid #2E2E38;border-bottom:0;background:{BG};'
            f'box-shadow:0 30px 120px rgba(255,111,168,.16);">{layers}</div>')


def screenshot(name, title, sub, body):
    html = f'''<!doctype html><meta charset="utf-8"><style>{BASE_CSS}
    body {{ width:1080px; height:1920px; background:radial-gradient(1200px 700px at 50% 0%, #2A1420 0%, {BG} 70%); }}
    h1 {{ font-size:84px; line-height:1.08; font-weight:800; text-align:center; padding:104px 70px 0; letter-spacing:-1px; }}
    p {{ font-size:38px; line-height:1.3; color:{MUTED}; text-align:center; padding:26px 110px 0; }}
    .stage {{ position:absolute; left:0; right:0; top:500px; bottom:0; display:flex; justify-content:center; align-items:flex-start; }}
    </style><h1>{title}</h1><p>{sub}</p><div class="stage">{body}</div>'''
    render(html, OUT_SHOTS / name, 1080, 1920)


def widget_body():
    src = (RAW / '10-home-widget.png').as_uri()
    return (f'<div style="margin-top:210px;width:900px;border-radius:64px;overflow:hidden;'
            f'box-shadow:0 30px 120px rgba(255,111,168,.22);border:3px solid #2E2E38;">'
            f'<img src="{src}" style="display:block;width:900px;"></div>')


def private_body():
    rows = ['No account', 'No internet access', 'No ads', 'Nothing leaves your phone', 'Delete your history any time']
    items = ''.join(
        f'<div style="display:flex;align-items:center;gap:30px;background:{CARD};border-radius:36px;'
        f'padding:40px 48px;font-size:50px;font-weight:700;">'
        f'<span style="color:{ACCENT};font-size:56px;">&#10003;</span>{r}</div>' for r in rows)
    return f'<div style="margin-top:60px;width:880px;display:flex;flex-direction:column;gap:30px;">{items}</div>'


def build_screenshots():
    # demo-*.png come from the throwaway demo build with imaginary history (see README.md).
    for old in OUT_SHOTS.glob('*.png'):
        old.unlink()
    screenshot('1-today.png', 'See what scrolling <b>really costs</b>',
               'Every reel counted. Every minute added up.', phone('demo-01-dashboard.png'))
    screenshot('2-live-counter.png', 'A live counter <b>while you scroll</b>',
               'A small brain pill sits on top of your feed.', phone('13-overlay-instagram-c.png', blur_feed=True))
    screenshot('3-trends.png', 'Spot the <b>trend</b>',
               'Your last 7 and 30 days, bar by bar.', phone('demo-02-dashboard-30-days.png'))
    screenshot('4-monthly.png', 'Watch the habit <b>shrink</b>',
               'Month by month totals and daily averages.', phone('demo-04-monthly.png'))
    screenshot('5-every-reel.png', 'Every reel, <b>timed</b>',
               'See how long each one held you.', phone('demo-03-dashboard-reel-list.png'))
    screenshot('6-widget.png', 'Today&#39;s count on your <b>home screen</b>',
               'A widget that keeps you honest.', widget_body())
    screenshot('7-all-your-feeds.png', 'Works across your <b>short-video apps</b>',
               'One counter for all of them.', phone('15-overlay-youtube-shorts.png', blur_feed=True))
    screenshot('8-private.png', '<b>Private</b> by design',
               'Everything stays on your phone.', private_body())


# ---------------------------------------------------------------- icon and feature graphic

def build_icon():
    # Same look as the adaptive launcher icon: brain mark on the #141418 background.
    html = f'''<!doctype html><meta charset="utf-8"><style>{BASE_CSS}
    body {{ width:512px; height:512px; background:#141418; display:flex; align-items:center; justify-content:center; }}
    </style>{brain(310)}'''
    render(html, OUT_GFX / 'icon-512.png', 512, 512)


def build_feature_graphic():
    html = f'''<!doctype html><meta charset="utf-8"><style>{BASE_CSS}
    body {{ width:1024px; height:500px; background:radial-gradient(700px 420px at 82% 50%, #3A1828 0%, {BG} 75%);
           display:flex; align-items:center; }}
    .l {{ padding-left:72px; width:640px; }}
    .name {{ display:flex; align-items:center; gap:18px; font-size:76px; font-weight:800; letter-spacing:-1.5px; }}
    .tag {{ font-size:35px; line-height:1.25; color:#E6E6EC; margin-top:18px; font-weight:600; }}
    .sub {{ font-size:23px; color:{MUTED}; margin-top:18px; }}
    .r {{ flex:1; display:flex; flex-direction:column; align-items:center; gap:26px; padding-right:40px; }}
    .pill {{ display:flex; align-items:center; gap:16px; background:rgba(20,20,24,.92); border:2px solid #34343E;
            border-radius:60px; padding:16px 34px 16px 28px; font-size:60px; font-weight:700;
            box-shadow:0 20px 80px rgba(255,111,168,.35); }}
    .cap {{ font-size:22px; color:{MUTED}; }}
    </style>
    <div class="l"><div class="name">{brain(92, 1.7)}ScrollTax</div>
      <div class="tag">See what scrolling <b>really costs</b></div>
      <div class="sub">Counts every reel and short. Stays on your phone.</div></div>
    <div class="r"><div class="pill">{brain(64, 1.7)}143</div><div class="cap">reels scrolled today</div></div>'''
    render(html, OUT_GFX / 'feature-graphic-1024x500.png', 1024, 500)


if __name__ == '__main__':
    what = sys.argv[1:] or ['icon', 'feature', 'screenshots']
    if 'icon' in what:
        build_icon()
    if 'feature' in what:
        build_feature_graphic()
    if 'screenshots' in what:
        build_screenshots()
