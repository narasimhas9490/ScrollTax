"""Synthesizes the intro's music into music.wav (38.4 s, 100 bpm, C major).

    python release/_src/intro/make_music.py        (needs numpy)

Everything is generated here from sine waves and noise, so there is nothing to license.
Soft mallet arpeggio, bell accents on the moments intro.html pops something on screen,
a quiet pad, bass, and light drums in the middle. Times below mirror the constants in intro.html.
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
BEAT, BAR, END = 0.6, 2.4, 38.4
S1, S2, S3, S4, S5, S6 = 0, 4.8, 9.6, 16.8, 28.8, 33.6
N = int((END + 3) * SR)
rng = np.random.default_rng(3)
wet = np.zeros((2, N))   # mallets and bells: these get the echo
dry = np.zeros((2, N))   # pad, bass, drums

SEMITONE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def hz(note):
    return 440 * 2 ** ((SEMITONE[note[0]] + 12 * (int(note[1:]) + 1) - 69) / 12)


def grid(seconds):
    return np.arange(int(seconds * SR)) / SR


def add(bus, sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    n = min(len(sig), N - i)
    angle = (pan + 1) * np.pi / 4
    bus[0, i:i + n] += sig[:n] * gain * np.cos(angle)
    bus[1, i:i + n] += sig[:n] * gain * np.sin(angle)


def mallet(note, seconds=1.4):
    f, t = hz(note), grid(seconds)
    y = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(4 * np.pi * f * t) * np.exp(-t * 12) + 0.2 * np.sin(8 * np.pi * f * t) * np.exp(-t * 22)
    return y * np.exp(-t * 5) * (1 - np.exp(-t * 900))


def bell(note, seconds=2.2):
    f, t = hz(note), grid(seconds)
    y = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(4 * np.pi * f * t) * np.exp(-t * 6) + 0.25 * np.sin(6 * np.pi * f * t) * np.exp(-t * 10)
    return y * np.exp(-t * 3.2) * (1 - np.exp(-t * 600))


def pad(notes, seconds):
    t = grid(seconds + 1.0)
    env = np.clip(t / 0.7, 0, 1) * np.clip((seconds + 1.0 - t) / 1.0, 0, 1)
    y = sum(np.sin(2 * np.pi * hz(n) * t) + 0.5 * np.sin(2 * np.pi * hz(n) * 1.004 * t) + 0.2 * np.sin(4 * np.pi * hz(n) * t) for n in notes)
    return y / len(notes) * env


def bass(note, seconds=1.2):
    f, t = hz(note), grid(seconds)
    # Light on the fundamental so it stays audible, not boomy, on phone speakers.
    y = 0.7 * np.sin(2 * np.pi * f * t) + 0.6 * np.sin(4 * np.pi * f * t) + 0.25 * np.sin(6 * np.pi * f * t)
    return y * np.exp(-t * 2.4) * (1 - np.exp(-t * 300))


def kick():
    t = grid(0.4)
    return np.sin(2 * np.pi * np.cumsum(48 + 100 * np.exp(-t * 30)) / SR) * np.exp(-t * 10)


def hat():
    t = grid(0.08)
    return np.diff(rng.standard_normal(len(t)), prepend=0) * np.exp(-t * 80)


def snap():
    t = grid(0.15)
    noise = np.convolve(np.diff(rng.standard_normal(len(t)), prepend=0), [0.5, 0.5], mode='same')
    return noise * np.exp(-t * 40)


def run(notes, t, step, gain, voice=mallet):
    """A quick run of notes, panned left to right."""
    for i, n in enumerate(notes):
        add(wet, voice(n), t + i * step, gain, pan=-0.5 + i / max(1, len(notes) - 1))


# chord: bass note, eight arpeggio eighths, pad notes
CHORDS = {
    'C': ('C2', ['C4', 'E4', 'G4', 'B4', 'E5', 'B4', 'G4', 'E4'], ['C3', 'G3', 'E4', 'B4']),
    'Am': ('A1', ['A3', 'C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4'], ['A2', 'E3', 'C4', 'G4']),
    'F': ('F1', ['F3', 'A3', 'C4', 'E4', 'A4', 'E4', 'C4', 'A3'], ['F2', 'C3', 'A3', 'E4']),
    'G': ('G1', ['G3', 'B3', 'D4', 'E4', 'B4', 'E4', 'D4', 'B3'], ['G2', 'D3', 'B3', 'E4']),
}
BARS = ['C', 'Am', 'F', 'G'] * 3 + ['F', 'G', 'C', 'C']

for bar, name in enumerate(BARS):
    t0 = bar * BAR
    root, arp, chord = CHORDS[name]
    quiet = bar < 2 or bar >= 12            # the question, the privacy section, the outro
    full = 7 <= bar <= 11                   # the feature section carries the drums
    add(dry, pad(chord, BAR), t0, 0.16 if quiet else 0.13)
    if bar >= 14:
        continue                            # the outro is written out below
    add(dry, bass(root), t0, 0.22 if quiet else 0.30)
    if bar < 2:
        continue                            # the opening is written out below
    if not quiet:
        add(dry, bass(root, 0.9), t0 + 2 * BEAT, 0.24)
    for i, note in enumerate(arp):
        if quiet and i % 2:
            continue                        # quarter notes only in the quiet parts
        level = (0.24 if quiet else 0.42 if bar < 4 else 0.48) * (1.0 if i % 2 == 0 else 0.7)
        add(wet, mallet(note), t0 + i * BEAT / 2, level, pan=0.35 if i % 2 else -0.35)
    if 4 <= bar <= 11:
        for beat in (0, 2):
            add(dry, kick(), t0 + beat * BEAT, 0.42)
    if full:
        for i in range(8):
            if i % 2 and not (bar == 11 and i > 4):
                add(dry, hat(), t0 + i * BEAT / 2, 0.05, pan=0.2)
        for beat in (1, 3):
            add(dry, snap(), t0 + beat * BEAT, 0.07, pan=-0.1)

# 1. A dot lands, splits into five and hops twice.
for t, g in ((0.33, 0.5), (0.65, 0.25), (0.82, 0.12)):
    add(wet, mallet('C5'), t, g)
run(['G4', 'A4', 'C5', 'D5', 'E5'], 0.9, 0.08, 0.3)
run(['C5', 'D5', 'E5', 'G5', 'A5'], 1.8, 0.12, 0.34)
run(['D5', 'E5', 'G5', 'A5', 'C6'], 3.0, 0.12, 0.34)
# 2. The counter runs up to 143, then settles.
run(['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6', 'G6', 'A6'], S2 + 1.2, 0.15, 0.13)
add(wet, bell('C6'), S2 + 2.9, 0.26)
# 3. One bell per supported app, one more for the line under them.
for i, n in enumerate(['E5', 'G5', 'A5', 'C6', 'D6']):
    add(wet, bell(n), S3 + BEAT * (i + 1), 0.26, pan=-0.6 + 0.3 * i)
add(wet, bell('E6'), S3 + BEAT * 6, 0.2)
# 4. A bell on each new feature, and a small tune over the top.
for i in range(4):
    add(wet, bell('G5'), S4 + 3.0 * i, 0.22)
for bar, beat, n in ((8, 0, 'E5'), (8, 1.5, 'G5'), (9, 0, 'A5'), (9, 2, 'E5'), (10, 0, 'C6'), (10, 1.5, 'A5'), (11, 0, 'G5'), (11, 2, 'D5')):
    add(wet, bell(n, 1.6), bar * BAR + beat * BEAT, 0.14, pan=0.25)
# The widget lifts out of the home screen (the bar 11 downbeat already rings), then counts two more reels.
for i, n in enumerate(['E6', 'G6']):
    add(wet, mallet(n), S4 + 3.0 * 3 + BEAT * (2 + i), 0.2, pan=0.3)
# 5. One bell per privacy chip.
for i, n in enumerate(['E5', 'G5', 'C6']):
    add(wet, bell(n), S5 + BEAT * (i + 1), 0.28, pan=-0.4 + 0.4 * i)
add(wet, bell('E6'), S5 + BEAT * 4, 0.18)
# 6. Dots return, gather, and land on the logo with a full chord.
run(['C5', 'E5', 'G5', 'C6', 'E6'], S6, 0.06, 0.22)
run(['E6', 'C6', 'G5', 'E5'], S6 + BEAT, 0.1, 0.2)
hit = S6 + 2 * BEAT
for i, n in enumerate(['C4', 'E4', 'G4', 'C5', 'E5', 'G5']):
    add(wet, mallet(n, 2.4), hit + i * 0.015, 0.4, pan=-0.5 + 0.2 * i)
add(wet, bell('C6', 3.0), hit, 0.3)
add(dry, bass('C2', 2.6), hit, 0.36)
add(dry, kick(), hit, 0.45)
add(wet, bell('G5'), hit + 0.3, 0.16)
add(wet, bell('E6'), hit + 0.9, 0.16)
for i, n in enumerate(['C5', 'E5', 'G5', 'C6']):
    add(wet, mallet(n), hit + 1.2 + i * 0.3, 0.22 - 0.04 * i, pan=0.4 if i % 2 else -0.4)


def delayed(x, seconds):
    out = np.zeros_like(x)
    n = int(seconds * SR)
    out[..., n:] = x[..., :-n]
    return out


# Echo across the stereo field plus a few short taps for a little room.
echo = np.stack([
    0.24 * delayed(wet[1], 0.3) + 0.12 * delayed(wet[0], 0.6),
    0.24 * delayed(wet[0], 0.3) + 0.12 * delayed(wet[1], 0.6),
])
room = sum(0.10 * delayed(wet, s) for s in (0.037, 0.053, 0.071))
mix = np.tanh((wet + echo + room + dry) * 1.1)
mix = mix[:, :int((END + 0.2) * SR)]
t = np.arange(mix.shape[1]) / SR
mix *= np.clip(t / 0.005, 0, 1) * np.cos(np.clip((t - 37.0) / (END - 37.0), 0, 1) * np.pi / 2) ** 2
mix *= 0.89 / np.abs(mix).max()

out = Path(__file__).with_name('music.wav')
with wave.open(str(out), 'wb') as f:
    f.setnchannels(2)
    f.setsampwidth(2)
    f.setframerate(SR)
    f.writeframes((mix.T * 32767).astype('<i2').tobytes())

print(f'wrote {out.name}: {mix.shape[1] / SR:.1f}s, peak {np.abs(mix).max():.2f}')
for name, a, b in (('question', S1, S2), ('counter', S2, S3), ('apps', S3, S4), ('features', S4, S5), ('private', S5, S6), ('logo', S6, END)):
    part = mix[:, int(a * SR):int(b * SR)]
    print(f'  {name:9s} rms {20 * np.log10(np.sqrt((part ** 2).mean()) + 1e-9):6.1f} dBFS')
