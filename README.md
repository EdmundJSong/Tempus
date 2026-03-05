# Tempus

A score-aware metronome for musicians, film composers, and game composers.

Tempus lets you map an entire piece — tempo changes, time signatures, beat groupings, accelerando, ritardando, and free-time sections — into one continuous click track. No more stopping to reset your metronome between sections.

## Features

- **Tempo mapping** — chain unlimited sections with different tempos and time signatures
- **Any time signature** — simple, compound, asymmetric (5/8, 7/8, 12/16, etc.)
- **Beat groupings** — define accent patterns (2+3, 3+2+2, 3+3+3+3, etc.)
- **Score notation** — input tempo as you see it in the score (♩=120, ♩.=80, ♪=160)
- **Beat units** — whole through 64th note, each with dotted variant
- **Accel / Rit** — tempo curves within sections with start and end tempo
- **Timed sections** — free-time countdown in seconds with custom cue markers
- **Click modes** — accented or flat, pitched or unpitched
- **Visual feedback** — beat dots, full-screen flash, or both
- **Mute** — silence clicks while keeping visual feedback active
- **Bar navigation** — jump to any bar number or section
- **Count-in** — optional 1 or 2 bar count-in
- **Mobile-first** — designed for phones on music stands

## Setup

Deploy to [Vercel](https://vercel.com) by connecting this repo. No configuration needed.

## Tech

React + Vite. Web Audio API for precise click scheduling. No external dependencies beyond React.
