# Recorded case views: visual verification

final result: passed

## Source and implementation

The current targets are the user's five annotated browser screenshots at `https://kevin-nexio.github.io/Conox-simulator/?demo=1`, at a 1021 × 1026 viewport, and the subsequent request for exactly three views, framed simulator by default, no white surround, and the simulator's original EEG sweep.

The original framed reference is `/var/folders/jd/szqcwwdd0ss1s91_jcfy5z000000gq/T/codex-clipboard-107f361c-4a04-4e94-987c-40ca18a8d769.png`, 2536 × 1762 pixels. The screen-only reference is `/var/folders/jd/szqcwwdd0ss1s91_jcfy5z000000gq/T/codex-clipboard-2d4f82a5-0d89-44e8-b751-7310b12e1271.png`, 5114 × 2880 pixels. These views reuse the simulator's shared ConoxMonitor components, styles, icons and existing brand assets. They are not screenshot replicas.

The production build was tested in the in-app browser at `http://127.0.0.1:4183/`. Current rendered evidence is `/tmp/conox-controls-qa/frame-final.png`, `/tmp/conox-controls-qa/screen-final.png`, `/tmp/conox-controls-qa/sweep-before.png` and `/tmp/conox-controls-qa/mobile-final.png`. Private recorded data and screenshots remain outside the repository and published site.

## Fidelity surfaces and comparison

The three directly visible choices are “Quatre blocs”, “Simulateur avec cadre” and “Simulateur sans cadre”. The framed simulator is selected when the case player opens. The two obsolete approximate CONOX compositions and their canvas renderer were removed, including from exports.

The framed and borderless scenes retain the original monitor's typography, metric strip, EEG above DSA, right qCON panel, graph switches, case panel and footer. The framed scene retains the original device bezel and wordmark. Its surrounding background is dark and its perimeter is grey, removing the white surround highlighted by the user. Numerical values and signal shapes come from the recording and are not fidelity targets against synthetic simulator data.

Four-block titles, values, units, axes and time labels remain native SVG text. EEG, SEF and index curves remain vector paths. Only the DSA power map is raster data. The shared SVG plots also render the recorded signals inside the original monitor components.

All four display selects and all three toggles remain visible in the preview heading, to the left of the fullscreen button at the annotated desktop viewport. They no longer require opening “Affichage”. The view selector is now three explicit buttons in the same heading. Passage and export remain combined in one compact toolbar.

At 1021 × 1026 the document height is 1026 pixels and the timeline plus complete presentation fit without scrolling. At 390 × 844 all three view choices and seven display controls remain visible in the normal flow; scrolling is expected at this narrow width. There is no horizontal overflow. Fullscreen entry and exit were exercised.

## EEG behavior and repairs

The recording previously moved an EEG window through the signal. It now reconstructs the original monitor's circular buffer: new samples overwrite from left to right, the previous pass remains on the right, and the short erase gap wraps at the boundary. The simulator and recording share the same erase-mask helper. Seeking, pausing and exports reconstruct the same position without showing unread future samples. Playback refreshes every 40 ms, matching the simulator's 25 Hz display update.

Browser verification sought to 603.90 seconds with a four-second window: the cursor fraction was 0.974853515625, near the right edge. Seeking to 604.10 seconds put it at 0.02490234375, back on the left, with two disconnected SVG paths retaining the previous pass on the right. Actual playback from 603 to 605 seconds advanced across that boundary and stopped at the selected end with cursor fraction 0.25. The two- and four-second window settings, amplitude and SEF50 control were also exercised.

Earlier visual repairs remain intact: images decode before monitor snapshots, the recording case button returns to the beginning, trend legends use their path colours, and export dimensions do not inherit viewport minimum heights. No actionable P0, P1 or P2 visual findings remain in the states tested for this release.

## Functional verification and limits

`npm run check` passes 72 tests, project checks, formatting and the production build. Tests compare the sweep against an independently simulated circular buffer for two-, four- and eight-second windows; cover boundary wrapping, erase-gap wrapping, start/end positions, missing future samples and deterministic seeks; and verify the three supported export sizes and translation parity. Browser errors and visible export errors were empty. A PNG generation completed with no error in the in-app browser; its download file was not retrieved in this run.

The preceding release had verified downloaded PNG, PDF and H.264 video files for all three retained views, including selectable four-block PDF text, one DSA image, fixed export dimensions and advancing video time/waveforms. Those file-level checks were not repeated for every format in this release. The same native scene remains shared by preview and exports. Safari was not tested in this run.
