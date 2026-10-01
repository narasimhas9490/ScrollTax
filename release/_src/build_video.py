"""Edits the raw phone recordings in release/video/raw into the two finished videos.

    python release/_src/build_video.py

Needs Chrome + Pillow (see build_images.py) and ffmpeg. ffmpeg is taken from $FFMPEG, else from
the imageio-ffmpeg package, else from PATH.

  scrolltax-promo-1080p.mp4      store promo: landscape, captions, feed blurred except the counter
  accessibility-declaration.mp4  the disclosure -> enable -> counting flow Play asks for
"""
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from build_images import ACCENT, BASE_CSS, BG, MUTED, RAW as SHOTS_RAW, RELEASE, brain, render

VIDEO = RELEASE / 'video'
RAW = VIDEO / 'raw'

# Geometry of the 720x1600 recordings (the phone is 1080x2400, so everything is x 2/3).
STATUS_BAR = 91                               # cropped from the promo so status icons never ship
PILL = dict(x=288, y=95, w=144, h=62)         # the counter pill, kept sharp while the feed is blurred
PHONE = dict(x=1270, y=64, w=454, h=952)      # where the phone clip sits on the 1920x1080 canvas


def ffmpeg():
    if os.environ.get('FFMPEG'):
        return os.environ['FFMPEG']
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return shutil.which('ffmpeg') or 'ffmpeg'


CSS = f'''{BASE_CSS}
body {{ width:1920px; height:1080px; background:radial-gradient(1100px 800px at 78% 50%, #32162A 0%, {BG} 72%); }}
.txt {{ position:absolute; left:140px; top:0; bottom:0; width:1000px; display:flex; flex-direction:column; justify-content:center; }}
.brand {{ display:flex; align-items:center; gap:14px; font-size:40px; font-weight:800; margin-bottom:44px; }}
h1 {{ font-size:92px; line-height:1.06; font-weight:800; letter-spacing:-1.5px; }}
p {{ font-size:40px; line-height:1.3; color:{MUTED}; margin-top:30px; }}
.slot {{ position:absolute; left:{PHONE['x'] - 6}px; top:{PHONE['y'] - 6}px; width:{PHONE['w'] + 12}px; height:{PHONE['h'] + 12}px;
        border-radius:26px; background:#2E2E38; box-shadow:0 30px 140px rgba(255,111,168,.28); }}
.center {{ position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }}
'''
BRAND = f'<div class="brand">{brain(54, 1.7)}ScrollTax</div>'


def page(body):
    return f'<!doctype html><meta charset="utf-8"><style>{CSS}</style>{body}'


def caption(title, sub, right='<div class="slot"></div>'):
    return page(f'<div class="txt">{BRAND}<h1>{title}</h1><p>{sub}</p></div>{right}')


def build_cards(d):
    cards = {
        'title': page(f'<div class="center">{brain(210, 1.5)}'
                      f'<h1 style="font-size:150px;margin-top:10px;">ScrollTax</h1>'
                      f'<p style="font-size:52px;color:#E6E6EC;">See what scrolling <b>really costs</b></p></div>'),
        'feed': caption('A live counter <b>while you scroll</b>',
                        'Every reel and short adds one. Right on top of your feed.'),
        'app': caption('Every reel <b>counted and timed</b>',
                       'Today, the last 30 days, and month by month.'),
        'widget': caption('Today&#39;s count on your <b>home screen</b>', 'A widget that keeps you honest.',
                          f'<img src="{(SHOTS_RAW / "10-home-widget.png").as_uri()}" style="position:absolute;'
                          f'left:1130px;top:299px;width:686px;border-radius:48px;border:3px solid #2E2E38;'
                          f'box-shadow:0 30px 140px rgba(255,111,168,.3);">'),
        'end': page(f'<div class="center"><h1 style="font-size:104px;">No account. No internet. <b>No ads.</b></h1>'
                    f'<p style="font-size:50px;">Everything stays on your phone.</p>'
                    f'<div class="brand" style="margin:80px 0 0;font-size:56px;">{brain(76, 1.7)}ScrollTax</div></div>'),
    }
    for name, html in cards.items():
        render(html, d / f'{name}.png', 1920, 1080)
    return {name: d / f'{name}.png' for name in cards}


