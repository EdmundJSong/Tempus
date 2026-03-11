<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport"
    content="width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0, minimum-scale=1.0, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>五行 Five Elements</title>
  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;600;900&family=Cormorant+Garamond:ital,wght@0,300;0,500;1,300&display=swap');

    :root {
      --safe-top: env(safe-area-inset-top, 0px);
      --safe-bottom: env(safe-area-inset-bottom, 0px);
      --metal: #d4af37;
      --wood: #4c994c;
      --water: #4682c8;
      --fire: #dc3c28;
      --earth: #8B5E3C;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }

    html,
    body {
      width: 100%;
      height: 100%;
      height: -webkit-fill-available;
      overflow: hidden;
      font-family: 'Cormorant Garamond', serif;
      background: #0a0a0a;
      color: #fff;
    }

    /* ═══════════════════════════════════
     PERMISSION OVERLAY
     ═══════════════════════════════════ */
    .permission-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 1);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 40px;
      padding-top: calc(40px + var(--safe-top));
      text-align: center;
    }

    .permission-overlay.hidden {
      display: none;
    }

    .permission-overlay h2 {
      font-family: 'Noto Serif SC', serif;
      font-weight: 300;
      font-size: clamp(1.2rem, 5vw, 1.5rem);
      margin-bottom: 12px;
    }

    .permission-overlay p {
      font-weight: 300;
      font-style: italic;
      opacity: 0.6;
      margin-bottom: 20px;
      line-height: 1.6;
      font-size: clamp(0.75rem, 3vw, 0.9rem);
    }

    .setup-hint {
      font-weight: 300;
      font-style: italic;
      opacity: 0.35;
      margin-bottom: 24px;
      font-size: clamp(1rem, 4vw, 1.2rem);
      letter-spacing: 0.08em;
    }

    .permission-btn {
      padding: 14px 40px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      font-family: 'Cormorant Garamond', serif;
      font-size: 1rem;
      letter-spacing: 0.1em;
      cursor: pointer;
      transition: transform 0.2s ease, background 0.2s ease;
    }

    .permission-btn:active {
      background: rgba(255, 255, 255, 0.15);
      transform: scale(0.95);
    }

    .permission-status {
      margin-top: 16px;
      font-size: 0.7rem;
      opacity: 0.35;
      font-style: italic;
    }

    /* ═══════════════════════════════════
     LANDING
     ═══════════════════════════════════ */
    #landing {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      height: -webkit-fill-available;
      padding: 20px;
      background: #0a0a0a;
      position: relative;
    }

    .circle-layout {
      position: relative;
      width: min(80vw, 80vh, 360px);
      height: min(80vw, 80vh, 360px);
    }

    .circle-ring {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 85%;
      height: 85%;
      transform: translate(-50%, -50%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 50%;
      pointer-events: none;
    }

    .energy-canvas {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 1;
    }

    .circle-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      z-index: 5;
      cursor: pointer;
      padding: 16px;
    }

    .circle-center h1 {
      font-family: 'Noto Serif SC', serif;
      font-weight: 300;
      font-size: clamp(1.4rem, 5vw, 2rem);
      letter-spacing: 0.25em;
      opacity: 0;
      animation: fadeIn 1s ease 0.2s forwards;
      transition: opacity 0.3s ease;
    }

    .circle-center .subtitle {
      font-family: 'Cormorant Garamond', serif;
      font-weight: 300;
      font-style: italic;
      font-size: clamp(0.65rem, 2.5vw, 0.85rem);
      letter-spacing: 0.12em;
      color: rgba(255, 255, 255, 0.4);
      margin-top: 2px;
      opacity: 0;
      animation: fadeIn 1s ease 0.5s forwards;
    }

    .circle-el {
      position: absolute;
      width: clamp(52px, 16vw, 68px);
      height: clamp(52px, 16vw, 68px);
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(255, 255, 255, 0.03);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transform: translate(-50%, -50%);
      opacity: 0;
      animation: fadeIn 0.6s ease forwards;
      gap: 1px;
      z-index: 10;
      transition: top 0.7s cubic-bezier(0.4, 0, 0.2, 1), left 0.7s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .circle-el:active {
      filter: brightness(1.3);
    }

    .circle-el .char {
      font-family: 'Noto Serif SC', serif;
      font-size: clamp(1.1rem, 4vw, 1.5rem);
      font-weight: 900;
      line-height: 1;
    }

    .circle-el .elname {
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(0.45rem, 1.8vw, 0.55rem);
      font-weight: 300;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      opacity: 0.5;
    }

    .circle-el:nth-child(1) {
      animation-delay: 0.4s;
    }

    .circle-el:nth-child(2) {
      animation-delay: 0.5s;
    }

    .circle-el:nth-child(3) {
      animation-delay: 0.6s;
    }

    .circle-el:nth-child(4) {
      animation-delay: 0.7s;
    }

    .circle-el:nth-child(5) {
      animation-delay: 0.8s;
    }

    .circle-el.c-metal {
      border-color: rgba(212, 175, 55, 0.3);
      animation: fadeIn 0.6s ease forwards, breatheMetal 4s ease-in-out infinite alternate;
    }

    @keyframes breatheMetal {
      from {
        box-shadow: 0 0 4px rgba(212, 175, 55, 0.05);
      }

      to {
        box-shadow: 0 0 16px rgba(212, 175, 55, 0.25);
      }
    }

    .circle-el.c-metal .char {
      color: var(--metal);
    }

    .circle-el.c-wood {
      border-color: rgba(76, 153, 76, 0.3);
      animation: fadeIn 0.6s ease forwards, breatheWood 4s ease-in-out infinite alternate 0.5s;
    }

    @keyframes breatheWood {
      from {
        box-shadow: 0 0 4px rgba(76, 153, 76, 0.05);
      }

      to {
        box-shadow: 0 0 16px rgba(76, 153, 76, 0.25);
      }
    }

    .circle-el.c-wood .char {
      color: var(--wood);
    }

    .circle-el.c-water {
      border-color: rgba(70, 130, 200, 0.3);
      animation: fadeIn 0.6s ease forwards, breatheWater 4s ease-in-out infinite alternate 1s;
    }

    @keyframes breatheWater {
      from {
        box-shadow: 0 0 4px rgba(70, 130, 200, 0.05);
      }

      to {
        box-shadow: 0 0 16px rgba(70, 130, 200, 0.25);
      }
    }

    .circle-el.c-water .char {
      color: var(--water);
    }

    .circle-el.c-fire {
      border-color: rgba(220, 60, 40, 0.3);
      animation: fadeIn 0.6s ease forwards, breatheFire 4s ease-in-out infinite alternate 1.5s;
    }

    @keyframes breatheFire {
      from {
        box-shadow: 0 0 4px rgba(220, 60, 40, 0.05);
      }

      to {
        box-shadow: 0 0 16px rgba(220, 60, 40, 0.25);
      }
    }

    .circle-el.c-fire .char {
      color: var(--fire);
    }

    .circle-el.c-earth {
      border-color: rgba(139, 94, 60, 0.3);
      animation: fadeIn 0.6s ease forwards, breatheEarth 4s ease-in-out infinite alternate 2s;
    }

    @keyframes breatheEarth {
      from {
        box-shadow: 0 0 4px rgba(139, 94, 60, 0.05);
      }

      to {
        box-shadow: 0 0 16px rgba(139, 94, 60, 0.25);
      }
    }

    .circle-el.c-earth .char {
      color: var(--earth);
    }

    /* ═══════════════════════════════════
     SHARED
     ═══════════════════════════════════ */
    .element-page {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      flex-direction: column;
      overflow: hidden;
      touch-action: none;
    }

    .element-page.active {
      display: flex;
    }

    .bg-char {
      position: absolute;
      top: 46%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Noto Serif SC', serif;
      font-weight: 900;
      font-size: min(70vw, 60vh);
      opacity: 0.06;
      pointer-events: none;
      user-select: none;
      z-index: 0;
    }

    .interaction-area {
      flex: 1;
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding-top: var(--safe-top);
      padding-bottom: calc(60px + var(--safe-bottom));
    }

    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      height: calc(56px + var(--safe-bottom));
      padding-bottom: var(--safe-bottom);
      display: flex;
      z-index: 200;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .nav-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      cursor: pointer;
      border: none;
      background: none;
      color: rgba(255, 255, 255, 0.25);
      font-family: 'Noto Serif SC', serif;
      font-size: clamp(1rem, 5vw, 1.3rem);
      font-weight: 900;
      transition: all 0.25s ease;
      position: relative;
    }

    .nav-item .nav-label {
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(0.4rem, 1.8vw, 0.5rem);
      font-weight: 300;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      opacity: 0.5;
    }

    .nav-item.active {
      color: rgba(255, 255, 255, 0.9);
    }

    .nav-item.active::before {
      content: '';
      position: absolute;
      top: 0;
      left: 25%;
      right: 25%;
      height: 2px;
      border-radius: 1px;
    }

    .nav-item.metal.active {
      color: var(--metal);
    }

    .nav-item.metal.active::before {
      background: var(--metal);
    }

    .nav-item.wood.active {
      color: var(--wood);
    }

    .nav-item.wood.active::before {
      background: var(--wood);
    }

    .nav-item.water.active {
      color: var(--water);
    }

    .nav-item.water.active::before {
      background: var(--water);
    }

    .nav-item.fire.active {
      color: var(--fire);
    }

    .nav-item.fire.active::before {
      background: var(--fire);
    }

    .nav-item.earth.active {
      color: var(--earth);
    }

    .nav-item.earth.active::before {
      background: var(--earth);
    }

    .home-btn {
      position: absolute;
      top: calc(12px + var(--safe-top));
      left: 12px;
      z-index: 100;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 50%;
      width: 34px;
      height: 34px;
      color: rgba(255, 255, 255, 0.4);
      font-size: 0.85rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(8px);
      transition: transform 0.2s ease, background 0.2s ease;
    }

    .home-btn:active {
      transform: scale(0.9);
      background: rgba(0, 0, 0, 0.6);
    }

    .cue-visible {
      opacity: 0.45;
      transition: opacity 0.8s ease;
    }

    .cue-hidden {
      opacity: 0 !important;
      transition: opacity 0.5s ease;
      pointer-events: none;
    }

    /* ═══════════════════════════════════
     METAL
     ═══════════════════════════════════ */
    #metal-page {
      background: radial-gradient(ellipse at 50% 40%, #1a1812 0%, #0d0c08 100%);
    }

    #metal-page .bg-char {
      color: var(--metal);
    }

    .metal-ring-visual {
      width: clamp(140px, 40vw, 180px);
      height: clamp(140px, 40vw, 180px);
      border: 2.5px solid rgba(212, 175, 55, 0.45);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
      position: relative;
      overflow: hidden;
    }

    .metal-ring-visual.shaking {
      border-color: rgba(212, 175, 55, 0.8);
      box-shadow: 0 0 40px rgba(212, 175, 55, 0.3);
    }

    .metal-shake-icon {
      opacity: 0.7;
      animation: shakeCueAnim 1.2s ease-in-out infinite;
      transition: opacity 0.5s ease;
    }

    .metal-shake-icon svg {
      width: 70px;
      height: 70px;
    }

    .metal-spark {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 2px;
      height: 15px;
      background: #fff;
      border-radius: 2px;
      pointer-events: none;
      box-shadow: 0 0 6px #d4af37, 0 0 12px #d4af37;
      animation: metalSparkAnim 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
      z-index: 5;
    }

    @keyframes metalSparkAnim {
      0% {
        transform: translate(calc(-50% + var(--sx)), calc(-50% + var(--sy))) rotate(var(--rot)) scaleY(1);
        opacity: 1;
      }

      100% {
        transform: translate(calc(-50% + var(--ex)), calc(-50% + var(--ey))) rotate(var(--rot)) scaleY(0.2);
        opacity: 0;
      }
    }

    @keyframes shakeCueAnim {

      0%,
      100% {
        transform: translateX(0) rotate(0deg);
      }

      12% {
        transform: translateX(-10px) rotate(-12deg);
      }

      24% {
        transform: translateX(10px) rotate(12deg);
      }

      36% {
        transform: translateX(-8px) rotate(-8deg);
      }

      48% {
        transform: translateX(8px) rotate(8deg);
      }

      60% {
        transform: translateX(-4px) rotate(-3deg);
      }

      72% {
        transform: translateX(4px) rotate(3deg);
      }
    }

    /* ═══════════════════════════════════
     WOOD
     ═══════════════════════════════════ */
    #wood-page {
      background: radial-gradient(ellipse at 50% 40%, #0f1a0f 0%, #080d08 100%);
    }

    #wood-page .bg-char {
      color: var(--wood);
    }

    .xy-pad {
      position: relative;
      width: min(75vw, 260px);
      aspect-ratio: 1;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      overflow: hidden;
      touch-action: none;
    }

    .xy-pad .crosshair {
      position: absolute;
      width: 22px;
      height: 22px;
      border: 2px solid rgba(255, 255, 255, 0.6);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      left: 50%;
      top: 50%;
      z-index: 2;
    }

    .xy-pad .ghost-cursor {
      position: absolute;
      width: 22px;
      height: 22px;
      border: 1.5px solid rgba(255, 255, 255, 0.25);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 1;
      transition: opacity 0.5s ease;
    }

    /* Tree of life */
    .tree-container {
      position: relative;
      width: 100%;
      flex: 1;
      max-width: 340px;
      max-height: 520px;
    }

    .tree-branches {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    }

    .tree-leaf-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 5;
      overflow: hidden;
    }

    .tree-node {
      position: absolute;
      width: clamp(42px, 12vw, 52px);
      height: clamp(42px, 12vw, 52px);
      border: 1px solid rgba(76, 153, 76, 0.25);
      border-radius: 4px;
      background: rgba(76, 153, 76, 0.06);
      color: rgba(255, 255, 255, 0.6);
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(0.6rem, 2.5vw, 0.72rem);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translate(-50%, -50%);
      z-index: 10;
      transition: all 1.5s cubic-bezier(0.1, 0.9, 0.2, 1);
    }

    .tree-node.actively-playing {
      border-color: rgba(76, 153, 76, 0.9);
      background: rgba(76, 153, 76, 0.2);
      box-shadow: 0 0 12px rgba(76, 153, 76, 0.8), inset 0 0 4px rgba(76, 153, 76, 0.4);
      color: rgba(255, 255, 255, 0.9);
      transform: translate(-50%, -50%) scale(0.95);
      transition: all 0.05s ease-out;
      /* snap fast */
    }

    .tree-node:active {
      background: rgba(76, 153, 76, 0.3);
      border-color: rgba(76, 153, 76, 0.7);
      transform: translate(-50%, -50%) scale(0.92);
    }

    .tree-node.invite-glow {
      border-color: rgba(76, 153, 76, 0.4);
      box-shadow: 0 0 12px rgba(76, 153, 76, 0.15);
      color: rgba(255, 255, 255, 0.7);
      transition: all 0.6s ease;
    }

    .tree-root {
      position: absolute;
      bottom: 4%;
      left: 50%;
      transform: translateX(-50%);
      width: clamp(72px, 20vw, 88px);
      height: clamp(72px, 20vw, 88px);
      border: 2px solid rgba(76, 153, 76, 0.25);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .tree-root.active {
      border-color: rgba(76, 153, 76, 0.6);
      box-shadow: 0 0 40px rgba(76, 153, 76, 0.2);
      background: rgba(76, 153, 76, 0.08);
    }

    .tree-root-cue {
      opacity: 0.35;
      animation: thumbPulse 2.5s ease-in-out infinite;
      transition: opacity 0.4s ease;
    }

    .tree-root-cue svg {
      width: clamp(40px, 12vw, 52px);
      height: clamp(50px, 15vw, 65px);
    }

    .tree-leaf {
      position: absolute;
      pointer-events: none;
      z-index: 5;
    }

    .tree-leaf svg {
      width: 14px;
      height: 14px;
    }

    /* ═══════════════════════════════════
     WATER
     ═══════════════════════════════════ */
    #water-page {
      background: radial-gradient(ellipse at 50% 40%, #0a1220 0%, #060a10 100%);
    }

    #water-page .bg-char {
      color: var(--water);
    }

    .water-tilt-hint {
      margin-bottom: clamp(8px, 1.5vh, 16px);
      opacity: 0.6;
      animation: tiltCueAnim 3s ease-in-out infinite;
    }

    .water-tilt-hint svg {
      width: 56px;
      height: 56px;
    }

    @keyframes tiltCueAnim {

      0%,
      100% {
        transform: rotate(0deg);
      }

      20% {
        transform: rotate(18deg);
      }

      40% {
        transform: rotate(-3deg);
      }

      60% {
        transform: rotate(-18deg);
      }

      80% {
        transform: rotate(3deg);
      }
    }

    .water-stroke-area {
      width: min(75vw, 280px);
      height: min(75vw, 280px);
      position: relative;
      touch-action: none;
    }

    .water-char-svg {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
    }

    .water-stroke {
      transition: stroke 0.3s ease;
    }

    .water-bubble {
      position: absolute;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 5;
      transition: left 0.15s ease-out, top 0.15s ease-out;
    }

    .water-bubble-inner {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 35%,
          rgba(130, 185, 240, 0.55) 0%, rgba(70, 130, 200, 0.35) 40%,
          rgba(50, 100, 180, 0.15) 70%, rgba(40, 80, 160, 0.05) 100%);
      box-shadow: 0 0 12px rgba(70, 130, 200, 0.3), inset 0 0 6px rgba(130, 185, 240, 0.2);
      position: relative;
      animation: waterWobble 4s ease-in-out infinite alternate;
    }

    @keyframes waterWobble {
      0% {
        border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
      }

      33% {
        border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
      }

      66% {
        border-radius: 50% 60% 60% 40% / 40% 60% 50% 60%;
      }

      100% {
        border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
      }
    }

    .water-bubble-inner::before {
      content: '';
      position: absolute;
      top: 20%;
      left: 25%;
      width: 35%;
      height: 25%;
      border-radius: 50%;
      background: rgba(200, 225, 255, 0.3);
      filter: blur(2px);
    }

    .water-tilt-readout {
      position: absolute;
      bottom: calc(80px + var(--safe-bottom));
      left: 0;
      right: 0;
      z-index: 20;
      display: flex;
      justify-content: center;
      gap: clamp(16px, 5vw, 30px);
      pointer-events: none;
      transition: opacity 0.5s ease;
    }

    .tilt-axis {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .tilt-axis .tilt-label {
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(0.6rem, 2.5vw, 0.75rem);
      font-weight: 300;
      font-style: italic;
      opacity: 0.4;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .tilt-axis .tilt-value {
      font-family: 'Noto Serif SC', serif;
      font-size: clamp(1.8rem, 8vw, 2.8rem);
      font-weight: 300;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1;
    }

    /* ═══════════════════════════════════
     FIRE
     ═══════════════════════════════════ */
    #fire-page {
      background: radial-gradient(ellipse at 50% 60%, #1a0a08 0%, #0d0604 100%);
    }

    #fire-page .bg-char {
      color: var(--fire);
    }

    .fire-layout {
      justify-content: flex-start;
      padding-top: clamp(20px, 5vh, 40px);
    }

    .fire-stroke-area {
      width: min(88vw, 340px);
      height: min(88vw, 340px);
      position: relative;
      touch-action: none;
      margin-top: clamp(8px, 1.5vh, 16px);
    }

    .fire-char-svg {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
    }

    .fire-stroke {
      transition: stroke 0.2s ease, stroke-width 0.2s ease;
    }

    .fire-flame-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
      z-index: 2;
      filter: url('#goo');
    }

    .fire-trace-ghost {
      position: absolute;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: rgba(220, 60, 40, 0.35);
      pointer-events: none;
      z-index: 3;
      transform: translate(-50%, -50%);
      transition: opacity 0.5s ease;
      box-shadow: 0 0 8px rgba(220, 60, 40, 0.3);
    }

    .flame-particle {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      animation: flameRise 0.8s ease-out forwards;
    }

    @keyframes flameRise {
      0% {
        opacity: 1;
        transform: scale(1) translateY(0);
      }

      100% {
        opacity: 0;
        transform: scale(0.2) translateY(-80px);
      }
    }

    .fire-xy-container {
      margin-bottom: 0;
    }

    .fire-ghost {
      animation: fireGhostMove 3s ease-in-out infinite;
    }

    @keyframes fireGhostMove {
      0% {
        left: 50%;
        top: 50%;
      }

      20% {
        left: 30%;
        top: 30%;
      }

      40% {
        left: 70%;
        top: 40%;
      }

      60% {
        left: 60%;
        top: 70%;
      }

      80% {
        left: 35%;
        top: 55%;
      }

      100% {
        left: 50%;
        top: 50%;
      }
    }


    /* ═══════════════════════════════════
     EARTH
     ═══════════════════════════════════ */
    #earth-page {
      background: radial-gradient(ellipse at 50% 50%, #1a1008 0%, #0d0904 100%);
    }

    #earth-page::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, transparent 40%, rgba(0, 0, 0, 0.8) 100%);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.5s ease;
      z-index: 100;
    }

    #earth-page.quaking::after {
      opacity: 1;
      transition: opacity 0.1s ease;
    }

    #earth-page .bg-char {
      color: var(--earth);
    }

    .earth-touch-area {
      width: clamp(160px, 42vw, 210px);
      height: clamp(160px, 42vw, 210px);
      border: 2.5px solid rgba(139, 94, 60, 0.35);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
    }

    .earth-thumbprint {
      opacity: 0.55;
      transition: opacity 0.4s ease;
      animation: thumbPulse 2.5s ease-in-out infinite;
    }

    .earth-thumbprint svg {
      width: clamp(56px, 16vw, 72px);
      height: clamp(70px, 20vw, 90px);
    }

    @keyframes thumbPulse {

      0%,
      100% {
        transform: scale(1);
        opacity: 0.55;
      }

      50% {
        transform: scale(1.06);
        opacity: 0.8;
      }
    }

    .earth-pulse {
      position: absolute;
      border: 1px solid rgba(139, 94, 60, 0.3);
      border-radius: 50%;
      animation: earthPulse 1s ease-out forwards;
      pointer-events: none;
    }

    @keyframes earthPulse {
      0% {
        transform: scale(1);
        opacity: 0.5;
      }

      100% {
        transform: scale(2);
        opacity: 0;
      }
    }

    @keyframes screenShake {

      0%,
      100% {
        transform: translate(0, 0);
      }

      10% {
        transform: translate(-5px, -3px);
      }

      20% {
        transform: translate(5px, 3px);
      }

      30% {
        transform: translate(-4px, 4px);
      }

      40% {
        transform: translate(4px, -4px);
      }

      50% {
        transform: translate(-3px, 2px);
      }

      60% {
        transform: translate(3px, -2px);
      }

      70% {
        transform: translate(-2px, 3px);
      }

      80% {
        transform: translate(2px, -1px);
      }

      90% {
        transform: translate(-1px, 1px);
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }

      to {
        opacity: 1;
      }
    }

    /* Status screens */
    .status-screen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #0a0a0a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      text-align: center;
      padding: 40px;
      animation: fadeIn 1s ease;
    }

    .status-screen.hidden {
      display: none;
    }

    .status-screen h1 {
      font-family: 'Noto Serif SC', serif;
      font-weight: 300;
      font-size: clamp(2rem, 8vw, 3rem);
      margin-bottom: 16px;
      opacity: 0.9;
    }

    .status-screen .sub {
      font-family: 'Cormorant Garamond', serif;
      font-weight: 300;
      font-style: italic;
      font-size: clamp(0.85rem, 3.5vw, 1.1rem);
      opacity: 0.5;
      line-height: 1.8;
    }

    .status-screen .reminder {
      margin-top: 40px;
      font-weight: 300;
      font-style: italic;
      font-size: clamp(0.75rem, 3vw, 0.95rem);
      opacity: 0.4;
      line-height: 1.7;
    }

    /* ═══════════════════════════════════
       DESTRUCTION SYSTEM
       ═══════════════════════════════════ */

    /* Global destruction wrapper shake */
    body.destruction-mode .element-page.active {
      animation: destructGlobalShake 0.15s infinite;
    }

    @keyframes destructGlobalShake {
      0% {
        transform: translate(0, 0) rotate(0deg) skew(0deg);
      }

      20% {
        transform: translate(var(--d-tx1, -3px), var(--d-ty1, 2px)) rotate(var(--d-rot, 0.3deg)) skew(var(--d-skew, 0.5deg));
      }

      40% {
        transform: translate(var(--d-tx2, 4px), var(--d-ty2, -3px)) rotate(calc(var(--d-rot, 0.3deg) * -1)) skew(calc(var(--d-skew, 0.5deg) * -1));
      }

      60% {
        transform: translate(var(--d-tx3, -2px), var(--d-ty3, 4px)) rotate(var(--d-rot, 0.3deg)) skew(var(--d-skew, 0.5deg));
      }

      80% {
        transform: translate(var(--d-tx4, 3px), var(--d-ty4, -1px)) rotate(calc(var(--d-rot, 0.3deg) * -0.5)) skew(0deg);
      }

      100% {
        transform: translate(0, 0) rotate(0deg) skew(0deg);
      }
    }

    /* Bg-char flicker in destruction */
    body.destruction-mode .bg-char {
      animation: destructCharFlicker 0.3s infinite steps(2);
    }

    @keyframes destructCharFlicker {

      0%,
      100% {
        opacity: 1;
      }

      50% {
        opacity: 0.4;
      }
    }

    /* Invert flash removed — epilepsy risk */

    /* ── Wood destruction ── */
    body.destruction-mode #wood-page .tree-node {
      border-color: var(--d-wood-border, rgba(76, 153, 76, 0.3));
      background: var(--d-wood-node-bg, transparent);
      box-shadow: none;
    }

    body.destruction-mode #wood-page .bg-char {
      color: var(--d-wood-char-color, rgba(76, 153, 76, 0.06));
    }

    body.destruction-mode #wood-page svg path {
      stroke: var(--d-wood-branch, rgba(76, 153, 76, 0.12));
    }

    /* ── Fire destruction ── */
    body.destruction-mode #fire-page .fire-stroke {
      stroke: var(--d-fire-stroke, rgba(220, 60, 40, 0.18)) !important;
      stroke-dasharray: none !important;
      opacity: var(--d-fire-stroke-op, 0.18);
    }

    body.destruction-mode #fire-page {
      filter: brightness(var(--d-fire-bright, 1)) contrast(var(--d-fire-contrast, 1));
    }

    /* ── Earth destruction ── */
    body.destruction-mode #earth-page {
      animation: destructGlobalShake 0.08s infinite, destructEarthExtra 0.1s infinite;
    }

    @keyframes destructEarthExtra {

      0%,
      100% {
        transform: translate(0, 0);
      }

      25% {
        transform: translate(var(--d-earth-shake, 2px), calc(var(--d-earth-shake, 2px) * -1));
      }

      75% {
        transform: translate(calc(var(--d-earth-shake, 2px) * -1), var(--d-earth-shake, 2px));
      }
    }

    /* ── Metal destruction ── */
    body.destruction-mode #metal-page .metal-ring {
      border-color: var(--d-metal-color, rgba(212, 175, 55, 0.3));
    }

    body.destruction-mode #metal-page .metal-char {
      color: var(--d-metal-color, rgba(212, 175, 55, 0.45));
    }

    body.destruction-mode #metal-page .bg-char {
      color: var(--d-metal-color, rgba(212, 175, 55, 0.06));
    }

    /* ── Water destruction ── */
    body.destruction-mode #water-page .water-stroke {
      stroke: var(--d-water-stroke, rgba(70, 130, 200, 0.15));
    }

    body.destruction-mode #water-page .water-bubble {
      width: var(--d-water-bubble-size, 28px);
      height: var(--d-water-bubble-size, 28px);
    }

    /* ═══════════════════════════════════
       AFTERMATH
       ═══════════════════════════════════ */
    #aftermathScreen {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #000;
      z-index: 9000;
      display: none;
      pointer-events: none;
      overflow: hidden;
    }

    /* Vignette and distant fires overlay */
    #aftermathScreen::before {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 60%;
      background: linear-gradient(to top, rgba(220, 60, 40, 0.15) 0%, transparent 100%);
      pointer-events: none;
      z-index: 1;
      animation: aftermathFireBreathe 8s ease-in-out infinite alternate;
    }

    /* "Cracked" gritty texture overlay */
    #aftermathScreen::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image:
        radial-gradient(ellipse at center, transparent 20%, rgba(0, 0, 0, 0.8) 100%),
        repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255, 255, 255, 0.01) 2px, rgba(255, 255, 255, 0.01) 4px);
      pointer-events: none;
      z-index: 2;
      opacity: 0.6;
    }

    @keyframes aftermathFireBreathe {
      0% {
        opacity: 0.5;
        transform: scaleY(1);
      }

      100% {
        opacity: 1;
        transform: scaleY(1.1);
      }
    }

    /* Wreckage Floating Animation */
    @keyframes wreckageDrift {
      0% {
        transform: translate(0, 0) rotate(var(--rot)) scale(1);
      }

      33% {
        transform: translate(3px, -5px) rotate(calc(var(--rot) + 2deg)) scale(0.98);
      }

      66% {
        transform: translate(-2px, 4px) rotate(calc(var(--rot) - 1deg)) scale(1.02);
      }

      100% {
        transform: translate(0, 0) rotate(var(--rot)) scale(1);
      }
    }

    /* Fade flicker for ruin characters (Increased base brightness for mobile) */
    @keyframes ruinFlicker {

      0%,
      100% {
        opacity: 0.6;
      }

      50% {
        opacity: 0.4;
      }

      80% {
        opacity: 0.8;
      }
    }

    /* 3D SVG Ruin Elements */
    #aftermathScreen .ruin-svg-container {
      position: absolute;
      width: clamp(60px, 15vw, 100px);
      height: clamp(60px, 15vw, 100px);
      z-index: 5;
      animation:
        wreckageDrift 15s ease-in-out infinite alternate,
        ruinFlicker 6s ease-in-out infinite;
      filter: drop-shadow(4px 10px 4px rgba(0,0,0,0.8)) drop-shadow(0px 0px 15px var(--glow-color));
      pointer-events: auto;
      cursor: pointer;
    }

    #aftermathScreen .ruin-svg-container svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    #aftermathScreen .ruin-svg-container path.stone-base {
      fill: #222;
      stroke: #111;
      stroke-width: 2;
    }

    #aftermathScreen .ruin-svg-container path.stone-face {
      fill: #4a4a4a;
    }

    #aftermathScreen .ruin-svg-container path.stone-highlight {
      fill: #8a8a8a;
    }

    /* Interactive States */
    #aftermathScreen.interactive {
      pointer-events: auto;
    }

    #aftermathScreen .ruin-svg-container.brightening {
      animation: none;
      transition: filter 0.3s, transform 0.3s;
      transform: scale(1.2);
      filter: drop-shadow(0px 20px 10px rgba(0,0,0,0.6)) drop-shadow(0px 0px 40px var(--glow-color));
    }

    #aftermathScreen .ruin-svg-container.brightening path.stone-face {
      transition: fill 0.3s;
      fill: var(--glow-color-solid);
    }
    
    #aftermathScreen .ruin-svg-container.brightening path.stone-highlight {
      transition: fill 0.3s;
      fill: #fff;
    }

    /* ── Aftermath interaction ── */
    #aftermathScreen.interactive {
      pointer-events: auto;
    }

    #aftermathScreen.interactive .ruin-char {
      pointer-events: auto;
      cursor: pointer;
    }

    #aftermathScreen .ruin-char.brightening {
      animation: none;
      transition: color 0.3s, text-shadow 0.3s, transform 0.3s;
      transform: scale(1.2);
    }

    #aftermathFlash {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 9999;
      pointer-events: none;
      opacity: 0;
    }

    #aftermathEmber {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 30px;
      height: 30px;
      margin-top: -15px;
      margin-left: -15px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(200,120,40,0.8) 0%, rgba(200,120,40,0) 70%);
      z-index: 10;
      opacity: 0;
      pointer-events: none;
      transition: opacity 2s;
    }

    /* Center ember SVG */
    #aftermathEmber svg {
      width: 100%;
      height: 100%;
      overflow: visible;
      filter: drop-shadow(0 0 15px rgba(200,120,40,0.8));
    }
    #aftermathEmber path {
      fill: none;
      stroke: rgba(255,180,100,0.9);
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    #aftermathEmber.visible {
      opacity: 1;
      pointer-events: auto;
      animation: emberBreatheSVG 4s ease-in-out infinite alternate;
      transition: opacity 3s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    @keyframes emberBreatheSVG {
      0% { transform: scale(0.9); filter: drop-shadow(0 0 10px rgba(200,120,40,0.5)); }
      100% { transform: scale(1.15); filter: drop-shadow(0 0 25px rgba(255,160,60,0.9)); }
    }

    .ember-tap-burst {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 200px;
      height: 200px;
      margin-top: -100px;
      margin-left: -100px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,200,150,0.8) 0%, rgba(200,100,20,0.4) 30%, transparent 70%);
      pointer-events: none;
      animation: emberBurstAnim 1.2s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
      mix-blend-mode: screen;
    }

    @keyframes emberBurstAnim {
      0% { transform: scale(0.2); opacity: 1; }
      100% { transform: scale(3); opacity: 0; }
    }

    .ember-tap-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 80px;
      height: 80px;
      margin-top: -40px;
      margin-left: -40px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(200,120,40,0.6) 0%, transparent 70%);
      pointer-events: none;
      animation: emberTapFade 1s ease-out forwards;
    }

    @keyframes emberTapFade {
      0% { transform: scale(0.5); opacity: 1; }
      100% { transform: scale(2.5); opacity: 0; }
    }

    /* Falling Ash Particles System */
    .ash-layer {
      position: absolute;
      top: -100%;
      /* Start above screen */
      left: 0;
      width: 100%;
      height: 200%;
      /* Double height for seamless scrolling */
      z-index: 6; /* Bring above ruin characters to look more immersive */
      pointer-events: none;
    }

    /* Larger, more obvious ash flakes */
    .ash-layer-1 {
      /* Box shadow trick: x y blur color */
      box-shadow:
        10vw 10vh 2px rgba(200, 200, 200, 0.6),
        30vw 30vh 4px rgba(220, 60, 40, 0.5),
        50vw 5vh 3px rgba(180, 180, 180, 0.7),
        70vw 50vh 5px rgba(255, 255, 255, 0.4),
        90vw 20vh 2px rgba(220, 80, 40, 0.6),
        20vw 80vh 3px rgba(200, 200, 200, 0.5),
        80vw 90vh 4px rgba(150, 150, 150, 0.8),
        40vw 60vh 6px rgba(240, 60, 40, 0.5),
        60vw 10vh 2px rgba(220, 220, 220, 0.6);
      width: 4px;
      height: 4px;
      border-radius: 50%;
      animation: ashFall 12s linear infinite;
    }

    .ash-layer-2 {
      box-shadow:
        15vw 5vh 3px rgba(180, 180, 180, 0.5),
        35vw 45vh 5px rgba(255, 100, 40, 0.4),
        55vw 25vh 2px rgba(220, 220, 220, 0.7),
        75vw 65vh 6px rgba(200, 200, 200, 0.4),
        95vw 85vh 3px rgba(220, 60, 40, 0.6),
        25vw 35vh 4px rgba(255, 255, 255, 0.5),
        85vw 15vh 2px rgba(150, 150, 150, 0.6),
        45vw 75vh 5px rgba(240, 80, 40, 0.4),
        65vw 95vh 3px rgba(220, 220, 220, 0.5);
      width: 6px;
      height: 6px;
      border-radius: 30% 70% 70% 40% / 50% 50% 60% 50%; /* Irregular flake shape */
      animation: ashFall 18s linear infinite;
      animation-delay: -5s;
    }

    .ash-layer-3 {
      box-shadow:
        5vw 90vh 4px rgba(200, 200, 200, 0.4),
        25vw 10vh 2px rgba(255, 80, 40, 0.6),
        45vw 40vh 6px rgba(180, 180, 180, 0.5),
        65vw 20vh 3px rgba(255, 255, 255, 0.6),
        85vw 50vh 5px rgba(220, 60, 40, 0.4),
        15vw 60vh 2px rgba(220, 220, 220, 0.7),
        75vw 30vh 4px rgba(150, 150, 150, 0.6),
        35vw 80vh 3px rgba(240, 60, 40, 0.5),
        95vw 70vh 5px rgba(200, 200, 200, 0.4);
      width: 8px;
      height: 8px;
      border-radius: 60% 40% 50% 50% / 40% 60% 50% 50%;
      animation: ashFall 24s linear infinite;
      animation-delay: -12s;
    }

    @keyframes ashFall {
      0% {
        transform: translateY(0) translateX(0) rotate(0deg);
      }

      100% {
        transform: translateY(100vh) translateX(-10vw) rotate(360deg);
      }
    }

    /* ═══════════════════════════════════
       HARMONY
       ═══════════════════════════════════ */
    #harmonyScreen {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #000;
      z-index: 9000;
      /* Reverted to #000 as canvas covers it */
      display: none;
      pointer-events: auto;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      /* Ensure nothing spills out */
    }

    /* Low GPU Living Background Canvas */
    #harmonyBgCanvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      pointer-events: none;
      opacity: 0;
      transition: opacity 2s ease-in-out;
    }

    .harmony-layout {
      pointer-events: auto;
      z-index: 10;
    }

    .harmony-el {
      position: absolute;
      /* Add absolute positioning so Top/Left works */
      cursor: pointer;
      pointer-events: auto;
      /* Ensure base styles are ready for entrance animation */
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.5);
      transition: opacity 1.5s ease-out, transform 1.5s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    /* Position elements in a circle (pentagon shape) around the center */
    /* Exact angles matching the r=0.72 pentagram on the canvas */
    .harmony-el[data-el="water"] {
      top: 14.0%;
      left: 50.0%;
    }

    .harmony-el[data-el="wood"] {
      top: 38.9%;
      left: 84.2%;
    }

    .harmony-el[data-el="fire"] {
      top: 79.1%;
      left: 71.2%;
    }

    .harmony-el[data-el="earth"] {
      top: 79.1%;
      left: 28.8%;
    }

    .harmony-el[data-el="metal"] {
      top: 38.9%;
      left: 15.8%;
    }

    /* Entrance Animation Classes Addded via JS */
    .harmony-el.entered {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }

    /* Harmony tap ripple */
    .harmony-ripple {
      position: absolute;
      border-radius: 50%;
      width: 80px;
      height: 80px;
      transform: translate(-50%, -50%) scale(0);
      opacity: 0.6;
      pointer-events: none;
      animation: harmonyRippleOut 0.7s ease-out forwards;
    }

    @keyframes harmonyRippleOut {
      0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 0.6;
      }

      100% {
        transform: translate(-50%, -50%) scale(3);
        opacity: 0;
      }
    }

    /* Harmony center glow */
    #harmonyCenter {
      transition: text-shadow 0.3s, box-shadow 0.3s;
    }

    #harmonyCenter.glowing {
      box-shadow: 0 0 30px rgba(255, 255, 255, 0.2), 0 0 60px rgba(255, 255, 255, 0.1);
    }

    /* ═══════════════════════════════════
       ADMIN PANEL
       ═══════════════════════════════════ */
    #adminPanel {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9999;
      background: rgba(10, 10, 15, 0.7);
      backdrop-filter: blur(25px);
      -webkit-backdrop-filter: blur(25px);
      font-family: -apple-system, system-ui, sans-serif;
      padding: 16px;
      padding-top: calc(16px + var(--safe-top));
      padding-bottom: calc(16px + var(--safe-bottom));
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .admin-container {
      width: 100%;
      max-width: 600px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }

    .admin-header {
      text-align: center;
      margin-bottom: 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 20px;
    }

    .admin-title {
      font-family: 'Noto Serif SC', serif;
      font-size: 28px;
      font-weight: 600;
      color: #fff;
      letter-spacing: 0.15em;
      margin-bottom: 12px;
      text-shadow: 0 2px 10px rgba(255, 255, 255, 0.2);
    }

    .admin-info {
      display: flex;
      justify-content: center;
      gap: 20px;
      font-family: 'Cormorant Garamond', serif;
      font-size: 15px;
      color: rgba(255, 255, 255, 0.6);
      letter-spacing: 0.05em;
    }

    .admin-info span {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(0, 0, 0, 0.3);
      padding: 6px 14px;
      border-radius: 30px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .admin-info strong {
      color: #fff;
      font-weight: 500;
    }

    #adminTimer {
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: monospace;
      font-size: 28px;
      font-weight: 700;
      color: #ff3366;
      background: rgba(40, 0, 10, 0.4);
      padding: 10px 24px;
      border-radius: 12px;
      border: 1px solid rgba(255, 50, 100, 0.3);
      box-shadow: 0 0 20px rgba(255, 50, 100, 0.15) inset, 0 4px 12px rgba(0, 0, 0, 0.5);
      margin: 16px auto;
      letter-spacing: 0.1em;
      text-shadow: 0 0 10px rgba(255, 50, 100, 0.5);
      width: max-content;
    }

    .admin-section {
      margin-bottom: 24px;
    }

    .admin-label {
      font-family: 'Cormorant Garamond', serif;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.4);
      letter-spacing: 0.2em;
      margin-bottom: 12px;
      padding-left: 4px;
      text-transform: uppercase;
    }

    .admin-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 12px;
    }

    .admin-btn {
      position: relative;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px 8px;
      font-family: 'Cormorant Garamond', serif;
      font-size: 16px;
      font-weight: 500;
      letter-spacing: 0.05em;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.8);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
      transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
      overflow: hidden;
      -webkit-tap-highlight-color: transparent;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }

    .admin-btn::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: inherit;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
      pointer-events: none;
    }

    .admin-btn:active {
      transform: scale(0.96) translateY(2px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      filter: brightness(1.2);
    }

    /* System buttons */
    .admin-btn.sys {
      background: linear-gradient(180deg, rgba(60, 60, 65, 0.5) 0%, rgba(40, 40, 45, 0.5) 100%);
      border-color: rgba(255, 255, 255, 0.15);
      color: #fff;
    }

    /* Element Colors */
    .admin-btn.create.wood {
      background: linear-gradient(180deg, rgba(76, 153, 76, 0.15) 0%, rgba(76, 153, 76, 0.05) 100%);
      border-color: rgba(76, 153, 76, 0.3);
      color: #9dfcb6;
    }
    .admin-btn.create.wood:active {
      box-shadow: 0 0 15px rgba(76, 153, 76, 0.4);
    }

    .admin-btn.create.fire {
      background: linear-gradient(180deg, rgba(240, 90, 20, 0.15) 0%, rgba(240, 90, 20, 0.05) 100%);
      border-color: rgba(240, 90, 20, 0.3);
      color: #ffb585;
    }
    .admin-btn.create.fire:active {
      box-shadow: 0 0 15px rgba(240, 90, 20, 0.4);
    }

    .admin-btn.create.earth {
      background: linear-gradient(180deg, rgba(139, 94, 60, 0.15) 0%, rgba(139, 94, 60, 0.05) 100%);
      border-color: rgba(139, 94, 60, 0.3);
      color: #ffcf9e;
    }
    .admin-btn.create.earth:active {
      box-shadow: 0 0 15px rgba(139, 94, 60, 0.4);
    }

    .admin-btn.create.metal {
      background: linear-gradient(180deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%);
      border-color: rgba(212, 175, 55, 0.3);
      color: #ffe694;
    }
    .admin-btn.create.metal:active {
      box-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
    }

    .admin-btn.create.water {
      background: linear-gradient(180deg, rgba(70, 130, 200, 0.15) 0%, rgba(70, 130, 200, 0.05) 100%);
      border-color: rgba(70, 130, 200, 0.3);
      color: #a3daff;
    }
    .admin-btn.create.water:active {
      box-shadow: 0 0 15px rgba(70, 130, 200, 0.4);
    }

    .admin-btn.create.harmony {
      background: linear-gradient(180deg, rgba(170, 102, 204, 0.15) 0%, rgba(170, 102, 204, 0.05) 100%);
      border-color: rgba(170, 102, 204, 0.3);
      color: #eeddff;
    }
    .admin-btn.create.harmony:active {
      box-shadow: 0 0 15px rgba(170, 102, 204, 0.4);
    }

    /* Destruction buttons */
    .admin-btn.destroy {
      background: repeating-linear-gradient(
        -45deg,
        rgba(30, 0, 0, 0.6) 0,
        rgba(30, 0, 0, 0.6) 8px,
        rgba(80, 0, 0, 0.6) 8px,
        rgba(80, 0, 0, 0.6) 16px
      );
      border: 1.5px dashed rgba(255, 30, 30, 0.8);
      border-radius: 2px;
      color: #ff3333;
      font-family: inherit;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: -0.05em;
      text-shadow: 1px 1px 0 #000;
    }
    
    .admin-btn.destroy::after {
      display: none;
    }

    .admin-btn.destroy:active {
      transform: scale(0.95);
      background: rgba(255, 0, 0, 0.3);
      border-style: solid;
      box-shadow: 0 0 15px rgba(255, 30, 30, 0.7) inset;
    }

    .admin-btn.destroy.aftermath {
      background: repeating-linear-gradient(
        45deg,
        rgba(30, 0, 40, 0.6) 0,
        rgba(30, 0, 40, 0.6) 8px,
        rgba(70, 0, 90, 0.6) 8px,
        rgba(70, 0, 90, 0.6) 16px
      );
      border: 1.5px dashed rgba(200, 40, 255, 0.8);
      color: #e59dfc;
    }
    
    .admin-btn.destroy.aftermath:active {
      background: rgba(140, 0, 255, 0.3);
      box-shadow: 0 0 15px rgba(200, 40, 255, 0.7) inset;
    }

    /* End button */
    .admin-btn.end {
      grid-column: 1 / -1;
      background: linear-gradient(180deg, rgba(30, 30, 30, 0.8) 0%, rgba(15, 15, 15, 0.9) 100%);
      color: #ff5555;
      border: 1px solid rgba(255, 85, 85, 0.3);
      padding: 18px;
      font-weight: 600;
      letter-spacing: 0.1em;
      margin-top: 12px;
      text-transform: uppercase;
    }
    .admin-btn.end:active {
      box-shadow: 0 0 20px rgba(255, 85, 85, 0.4);
    }

    /* Active state highlight */
    .admin-btn.admin-active {
      box-shadow: 0 0 0 1.5px rgba(255, 255, 255, 0.8), 0 0 16px rgba(255, 255, 255, 0.2);
    }
  </style>
</head>

<body>

  <div id="adminPanel" style="display:none;">
    <div class="admin-container">
      <div class="admin-header">
        <div class="admin-title">五行 ADMIN</div>
        <div class="admin-info">
          <span>Users: <strong id="adminUserCount">0</strong></span>
          <span>Status: <strong id="adminCurrentStatus">loading...</strong></span>
        </div>
        <div id="adminTimer">00:00</div>
      </div>
      <div class="admin-section">
        <div class="admin-label">SYSTEM</div>
        <div class="admin-row">
          <button class="admin-btn sys" onclick="setAdminStatus('locked')">🔒 Locked</button>
          <button class="admin-btn sys" onclick="setAdminStatus('live')">▶ Live</button>
          <button class="admin-btn sys" onclick="setAdminStatus('live_all')">⊞ All</button>
        </div>
      </div>
      <div class="admin-section">
        <div class="admin-label">CREATION</div>
        <div class="admin-row">
          <button class="admin-btn create wood" onclick="setAdminStatus('live_wood')">木 Wood</button>
          <button class="admin-btn create fire" onclick="setAdminStatus('live_fire')">火 Fire</button>
          <button class="admin-btn create earth" onclick="setAdminStatus('live_earth')">土 Earth</button>
        </div>
        <div class="admin-row">
          <button class="admin-btn create metal" onclick="setAdminStatus('live_metal')">金 Metal</button>
          <button class="admin-btn create water" onclick="setAdminStatus('live_water')">水 Water</button>
          <button class="admin-btn create harmony" onclick="setAdminStatus('live_harmony')">✦ Harmony</button>
        </div>
      </div>
      <div class="admin-section">
        <div class="admin-label">DESTRUCTION</div>
        <div class="admin-row">
          <button class="admin-btn destroy" onclick="setAdminStatus('destroy_water')">水 Tsunami</button>
          <button class="admin-btn destroy" onclick="setAdminStatus('destroy_fire')">火 Inferno</button>
          <button class="admin-btn destroy" onclick="setAdminStatus('destroy_metal')">金 Rust</button>
        </div>
        <div class="admin-row">
          <button class="admin-btn destroy" onclick="setAdminStatus('destroy_wood')">木 Ashes</button>
          <button class="admin-btn destroy" onclick="setAdminStatus('destroy_earth')">土 Quake</button>
          <button class="admin-btn destroy aftermath" onclick="setAdminStatus('live_aftermath')">☠ Aftermath</button>
        </div>
      </div>
      <div class="admin-section">
        <div class="admin-row">
          <button class="admin-btn end" onclick="setAdminStatus('ended')">⏹ END SHOW</button>
        </div>
      </div>
    </div>
  </div>

  <!-- SVG Filters -->
  <svg width="0" height="0" style="position:absolute; pointer-events:none;">
    <filter id="goo">
      <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
      <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
    </filter>
  </svg>

  <!-- Locked screen -->
  <div class="status-screen" id="lockedScreen">
    <h1>五行</h1>
    <p class="sub">Performance has not yet begun.</p>
  </div>

  <!-- End screen -->
  <div class="status-screen hidden" id="endScreen">
    <h1>五行</h1>
    <div class="reminder">
      please return your phone to silent mode<br>
      thank you
    </div>
  </div>

  <!-- Permission -->
  <div class="permission-overlay hidden" id="permissionOverlay">
    <h2>五行</h2>
    <p>This experience uses your device's<br>motion sensors, audio, and haptics.</p>
    <div class="setup-hint">unmute · volume up · brightness up</div>
    <button class="permission-btn" id="startBtn">Enter</button>
    <div class="permission-status" id="permStatus"></div>
  </div>

  <!-- Landing -->
  <div id="landing">
    <div class="circle-layout" id="circleLayout">
      <div class="circle-ring"></div>
      <canvas class="energy-canvas" id="energyCanvas"></canvas>
      <div class="circle-el c-metal" id="el-metal" onclick="openElement('metal')"><span class="char">金</span><span
          class="elname">Metal</span></div>
      <div class="circle-el c-wood" id="el-wood" onclick="openElement('wood')"><span class="char">木</span><span
          class="elname">Wood</span></div>
      <div class="circle-el c-water" id="el-water" onclick="openElement('water')"><span class="char">水</span><span
          class="elname">Water</span></div>
      <div class="circle-el c-fire" id="el-fire" onclick="openElement('fire')"><span class="char">火</span><span
          class="elname">Fire</span></div>
      <div class="circle-el c-earth" id="el-earth" onclick="openElement('earth')"><span class="char">土</span><span
          class="elname">Earth</span></div>
      <div class="circle-center" id="circleCenter" onclick="cycleLandingState()">
        <h1 id="centerTitle">五行</h1>
        <div class="subtitle" id="centerSub">Five Elements</div>
      </div>
    </div>
  </div>

  <!-- Metal -->
  <div class="element-page" id="metal-page">
    <button class="home-btn" onclick="goHome()">⌂</button>
    <div class="bg-char">金</div>
    <div class="interaction-area">
      <div class="metal-ring-visual" id="metalRing">
        <div class="metal-shake-icon cue-visible" id="metalCue">
          <svg viewBox="0 0 40 40" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" stroke-linecap="round">
            <rect x="13" y="7" width="14" height="26" rx="3" />
            <line x1="5" y1="13" x2="9" y2="10" />
            <line x1="4" y1="20" x2="9" y2="20" />
            <line x1="5" y1="27" x2="9" y2="30" />
            <line x1="35" y1="13" x2="31" y2="10" />
            <line x1="36" y1="20" x2="31" y2="20" />
            <line x1="35" y1="27" x2="31" y2="30" />
          </svg>
        </div>
      </div>
    </div>
  </div>

  <!-- Wood -->
  <div class="element-page" id="wood-page">
    <button class="home-btn" onclick="goHome()">⌂</button>
    <div class="bg-char">木</div>
    <div class="interaction-area">
      <div class="tree-container" id="treeContainer">
        <!-- Branches SVG drawn by JS -->
        <svg class="tree-branches" id="treeBranches" viewBox="0 0 300 500" preserveAspectRatio="xMidYMid meet"></svg>
        <!-- Leaf container -->
        <div class="tree-leaf-layer" id="treeLeafLayer"></div>
        <!-- Marimba nodes -->
        <button class="tree-node" id="tn0" style="left:22%;top:62%;" data-note="0">C</button>
        <button class="tree-node" id="tn1" style="left:72%;top:57%;" data-note="1">D♭</button>
        <button class="tree-node" id="tn2" style="left:12%;top:38%;" data-note="2">F</button>
        <button class="tree-node" id="tn3" style="left:82%;top:34%;" data-note="3">G</button>
        <button class="tree-node" id="tn4" style="left:32%;top:14%;" data-note="4">A♭</button>
        <button class="tree-node" id="tn5" style="left:68%;top:18%;" data-note="5">WB</button>
        <!-- Root -->
        <div class="tree-root" id="woodRoot">
          <div class="tree-root-cue cue-visible" id="woodCue">
            <svg viewBox="0 0 64 80" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.1"
              stroke-linecap="round">
              <path d="M18 70 C12 62 10 52 10 42 C10 22 18 10 32 8 C46 10 54 22 54 42 C54 52 52 62 46 70"
                stroke="rgba(255,255,255,0.25)" stroke-width="1.5" />
              <path d="M20 60 C24 54 28 52 32 52 C36 52 40 54 44 60" />
              <path d="M18 56 C23 48 27 46 32 46 C37 46 41 48 46 56" />
              <path d="M17 51 C22 43 27 40 32 40 C37 40 42 43 47 51" />
              <path d="M17 46 C22 38 27 35 32 35 C37 35 42 38 47 46" />
              <path d="M24 40 C24 34 27 30 32 30 C37 30 40 34 40 40 C40 44 37 47 32 47 C27 47 24 44 24 40" />
              <path d="M27 39 C27 36 29 33 32 33 C35 33 37 36 37 39 C37 42 35 44 32 44 C29 44 27 42 27 39" />
              <path d="M18 40 C20 30 25 24 32 24 C39 24 44 30 46 40" />
              <path d="M16 36 C19 24 25 18 32 18 C39 18 45 24 48 36" />
              <path d="M15 32 C18 20 24 14 32 14 C40 14 46 20 49 32" />
              <path d="M16 28 C19 18 24 12 32 12 C40 12 45 18 48 28" />
              <path d="M32 68 L32 76" stroke="rgba(255,255,255,0.3)" stroke-width="1.3" />
              <path d="M28 73 L32 77 L36 73" stroke="rgba(255,255,255,0.3)" stroke-width="1.3" fill="none" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Water -->
  <div class="element-page" id="water-page">
    <button class="home-btn" onclick="goHome()">⌂</button>
    <div class="bg-char">水</div>
    <div class="interaction-area">
      <div class="water-tilt-hint" id="waterTiltHint">
        <svg viewBox="0 0 48 48" fill="none" stroke-linecap="round">
          <rect x="16" y="10" width="16" height="26" rx="3" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" />
          <path d="M8 23 L3 23" stroke="rgba(255,255,255,0.45)" stroke-width="1.2" />
          <path d="M6 19.5 L3 23 L6 26.5" stroke="rgba(255,255,255,0.45)" stroke-width="1.2" fill="none" />
          <path d="M40 23 L45 23" stroke="rgba(255,255,255,0.45)" stroke-width="1.2" />
          <path d="M42 19.5 L45 23 L42 26.5" stroke="rgba(255,255,255,0.45)" stroke-width="1.2" fill="none" />
          <path d="M24 5 L24 1" stroke="rgba(255,255,255,0.45)" stroke-width="1.2" />
          <path d="M20.5 3.5 L24 0.5 L27.5 3.5" stroke="rgba(255,255,255,0.45)" stroke-width="1.2" fill="none" />
          <path d="M24 43 L24 47" stroke="rgba(255,255,255,0.45)" stroke-width="1.2" />
          <path d="M20.5 44.5 L24 47.5 L27.5 44.5" stroke="rgba(255,255,255,0.45)" stroke-width="1.2" fill="none" />
        </svg>
      </div>
      <div class="water-stroke-area" id="waterStrokeArea">
        <svg class="water-char-svg" id="waterCharSvg" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
          <path class="water-stroke" id="ws0" d="M100 15 Q100 130 95 185" stroke="rgba(70,130,200,0.25)"
            stroke-width="14" fill="none" stroke-linecap="round" />
          <path class="water-stroke" id="ws1" d="M30 60 Q60 50 75 75" stroke="rgba(70,130,200,0.25)" stroke-width="12"
            fill="none" stroke-linecap="round" />
          <path class="water-stroke" id="ws2" d="M60 110 Q40 145 20 180" stroke="rgba(70,130,200,0.25)"
            stroke-width="13" fill="none" stroke-linecap="round" />
          <path class="water-stroke" id="ws3" d="M140 60 Q135 75 125 90" stroke="rgba(70,130,200,0.25)"
            stroke-width="13" fill="none" stroke-linecap="round" />
          <path class="water-stroke" id="ws4" d="M125 110 Q145 145 170 180" stroke="rgba(70,130,200,0.25)"
            stroke-width="13" fill="none" stroke-linecap="round" />
        </svg>
        <div class="water-bubble" id="waterBubble">
          <div class="water-bubble-inner"></div>
        </div>
      </div>
      <div class="water-tilt-readout" id="waterReadout" style="opacity:0;">
        <div class="tilt-axis"><span class="tilt-label">Tilt</span><span class="tilt-value" id="tiltBeta">0°</span>
        </div>
        <div class="tilt-axis"><span class="tilt-label">Roll</span><span class="tilt-value" id="tiltGamma">0°</span>
        </div>
        <div class="tilt-axis"><span class="tilt-label">Spin</span><span class="tilt-value" id="tiltAlpha">0°</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Fire -->
  <div class="element-page" id="fire-page">
    <button class="home-btn" onclick="goHome()">⌂</button>
    <div class="bg-char">火</div>
    <div class="interaction-area fire-layout">
      <div class="fire-xy-container">
        <div class="xy-pad" id="firePad" style="border-color:rgba(220,60,40,0.25);max-width:180px;max-height:180px;">
          <div class="crosshair" id="fireCrosshair"></div>
          <div class="ghost-cursor fire-ghost" id="fireGhost"></div>
        </div>
      </div>
      <div class="fire-stroke-area" id="fireStrokeArea">
        <svg class="fire-char-svg" id="fireCharSvg" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
          <!-- 火 strokes as dashed outlines for tracing -->
          <path class="fire-stroke" id="fs0" d="M70 80 Q60 95 55 105" stroke="rgba(220,60,40,0.28)" stroke-width="9"
            fill="none" stroke-linecap="round" stroke-dasharray="4 6" />
          <path class="fire-stroke" id="fs1" d="M140 70 Q130 85 120 95" stroke="rgba(220,60,40,0.28)" stroke-width="9"
            fill="none" stroke-linecap="round" stroke-dasharray="4 6" />
          <path class="fire-stroke" id="fs2" d="M100 35 Q100 100 40 170" stroke="rgba(220,60,40,0.28)" stroke-width="10"
            fill="none" stroke-linecap="round" stroke-dasharray="4 6" />
          <path class="fire-stroke" id="fs3" d="M100 90 Q140 135 165 170" stroke="rgba(220,60,40,0.28)"
            stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="4 6" />
        </svg>
        <div class="fire-flame-layer" id="fireFlameLayer"></div>
        <div class="fire-trace-ghost" id="fireTraceGhost"></div>
      </div>
    </div>
  </div>

  <!-- Earth -->
  <div class="element-page" id="earth-page">
    <button class="home-btn" onclick="goHome()">⌂</button>
    <div class="bg-char">土</div>
    <div class="interaction-area">
      <div class="earth-touch-area" id="earthTouch">
        <div class="earth-thumbprint" id="earthCue">
          <svg viewBox="0 0 64 80" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.1"
            stroke-linecap="round">
            <path d="M18 70 C12 62 10 52 10 42 C10 22 18 10 32 8 C46 10 54 22 54 42 C54 52 52 62 46 70"
              stroke="rgba(255,255,255,0.25)" stroke-width="1.5" />
            <path d="M20 60 C24 54 28 52 32 52 C36 52 40 54 44 60" />
            <path d="M18 56 C23 48 27 46 32 46 C37 46 41 48 46 56" />
            <path d="M17 51 C22 43 27 40 32 40 C37 40 42 43 47 51" />
            <path d="M17 46 C22 38 27 35 32 35 C37 35 42 38 47 46" />
            <path d="M24 40 C24 34 27 30 32 30 C37 30 40 34 40 40 C40 44 37 47 32 47 C27 47 24 44 24 40" />
            <path d="M27 39 C27 36 29 33 32 33 C35 33 37 36 37 39 C37 42 35 44 32 44 C29 44 27 42 27 39" />
            <path d="M18 40 C20 30 25 24 32 24 C39 24 44 30 46 40" />
            <path d="M16 36 C19 24 25 18 32 18 C39 18 45 24 48 36" />
            <path d="M15 32 C18 20 24 14 32 14 C40 14 46 20 49 32" />
            <path d="M16 28 C19 18 24 12 32 12 C40 12 45 18 48 28" />
            <path d="M32 68 L32 76" stroke="rgba(255,255,255,0.3)" stroke-width="1.3" />
            <path d="M28 73 L32 77 L36 73" stroke="rgba(255,255,255,0.3)" stroke-width="1.3" fill="none" />
          </svg>
        </div>
      </div>
    </div>
  </div>

  <!-- HARMONY / MANDALA -->
  <div id="harmonyScreen">
    <canvas id="harmonyBgCanvas"></canvas>
    <div class="circle-layout harmony-layout" id="harmonyLayout">
      <div class="circle-ring" style="opacity: 0.2;"></div>
      <canvas class="energy-canvas" id="harmonyCanvas"></canvas>
      <div class="circle-el c-metal harmony-el" data-el="metal"><span class="char">金</span><span
          class="elname">Metal</span></div>
      <div class="circle-el c-wood harmony-el" data-el="wood"><span class="char">木</span><span
          class="elname">Wood</span></div>
      <div class="circle-el c-water harmony-el" data-el="water"><span class="char">水</span><span
          class="elname">Water</span></div>
      <div class="circle-el c-fire harmony-el" data-el="fire"><span class="char">火</span><span
          class="elname">Fire</span></div>
      <div class="circle-el c-earth harmony-el" data-el="earth"><span class="char">土</span><span
          class="elname">Earth</span></div>
      <div class="circle-center" id="harmonyCenter" style="width: 100px; height: 100px; border-radius: 50%;">
        <!-- Empty center core to anchor the tap glows -->
      </div>
    </div>
  </div>

  <!-- AFTERMATH / RUINS -->
  <div id="aftermathScreen">

    <!-- Ash Particles System -->
    <div class="ash-layer ash-layer-1"></div>
    <div class="ash-layer ash-layer-2"></div>
    <div class="ash-layer ash-layer-3"></div>

    <!-- Fullscreen radial flash overlay -->
    <div id="aftermathFlash"></div>

    <!-- Center ember Rebirth SVG -->
    <div id="aftermathEmber">
      <svg viewBox="-50 -50 100 100">
        <!-- Rebirth Mandala/Lotus Pattern -->
        <g class="mandala-petals">
          <path d="M0 -10 Q 20 -40, 0 -45 Q -20 -40, 0 -10 Z" />
          <path d="M0 10 Q 20 40, 0 45 Q -20 40, 0 10 Z" />
          <path d="M10 0 Q 40 -20, 45 0 Q 40 20, 10 0 Z" />
          <path d="M-10 0 Q -40 -20, -45 0 Q -40 20, -10 0 Z" />
          <circle cx="0" cy="0" r="8" fill="rgba(255,200,100,0.8)" />
          <!-- Inner sparks -->
          <circle cx="0" cy="-25" r="2" fill="#fff" />
          <circle cx="0" cy="25" r="2" fill="#fff" />
          <circle cx="25" cy="0" r="2" fill="#fff" />
          <circle cx="-25" cy="0" r="2" fill="#fff" />
        </g>
      </svg>
    </div>

    <!-- Ruined Elements replacing text with chiseled SVGs (approximate kanji structures) -->
    
    <!-- METAL 金 -->
    <div class="ruin-svg-container" data-element="metal" data-color="212,175,55" data-dur="2.5" 
         style="top: 18%; left: 12%; --rot: -12deg; --glow-color: rgba(212,175,55,0.4); --glow-color-solid: rgb(212,175,55);">
      <svg viewBox="0 0 100 100">
        <!-- Base for shadow -->
        <path class="stone-base" d="M50 15 L20 45 L35 45 L35 85 L65 85 L65 45 L80 45 Z" transform="translate(4,4)" />
        <path class="stone-base" d="M30 65 L70 65 M40 75 L60 75 M25 85 L75 85" stroke-width="4" transform="translate(4,4)" />
        <circle cx="40" cy="55" r="4" class="stone-base" transform="translate(4,4)" />
        <circle cx="60" cy="55" r="4" class="stone-base" transform="translate(4,4)" />
        <!-- Face -->
        <path class="stone-face" d="M50 15 L20 45 L35 45 L35 85 L65 85 L65 45 L80 45 Z" />
        <path class="stone-face" d="M30 65 L70 65 M40 75 L60 75 M25 85 L75 85" stroke="#4a4a4a" stroke-width="4" />
        <circle cx="40" cy="55" r="4" class="stone-face" />
        <circle cx="60" cy="55" r="4" class="stone-face" />
        <!-- Highlights -->
        <path class="stone-highlight" d="M50 15 L20 45 L35 45 L50 15 M35 45 L35 85 L38 85 L38 45 Z" />
      </svg>
    </div>

    <!-- WOOD 木 -->
    <div class="ruin-svg-container" data-element="wood" data-color="76,153,76" data-dur="3.5" 
         style="top: 55%; left: 58%; --rot: 18deg; --glow-color: rgba(76,153,76,0.4); --glow-color-solid: rgb(76,153,76);">
      <svg viewBox="0 0 100 100">
        <path class="stone-base" d="M20 40 L80 40 M50 15 L50 90 M50 40 L25 85 M50 40 L75 85" stroke-width="12" stroke-linecap="square" transform="translate(4,4)" />
        <path class="stone-face" d="M20 40 L80 40 M50 15 L50 90 M50 40 L25 85 M50 40 L75 85" stroke="#4a4a4a" stroke-width="12" stroke-linecap="square" />
        <path class="stone-highlight" d="M20 36 L80 36 M46 15 L46 90" stroke="#8a8a8a" stroke-width="4" />
      </svg>
    </div>

    <!-- WATER 水 -->
    <div class="ruin-svg-container" data-element="water" data-color="70,130,200" data-dur="4.0" 
         style="top: 38%; left: 35%; --rot: 4deg; --glow-color: rgba(70,130,200,0.4); --glow-color-solid: rgb(70,130,200);">
      <svg viewBox="0 0 100 100">
        <path class="stone-base" d="M50 10 L45 80 Q50 90 65 85 M25 40 L45 55 M15 75 L35 60 M75 35 L55 55 M85 70 L65 55" stroke-width="10" stroke-linecap="round" fill="none" transform="translate(4,4)" />
        <path class="stone-face" d="M50 10 L45 80 Q50 90 65 85 M25 40 L45 55 M15 75 L35 60 M75 35 L55 55 M85 70 L65 55" stroke="#4a4a4a" stroke-width="10" stroke-linecap="round" fill="none" />
        <path class="stone-highlight" d="M48 10 L43 80 M24 38 L44 53" stroke="#8a8a8a" stroke-width="3" fill="none" />
      </svg>
    </div>

    <!-- FIRE 火 -->
    <div class="ruin-svg-container" data-element="fire" data-color="220,60,40" data-dur="2.0" 
         style="top: 68%; left: 15%; --rot: -25deg; --glow-color: rgba(220,60,40,0.5); --glow-color-solid: rgb(220,60,40);">
      <svg viewBox="0 0 100 100">
        <path class="stone-base" d="M30 45 L50 85 M70 45 L50 85 M20 60 L35 30 M80 60 L65 30" stroke-width="11" stroke-linecap="round" fill="none" transform="translate(4,4)" />
        <path class="stone-face" d="M30 45 L50 85 M70 45 L50 85 M20 60 L35 30 M80 60 L65 30" stroke="#4a4a4a" stroke-width="11" stroke-linecap="round" fill="none" />
        <path class="stone-highlight" d="M28 45 L48 85 M18 60 L33 30" stroke="#8a8a8a" stroke-width="3" fill="none" />
      </svg>
    </div>

    <!-- EARTH 土 -->
    <div class="ruin-svg-container" data-element="earth" data-color="139,94,60" data-dur="5.0" 
         style="top: 22%; left: 55%; --rot: 10deg; --glow-color: rgba(139,94,60,0.4); --glow-color-solid: rgb(139,94,60);">
      <svg viewBox="0 0 100 100">
        <path class="stone-base" d="M30 45 L70 45 M50 15 L50 85 M15 85 L85 85" stroke-width="12" stroke-linecap="square" fill="none" transform="translate(4,4)" />
        <path class="stone-face" d="M30 45 L70 45 M50 15 L50 85 M15 85 L85 85" stroke="#4a4a4a" stroke-width="12" stroke-linecap="square" fill="none" />
        <path class="stone-highlight" d="M30 41 L70 41 M46 15 L46 85 M15 81 L85 81" stroke="#8a8a8a" stroke-width="4" fill="none" />
      </svg>
    </div>
  </div>

  <!-- Nav -->
  <div class="bottom-nav" id="bottomNav" style="display:none;">
    <button class="nav-item metal" onclick="switchElement('metal')"><span>金</span><span
        class="nav-label">Metal</span></button>
    <button class="nav-item wood" onclick="switchElement('wood')"><span>木</span><span
        class="nav-label">Wood</span></button>
    <button class="nav-item water" onclick="switchElement('water')"><span>水</span><span
        class="nav-label">Water</span></button>
    <button class="nav-item fire" onclick="switchElement('fire')"><span>火</span><span
        class="nav-label">Fire</span></button>
    <button class="nav-item earth" onclick="switchElement('earth')"><span>土</span><span
        class="nav-label">Earth</span></button>
  </div>

  <script>
    // ═══════════════════════════════════
    // FIREBASE STATUS CONTROL
    // ═══════════════════════════════════

    // *** REPLACE with your Firebase config ***
    const FIREBASE_CONFIG = {
      databaseURL: 'https://wuxing-fa488-default-rtdb.firebaseio.com'
    };
    firebase.initializeApp(FIREBASE_CONFIG);
    const db = firebase.database();
    let appStatus = 'locked'; // locked | live | ended | live_wood | destroy_water | etc.
    let globalActiveUsers = 1; // Default to 1 to avoid division by zero

    const IS_ADMIN = window.location.search.includes('admin=true');
    let adminTimerInterval = null, adminStatusTime = 0;

    // Setup Admin Panel & Presence
    if (IS_ADMIN) {
      document.getElementById('adminPanel').style.display = 'block';
      // Hide everything else
      document.getElementById('lockedScreen').classList.add('hidden');
      document.getElementById('permissionOverlay').classList.add('hidden');
      db.ref('users').on('value', snap => {
        globalActiveUsers = Math.max(1, snap.numChildren());
        document.getElementById('adminUserCount').textContent = snap.numChildren();
      });
      db.ref('status').on('value', snap => {
        const val = snap.val() || 'unknown';
        document.getElementById('adminCurrentStatus').textContent = val;
        adminStatusTime = Date.now();
        // Highlight active button
        document.querySelectorAll('.admin-btn').forEach(b => b.classList.remove('admin-active'));
        const statusMap = {
          'locked': '🔒 Locked', 'live': '▶ Live', 'live_all': '⊞ All',
          'live_wood': '木 Wood', 'live_fire': '火 Fire', 'live_earth': '土 Earth',
          'live_metal': '金 Metal', 'live_water': '水 Water', 'live_harmony': '✦ Harmony',
          'destroy_wood': '木 Ashes', 'destroy_fire': '火 Inferno', 'destroy_earth': '土 Quake',
          'destroy_metal': '金 Rust', 'destroy_water': '水 Tsunami',
          'live_aftermath': '☠ Aftermath', 'ended': '⏹ END SHOW'
        };
        const label = statusMap[val];
        if (label) {
          document.querySelectorAll('.admin-btn').forEach(b => {
            if (b.textContent.trim() === label.trim()) b.classList.add('admin-active');
          });
        }
      });
      // Elapsed timer
      adminTimerInterval = setInterval(() => {
        if (adminStatusTime) {
          const sec = Math.floor((Date.now() - adminStatusTime) / 1000);
          document.getElementById('adminTimer').textContent = sec + 's';
        }
      }, 500);
    }

    window.setAdminStatus = function (status) {
      db.ref('status').set(status);
    };

    let isPresenceInitialized = false;
    function initPresence() {
      if (isPresenceInitialized || IS_ADMIN) return;
      isPresenceInitialized = true;
      const connectedRef = db.ref('.info/connected');
      const myConnectionsRef = db.ref('users');
      connectedRef.on('value', (snap) => {
        if (snap.val() === true) {
          const con = myConnectionsRef.push();
          con.onDisconnect().remove();
          con.set(true);
        }
      });
      db.ref('users').on('value', snap => {
        globalActiveUsers = Math.max(1, snap.numChildren());
      });
    }

    // ═══════════════════════════════════
    // DESTRUCTION ENGINE
    // ═══════════════════════════════════
    let destructionStartTime = 0, destructionFrame = null, destructionElement = null;
    let destructLeafTimer = null, destructCrackleTimer = null, destructPulseTimer = null;
    const DESTRUCT_DURATION = 30000; // 30s baseline

    function startDestruction(el) {
      // Cancel any existing destruction loop first (prevents double rAF)
      if (destructionFrame) { cancelAnimationFrame(destructionFrame); destructionFrame = null; }
      if (destructLeafTimer) { clearInterval(destructLeafTimer); destructLeafTimer = null; }
      if (destructCrackleTimer) { clearInterval(destructCrackleTimer); destructCrackleTimer = null; }
      if (destructPulseTimer) { clearInterval(destructPulseTimer); destructPulseTimer = null; }

      destructionElement = el;
      destructionStartTime = Date.now();
      document.body.classList.add('destruction-mode');
      destructionTick();

      // Element-specific auto-triggers
      if (el === 'wood') startDestructWoodLeaves();
      if (el === 'fire') startDestructFireCrackles();
      if (el === 'earth') startDestructEarthPulses();
    }

    function stopDestruction() {
      document.body.classList.remove('destruction-mode');
      if (destructionFrame) { cancelAnimationFrame(destructionFrame); destructionFrame = null; }
      if (destructLeafTimer) { clearInterval(destructLeafTimer); destructLeafTimer = null; }
      if (destructCrackleTimer) { clearInterval(destructCrackleTimer); destructCrackleTimer = null; }
      if (destructPulseTimer) { clearInterval(destructPulseTimer); destructPulseTimer = null; }
      destructionElement = null;
      destructionStartTime = 0;
      waterDestructSnap = 1.0;
      // Reset CSS custom properties
      document.documentElement.style.cssText = '';
    }

    function destructionTick() {
      if (!destructionElement) return;
      const elapsed = Date.now() - destructionStartTime;
      const p = Math.min(1, elapsed / DESTRUCT_DURATION); // 0→1 over 30s
      const el = destructionElement;
      const root = document.documentElement;

      // ── Global shake intensity ──
      const shakeAmt = 2 + p * 8;
      const rotAmt = 0.2 + p * 1.2;
      const skewAmt = 0.3 + p * 2;
      root.style.setProperty('--d-tx1', (-shakeAmt) + 'px');
      root.style.setProperty('--d-ty1', (shakeAmt * 0.7) + 'px');
      root.style.setProperty('--d-tx2', (shakeAmt * 1.2) + 'px');
      root.style.setProperty('--d-ty2', (-shakeAmt) + 'px');
      root.style.setProperty('--d-tx3', (-shakeAmt * 0.8) + 'px');
      root.style.setProperty('--d-ty3', (shakeAmt * 1.1) + 'px');
      root.style.setProperty('--d-tx4', (shakeAmt * 0.9) + 'px');
      root.style.setProperty('--d-ty4', (-shakeAmt * 0.6) + 'px');
      root.style.setProperty('--d-rot', rotAmt + 'deg');
      root.style.setProperty('--d-skew', skewAmt + 'deg');

      // ── Per-element degradation ──
      if (el === 'wood') destructTickWood(p);
      else if (el === 'fire') destructTickFire(p);
      else if (el === 'earth') destructTickEarth(p);
      else if (el === 'metal') destructTickMetal(p);
      else if (el === 'water') destructTickWater(p);

      destructionFrame = requestAnimationFrame(destructionTick);
    }

    // ── WOOD DESTRUCTION ──
    function destructTickWood(p) {
      const root = document.documentElement;
      // Green → grey/brown for nodes and branches
      const r = Math.round(76 + p * 100);
      const g = Math.round(153 - p * 100);
      const b = Math.round(76 - p * 40);
      root.style.setProperty('--d-wood-border', `rgba(${r},${g},${b},${0.3 - p * 0.2})`);
      root.style.setProperty('--d-wood-node-bg', `rgba(${r},${g},${b},${p * 0.15})`);
      // Bg-char: shift to white/grey with visible alpha
      const charGrey = Math.round(120 + p * 60);
      root.style.setProperty('--d-wood-char-color', `rgba(${charGrey},${charGrey},${charGrey},${0.12 - p * 0.05})`);
      root.style.setProperty('--d-wood-branch', `rgba(${r},${g},${b},${0.12 - p * 0.08})`);

      // Audio degradation
      if (woodSynth) {
        // Detune flat ~50 cents
        woodSynth.osc1.detune.setTargetAtTime(2 - p * 50, audioCtx.currentTime, 0.3);
        woodSynth.osc2.detune.setTargetAtTime(-2 - p * 50, audioCtx.currentTime, 0.3);
      }
      if (woodLoop) {
        // Filter closing down
        woodLoop.filter.frequency.setTargetAtTime(600 - p * 500, audioCtx.currentTime, 0.3);
      }
      if (woodSynthLfo) {
        // LFO slows to near zero
        woodSynthLfo.frequency.setTargetAtTime(Math.max(0.01, 0.15 - p * 0.14), audioCtx.currentTime, 0.3);
      }
    }

    function startDestructWoodLeaves() {
      // Profuse grey ash leaves falling downward
      destructLeafTimer = setInterval(() => {
        if (!destructionElement || destructionElement !== 'wood') return;
        spawnDestructLeaf();
      }, 120);
    }

    function spawnDestructLeaf() {
      const layer = document.getElementById('treeLeafLayer');
      if (!layer) return;
      const container = document.getElementById('treeContainer');
      if (!container) return;
      const cw = container.clientWidth, ch = container.clientHeight;

      // Random position across full width, start near top
      const startX = Math.random() * cw;
      const startY = -10 - Math.random() * 40;
      const endY = ch + 20;

      const dur = 2.0 + Math.random() * 1.5;
      const rot = Math.random() * 360;
      const rotSpeed = 80 + Math.random() * 200;
      const driftX = (Math.random() - 0.5) * 80;
      const swayAmp = 10 + Math.random() * 20;
      const swayFreq = 1 + Math.random() * 2;
      const size = 0.3 + Math.random() * 0.5;

      // Grey/ash color with variation
      const grey = Math.round(100 + Math.random() * 80);
      const fillOp = 0.3 + Math.random() * 0.4;

      const leaf = document.createElement('div');
      leaf.className = 'tree-leaf';
      leaf.style.left = startX + 'px';
      leaf.style.top = startY + 'px';
      leaf.innerHTML = `<svg viewBox="0 0 20 20" fill="rgba(${grey},${grey},${grey - 20},${fillOp})" stroke="rgba(${grey},${grey},${grey},0.3)" stroke-width="0.5">
    <path d="M10 2 C6 6 3 10 4 14 C5 18 9 19 10 19 C11 19 15 18 16 14 C17 10 14 6 10 2Z"/>
    <path d="M10 5 L10 17" fill="none" stroke="rgba(${grey},${grey},${grey},0.3)" stroke-width="0.6"/>
  </svg>`;

      const startTime = performance.now();

      function animLeaf(now) {
        const t = Math.min((now - startTime) / (dur * 1000), 1);
        const px = startX + driftX * t + swayAmp * Math.sin(t * Math.PI * swayFreq);
        const py = startY + (endY - startY) * t;
        const r = rot + rotSpeed * t;
        const op = t < 0.1 ? t / 0.1 : (t > 0.8 ? Math.max(0, (1 - t) / 0.2) : 1);

        leaf.style.transform = `translate(-50%,-50%) rotate(${r}deg) scale(${size})`;
        leaf.style.left = px + 'px';
        leaf.style.top = py + 'px';
        leaf.style.opacity = op * 0.7;
        if (t < 1) requestAnimationFrame(animLeaf);
        else leaf.remove();
      }
      layer.appendChild(leaf);
      requestAnimationFrame(animLeaf);
    }

    // ── FIRE DESTRUCTION ──
    function destructTickFire(p) {
      const root = document.documentElement;
      // All strokes glow brighter
      const strokeOp = 0.18 + p * 0.7;
      root.style.setProperty('--d-fire-stroke', `rgba(255,${Math.round(120 - p * 80)},${Math.round(40 - p * 30)},${strokeOp})`);
      root.style.setProperty('--d-fire-stroke-op', strokeOp.toFixed(2));
      // Brightness and contrast push
      root.style.setProperty('--d-fire-bright', (1 + p * 0.6).toFixed(2));
      root.style.setProperty('--d-fire-contrast', (1 + p * 0.5).toFixed(2));

      // Audio: filter opens wide, playback rate up, detuning spreads
      if (fireLoop) {
        fireLoop.filter.frequency.setTargetAtTime(400 + p * 5600, audioCtx.currentTime, 0.3);
        fireLoop.source.playbackRate.setTargetAtTime(1 + p * 0.8, audioCtx.currentTime, 0.3);
      }
      if (fireSynth) {
        fireSynth.osc1.detune.setTargetAtTime(4 + p * 40, audioCtx.currentTime, 0.3);
        fireSynth.osc2.detune.setTargetAtTime(-4 - p * 40, audioCtx.currentTime, 0.3);
      }
    }

    function startDestructFireCrackles() {
      destructCrackleTimer = setInterval(() => {
        if (!destructionElement || destructionElement !== 'fire') return;
        if (!audioCtx) return;
        const p = Math.min(1, (Date.now() - destructionStartTime) / DESTRUCT_DURATION);
        // Random crackles: more frequent as p increases
        if (Math.random() < 0.3 + p * 0.5) {
          const t = audioCtx.currentTime;
          const osc = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.value = 1500 + Math.random() * 3000;
          g.gain.setValueAtTime(0.05 + p * 0.1, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.08 + Math.random() * 0.12);
          osc.connect(g); g.connect(audioCtx.destination);
          osc.start(t); osc.stop(t + 0.25);
        }
      }, 200);
    }

    // ── EARTH DESTRUCTION ──
    function destructTickEarth(p) {
      const root = document.documentElement;
      // Extra shake intensity
      root.style.setProperty('--d-earth-shake', (3 + p * 12) + 'px');

      // Audio: drone drops lower, filter opens
      if (earthDrone) {
        earthDrone.osc1.frequency.setTargetAtTime(55 - p * 15, audioCtx.currentTime, 0.3);
        earthDrone.osc2.frequency.setTargetAtTime((55 - p * 15) * 1.002, audioCtx.currentTime, 0.3);
        earthDrone.filter.frequency.setTargetAtTime(400 + p * 2000, audioCtx.currentTime, 0.3);
        // Volume pushes up
        earthDrone.gain.gain.setTargetAtTime(0.12 + p * 0.15, audioCtx.currentTime, 0.3);
      }
      // Continuous vibration
      if (navigator.vibrate && p > 0.1) {
        navigator.vibrate([30, 20]);
      }
    }

    function startDestructEarthPulses() {
      // Auto-trigger visual pulses without touch
      destructPulseTimer = setInterval(() => {
        if (!destructionElement || destructionElement !== 'earth') return;
        const ta = document.getElementById('earthTouch');
        if (ta) {
          ta.style.boxShadow = '0 0 40px rgba(139,94,60,0.6), inset 0 0 25px rgba(139,94,60,0.3)';
          setTimeout(() => { if (ta) ta.style.boxShadow = 'none'; }, 300);
        }
      }, 800);
    }

    // ── METAL DESTRUCTION ──
    function destructTickMetal(p) {
      const root = document.documentElement;
      // Gold → rust: interpolate color
      const r = Math.round(212 - p * 73);  // 212→139
      const g = Math.round(175 - p * 81);  // 175→94
      const b = Math.round(55 - p * 25);   // 55→30
      root.style.setProperty('--d-metal-color', `rgba(${r},${g},${b},0.45)`);
    }

    // Metal bell audio degradation applied per-strike via progress check
    function getMetalDestructionProgress() {
      if (!destructionElement || destructionElement !== 'metal') return 0;
      return Math.min(1, (Date.now() - destructionStartTime) / DESTRUCT_DURATION);
    }

    // ── WATER DESTRUCTION ──
    let waterDestructSnap = 1.0; // 1 = full snap to strokes, 0 = free movement

    function destructTickWater(p) {
      const root = document.documentElement;
      // Bubble grows
      const bubbleSize = 28 + p * 30;
      root.style.setProperty('--d-water-bubble-size', bubbleSize + 'px');
      // Stroke colors shift red
      const sr = Math.round(70 + p * 150);
      const sg = Math.round(130 - p * 80);
      const sb = Math.round(200 - p * 100);
      root.style.setProperty('--d-water-stroke', `rgba(${sr},${sg},${sb},${0.15 + p * 0.15})`);

      // Loosen stroke constraint
      waterDestructSnap = 1 - p * 0.85; // goes from 1.0 → 0.15

      // Audio chaos
      if (waterLoop) {
        waterLoop.source.playbackRate.setTargetAtTime(
          0.5 + Math.random() * p * 2, audioCtx.currentTime, 0.1);
        waterLoop.filter.frequency.setTargetAtTime(
          200 + Math.random() * p * 5000, audioCtx.currentTime, 0.1);
      }
      if (waterLfo) {
        waterLfo.frequency.setTargetAtTime(0.3 + p * 8, audioCtx.currentTime, 0.3);
      }
      if (waterSynth) {
        // Ab2 detunes sharp
        waterSynth.osc1.detune.setTargetAtTime(3 + p * 60, audioCtx.currentTime, 0.3);
        waterSynth.osc2.detune.setTargetAtTime(-3 + p * 60, audioCtx.currentTime, 0.3);
      }
    }

    // ── Hard kill all audio (admin transitions) ──
    function killAllAudio() {
      if (!audioCtx) return;
      const t = audioCtx.currentTime;
      const KILL_FADE = 0.3;
      const KILL_STOP = 400;

      const fadeAndStop = (gainNode, ...stopNodes) => {
        if (!gainNode) return;
        try { gainNode.gain.setValueAtTime(gainNode.gain.value, t); } catch (e) { }
        try { gainNode.gain.linearRampToValueAtTime(0, t + KILL_FADE); } catch (e) { }
        setTimeout(() => {
          stopNodes.forEach(n => { if (n) try { n.stop(); } catch (e) { } });
        }, KILL_STOP);
      };

      // Wood
      if (woodLoop) { fadeAndStop(woodLoop.gain, woodLoop.source); woodLoop = null; }
      if (woodSynth) { fadeAndStop(woodSynth.gain, woodSynth.osc1, woodSynth.osc2); woodSynth = null; }
      if (woodSynthLfo) { try { woodSynthLfo.stop(); } catch (e) { } woodSynthLfo = null; }
      if (woodSynthLfoGain) woodSynthLfoGain = null;

      // Water
      if (waterLoop) { fadeAndStop(waterLoop.gain, waterLoop.source); waterLoop = null; }
      if (waterSynth) { fadeAndStop(waterSynth.gain, waterSynth.osc1, waterSynth.osc2); waterSynth = null; }
      if (waterLfo) { try { waterLfo.stop(); } catch (e) { } waterLfo = null; }
      if (waterLfoGain) waterLfoGain = null;

      // Fire
      if (fireLoop) { fadeAndStop(fireLoop.gain, fireLoop.source); fireLoop = null; }
      if (fireSynth) { fadeAndStop(fireSynth.gain, fireSynth.osc1, fireSynth.osc2); fireSynth = null; }
      if (fireSynthLfo) { try { fireSynthLfo.stop(); } catch (e) { } fireSynthLfo = null; }
      if (fireSynthLfoGain) fireSynthLfoGain = null;

      // Earth
      if (earthDrone) { fadeAndStop(earthDrone.gain, earthDrone.osc1, earthDrone.osc2); earthDrone = null; }
      if (earthBed) { fadeAndStop(earthBed.gain, earthBed.source); earthBed = null; }

      // Aftermath oscillator
      if (window.aftermathOsc) {
        try { window.aftermathGain.gain.setValueAtTime(0, t); window.aftermathOsc.stop(); } catch (e) { }
        window.aftermathOsc = null; window.aftermathGain = null;
      }
    }

    function onStatusChange(status) {
      if (status === appStatus) return;

      // Admin is remote control only — no rendering
      if (IS_ADMIN) { appStatus = status; return; }

      if (appStatus === 'ended' || appStatus === 'live_aftermath') {
        if (status !== 'ended' && status !== 'live_aftermath') {
          window.location.reload();
          return;
        }
      }

      // Clean up previous destruction if switching away
      if (appStatus && appStatus.startsWith('destroy_') && !status.startsWith('destroy_')) {
        stopDestruction();
      }

      appStatus = status;

      if (status === 'locked') {
        stopDestruction();
        document.getElementById('lockedScreen').classList.remove('hidden');
        document.getElementById('endScreen').classList.add('hidden');
        document.getElementById('permissionOverlay').classList.add('hidden');
      } else if (status === 'ended') {
        stopDestruction();
        killAllAudio();
        triggerSoftEnd();
      } else if (status === 'live_aftermath') {
        stopDestruction();
        triggerAftermath();
      } else if (status === 'live_harmony') {
        stopDestruction();
        triggerHarmony();
      } else {
        // Active Narrative States
        document.getElementById('lockedScreen').classList.add('hidden');
        document.getElementById('endScreen').classList.add('hidden');

        if (!audioCtx) {
          document.getElementById('permissionOverlay').classList.remove('hidden');
        } else {
          document.getElementById('permissionOverlay').classList.add('hidden');

          const harm = document.getElementById('harmonyScreen'); if (harm) harm.style.display = 'none';
          cleanupHarmony();
          const aft = document.getElementById('aftermathScreen'); if (aft) { aft.style.display = 'none'; aft.classList.remove('interactive'); }

          if (status === 'live') {
            document.getElementById('landing').style.display = 'flex';
            document.getElementById('bottomNav').style.display = 'none';
            if (currentElement) {
              const old = document.getElementById(currentElement + '-page');
              if (old) old.classList.remove('active');
            }
            currentElement = null;
            initLanding();
            if (landingState !== 'wuxing') {
              setTimeout(() => startEnergyFlow(landingState === 'sheng' ? 1 : -1), 100);
            }
          } else if (status === 'live_all') {
            document.getElementById('landing').style.display = 'none';
            document.getElementById('bottomNav').style.display = 'flex';
            if (!currentElement) switchElement('wood');
          } else if (status.startsWith('live_')) {
            let el = status.replace('live_', '');
            document.getElementById('landing').style.display = 'none';
            document.getElementById('bottomNav').style.display = 'none';
            switchElement(el);
          } else if (status.startsWith('destroy_')) {
            let el = status.replace('destroy_', '');
            document.getElementById('landing').style.display = 'none';
            document.getElementById('bottomNav').style.display = 'none';
            // Switch to the element if not already there
            if (currentElement !== el) switchElement(el);
            // Start destruction engine
            startDestruction(el);
          }
        }
      }
    }

    // Real-time listener
    db.ref('status').on('value', snap => {
      const val = snap.val();
      if (val) onStatusChange(val);
    });

    // Fallback check every 30s
    setInterval(() => {
      db.ref('status').once('value', snap => { if (snap.val()) onStatusChange(snap.val()); });
    }, 30000);

    function triggerHarmony() {
      if (currentElement) { cleanupCurrent(); document.getElementById(currentElement + '-page').classList.remove('active'); currentElement = null; }
      document.getElementById('permissionOverlay').classList.add('hidden');
      document.getElementById('landing').style.display = 'none';
      document.getElementById('bottomNav').style.display = 'none';
      document.getElementById('lockedScreen').classList.add('hidden');
      document.getElementById('endScreen').classList.add('hidden');

      const harm = document.getElementById('harmonyScreen');
      harm.style.display = 'flex';

      const aft = document.getElementById('aftermathScreen');
      if (aft) { aft.style.display = 'none'; aft.classList.remove('interactive'); }

      // Reset Element animation states
      document.querySelectorAll('.harmony-el').forEach((el, index) => {
        el.classList.remove('entered');
        // Add a slight stagger to the entrance
        setTimeout(() => {
          el.classList.add('entered');
        }, 100 + (index * 150));
      });

      // Fade in background canvas
      const bgCanvas = document.getElementById('harmonyBgCanvas');
      if (bgCanvas) {
        bgCanvas.style.opacity = '1';
      }

      initHarmonyFlow();
    }

    // ── Harmony energy flow + tap interaction ──
    let harmonyFlowFrame = null, harmonyBgFrame = null;
    let harmonyParticles = [], harmonyDir = 1, harmonyDirTimer = null;
    let harmonyCenterGlow = 0, harmonyCenterDecay = null;
    let bgTime = 0; // For background gradient animation

    // Low-opacity, deep colors for the background
    const BG_COLORS = [
      { r: 30, g: 25, b: 5 },   // Metal
      { r: 5, g: 20, b: 5 },    // Wood
      { r: 5, g: 15, b: 30 },   // Water
      { r: 30, g: 5, b: 5 },    // Fire
      { r: 20, g: 12, b: 5 }    // Earth
    ];

    const HARMONY_COLORS = {
      metal: 'rgba(212,175,55,0.5)', wood: 'rgba(76,153,76,0.5)',
      water: 'rgba(70,130,200,0.5)', fire: 'rgba(220,60,40,0.5)', earth: 'rgba(139,94,60,0.5)'
    };

    function initHarmonyFlow() {
      const canvas = document.getElementById('harmonyCanvas');
      const bgCanvas = document.getElementById('harmonyBgCanvas');
      if (!canvas || !bgCanvas) return;

      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;

      bgCanvas.width = window.innerWidth;
      bgCanvas.height = window.innerHeight;
      bgTime = 0;

      // Start particles passing each other (half clockwise, half counter-clockwise)
      harmonyParticles = [];
      for (let i = 0; i < 16; i++) {
        harmonyParticles.push({
          angle: (i / 16) * Math.PI * 2,
          speed: 0.005 + Math.random() * 0.003, // Slower for elegance
          direction: i % 2 === 0 ? 1 : -1, // Alternate directions
          size: 1.5 + Math.random() * 1.5
        });
      }
      harmonyDir = 1;

      drawHarmonyBg();
      drawHarmonyFlow();

      // Auto-alternate direction every 8s
      harmonyDirTimer = setInterval(() => {
        harmonyDir *= -1;
      }, 8000);

      // Tap ripples on element buttons
      document.querySelectorAll('.harmony-el').forEach(el => {
        el.addEventListener('touchstart', harmonyTap);
        el.addEventListener('click', harmonyTap);
      });

      // Center glow decay
      harmonyCenterGlow = 0;
      harmonyCenterDecay = setInterval(() => {
        if (harmonyCenterGlow > 0) {
          harmonyCenterGlow = Math.max(0, harmonyCenterGlow - 0.02);
          updateHarmonyCenterGlow();
        }
      }, 50);
    }

    // Low GPU Background Gradient Loop
    function drawHarmonyBg() {
      const canvas = document.getElementById('harmonyBgCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: false }); // alpha: false helps performance

      bgTime += 0.002;

      // Calculate 3 shifting points for a simple, soft mesh gradient
      const w = canvas.width, h = canvas.height;

      // Create a solid black base
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, w, h);

      // Add 3 soft, slow-moving radial gradients (Low GPU cost vs many gradients)
      for (let i = 0; i < 3; i++) {
        const color = BG_COLORS[(Math.floor(bgTime * 10) + i) % BG_COLORS.length];

        const x = w / 2 + Math.sin(bgTime + i * 2) * w * 0.3;
        const y = h / 2 + Math.cos(bgTime * 0.8 + i) * h * 0.3;
        const r = Math.max(w, h) * 0.6;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = grad;
        // Use lighter blend mode to accumulate colors
        ctx.globalCompositeOperation = 'screen';
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over'; // reset
      }

      harmonyBgFrame = requestAnimationFrame(drawHarmonyBg);
    }

    // Generative Lines and Particles Loop
    function drawHarmonyFlow() {
      const canvas = document.getElementById('harmonyCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const cx = canvas.width / 2, cy = canvas.height / 2;
      const r = Math.min(cx, cy) * 0.72;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Generative Network Lines (Pentagram shape: Wood->Fire->Earth->Metal->Water)
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        // The traditional Sheng cycle points (simplified visually to a star/pentagon)
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const nextAngle = (((i + 1) % 5) / 5) * Math.PI * 2 - Math.PI / 2;

        const x1 = cx + r * Math.cos(angle);
        const y1 = cy + r * Math.sin(angle);
        const x2 = cx + r * Math.cos(nextAngle);
        const y2 = cy + r * Math.sin(nextAngle);

        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      for (const p of harmonyParticles) {
        // Individual direction instead of global harmonyDir
        p.angle += p.speed * p.direction;
        const x = cx + r * Math.cos(p.angle), y = cy + r * Math.sin(p.angle);

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,0.6)`;
        ctx.fill();

        // Short, optimized tail
        ctx.beginPath();
        const tailX = cx + r * Math.cos(p.angle - p.speed * p.direction * 10);
        const tailY = cy + r * Math.sin(p.angle - p.speed * p.direction * 10);

        ctx.moveTo(x, y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = p.size;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      harmonyFlowFrame = requestAnimationFrame(drawHarmonyFlow);
    }

    function harmonyTap(e) {
      e.preventDefault();
      const el = e.currentTarget;
      const elName = el.dataset.el;
      const color = HARMONY_COLORS[elName] || 'rgba(255,255,255,0.4)';

      // Create ripple
      const ripple = document.createElement('div');
      ripple.className = 'harmony-ripple';
      ripple.style.background = `radial-gradient(circle, ${color} 0%, transparent 70%)`;
      ripple.style.left = '50%';
      ripple.style.top = '50%';
      el.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);

      // Brighten center
      harmonyCenterGlow = Math.min(1, harmonyCenterGlow + 0.15);
      updateHarmonyCenterGlow();
    }

    function updateHarmonyCenterGlow() {
      const center = document.getElementById('harmonyCenter');
      if (!center) return;
      if (harmonyCenterGlow > 0.05) {
        center.classList.add('glowing');
        center.style.boxShadow = `0 0 ${20 + harmonyCenterGlow * 40}px rgba(255,255,255,${harmonyCenterGlow * 0.25}), 0 0 ${40 + harmonyCenterGlow * 60}px rgba(255,255,255,${harmonyCenterGlow * 0.1})`;
      } else {
        center.classList.remove('glowing');
        center.style.boxShadow = '';
      }
    }

    function cleanupHarmony() {
      if (harmonyBgFrame) { cancelAnimationFrame(harmonyBgFrame); harmonyBgFrame = null; }
      if (harmonyFlowFrame) { cancelAnimationFrame(harmonyFlowFrame); harmonyFlowFrame = null; }
      if (harmonyDirTimer) { clearInterval(harmonyDirTimer); harmonyDirTimer = null; }
      if (harmonyCenterDecay) { clearInterval(harmonyCenterDecay); harmonyCenterDecay = null; }
      document.querySelectorAll('.harmony-el').forEach(el => {
        el.removeEventListener('touchstart', harmonyTap);
        el.removeEventListener('click', harmonyTap);
        el.classList.remove('entered');
      });
      const canvas = document.getElementById('harmonyCanvas');
      if (canvas) { const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); }
      const bgCanvas = document.getElementById('harmonyBgCanvas');
      if (bgCanvas) {
        bgCanvas.style.opacity = '0';
        const ctx = bgCanvas.getContext('2d');
        ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
      }
    }

    function triggerAftermath() {
      if (currentElement) { cleanupCurrent(); document.getElementById(currentElement + '-page').classList.remove('active'); currentElement = null; }
      cleanupHarmony();
      document.getElementById('permissionOverlay').classList.add('hidden');
      document.getElementById('landing').style.display = 'none';
      document.getElementById('bottomNav').style.display = 'none';
      document.getElementById('lockedScreen').classList.add('hidden');
      document.getElementById('endScreen').classList.add('hidden');

      const harm = document.getElementById('harmonyScreen');
      if (harm) harm.style.display = 'none';
      document.body.classList.remove('destruction-mode');

      const aft = document.getElementById('aftermathScreen');
      if (aft) aft.style.display = 'block';

      // Barely audible noise floor to keep audio context alive
      if (audioCtx && !window.aftermathOsc) {
        window.aftermathOsc = audioCtx.createOscillator();
        window.aftermathGain = audioCtx.createGain();
        window.aftermathOsc.type = 'sine';
        window.aftermathOsc.frequency.value = 20;
        window.aftermathGain.gain.value = 0.001;
        window.aftermathOsc.connect(window.aftermathGain);
        window.aftermathGain.connect(audioCtx.destination);
        window.aftermathOsc.start();
      }

      // Initialize interactive aftermath
      initAftermathInteraction();
    }

    // ── AFTERMATH INTERACTION ──
    let aftermathBusy = false;
    let aftermathCleared = 0;

    function initAftermathInteraction() {
      aftermathBusy = false;
      aftermathCleared = 0;
      const aft = document.getElementById('aftermathScreen');
      aft.classList.add('interactive');

      // Reset all ruin-svg-containers to visible and tappable
      const chars = aft.querySelectorAll('.ruin-svg-container');
      chars.forEach(ch => {
        ch.style.display = '';
        ch.style.opacity = '';
        ch.classList.remove('brightening');
        ch.addEventListener('touchstart', aftermathCharTap, { passive: false });
        ch.addEventListener('click', aftermathCharTap);
      });

      // Reset ash layer opacities
      document.querySelectorAll('.ash-layer').forEach(layer => layer.style.opacity = '1');

      // Hide ember
      const ember = document.getElementById('aftermathEmber');
      ember.classList.remove('visible');
      ember.removeEventListener('touchstart', aftermathEmberTap);
      ember.removeEventListener('click', aftermathEmberTap);

      // Reset flash overlay
      const flash = document.getElementById('aftermathFlash');
      flash.style.opacity = '0';
      flash.style.background = 'transparent';
    }

    function aftermathCharTap(e) {
      e.stopPropagation();
      e.preventDefault();
      if (aftermathBusy) return;
      aftermathBusy = true;

      // Haptic feedback if supported
      if (navigator.vibrate) navigator.vibrate(50);

      const charEl = e.currentTarget;
      const color = charEl.dataset.color;
      const dur = parseFloat(charEl.dataset.dur);
      const flash = document.getElementById('aftermathFlash');

      // Get tap coordinates
      let touchX = window.innerWidth / 2;
      let touchY = window.innerHeight / 2;
      if (e.touches && e.touches.length > 0) {
        touchX = e.touches[0].clientX;
        touchY = e.touches[0].clientY;
      } else if (e.clientX && e.clientY) {
        touchX = e.clientX;
        touchY = e.clientY;
      }

      // Progressive ash clearing
      aftermathCleared++;
      const ashOpacity = Math.max(0, 1 - (aftermathCleared * 0.2));
      document.querySelectorAll('.ash-layer').forEach(layer => {
        layer.style.transition = 'opacity 2s ease';
        layer.style.opacity = ashOpacity;
      });

      // Phase 1: Character brightens (Trigger CSS animation classes)
      const brightenTime = dur * 0.12;
      charEl.classList.add('brightening');
      
      // Setup the radial burst on the flash div
      flash.style.transition = 'none';
      flash.style.opacity = '0';
      flash.style.background = `radial-gradient(circle at ${touchX}px ${touchY}px, rgb(${color}) 0%, rgba(${color}, 0.8) 40%, transparent 100%)`;

      // Phase 2: Burst expands
      const fillTime = dur * 0.15;
      setTimeout(() => {
        flash.style.transition = `opacity ${fillTime}s ease-in`;
        flash.style.opacity = '1';
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Heavier burst vibration
      }, brightenTime * 1000);

      // Phase 3: Hold at full color
      const holdTime = dur * 0.2;
      const holdStart = (brightenTime + fillTime) * 1000;

      // Phase 4: Fade back to black, character gone
      const fadeTime = dur * 0.53;
      setTimeout(() => {
        charEl.style.display = 'none';
        flash.style.transition = `opacity ${fadeTime}s ease-out`;
        flash.style.opacity = '0';
      }, holdStart + holdTime * 1000);

      // Cleanup and unlock
      const totalMs = dur * 1000;
      setTimeout(() => {
        charEl.removeEventListener('touchstart', aftermathCharTap);
        charEl.removeEventListener('click', aftermathCharTap);
        flash.style.background = 'transparent';
        aftermathBusy = false;

        // All five cleared: show Ember Rebirth SVG
        if (aftermathCleared >= 5) {
          setTimeout(() => {
            const ember = document.getElementById('aftermathEmber');
            ember.classList.add('visible');
            ember.addEventListener('touchstart', aftermathEmberTap, { passive: false });
            ember.addEventListener('click', aftermathEmberTap);
            if (navigator.vibrate) navigator.vibrate(200); // Rebirth hum
          }, 1500);
        }
      }, totalMs);
    }

    function aftermathEmberTap(e) {
      e.stopPropagation();
      e.preventDefault();
      
      if (navigator.vibrate) navigator.vibrate([50, 50, 100, 50, 200]); // Pulsing hum

      const ember = document.getElementById('aftermathEmber');
      const burst = document.createElement('div');
      burst.className = 'ember-tap-burst';
      ember.appendChild(burst);
      setTimeout(() => burst.remove(), 1200);
    }

    function triggerSoftEnd() {
      // Random fade 3-6 seconds per device
      const fadeDur = 3 + Math.random() * 3;
      const t = audioCtx ? audioCtx.currentTime : 0;
      let actualWaitTime = 0;

      // Fade all active audio
      if (audioCtx && currentElement) {
        actualWaitTime = fadeDur * 1000 + 200;
        const fadeNodes = [];
        if (woodLoop) fadeNodes.push(woodLoop.gain);
        if (woodSynth) fadeNodes.push(woodSynth.gain);
        if (waterLoop) fadeNodes.push(waterLoop.gain);
        if (waterSynth) fadeNodes.push(waterSynth.gain);
        if (fireLoop) fadeNodes.push(fireLoop.gain);
        if (fireSynth) fadeNodes.push(fireSynth.gain);
        if (earthDrone) fadeNodes.push(earthDrone.gain);
        if (earthBed) fadeNodes.push(earthBed.gain);
        fadeNodes.forEach(g => {
          g.gain.setValueAtTime(g.gain.value, t);
          g.gain.linearRampToValueAtTime(0, t + fadeDur);
        });
      }

      // Show end screen after fade completes (or instantly if no audio)
      setTimeout(() => {
        if (currentElement) cleanupCurrent();
        document.querySelectorAll('.element-page').forEach(p => p.classList.remove('active'));
        document.getElementById('landing').style.display = 'none';
        document.getElementById('bottomNav').style.display = 'none';

        const harm = document.getElementById('harmonyScreen');
        if (harm) harm.style.display = 'none';
        cleanupHarmony();
        const aft = document.getElementById('aftermathScreen');
        if (aft) { aft.style.display = 'none'; aft.classList.remove('interactive'); }
        document.body.classList.remove('destruction-mode');

        document.getElementById('permissionOverlay').classList.add('hidden');
        document.getElementById('lockedScreen').classList.add('hidden');
        document.getElementById('endScreen').classList.remove('hidden');
        currentElement = null;
      }, actualWaitTime);
    }

    // ═══════════════════════════════════
    // WAKE FROM SLEEP
    // ═══════════════════════════════════
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Resume audio context
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        // Re-check Firebase status
        db.ref('status').once('value', snap => { if (snap.val()) onStatusChange(snap.val()); });
        // Re-initialize current element if still live
        if (appStatus === 'live' && currentElement) {
          const el = currentElement;
          cleanupCurrent();
          currentElement = null;
          switchElement(el);
        }
      }
    });

    // ═══════════════════════════════════
    // AUDIO LOADING
    // ═══════════════════════════════════
    let audioCtx = null, currentElement = null;
    const audioBuffers = {};
    const AUDIO_FILES = {
      'water_long': 'audio/Water_Long.mp3',
      'wood_long': 'audio/Wood_Long.mp3',
      'fire_long': 'audio/Fire_Long.mp3',
      'earth_long': 'audio/Earth_Long.mp3',
      'C2': 'audio/C2_Marimba_Hard.mp3', 'C3': 'audio/C3_Marimba_Hard.mp3',
      'C4': 'audio/C4_Marimba_Hard.mp3', 'C5': 'audio/C5_Marimba_Hard.mp3', 'C6': 'audio/C6_Marimba_Hard.mp3',
      'Db2': 'audio/Db2_Marimba_Hard.mp3', 'Db3': 'audio/Db3_Marimba_Hard.mp3',
      'Db4': 'audio/Db4_Marimba_Hard.mp3', 'Db5': 'audio/Db5_Marimba_Hard.mp3',
      'F2': 'audio/F2_Marimba_Hard.mp3', 'F3': 'audio/F3_Marimba_Hard.mp3',
      'F4': 'audio/F4_Marimba_Hard.mp3', 'F5': 'audio/F5_Marimba_Hard.mp3',
      'G2': 'audio/G2_Marimba_Hard.mp3', 'G3': 'audio/G3_Marimba_Hard.mp3',
      'G4': 'audio/G4_Marimba_Hard.mp3', 'G5': 'audio/G5_Marimba_Hard.mp3',
      'Ab2': 'audio/Ab2_Marimba_Hard.mp3', 'Ab3': 'audio/Ab3_Marimba_Hard.mp3',
      'Ab4': 'audio/Ab4_Marimba_Hard.mp3', 'Ab5': 'audio/Ab5_Marimba_Hard.mp3',
      'Wb1': 'audio/Wb1.mp3', 'Wb2': 'audio/Wb2.mp3', 'Wb3': 'audio/Wb3.mp3', 'Wb4': 'audio/Wb4.mp3'
    };

    async function loadAllAudio() {
      if (!audioCtx) return;
      const promises = Object.entries(AUDIO_FILES).map(async ([k, url]) => {
        try {
          const r = await fetch(url);
          const ab = await r.arrayBuffer();
          audioBuffers[k] = await audioCtx.decodeAudioData(ab);
        } catch (e) { console.warn('Failed to load ' + url, e); }
      });
      await Promise.all(promises);
    }

    function initAudio() {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    function playBuffer(key, loop, gain) {
      const buf = audioBuffers[key]; if (!buf) return null;
      const src = audioCtx.createBufferSource();
      const g = audioCtx.createGain();
      src.buffer = buf; src.loop = !!loop;
      g.gain.value = gain || 1;
      src.connect(g); g.connect(audioCtx.destination);
      src.start();
      return { source: src, gain: g };
    }

    function playBufferWithChain(key, loop) {
      const buf = audioBuffers[key]; if (!buf) return null;
      const src = audioCtx.createBufferSource();
      const g = audioCtx.createGain();
      const fl = audioCtx.createBiquadFilter();
      fl.type = 'lowpass'; fl.frequency.value = 800; fl.Q.value = 2;
      g.gain.value = 0;
      src.buffer = buf; src.loop = !!loop;
      src.connect(fl); fl.connect(g); g.connect(audioCtx.destination);
      src.start();
      return { source: src, gain: g, filter: fl };
    }

    document.getElementById('startBtn').addEventListener('click', async () => {
      const s = document.getElementById('permStatus'); s.textContent = 'Loading…';
      initAudio();
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') { try { await DeviceMotionEvent.requestPermission(); } catch (e) { } }
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') { try { await DeviceOrientationEvent.requestPermission(); } catch (e) { } }
      if (navigator.vibrate) navigator.vibrate(1);
      if ('wakeLock' in navigator) { try { await navigator.wakeLock.request('screen'); } catch (e) { } }
      await loadAllAudio();

      initPresence(); // Track user connection for hive scaling

      document.getElementById('permissionOverlay').classList.add('hidden');

      // Trigger routing based on whatever the current status is
      let currentTrigger = appStatus;
      appStatus = null;
      onStatusChange(currentTrigger);
    });

    function hideCue(id) { const c = document.getElementById(id); if (c) { c.classList.remove('cue-visible'); c.classList.add('cue-hidden'); } }
    function showCue(id) { const c = document.getElementById(id); if (c) { c.classList.remove('cue-hidden'); c.classList.add('cue-visible'); } }

    // ═══════════════════════════════════
    // LANDING
    // ═══════════════════════════════════
    const PPOS = [{ top: 7.5, left: 50 }, { top: 34.5, left: 90 }, { top: 84, left: 74 }, { top: 84, left: 26 }, { top: 34.5, left: 10 }];
    const EL_IDS = ['el-metal', 'el-wood', 'el-water', 'el-fire', 'el-earth'];
    const STATE_MAP = {
      wuxing: [0, 1, 2, 3, 4],
      sheng: [0, 2, 1, 3, 4],
      ke: [0, 4, 2, 1, 3]
    };
    const STATE_LABELS = {
      wuxing: { title: '五行', sub: 'Five Elements' },
      sheng: { title: '生', sub: 'Creation' },
      ke: { title: '克', sub: 'Destruction' }
    };
    const STATE_ORDER = ['wuxing', 'sheng', 'ke'];
    let landingState = 'wuxing', energyAnimFrame = null, energyParticles = [], energyDirection = 0;

    function initLanding() {
      const layout = document.getElementById('circleLayout');
      const canvas = document.getElementById('energyCanvas');
      const sz = layout.clientWidth;
      canvas.width = sz * 2; canvas.height = sz * 2;
      canvas.style.width = sz + 'px'; canvas.style.height = sz + 'px';
      setElementPositions('wuxing');
    }
    function setElementPositions(state) {
      const map = STATE_MAP[state];
      for (let i = 0; i < 5; i++) {
        const el = document.getElementById(EL_IDS[i]);
        const p = PPOS[map[i]];
        el.style.top = p.top + '%'; el.style.left = p.left + '%';
      }
    }
    function cycleLandingState() {
      stopEnergyFlow();
      const next = STATE_ORDER[(STATE_ORDER.indexOf(landingState) + 1) % 3];
      landingState = next;
      document.getElementById('centerTitle').textContent = STATE_LABELS[next].title;
      document.getElementById('centerSub').textContent = STATE_LABELS[next].sub;
      setElementPositions(next);
      if (next !== 'wuxing') setTimeout(() => startEnergyFlow(next === 'sheng' ? 1 : -1), 750);
    }
    function startEnergyFlow(dir) {
      energyDirection = dir; energyParticles = [];
      for (let i = 0; i < 6; i++)energyParticles.push({ angle: (i / 6) * Math.PI * 2, speed: 0.012 + Math.random() * 0.004, size: 2 + Math.random() * 1.5 });
      drawEnergy();
    }
    function stopEnergyFlow() {
      if (energyAnimFrame) { cancelAnimationFrame(energyAnimFrame); energyAnimFrame = null; }
      const canvas = document.getElementById('energyCanvas');
      if (canvas) { canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height); }
    }
    function drawEnergy() {
      const canvas = document.getElementById('energyCanvas');
      const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2, r = w * 0.425;
      ctx.clearRect(0, 0, w, h);
      for (const p of energyParticles) {
        p.angle += p.speed * energyDirection;
        const x = cx + r * Math.sin(p.angle), y = cy - r * Math.cos(p.angle);
        const g = ctx.createRadialGradient(x, y, 0, x, y, 16);
        g.addColorStop(0, 'rgba(255,255,255,0.4)'); g.addColorStop(0.4, 'rgba(255,255,255,0.1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(x, y, p.size, 0, Math.PI * 2); ctx.fill();
        for (let t = 1; t <= 3; t++) {
          const ta = p.angle - p.speed * energyDirection * t * 3, tx = cx + r * Math.sin(ta), ty = cy - r * Math.cos(ta);
          ctx.fillStyle = `rgba(255,255,255,${0.2 - t * 0.06})`; ctx.beginPath(); ctx.arc(tx, ty, p.size * 0.7, 0, Math.PI * 2); ctx.fill();
        }
      }
      energyAnimFrame = requestAnimationFrame(drawEnergy);
    }

    // ═══════════════════════════════════
    // NAV
    // ═══════════════════════════════════
    function openElement(n) { initAudio(); stopEnergyFlow(); document.getElementById('landing').style.display = 'none'; document.getElementById('bottomNav').style.display = 'flex'; switchElement(n); }
    function switchElement(n) {
      if (appStatus === 'live_harmony' || appStatus === 'live_aftermath') return;
      if (currentElement === n) return;
      if (currentElement) {
        document.getElementById(currentElement + '-page').classList.remove('active');
        cleanupCurrent();
      }
      document.querySelectorAll('.element-page').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      document.querySelector(`.nav-item.${n}`).classList.add('active');
      document.getElementById(n + '-page').classList.add('active');
      currentElement = n; initAudio();
      ({ metal: initMetal, wood: initWood, water: initWater, fire: initFire, earth: initEarth })[n]();
    }
    function goHome() {
      cleanupCurrent();
      document.querySelectorAll('.element-page').forEach(p => p.classList.remove('active'));
      document.getElementById('bottomNav').style.display = 'none';
      document.getElementById('landing').style.display = 'flex';
      currentElement = null; initLanding();
      if (landingState !== 'wuxing') setTimeout(() => startEnergyFlow(landingState === 'sheng' ? 1 : -1), 100);
    }
    function cleanupCurrent() { ({ metal: cleanupMetal, wood: cleanupWood, water: cleanupWater, fire: cleanupFire, earth: cleanupEarth })[currentElement](); }

    // ═══════════════════════════════════
    // METAL — synth, 1s idle
    // ═══════════════════════════════════
    let metalHandler = null, metalLastShake = 0, metalIdleTimer = null, metalActiveNodes = 0;
    const METAL_NODE_CAP = 12;
    function initMetal() {
      showCue('metalCue');
      metalHandler = e => {
        const a = e.accelerationIncludingGravity || e.acceleration; if (!a) return;
        const m = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z), now = Date.now();
        if (m > 18 && now - metalLastShake > 120) {
          metalLastShake = now; hideCue('metalCue'); triggerMetalRing(Math.min(m / 40, 1));
          clearTimeout(metalIdleTimer); metalIdleTimer = setTimeout(() => showCue('metalCue'), 1000);
        }
      };
      window.addEventListener('devicemotion', metalHandler);
      document.getElementById('metalRing').addEventListener('touchstart', metalTap);
    }
    function metalTap() { hideCue('metalCue'); triggerMetalRing(0.7); clearTimeout(metalIdleTimer); metalIdleTimer = setTimeout(() => showCue('metalCue'), 1000); }
    function triggerMetalRing(v) {
      if (metalActiveNodes >= METAL_NODE_CAP) return; // prevent node accumulation
      metalActiveNodes++;
      const r = document.getElementById('metalRing'); r.classList.add('shaking'); setTimeout(() => r.classList.remove('shaking'), 200);

      // Emit sparks
      for (let i = 0; i < 6; i++) {
        const spark = document.createElement('div');
        spark.className = 'metal-spark';
        const angle = Math.random() * Math.PI * 2;
        const startRad = 70;
        const endRad = startRad + 30 + Math.random() * 40;
        spark.style.setProperty('--sx', `${Math.cos(angle) * startRad}px`);
        spark.style.setProperty('--sy', `${Math.sin(angle) * startRad}px`);
        spark.style.setProperty('--ex', `${Math.cos(angle) * endRad}px`);
        spark.style.setProperty('--ey', `${Math.sin(angle) * endRad}px`);
        spark.style.setProperty('--rot', `${angle + Math.PI / 2}rad`);
        r.appendChild(spark);
        setTimeout(() => spark.remove(), 500);
      }

      const dp = getMetalDestructionProgress();
      const t = audioCtx.currentTime;
      const f = 800 + Math.random() * 600;

      // Bell strike
      const bellVol = v * 0.25 * (1 - dp * 0.7);
      const bellDecay = 1.5 + dp * 3;
      const bellFilterFreq = f * (1 - dp * 0.5);

      const m = audioCtx.createOscillator(), mg = audioCtx.createGain();
      const c = audioCtx.createOscillator(), e = audioCtx.createGain();
      const bf = audioCtx.createBiquadFilter();
      bf.type = 'lowpass'; bf.frequency.value = 6000 - dp * 4000; bf.Q.value = 1;

      m.frequency.value = bellFilterFreq * 1.4;
      mg.gain.value = f * 2 * (1 - dp * 0.6);
      c.frequency.value = bellFilterFreq;
      m.connect(mg); mg.connect(c.frequency);
      c.connect(bf); bf.connect(e); e.connect(audioCtx.destination);
      e.gain.setValueAtTime(bellVol, t);
      e.gain.exponentialRampToValueAtTime(0.001, t + bellDecay);
      m.start(t); c.start(t); m.stop(t + bellDecay + 0.1); c.stop(t + bellDecay + 0.1);

      // E4 resonance
      const eTone = audioCtx.createOscillator();
      const eGain = audioCtx.createGain();
      eTone.type = 'sine';
      eTone.frequency.value = 329.6 - dp * 36.6;
      eTone.connect(eGain);
      eGain.connect(audioCtx.destination);
      eGain.gain.setValueAtTime(0, t);
      eGain.gain.setValueAtTime(0, t + 0.4);
      eGain.gain.linearRampToValueAtTime(v * 0.025, t + 1.0);
      eGain.gain.linearRampToValueAtTime(0, t + 3.0);
      eTone.start(t);
      eTone.stop(t + 3.1);

      // Decrement when longest node finishes
      setTimeout(() => { metalActiveNodes = Math.max(0, metalActiveNodes - 1); }, (bellDecay + 0.2) * 1000);
    }
    function cleanupMetal() {
      if (metalHandler) window.removeEventListener('devicemotion', metalHandler);
      document.getElementById('metalRing').removeEventListener('touchstart', metalTap);
      clearTimeout(metalIdleTimer); metalHandler = null; metalActiveNodes = 0;
    }

    // ═══════════════════════════════════
    // WOOD — Tree of life
    // ═══════════════════════════════════
    let woodLoop = null, woodSynth = null, woodSynthLfo = null, woodSynthLfoGain = null, woodPadActive = false, woodLeafInterval = null, woodBreathPhase = 0, woodBreathFrame = null, woodHoldStart = 0, woodGlowInterval = null, woodGlowDeck = [], woodGlowStopped = false;
    let leafTargetDeck = [], leafTargetIdx = 0;

    // Round robin config
    const WOOD_NODES = [
      { keys: ['C2', 'C3', 'C4', 'C5', 'C6'], def: 'C3', defCount: 2 },
      { keys: ['Db2', 'Db3', 'Db4', 'Db5'], def: 'Db3', defCount: 2 },
      { keys: ['F2', 'F3', 'F4', 'F5'], def: 'F3', defCount: 2 },
      { keys: ['G2', 'G3', 'G4', 'G5'], def: 'G3', defCount: 2 },
      { keys: ['Ab2', 'Ab3', 'Ab4', 'Ab5'], def: 'Ab3', defCount: 2 },
      { keys: ['Wb1', 'Wb2', 'Wb3', 'Wb4'], def: 'Wb3', defCount: 1 }
    ];
    let woodTapCounts = [0, 0, 0, 0, 0, 0];

    // Node positions (% of container) for branch drawing
    const TREE_NODES = [
      { x: 22, y: 62 }, { x: 72, y: 57 }, { x: 12, y: 38 }, { x: 82, y: 34 }, { x: 32, y: 14 }, { x: 68, y: 18 }
    ];
    const TREE_ROOT = { x: 50, y: 94 };
    const TREE_TRUNK_TOP = { x: 50, y: 52 };

    // Branch control points (stored after drawing for leaf paths)
    let branchPaths = [];

    function shuffleArray(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
      return a;
    }

    function nextGlowIndex() {
      if (woodGlowDeck.length === 0) woodGlowDeck = shuffleArray([0, 1, 2, 3, 4, 5]);
      return woodGlowDeck.shift();
    }

    function nextLeafTarget() {
      if (leafTargetIdx >= leafTargetDeck.length) { leafTargetDeck = shuffleArray([0, 1, 2, 3, 4, 5]); leafTargetIdx = 0; }
      return leafTargetDeck[leafTargetIdx++];
    }

    function initWood() {
      woodTapCounts = [0, 0, 0, 0, 0, 0];
      woodGlowStopped = false;
      leafTargetDeck = shuffleArray([0, 1, 2, 3, 4, 5]); leafTargetIdx = 0;
      showCue('woodCue');
      drawBranches();

      // MP3 loop through filter
      woodLoop = playBufferWithChain('wood_long', true);
      if (woodLoop) { woodLoop.filter.frequency.value = 600; woodLoop.gain.gain.value = 0; }

      // Sine synth bed with slow LFO (pulsing ember)
      woodSynth = createDrone(65.4, 'sine', 2);
      woodSynth.filter.frequency.value = 600; woodSynth.gain.gain.value = 0;
      woodSynthLfo = audioCtx.createOscillator();
      woodSynthLfoGain = audioCtx.createGain();
      woodSynthLfo.type = 'sine'; woodSynthLfo.frequency.value = 0.15;
      woodSynthLfoGain.gain.value = 0.03;
      woodSynthLfo.connect(woodSynthLfoGain);
      woodSynthLfoGain.connect(woodSynth.gain.gain);
      woodSynthLfo.start();

      const root = document.getElementById('woodRoot');
      root.addEventListener('touchstart', woodTS);
      root.addEventListener('touchend', woodTE);
      root.addEventListener('touchcancel', woodTE);

      // Marimba nodes
      const nodes = document.querySelectorAll('#wood-page .tree-node');
      nodes.forEach((n, i) => {
        n.addEventListener('touchstart', e => {
          e.preventDefault();
          // Stop glow permanently on first tap
          if (!woodGlowStopped) {
            woodGlowStopped = true;
            if (woodGlowInterval) { clearInterval(woodGlowInterval); woodGlowInterval = null; }
            nodes.forEach(nn => nn.classList.remove('invite-glow'));
          }
          triggerWoodSample(i);

          // Visual bloom effect on hit
          n.classList.add('actively-playing');
          // Reset after frame to let transition handle the long fade
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              n.classList.remove('actively-playing');
            });
          });
        });
      });

      // Start shuffled glow cycling
      woodGlowDeck = [];
      let currentGlow = -1;
      woodGlowInterval = setInterval(() => {
        if (woodGlowStopped) return;
        nodes.forEach(nn => nn.classList.remove('invite-glow'));
        currentGlow = nextGlowIndex();
        nodes[currentGlow].classList.add('invite-glow');
      }, 600);
    }

    function drawBranches() {
      const svg = document.getElementById('treeBranches');
      const vw = 300, vh = 500;
      const rx = TREE_ROOT.x / 100 * vw, ry = TREE_ROOT.y / 100 * vh;
      const ttx = TREE_TRUNK_TOP.x / 100 * vw, tty = TREE_TRUNK_TOP.y / 100 * vh;
      let paths = '';
      branchPaths = [];

      // Trunk
      paths += `<path d="M${rx} ${ry} Q${rx} ${ry - 40} ${ttx} ${tty}" stroke="rgba(76,153,76,0.25)" stroke-width="1.5" fill="none"/>`;

      // Branches to each node
      TREE_NODES.forEach((n, i) => {
        const nx = n.x / 100 * vw, ny = n.y / 100 * vh;
        const cpx = (ttx + nx) / 2 + (((i % 3) - 1) * 15);
        const cpy = Math.min(tty, ny) + (Math.abs(tty - ny) * 0.3);
        paths += `<path d="M${ttx} ${tty} Q${cpx} ${cpy} ${nx} ${ny}" stroke="rgba(76,153,76,0.25)" stroke-width="1.2" fill="none"/>`;
        // Store control points for leaf path sampling
        branchPaths.push({ sx: ttx, sy: tty, cpx, cpy, ex: nx, ey: ny });
      });
      svg.innerHTML = paths;
    }

    // Quadratic bezier point at parameter t
    function bezierPt(sx, sy, cpx, cpy, ex, ey, t) {
      const u = 1 - t;
      return {
        x: u * u * sx + 2 * u * t * cpx + t * t * ex,
        y: u * u * sy + 2 * u * t * cpx + t * t * ey,
      };
    }

    function woodTS(e) {
      e.preventDefault();
      woodPadActive = true; woodHoldStart = Date.now();
      hideCue('woodCue');
      const root = document.getElementById('woodRoot');
      root.classList.add('active');

      if (woodLoop) {
        woodLoop.gain.gain.setValueAtTime(woodLoop.gain.gain.value, audioCtx.currentTime);
        woodLoop.gain.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + 0.8);
      }
      if (woodSynth) {
        woodSynth.gain.gain.setValueAtTime(0, audioCtx.currentTime);
        woodSynth.gain.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 1.5);
      }
      // Speed up LFO on press
      if (woodSynthLfo) woodSynthLfo.frequency.linearRampToValueAtTime(0.35, audioCtx.currentTime + 2.0);

      leafTargetDeck = shuffleArray([0, 1, 2, 3, 4, 5]); leafTargetIdx = 0;
      woodLeafTick();
      woodBreathPhase = 0;
      woodBreathLoop();
    }

    function woodLeafTick() {
      if (!woodPadActive) return;
      const elapsed = Date.now() - woodHoldStart;
      const progress = Math.min(elapsed / 10000, 1);
      // Base interval 300→80ms + random jitter ±40ms
      const baseInterval = 300 - progress * 220;
      const jitter = (Math.random() - 0.5) * 80;
      const interval = Math.max(60, baseInterval + jitter);
      spawnTreeLeaf();
      woodLeafInterval = setTimeout(woodLeafTick, interval);
    }

    function woodTE() {
      woodPadActive = false;
      const root = document.getElementById('woodRoot');
      root.classList.remove('active');
      showCue('woodCue');
      if (woodLoop) {
        woodLoop.gain.gain.setValueAtTime(woodLoop.gain.gain.value, audioCtx.currentTime);
        woodLoop.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.8);
      }
      if (woodSynth) {
        woodSynth.gain.gain.setValueAtTime(woodSynth.gain.gain.value, audioCtx.currentTime);
        woodSynth.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.8);
      }
      // Fade LFO modulation to prevent pop
      if (woodSynthLfoGain) woodSynthLfoGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.2);
      // Slow LFO back down and restore LFO depth after fade
      if (woodSynthLfo) woodSynthLfo.frequency.linearRampToValueAtTime(0.15, audioCtx.currentTime + 1.0);
      setTimeout(() => { if (woodSynthLfoGain) woodSynthLfoGain.gain.value = 0.03; }, 1200);
      if (woodLeafInterval) { clearTimeout(woodLeafInterval); woodLeafInterval = null; }
      if (woodBreathFrame) { cancelAnimationFrame(woodBreathFrame); woodBreathFrame = null; }
    }

    function woodBreathLoop() {
      if (!woodPadActive || !woodLoop) return;
      woodBreathPhase += 0.008;
      const freq = 1400 + 1100 * Math.sin(woodBreathPhase);
      woodLoop.filter.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.1);
      if (woodSynth) woodSynth.filter.frequency.setTargetAtTime(freq * 0.5, audioCtx.currentTime, 0.1);
      woodBreathFrame = requestAnimationFrame(woodBreathLoop);
    }

    function spawnTreeLeaf() {
      const layer = document.getElementById('treeLeafLayer');
      const container = document.getElementById('treeContainer');
      if (!container || !layer || branchPaths.length === 0) return;
      const cw = container.clientWidth, ch = container.clientHeight;
      const scX = cw / 300, scY = ch / 500;

      // Balanced target via shuffled deck
      const targetIdx = nextLeafTarget();
      const branch = branchPaths[targetIdx];

      // Trunk path: root to trunk top (quadratic bezier)
      const trunkSx = TREE_ROOT.x / 100 * cw, trunkSy = TREE_ROOT.y / 100 * ch;
      const trunkCpx = trunkSx, trunkCpy = trunkSy - 40 * scY;
      const trunkEx = TREE_TRUNK_TOP.x / 100 * cw, trunkEy = TREE_TRUNK_TOP.y / 100 * ch;

      // Branch path (scaled to container)
      const bsx = branch.sx * scX, bsy = branch.sy * scY;
      const bcpx = branch.cpx * scX, bcpy = branch.cpy * scY;
      const bex = branch.ex * scX, bey = branch.ey * scY;

      // Spawn from root rim
      const angle = Math.random() * Math.PI * 2;
      const rootR = 35;
      const spawnX = trunkSx + Math.cos(angle) * rootR;
      const spawnY = trunkSy + Math.sin(angle) * rootR;

      // Randomized parameters
      const dur = 2.5 + Math.random() * 1.8;
      const rot = Math.random() * 360;
      const rotSpeed = 100 + Math.random() * 200;
      const swayAmp = 8 + Math.random() * 16;
      const swayFreq = 1.5 + Math.random() * 2;
      const fillOp = 0.4 + Math.random() * 0.4;

      const leaf = document.createElement('div');
      leaf.className = 'tree-leaf';
      leaf.style.left = spawnX + 'px'; leaf.style.top = spawnY + 'px';
      leaf.innerHTML = `<svg viewBox="0 0 20 20" fill="rgba(76,153,76,${fillOp})" stroke="rgba(76,153,76,0.4)" stroke-width="0.5">
    <path d="M10 2 C6 6 3 10 4 14 C5 18 9 19 10 19 C11 19 15 18 16 14 C17 10 14 6 10 2Z"/>
    <path d="M10 5 L10 17" fill="none" stroke="rgba(76,153,76,0.4)" stroke-width="0.6"/>
  </svg>`;

      const startTime = performance.now();
      // Trunk takes first 40% of journey, branch takes 60%
      const trunkFrac = 0.4;

      function animLeaf(now) {
        const t = Math.min((now - startTime) / (dur * 1000), 1);
        let px, py;

        if (t < 0.05) {
          // Quick move from spawn to trunk start
          const st = t / 0.05;
          px = spawnX + (trunkSx - spawnX) * st;
          py = spawnY + (trunkSy - spawnY) * st;
        } else if (t < trunkFrac) {
          // Follow trunk
          const tt = (t - 0.05) / (trunkFrac - 0.05);
          const ease = tt * tt * (3 - 2 * tt); // smoothstep
          const pt = bezierPt(trunkSx, trunkSy, trunkCpx, trunkCpy, trunkEx, trunkEy, ease);
          px = pt.x; py = pt.y;
        } else {
          // Follow branch
          const bt = (t - trunkFrac) / (1 - trunkFrac);
          const ease = bt * bt * (3 - 2 * bt);
          const pt = bezierPt(bsx, bsy, bcpx, bcpy, bex, bey, ease);
          px = pt.x; py = pt.y;
        }

        // Add sway perpendicular to path
        px += swayAmp * Math.sin(t * Math.PI * swayFreq);

        const r = rot + rotSpeed * t;
        const op = t < 0.1 ? t / 0.1 : (t > 0.75 ? Math.max(0, (1 - t) / 0.25) : 1);
        const sc = 0.5 + 0.5 * (1 - t * 0.4);

        leaf.style.transform = `translate(-50%,-50%) rotate(${r}deg) scale(${sc})`;
        leaf.style.left = px + 'px'; leaf.style.top = py + 'px';
        leaf.style.opacity = op * 0.7;
        if (t < 1) requestAnimationFrame(animLeaf);
        else leaf.remove();
      }
      layer.appendChild(leaf);
      requestAnimationFrame(animLeaf);
    }

    function triggerWoodSample(nId) {
      if (!audioCtx) return;

      const conf = WOOD_NODES[nId];
      const count = woodTapCounts[nId];
      let key;
      if (count < conf.defCount) {
        key = conf.def;
      } else {
        key = conf.keys[Math.floor(Math.random() * conf.keys.length)];
      }
      woodTapCounts[nId]++;

      // Destruction: slower, quieter, muffled
      if (destructionElement === 'wood' && destructionStartTime) {
        const dp = Math.min(1, (Date.now() - destructionStartTime) / DESTRUCT_DURATION);
        const result = playBuffer(key, false, 0.5 * (1 - dp * 0.6));
        if (result) {
          result.source.playbackRate.value = 1 - dp * 0.3; // slows down
        }
      } else {
        playBuffer(key, false, 0.5);
      }
    }

    function cleanupWood() {
      woodPadActive = false;
      const fadeDur = appStatus.startsWith('destroy_') ? 0.5 : 1.5;
      const fadeTimeout = fadeDur * 1000 + 300;
      if (woodLoop) {
        const ref = woodLoop; woodLoop = null;
        ref.gain.gain.setValueAtTime(ref.gain.gain.value, audioCtx.currentTime);
        ref.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + fadeDur);
        setTimeout(() => { try { ref.source.stop(); } catch (e) { } }, fadeTimeout);
      }
      if (woodSynth) {
        const ref = woodSynth, lfo = woodSynthLfo, lfoG = woodSynthLfoGain;
        woodSynth = null; woodSynthLfo = null; woodSynthLfoGain = null;
        ref.gain.gain.setValueAtTime(ref.gain.gain.value, audioCtx.currentTime);
        ref.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + fadeDur);
        if (lfoG) lfoG.gain.setTargetAtTime(0, audioCtx.currentTime, fadeDur * 0.3);
        setTimeout(() => {
          if (lfo) try { lfo.stop(); } catch (e) { }
          try { ref.osc1.stop(); ref.osc2.stop(); } catch (e) { }
        }, fadeTimeout);
      }
      if (woodLeafInterval) { clearTimeout(woodLeafInterval); woodLeafInterval = null; }
      if (woodBreathFrame) { cancelAnimationFrame(woodBreathFrame); woodBreathFrame = null; }
      if (woodGlowInterval) { clearInterval(woodGlowInterval); woodGlowInterval = null; }
      const nodes = document.querySelectorAll('#wood-page .tree-node');
      nodes.forEach(n => n.classList.remove('invite-glow'));
      const root = document.getElementById('woodRoot');
      root.classList.remove('active');
      root.removeEventListener('touchstart', woodTS);
      root.removeEventListener('touchend', woodTE);
      root.removeEventListener('touchcancel', woodTE);
      const layer = document.getElementById('treeLeafLayer');
      if (layer) layer.innerHTML = '';
    }

    // ═══════════════════════════════════
    // WATER — MP3 loop, clamped tilt
    // ═══════════════════════════════════
    let waterLoop = null, waterSynth = null, waterLfo = null, waterLfoGain = null, waterOrientHandler = null, waterReady = false, waterDelayTimer = null, waterBaseAlpha = null, waterSmoothedAlpha = 0;
    const BETA_NEUTRAL = 60, TILT_FWD = 55, TILT_BACK = 15, ROLL_CLAMP = 50, SPIN_CLAMP = 60, SPIN_MAX_JUMP = 30;

    // 水 stroke paths in SVG space (0-200)
    const WATER_STROKES = [
      [{ x: 100, y: 15 }, { x: 100, y: 70 }, { x: 100, y: 130 }, { x: 95, y: 185 }], // ws0: center vertical hook
      [{ x: 30, y: 60 }, { x: 45, y: 55 }, { x: 60, y: 50 }, { x: 75, y: 75 }], // ws1: top left hook
      [{ x: 60, y: 110 }, { x: 50, y: 125 }, { x: 40, y: 145 }, { x: 20, y: 180 }], // ws2: bottom left sweep
      [{ x: 140, y: 60 }, { x: 135, y: 75 }, { x: 125, y: 90 }], // ws3: right dot/short sweep
      [{ x: 125, y: 110 }, { x: 145, y: 145 }, { x: 170, y: 180 }] // ws4: bottom right sweep
    ];

    // Find closest point on any stroke to a target XY in SVG space
    function closestWaterPoint(tx, ty) {
      let bestDist = Infinity, bestX = 100, bestY = 100, bestStroke = 0;
      for (let si = 0; si < WATER_STROKES.length; si++) {
        const stroke = WATER_STROKES[si];
        for (let i = 0; i < stroke.length - 1; i++) {
          const ax = stroke[i].x, ay = stroke[i].y, bx = stroke[i + 1].x, by = stroke[i + 1].y;
          const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
          let t = len2 > 0 ? ((tx - ax) * dx + (ty - ay) * dy) / len2 : 0;
          t = Math.max(0, Math.min(1, t));
          const cx = ax + t * dx, cy = ay + t * dy;
          const dist = Math.sqrt((tx - cx) * (tx - cx) + (ty - cy) * (ty - cy));
          if (dist < bestDist) { bestDist = dist; bestX = cx; bestY = cy; bestStroke = si; }
        }
      }
      return { x: bestX, y: bestY, stroke: bestStroke };
    }

    function initWater() {
      waterReady = false; waterBaseAlpha = null;
      document.getElementById('waterReadout').style.opacity = '0';
      const bubble = document.getElementById('waterBubble');
      const sa = document.getElementById('waterStrokeArea');
      // Start at center junction
      bubble.style.left = '50%'; bubble.style.top = '47.5%';

      // Show tilt hint, hide after first movement
      const hint = document.getElementById('waterTiltHint');
      if (hint) hint.style.opacity = '0.35';

      waterLoop = playBufferWithChain('water_long', true);
      if (waterLoop) {
        waterLoop.gain.gain.value = 0;
        waterLoop.filter.frequency.value = 800;
        waterLfo = audioCtx.createOscillator();
        waterLfoGain = audioCtx.createGain();
        waterLfo.type = 'sine'; waterLfo.frequency.value = 0.3;
        waterLfoGain.gain.value = 200;
        waterLfo.connect(waterLfoGain);
        waterLfoGain.connect(waterLoop.filter.frequency);
        waterLfo.start();
      }

      waterSynth = createDrone(103.8, 'triangle', 3);
      waterSynth.filter.frequency.value = 800; waterSynth.gain.gain.value = 0;

      const readout = document.getElementById('waterReadout');
      const vB = document.getElementById('tiltBeta'), vG = document.getElementById('tiltGamma'), vA = document.getElementById('tiltAlpha');

      waterDelayTimer = setTimeout(() => {
        waterReady = true;
        if (waterLoop) {
          waterLoop.gain.gain.setValueAtTime(0, audioCtx.currentTime);
          waterLoop.gain.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + 2.0);
        }
        if (waterSynth) {
          waterSynth.gain.gain.setValueAtTime(0, audioCtx.currentTime);
          waterSynth.gain.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 2.0);
        }
        readout.style.opacity = '1';
      }, 1000);

      const updateBubble = (normX, normY) => {
        // normX: 0=left, 1=right. normY: 0=top, 1=bottom
        // Map to SVG space target position
        const targetSvgX = normX * 200;
        const targetSvgY = normY * 200;
        const pt = closestWaterPoint(targetSvgX, targetSvgY);

        // Interpolate between snapped and free based on destruction
        const snap = typeof waterDestructSnap !== 'undefined' ? waterDestructSnap : 1;
        const finalX = pt.x * snap + targetSvgX * (1 - snap);
        const finalY = pt.y * snap + targetSvgY * (1 - snap);

        // Convert SVG coords to % of container
        const pctX = (finalX / 200) * 100;
        const pctY = (finalY / 200) * 100;
        bubble.style.left = Math.max(0, Math.min(100, pctX)) + '%';
        bubble.style.top = Math.max(0, Math.min(100, pctY)) + '%';

        // Glow the active stroke (skip during destruction — CSS handles it)
        if (snap > 0.5) {
          const paths = document.querySelectorAll('.water-stroke');
          paths.forEach((p, i) => {
            p.setAttribute('stroke', i === pt.stroke ? 'rgba(70,130,200,0.45)' : 'rgba(70,130,200,0.25)');
          });
        }

        // Audio: use final position
        const audioNx = finalX / 200;
        const audioNy = finalY / 200;
        return { nx: audioNx, ny: audioNy };
      };

      waterOrientHandler = e => {
        const beta = e.beta || 0, gamma = e.gamma || 0, alpha = e.alpha || 0;
        if (waterBaseAlpha === null) { waterBaseAlpha = alpha; waterSmoothedAlpha = 0; }

        // Hide tilt hint on first movement
        if (hint && (Math.abs(beta - BETA_NEUTRAL) > 5 || Math.abs(gamma) > 5)) {
          hint.style.opacity = '0'; hint.style.transition = 'opacity 0.5s ease';
        }

        // Tilt: asymmetric range -55 (forward) to +15 (back) relative to neutral
        const relBeta = beta - BETA_NEUTRAL;
        const cB = Math.max(-TILT_FWD, Math.min(TILT_BACK, relBeta));
        // ny: 0=top(-55°, high pitch), 1=bottom(+15°, low pitch)
        const ny = (cB + TILT_FWD) / (TILT_FWD + TILT_BACK);

        // Roll: symmetric
        const relGamma = gamma;
        const cG = Math.max(-ROLL_CLAMP, Math.min(ROLL_CLAMP, relGamma));
        const nx = (cG + ROLL_CLAMP) / (ROLL_CLAMP * 2);

        // Spin: smooth anti-jump
        let relAlpha = alpha - waterBaseAlpha;
        if (relAlpha > 180) relAlpha -= 360;
        if (relAlpha < -180) relAlpha += 360;
        // Reject jumps > SPIN_MAX_JUMP, interpolate smoothly
        const alphaDelta = relAlpha - waterSmoothedAlpha;
        if (Math.abs(alphaDelta) > SPIN_MAX_JUMP) {
          waterSmoothedAlpha += Math.sign(alphaDelta) * SPIN_MAX_JUMP * 0.3;
        } else {
          waterSmoothedAlpha += (relAlpha - waterSmoothedAlpha) * 0.3;
        }
        const cA = Math.max(-SPIN_CLAMP, Math.min(SPIN_CLAMP, waterSmoothedAlpha));
        const nz = (cA + SPIN_CLAMP) / (SPIN_CLAMP * 2);

        vB.textContent = Math.round(cB) + '°';
        vG.textContent = Math.round(cG) + '°';
        vA.textContent = Math.round(cA) + '°';

        const audio = updateBubble(nx, ny);

        if (!waterReady || !waterLoop) return;
        // Invert: top of char (ny=0) = high pitch, bottom (ny=1) = low pitch
        waterLoop.source.playbackRate.setTargetAtTime(0.5 + (1 - audio.ny) * 1.5, audioCtx.currentTime, 0.1);
        waterLoop.filter.frequency.setTargetAtTime(200 + (1 - audio.ny) * 4000, audioCtx.currentTime, 0.1);
        if (waterLfo) waterLfo.frequency.setTargetAtTime(0.1 + nz * 6, audioCtx.currentTime, 0.1);
        if (waterSynth) waterSynth.filter.frequency.setTargetAtTime(200 + (1 - audio.ny) * 4000, audioCtx.currentTime, 0.1);
      };
      window.addEventListener('deviceorientation', waterOrientHandler);

      // Touch fallback
      sa.addEventListener('touchmove', e => {
        e.preventDefault();
        const r = sa.getBoundingClientRect(), t = e.touches[0];
        const nx = Math.max(0, Math.min(1, (t.clientX - r.left) / r.width));
        const ny = Math.max(0, Math.min(1, (t.clientY - r.top) / r.height));
        if (hint) { hint.style.opacity = '0'; hint.style.transition = 'opacity 0.5s ease'; }
        // Display: map ny back to tilt range (-55 to +15)
        const displayTilt = Math.round(-TILT_FWD + ny * (TILT_FWD + TILT_BACK));
        vB.textContent = displayTilt + '°';
        vG.textContent = Math.round((nx - 0.5) * ROLL_CLAMP * 2) + '°';
        const audio = updateBubble(nx, ny);
        if (!waterReady || !waterLoop) return;
        waterLoop.source.playbackRate.setTargetAtTime(0.5 + (1 - audio.ny) * 1.5, audioCtx.currentTime, 0.1);
        waterLoop.filter.frequency.setTargetAtTime(200 + (1 - audio.ny) * 4000, audioCtx.currentTime, 0.1);
      });
    }

    function cleanupWater() {
      if (waterOrientHandler) window.removeEventListener('deviceorientation', waterOrientHandler);
      waterOrientHandler = null; waterReady = false; waterBaseAlpha = null; waterSmoothedAlpha = 0;
      clearTimeout(waterDelayTimer);
      document.getElementById('waterReadout').style.opacity = '0';
      const hint = document.getElementById('waterTiltHint');
      if (hint) { hint.style.opacity = ''; hint.style.transition = ''; }
      const bubble = document.getElementById('waterBubble');
      if (bubble) { bubble.style.left = '50%'; bubble.style.top = '47.5%'; }
      document.querySelectorAll('.water-stroke').forEach(p => p.setAttribute('stroke', 'rgba(70,130,200,0.25)'));
      if (waterLoop) {
        const fadeDur = appStatus.startsWith('destroy_') ? 0.5 : 1.5;
        const fadeTimeout = fadeDur * 1000 + 300;
        const loopRef = waterLoop, lfoRef = waterLfo;
        waterLoop = null; waterLfo = null; waterLfoGain = null;
        loopRef.gain.gain.setValueAtTime(loopRef.gain.gain.value, audioCtx.currentTime);
        loopRef.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + fadeDur);
        setTimeout(() => {
          if (lfoRef) try { lfoRef.stop(); } catch (e) { }
          try { loopRef.source.stop(); } catch (e) { }
        }, fadeTimeout);
      }
      if (waterSynth) {
        const fadeDur = appStatus.startsWith('destroy_') ? 0.5 : 1.5;
        const fadeTimeout = fadeDur * 1000 + 300;
        const ref = waterSynth; waterSynth = null;
        ref.gain.gain.setValueAtTime(ref.gain.gain.value, audioCtx.currentTime);
        ref.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + fadeDur);
        setTimeout(() => { try { ref.osc1.stop(); ref.osc2.stop(); } catch (e) { } }, fadeTimeout);
      }
    }

    // ═══════════════════════════════════
    // FIRE — MP3 XY pad + synth swipe + sine pulse
    // ═══════════════════════════════════
    let fireLoop = null, fireSynth = null, fireSynthLfo = null, fireSynthLfoGain = null, firePadActive = false, fireLastSwipe = 0, fireIdleTimer = null, fireGhostAnim = null, fireGhostStopped = false;

    // 火 stroke paths in SVG space (0-200), matching fs0-fs3 order
    const FIRE_STROKES = [
      [{ x: 70, y: 80 }, { x: 60, y: 95 }, { x: 55, y: 105 }], // fs0: left dot
      [{ x: 140, y: 70 }, { x: 130, y: 85 }, { x: 120, y: 95 }], // fs1: right dot
      [{ x: 100, y: 35 }, { x: 100, y: 75 }, { x: 80, y: 120 }, { x: 60, y: 145 }, { x: 40, y: 170 }], // fs2: center left sweep
      [{ x: 100, y: 90 }, { x: 125, y: 115 }, { x: 145, y: 140 }, { x: 165, y: 170 }] // fs3: center right sweep
    ];
    const FIRE_HIT_RADIUS = 28;

    function distToSegment(px, py, ax, ay, bx, by) {
      const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
      if (len2 === 0) return Math.sqrt((px - ax) * (px - ax) + (py - ay) * (py - ay));
      let t = ((px - ax) * dx + (py - ay) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
      const cx = ax + t * dx, cy = ay + t * dy;
      return Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
    }

    function nearFireStroke(svgX, svgY) {
      for (const stroke of FIRE_STROKES) {
        for (let i = 0; i < stroke.length - 1; i++) {
          if (distToSegment(svgX, svgY, stroke[i].x, stroke[i].y, stroke[i + 1].x, stroke[i + 1].y) < FIRE_HIT_RADIUS) return true;
        }
      }
      return false;
    }

    // Sample a point along a polyline stroke at parameter t (0-1)
    function strokePointAt(stroke, t) {
      let totalLen = 0; const segLens = [];
      for (let i = 0; i < stroke.length - 1; i++) {
        const dx = stroke[i + 1].x - stroke[i].x, dy = stroke[i + 1].y - stroke[i].y;
        segLens.push(Math.sqrt(dx * dx + dy * dy)); totalLen += segLens[i];
      }
      let target = t * totalLen, accum = 0;
      for (let i = 0; i < segLens.length; i++) {
        if (accum + segLens[i] >= target || i === segLens.length - 1) {
          const segT = segLens[i] > 0 ? (target - accum) / segLens[i] : 0;
          return { x: stroke[i].x + (stroke[i + 1].x - stroke[i].x) * segT, y: stroke[i].y + (stroke[i + 1].y - stroke[i].y) * segT };
        }
        accum += segLens[i];
      }
      return { x: stroke[0].x, y: stroke[0].y };
    }

    function startFireGhost() {
      const gh = document.getElementById('fireTraceGhost');
      if (!gh) return;
      gh.style.opacity = '1'; fireGhostStopped = false;
      let strokeIdx = 0;
      const speeds = [800, 800, 2500, 2500]; // alternating slow/fast

      function traceStroke() {
        if (fireGhostStopped) return;
        const stroke = FIRE_STROKES[strokeIdx];
        const dur = speeds[strokeIdx % speeds.length];
        const sa = document.getElementById('fireStrokeArea');
        if (!sa) return;
        const start = Date.now();
        const isFast = dur < 1500;
        gh.style.width = isFast ? '18px' : '12px'; gh.style.height = isFast ? '18px' : '12px';
        gh.style.background = isFast ? 'rgba(220,60,40,0.55)' : 'rgba(220,60,40,0.25)';
        gh.style.boxShadow = isFast ? '0 0 14px rgba(220,60,40,0.5)' : '0 0 6px rgba(220,60,40,0.2)';

        function step() {
          if (fireGhostStopped) return;
          const t = Math.min((Date.now() - start) / dur, 1);
          const pt = strokePointAt(stroke, t);
          gh.style.left = (pt.x / 200 * sa.clientWidth) + 'px';
          gh.style.top = (pt.y / 200 * sa.clientHeight) + 'px';
          if (t < 1) fireGhostAnim = requestAnimationFrame(step);
          else setTimeout(() => { if (fireGhostStopped) return; strokeIdx = (strokeIdx + 1) % FIRE_STROKES.length; traceStroke(); }, 600);
        }
        fireGhostAnim = requestAnimationFrame(step);
      }
      traceStroke();
    }

    function stopFireGhost() {
      fireGhostStopped = true;
      if (fireGhostAnim) { cancelAnimationFrame(fireGhostAnim); fireGhostAnim = null; }
      const gh = document.getElementById('fireTraceGhost');
      if (gh) gh.style.opacity = '0';
    }

    function initFire() {
      fireLoop = playBufferWithChain('fire_long', true);
      if (fireLoop) { fireLoop.filter.frequency.value = 400; fireLoop.filter.Q.value = 1; fireLoop.gain.gain.value = 0; }

      fireSynth = createDrone(174.6, 'sine', 4);
      fireSynth.filter.frequency.value = 500; fireSynth.gain.gain.value = 0;
      fireSynthLfo = audioCtx.createOscillator();
      fireSynthLfoGain = audioCtx.createGain();
      fireSynthLfo.type = 'sine'; fireSynthLfo.frequency.value = 0.5;
      fireSynthLfoGain.gain.value = 0.04;
      fireSynthLfo.connect(fireSynthLfoGain);
      fireSynthLfoGain.connect(fireSynth.gain.gain);
      fireSynthLfo.start();
      fireSynth.gain.gain.setValueAtTime(0, audioCtx.currentTime);
      fireSynth.gain.gain.linearRampToValueAtTime(0.07, audioCtx.currentTime + 1.5);

      const pad = document.getElementById('firePad'), cross = document.getElementById('fireCrosshair');
      const ghost = document.getElementById('fireGhost');
      ghost.style.opacity = '1';

      // Start trace ghost
      fireGhostStopped = false;
      startFireGhost();

      const fireTouch = () => {
        if (fireSynth) fireSynth.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.0);
        if (fireIdleTimer) { clearTimeout(fireIdleTimer); fireIdleTimer = null; }
      };
      const fireRelease = () => {
        if (fireIdleTimer) clearTimeout(fireIdleTimer);
        fireIdleTimer = setTimeout(() => {
          if (fireSynth) fireSynth.gain.gain.linearRampToValueAtTime(0.07, audioCtx.currentTime + 2.0);
        }, 2000);
      };

      const mv = (x, y) => {
        const r = pad.getBoundingClientRect();
        const nx = Math.max(0, Math.min(1, (x - r.left) / r.width)), ny = Math.max(0, Math.min(1, (y - r.top) / r.height));
        cross.style.left = (nx * 100) + '%'; cross.style.top = (ny * 100) + '%';
        const logFreq = 300 * Math.pow(20, nx);
        const q = 1 + (1 - ny) * 17;
        if (fireLoop) {
          fireLoop.filter.frequency.setTargetAtTime(logFreq, audioCtx.currentTime, 0.05);
          fireLoop.filter.Q.setTargetAtTime(q, audioCtx.currentTime, 0.05);
          fireLoop.gain.gain.setTargetAtTime(0.3, audioCtx.currentTime, 0.05);
        }
        const intensity = (nx + (1 - ny)) / 2;
        pad.style.background = `rgba(220,60,40,${intensity * 0.4})`;
      };
      // Energy throttle variables
      let fireLastEnergyTime = 0;

      pad.addEventListener('touchstart', e => { e.preventDefault(); firePadActive = true; ghost.style.opacity = '0'; fireTouch(); mv(e.touches[0].clientX, e.touches[0].clientY); fireLastEnergyTime = Date.now(); });
      pad.addEventListener('touchmove', e => {
        e.preventDefault();
        if (firePadActive) {
          mv(e.touches[0].clientX, e.touches[0].clientY);
          let now = Date.now();
          if (now - fireLastEnergyTime > 100) { // Max 10 updates a second
            fireLastEnergyTime = now;
          }
        }
      });
      pad.addEventListener('touchend', () => {
        firePadActive = false; cross.style.left = '50%'; cross.style.top = '50%';
        pad.style.background = 'transparent';
        if (fireLoop) fireLoop.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
        fireRelease();
      });

      // Stroke swipe area
      const sa = document.getElementById('fireStrokeArea');
      const svg = document.getElementById('fireCharSvg');
      const fl = document.getElementById('fireFlameLayer');
      let ss = null, sTime = 0;

      sa.addEventListener('touchstart', e => {
        e.preventDefault();
        stopFireGhost();
        fireTouch();
        ss = { x: e.touches[0].clientX, y: e.touches[0].clientY }; sTime = Date.now();
      });
      sa.addEventListener('touchmove', e => {
        e.preventDefault(); if (!ss) return;
        const now = Date.now(); if (now - fireLastSwipe < 60) return;
        const tx = e.touches[0].clientX, ty = e.touches[0].clientY;
        const dx = tx - ss.x, dy = ty - ss.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 12) {
          const r = sa.getBoundingClientRect();
          const localX = tx - r.left, localY = ty - r.top;
          const svgX = (localX / r.width) * 200, svgY = (localY / r.height) * 200;

          if (nearFireStroke(svgX, svgY)) {
            fireLastSwipe = now;
            const dt = now - sTime;
            const speed = dt > 0 ? dist / dt : 1;
            spawnFlame(localX, localY, fl);
            triggerFlameSound(speed);
            // Glow only the nearest stroke
            svg.querySelectorAll('.fire-stroke').forEach((p, i) => {
              const stroke = FIRE_STROKES[i];
              let near = false;
              for (let j = 0; j < stroke.length - 1; j++) {
                if (distToSegment(svgX, svgY, stroke[j].x, stroke[j].y, stroke[j + 1].x, stroke[j + 1].y) < FIRE_HIT_RADIUS) { near = true; break; }
              }
              if (near) {
                const glow = Math.min(0.6, 0.35 + speed * 0.3);
                p.setAttribute('stroke', `rgba(220,60,40,${glow})`);
                p.setAttribute('stroke-dasharray', 'none');
                setTimeout(() => { p.setAttribute('stroke', 'rgba(220,60,40,0.28)'); p.setAttribute('stroke-dasharray', '4 6'); }, 250);
              }
            });
          }
          ss = { x: tx, y: ty }; sTime = now;
        }
      });
      sa.addEventListener('touchend', () => { ss = null; fireRelease(); });
    }
    function spawnFlame(x, y, c) { const el = document.createElement('div'); el.className = 'flame-particle'; el.style.background = `hsl(${10 + Math.random() * 30},90%,55%)`; el.style.left = x + 'px'; el.style.top = y + 'px'; const s = 6 + Math.random() * 10; el.style.width = s + 'px'; el.style.height = s + 'px'; c.appendChild(el); setTimeout(() => el.remove(), 800); }
    function triggerFlameSound(speed) {
      // speed: ~0.1 (slow) to ~2.0+ (fast)
      const spd = Math.min(speed, 2.0);
      const norm = spd / 2.0; // 0 to 1
      const t = audioCtx.currentTime;
      // Duration: slow=80ms, fast=200ms
      const dur = 0.08 + norm * 0.12;
      const bs = Math.floor(audioCtx.sampleRate * dur);
      const buf = audioCtx.createBuffer(1, bs, audioCtx.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < bs; i++)d[i] = Math.random() * 2 - 1;
      const s = audioCtx.createBufferSource(); s.buffer = buf;
      // Frequency: slow=800Hz (dark), fast=3500Hz (bright)
      const bp = audioCtx.createBiquadFilter(); bp.type = 'bandpass';
      bp.frequency.value = 800 + norm * 2700 + Math.random() * 500;
      // Q: slow=4 (narrow), fast=1.5 (wide)
      bp.Q.value = 4 - norm * 2.5;
      // Volume: slow=0.06, fast=0.25
      const vol = 0.06 + norm * 0.19;
      const e = audioCtx.createGain(); e.gain.setValueAtTime(vol, t); e.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.05);
      s.connect(bp); bp.connect(e); e.connect(audioCtx.destination); s.start(t);
    }
    function cleanupFire() {
      stopFireGhost();
      const fadeDur = appStatus.startsWith('destroy_') ? 0.5 : 1.5;
      const fadeTimeout = fadeDur * 1000 + 300;
      if (fireLoop) {
        const ref = fireLoop; fireLoop = null;
        ref.gain.gain.setValueAtTime(ref.gain.gain.value, audioCtx.currentTime);
        ref.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + fadeDur);
        setTimeout(() => { try { ref.source.stop(); } catch (e) { } }, fadeTimeout);
      }
      if (fireSynth) {
        const ref = fireSynth, lfo = fireSynthLfo, lfoG = fireSynthLfoGain;
        fireSynth = null; fireSynthLfo = null; fireSynthLfoGain = null;
        ref.gain.gain.setValueAtTime(ref.gain.gain.value, audioCtx.currentTime);
        ref.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + fadeDur);
        if (lfoG) lfoG.gain.setTargetAtTime(0, audioCtx.currentTime, fadeDur * 0.3);
        setTimeout(() => {
          if (lfo) try { lfo.stop(); } catch (e) { }
          try { ref.osc1.stop(); ref.osc2.stop(); } catch (e) { }
        }, fadeTimeout);
      }
      if (fireIdleTimer) { clearTimeout(fireIdleTimer); fireIdleTimer = null; }
      const pad = document.getElementById('firePad');
      if (pad) pad.style.background = 'transparent';
      const fl = document.getElementById('fireFlameLayer');
      if (fl) fl.innerHTML = '';
      const svg = document.getElementById('fireCharSvg');
      if (svg) svg.querySelectorAll('.fire-stroke').forEach(p => { p.setAttribute('stroke', 'rgba(220,60,40,0.28)'); p.setAttribute('stroke-dasharray', '4 6'); });
    }

    // ═══════════════════════════════════
    // EARTH — earthquake + MP3 bed
    // ═══════════════════════════════════
    let earthDrone = null, earthBed = null, earthAnimFrame = null, earthStartTime = null, earthLastVib = 0, earthPulseContainer = null, earthQuaking = false, earthFirstQuake = true;
    const QUAKE_TIMES = [6000, 11000, 21000];
    let earthQuakeTime = 6000;

    function createDrone(f, t, d) {
      const o1 = audioCtx.createOscillator(), o2 = audioCtx.createOscillator();
      const g = audioCtx.createGain(), fl = audioCtx.createBiquadFilter();
      o1.type = t || 'sine'; o1.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 1.002;
      if (d) { o1.detune.value = d; o2.detune.value = -d; }
      fl.type = 'lowpass'; fl.frequency.value = 800; fl.Q.value = 2; g.gain.value = 0;
      o1.connect(fl); o2.connect(fl); fl.connect(g); g.connect(audioCtx.destination);
      o1.start(); o2.start();
      return { osc1: o1, osc2: o2, gain: g, filter: fl };
    }

    function initEarth() {
      showCue('earthCue');
      earthDrone = createDrone(55, 'sine', 2); earthDrone.filter.frequency.value = 400;
      const ta = document.getElementById('earthTouch');
      earthPulseContainer = ta.parentElement;
      ta.addEventListener('touchstart', earthTS);
      ta.addEventListener('touchend', earthTE);
      ta.addEventListener('touchcancel', earthTE);
    }

    function earthTS(e) {
      e.preventDefault(); hideCue('earthCue');
      earthStartTime = Date.now(); earthLastVib = 0; earthQuaking = false;
      earthQuakeTime = earthFirstQuake ? 6000 : QUAKE_TIMES[Math.floor(Math.random() * QUAKE_TIMES.length)];
      earthDrone.gain.gain.setValueAtTime(0, audioCtx.currentTime);

      // Start MP3 bed
      earthBed = playBuffer('earth_long', true, 0);
      earthChargeLoop();
    }

    function earthChargeLoop() {
      if (!earthStartTime) return;
      const elapsed = Date.now() - earthStartTime;
      const ta = document.getElementById('earthTouch');

      if (earthQuaking) {
        earthStartTime = Date.now(); earthQuaking = false; earthLastVib = 0;
        earthQuakeTime = QUAKE_TIMES[Math.floor(Math.random() * QUAKE_TIMES.length)];
        earthDrone.gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
        if (earthBed) earthBed.gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
        ta.style.boxShadow = 'none'; ta.style.borderColor = 'rgba(139,94,60,0.35)'; ta.style.background = 'transparent';
        earthAnimFrame = requestAnimationFrame(earthChargeLoop);
        return;
      }

      const progress = Math.min(elapsed / earthQuakeTime, 1);

      // Synth drone volume
      earthDrone.gain.gain.setValueAtTime(progress * 0.3, audioCtx.currentTime);
      // MP3 bed always softer than synth
      if (earthBed) earthBed.gain.gain.setValueAtTime(progress * 0.15, audioCtx.currentTime);

      // Progressive glow
      const glowSize = 20 + progress * 80, glowOp = 0.05 + progress * 0.35;
      const borderOp = 0.25 + progress * 0.6, bgOp = progress * 0.2;
      ta.style.boxShadow = `0 0 ${glowSize}px rgba(139,94,60,${glowOp})`;
      ta.style.borderColor = `rgba(139,94,60,${borderOp})`;
      ta.style.background = `rgba(139,94,60,${bgOp})`;

      // Progressive haptic
      const now = Date.now(), vibInterval = 800 - progress * 650;
      if (now - earthLastVib > vibInterval) {
        const vibStr = Math.round(30 + progress * 120);
        if (navigator.vibrate) navigator.vibrate(vibStr);
        earthLastVib = now; spawnEarthPulse();
      }

      if (progress >= 1) { triggerEarthquake(); return; }
      earthAnimFrame = requestAnimationFrame(earthChargeLoop);
    }

    function triggerEarthquake() {
      earthQuaking = true; earthFirstQuake = false;
      earthQuakeTime = QUAKE_TIMES[Math.floor(Math.random() * QUAKE_TIMES.length)];
      const ta = document.getElementById('earthTouch');
      if (navigator.vibrate) navigator.vibrate([200, 80, 300, 80, 200]);
      const page = document.getElementById('earth-page');
      page.style.animation = 'screenShake 0.6s ease';
      page.classList.add('quaking');
      setTimeout(() => { page.style.animation = ''; page.classList.remove('quaking'); }, 700);
      ta.style.boxShadow = '0 0 120px rgba(139,94,60,0.7)';
      ta.style.borderColor = 'rgba(139,94,60,1)';
      ta.style.background = 'rgba(139,94,60,0.35)';
      earthDrone.gain.gain.setValueAtTime(0.45, audioCtx.currentTime);
      earthDrone.gain.gain.linearRampToValueAtTime(0.02, audioCtx.currentTime + 1.5);
      if (earthBed) {
        earthBed.gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        earthBed.gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
      }
      setTimeout(() => { if (earthStartTime) earthAnimFrame = requestAnimationFrame(earthChargeLoop); }, 1500);
    }

    function earthTE() {
      earthStartTime = null; earthQuaking = false;
      if (earthAnimFrame) { cancelAnimationFrame(earthAnimFrame); earthAnimFrame = null; }
      if (navigator.vibrate) navigator.vibrate(0);
      const ta = document.getElementById('earthTouch');
      ta.style.boxShadow = 'none'; ta.style.borderColor = 'rgba(139,94,60,0.35)'; ta.style.background = 'transparent';
      if (earthDrone) earthDrone.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
      if (earthBed) {
        const bedRef = earthBed; earthBed = null;
        bedRef.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
        setTimeout(() => { try { bedRef.source.stop(); } catch (e) { } }, 350);
      }
      showCue('earthCue');
    }

    function spawnEarthPulse() {
      const el = document.createElement('div'); el.className = 'earth-pulse';
      const ta = document.getElementById('earthTouch');
      const r = ta.getBoundingClientRect(), pr = earthPulseContainer.getBoundingClientRect();
      const sz = ta.clientWidth; el.style.width = sz + 'px'; el.style.height = sz + 'px';
      el.style.left = (r.left - pr.left + r.width / 2 - sz / 2) + 'px';
      el.style.top = (r.top - pr.top + r.height / 2 - sz / 2) + 'px';
      earthPulseContainer.appendChild(el); setTimeout(() => el.remove(), 1000);
    }

    function cleanupEarth() {
      earthStartTime = null; earthQuaking = false; earthFirstQuake = true;
      if (earthAnimFrame) { cancelAnimationFrame(earthAnimFrame); earthAnimFrame = null; }
      const fadeDur = appStatus.startsWith('destroy_') ? 0.5 : 1.5;
      const fadeTimeout = fadeDur * 1000 + 300;
      if (earthDrone) {
        const ref = earthDrone; earthDrone = null;
        ref.gain.gain.setValueAtTime(ref.gain.gain.value, audioCtx.currentTime);
        ref.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + fadeDur);
        setTimeout(() => { try { ref.osc1.stop(); ref.osc2.stop(); } catch (e) { } }, fadeTimeout);
      }
      if (earthBed) {
        const ref = earthBed; earthBed = null;
        ref.gain.gain.setValueAtTime(ref.gain.gain.value, audioCtx.currentTime);
        ref.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + fadeDur);
        setTimeout(() => { try { ref.source.stop(); } catch (e) { } }, fadeTimeout);
      }
      if (navigator.vibrate) navigator.vibrate(0);
      const ta = document.getElementById('earthTouch');
      ta.style.boxShadow = 'none'; ta.style.borderColor = 'rgba(139,94,60,0.35)'; ta.style.background = 'transparent';
      ta.removeEventListener('touchstart', earthTS); ta.removeEventListener('touchend', earthTE); ta.removeEventListener('touchcancel', earthTE);
    }

    document.addEventListener('touchmove', e => { if (currentElement) e.preventDefault(); }, { passive: false });
  </script>
</body>

</html>
