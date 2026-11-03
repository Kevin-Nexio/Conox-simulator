# Conox Challenge

The game has a separate Vite entry in `game/index.html`. The simulator's
navigation does not link to it. Both entries include the same GoatCounter site;
normal page loads use the game's own pathname, following the standard
[GoatCounter installation](https://www.goatcounter.com/help/start).

## Shared simulator

`src/game/GameApp.jsx` and `Discovery.jsx` retain the three learning paths,
twelve missions and guided ICU story from the supplied
`Conox_Challenge_Simple_EN.html`. The bundled simulator and React runtime from
that file are not used.

`GameMonitor` renders the exported `SimulatorApp` from `src/App.jsx`, which uses
the same simulation engine, EEG history, DSA drawing, indices and
`ConoxMonitor` components as the main page. Mission references resolve directly
against `src/data/scenarios.js`; there is no second scenario catalogue or signal
generator. Changing reference remounts the simulator with clean histories.
Enlarging or resizing it keeps the same instance running.

Embedded mode uses English and does not read or write the main simulator's
preferences, change its demo URL, generate QR codes or join remote demo rooms.
The qCON advisory and view controls call the existing simulator controls.
The provisional ICU story renders missing index values in the DOM and disables
index trends, rather than merely concealing numbers with CSS. Its existing
clinical reservations and illustrative-signal notices remain in the game.

## Phone layout

Phone layouts retain readable text and scroll inside the activity when needed.
Monitor and challenge tabs give each part the available width. The monitor can
expand into a screen-only view using the existing borderless component, with a
close control, Escape support and keyboard focus containment. Safe-area padding
and dynamic viewport height accommodate mobile browser controls and notches.
The header logo and the framed monitor's logo return to the game's home.

## Build and validation

`npm run check` checks structure, formatting, the test suite and both Vite entries.
`tests/game.test.mjs` checks shared scenario references, mission integrity,
progress recovery, unlocking and best-score retention.

For the current GitHub Pages repository:

```sh
GITHUB_PAGES=true GITHUB_REPOSITORY=Kevin-Nexio/Conox-simulator npm run build
```

Publish `dist` to the configured `gh-pages` branch. Keep existing auxiliary
deployment paths that are not produced by this build. The maintained simulator
source is currently on `feature/dsa-color-scale`; `main` alone does not contain
the later recording and simulator features. The GoatCounter addition from
`main` was incorporated before building the game.

Browser verification covers all twelve missions, incorrect-answer feedback,
scores after reload, the advisory threshold crossing, the combined trend view,
reference changes, both home links, enlarged display, small phone portrait and
landscape sizes, image loading in a relative-base preview, and the main
simulator's controls. Phone checks use browser viewports, not physical iPhone
hardware or a native Safari session.