def run(args):
    subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', *args], check=True)


def still(path, seconds):
    return ['-loop', '1', '-framerate', '30', '-t', str(seconds), '-i', str(path)]


def build_promo(cards):
    feed_len, app_hold = 10.5, 2.6
    app_len = 9.6 + app_hold   # app-tour-demo.mp4 is 9.66s
    ph, pill = PHONE, PILL
    crop = f'crop=720:{1600 - STATUS_BAR}:0:{STATUS_BAR}'
    fin = 'fps=30,format=yuv420p,fade=t=in:st=0:d=0.3'
    graph = ';'.join([
        f'[0:v]{fin}[v0]',
        # Feed clip: blur everything (other people\'s videos) and paste the sharp counter back on top.
        f'[2:v]trim=start=0.8:duration={feed_len},setpts=PTS-STARTPTS,fps=30,split[fa][fb]',
        '[fa]boxblur=14:2[fblur]',
        f'[fb]crop={pill["w"]}:{pill["h"]}:{pill["x"]}:{pill["y"]}[fpill]',
        f'[fblur][fpill]overlay={pill["x"]}:{pill["y"]},{crop},scale={ph["w"]}:{ph["h"]}[fphone]',
        f'[1:v][fphone]overlay={ph["x"]}:{ph["y"]}:shortest=1,{fin}[v1]',
        # App tour, recorded in the demo build (imaginary history). Hold the last frame (Monthly) so it can be read.
        f'[4:v]fps=30,tpad=stop_mode=clone:stop_duration={app_hold},{crop},scale={ph["w"]}:{ph["h"]}[aphone]',
        f'[3:v][aphone]overlay={ph["x"]}:{ph["y"]}:shortest=1,{fin}[v2]',
        f'[5:v]{fin}[v3]',
        f'[6:v]{fin}[v4]',
        '[v0][v1][v2][v3][v4]concat=n=5:v=1:a=0[v]',
    ])
    out = VIDEO / 'scrolltax-promo-1080p.mp4'
    run([
        *still(cards['title'], 3),
        *still(cards['feed'], feed_len), '-i', str(RAW / 'instagram-overlay.mp4'),
        *still(cards['app'], app_len), '-i', str(RAW / 'app-tour-demo.mp4'),
        *still(cards['widget'], 3.5),
        *still(cards['end'], 3.5),
        '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',  # silent track; some players reject video-only files
        '-filter_complex', graph, '-map', '[v]', '-map', '7:a', '-shortest',
        '-c:v', 'libx264', '-crf', '19', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-r', '30',
        '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', str(out),
    ])
    print('wrote', out.relative_to(RELEASE))


def build_declaration():
    start, feed_from = 2.1, 26.3   # skip the home screen; Instagram starts sliding in at about 26.4s
    pill = PILL
    graph = ';'.join([
        f'[0:v]trim=start={start},setpts=PTS-STARTPTS,fps=30,split=3[base][a][b]',
        '[a]boxblur=14:2[blur]',
        f'[b]crop={pill["w"]}:{pill["h"]}:{pill["x"]}:{pill["y"]}[pill]',
        f'[blur][pill]overlay={pill["x"]}:{pill["y"]}[feed]',
        f"[base][feed]overlay=0:0:enable='gte(t,{feed_from - start})',format=yuv420p[v]",
    ])
    out = VIDEO / 'accessibility-declaration.mp4'
    run([
        '-i', str(RAW / 'permission-flow.mp4'), '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
        '-filter_complex', graph, '-map', '[v]', '-map', '1:a', '-shortest',
        '-c:v', 'libx264', '-crf', '20', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-r', '30',
        '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', str(out),
    ])
    print('wrote', out.relative_to(RELEASE))


if __name__ == '__main__':
    with tempfile.TemporaryDirectory() as tmp:
        build_promo(build_cards(Path(tmp)))
    build_declaration()
