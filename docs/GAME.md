# Conox Challenge

The game has a separate Vite entry in `game/index.html`. The simulator's
navigation does not link to it. Both entries include the same GoatCounter site;
normal page loads use the game's own pathname, following the standard
[GoatCounter installation](https://www.goatcounter.com/help/start).

## Shared simulator

`src/game/GameApp.jsx` and `Discovery.jsx` retain the three learning paths,
twelve missions and guided ICU story initially based on the supplied
`Conox_Challenge_Simple_EN.html`. The bundled simulator and React runtime from
that file are not used.

`GameMonitor` renders the exported `SimulatorApp` from `src/App.jsx`, which uses
the same simulation engine, EEG history, DSA drawing, indices and
`ConoxMonitor` components as the main page. Mission references resolve against `src/data/scenarios.js`. Clinical teaching
variants copy these profiles and opt into longer suppression cycles and a short
live history; there is no second signal generator. Changing reference remounts
the simulator with clean histories.
Enlarging or resizing it keeps the same instance running.

Embedded mode uses English and does not read or write the main simulator's
preferences, change its demo URL, generate QR codes or join remote demo rooms.
The qCON advisory and view controls call the existing simulator controls.
The ICU story renders missing index values in the DOM and disables index trends,
rather than merely concealing numbers with CSS. It does not establish a fixed
RASS-to-qCON conversion. Clinical assumptions and evidence are recorded in
[the clinical notes](GAME-CLINICAL-NOTES.md).

The optional `trainingScenario.training` settings activate a teaching sequence
inside the existing `SimulatorApp`. The game uses an eight-second EEG, a
one-minute DSA and a twelve-second suppression cycle. Profiles interpolate over
sixty seconds, then hold their final state until an explicit replay. The raw EEG
and DSA share the same temporal suppression gate. History starts empty;
`historySeconds` accepts only zero. qCON/qNOX remain reference values and are
therefore hidden in the clinical narrative. Original simulator defaults and
presets are unchanged when this opt-in is absent.

The revised clinical story uses storage key `icu-story.v2`; revised missions
use `pathways.v3`. Older scores remain stored under their old keys, but are not
counted as completion of the new material.

## Phone layout

Phone layouts retain readable text and scroll inside the activity when needed.
Monitor and challenge tabs give each part the available width. The monitor can
expand into a screen-only view using the existing borderless component, with a
close control, Escape support and keyboard focus containment. Safe-area padding
and dynamic viewport height accommodate mobile browser controls and notches.
The header logo and the framed monitor's logo return to the game's home.

Choosing a quiz path opens the first unfinished mission directly. A completed
path starts again at its first mission, retaining best scores. The mission list
is shown only in the final summary; resetting there immediately starts the first
mission. Phones open the question panel first, with the monitor one tab away.

The guided story uses the existing borderless monitor display at all sizes,
giving EEG and DSA more room without changing their proportions. The bedside
illustration separates the propofol IV line, breathing circuit and optional EEG
sensor. A short learning guide explains why EEG is useful, its ICU context, and
the sensor-to-monitor connection using the existing simulator terminology.

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
