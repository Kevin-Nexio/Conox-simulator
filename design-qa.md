# Recorded case views: visual verification

final result: passed

## Jano feedback: local corrections, 27 October 2026

The full check passes 100 tests and the production build. A targeted source review identified two issues, both repaired: pointer clicks had kept focus on a button and prevented subsequent playback shortcuts; PDF right alignment had measured Ω before spelling it as Ohm. The focused tests cover both regressions.

The experimental decoder now reads qNOX at byte 25 and EMG at byte 19. Independent literal-byte tests avoid repeating the parser's mapping table. Three provisional impedance fields at bytes 22–24 show ordinary values from 0 to 10 kΩ; unknown codes remain gaps, with all raw bytes preserved. A read-only check of the original local recording confirms its input hash is unchanged and the resulting ranges are qNOX 36–99 and EMG 0–100. This supports the correction but does not replace synchronized comparison with the original display. Saved-case round-trip tests include the corrected fields and impedances.

In-app browser tests on a synthetic 32-second case verified Space play/pause, 5-second arrow jumps, 30-second Shift-arrow jumps, whole-case clamping, pointer-to-keyboard handoff, and native select behaviour. Fullscreen settings change the EEG window, amplitude, DSA range, color offset and SEF display. Direct monitor controls change EEG seconds and amplitude. German fullscreen labels were exercised without untranslated keys. The four-block, framed and borderless views all show the recorded impedances; seeking to a partial electrode check shows `1: 1 · 2: -- · 3: --`, without holding previous readings.

At 1021 × 1026, document height stays 1026 and the timeline stays 129.3984375 CSS pixels high. Both case-panel buttons remain inside their panel. At 390 × 844, the expanded fullscreen toolbar is about 299 pixels high, leaves about 545 pixels for the monitor, and does not overflow horizontally. Viewport overrides were reset after testing. Existing user case tabs were not reloaded. Local synthetic screenshot evidence: `/tmp/conox-jano-feedback-20261027/fullscreen-final.png`.

The legend now uses the actual recorded DSA palette at the actual dB positions, including offset-adjusted numbers. Pixel/legend consistency is tested across the range. Signal processing and the underlying palette are unchanged; the photos do not establish an exact original-device color calibration. A four-block PDF was generated through the UI without an app error, but its downloaded file was not retrieved in this run. PDF text, right alignment, vector structure and offsets are covered by the automated tests. No new file-level video verification was performed. Changes remain local; this is not a new Pages deployment.

## Case save and restore: release verification

“Enregistrer le cas (.cxbin)” saves the exact complete original source plus a versioned simulator-state extension in one file. This is explicitly labelled as simulator-specific; native ConoxView compatibility is unverified. The original-only recovery action is available under file details. Marker state and timeline options are now controlled by the player so imports restore them without being cleared by a new frame array.

The complete check passes 88 tests, including plain inputs, Unicode annotations, every saved setting, startup frames and unknown-byte preservation, identical reconstructed EEG/DSA, resaving without nested trailers, typed-array offsets, immutable Blob retention after worker-buffer transfer, invalid UTF-8/JSON, bad or future footers, checksum changes, invalid ranges/settings and duplicate marker IDs. A separate source review found no confirmed P1/P2 issue.

In-app browser verification saved a real synthetic file to `/Users/kevinzimmermann/Downloads/synthetic-events-simulateur.cxbin`, copied to `/tmp/conox-timeline-curves-qa/saved-ui-case.cxbin` for checks. It contains 131072 original bytes plus 610 extension bytes. The extracted original is byte-for-byte identical to the synthetic source. Replacing the open case with plain input reset it to defaults; reopening the downloaded file restored both named events, 4.50–26.75 seconds, playhead 20.50 seconds, 2× speed, borderless view, all monitor graphs, eight-second EEG, ±50 µV, one-minute DSA, +4 dB, grid off, SEF50 on, curves initially hidden and BSR hidden in their legend. The 26.75-second end was typed and the save button clicked directly, verifying blur/commit ordering. A third marker received a distinct ID after reimport. A deliberately damaged input showed its integrity error and retained the existing case, settings and all three markers.

The file toolbar still fits at 1021 × 1026, document height remains 1026 and timeline height remains 129.3984375 CSS pixels. Current evidence is `/tmp/conox-timeline-curves-qa/case-restored.png`. These screenshots and files contain synthetic data only and stay outside the release. The original-only download button was exercised, but its browser save sheet/file was not inspected: computer use cannot access the Codex app's native UI. Source recovery is covered by the byte-for-byte codec checks. The actual enriched download and reimport were verified. No user's active case was reloaded during these checks.

## Local timeline prototype, preceding iteration

The subsequent local-only requests add index curves inside the timeline, rename the recording display toggle to “Quadrillage”, introduce named event markers, and simplify the range handles. The first triangle treatment was rejected as too large. The current treatment follows the separation of range handles and playhead in the official [Premiere timeline reference](https://helpx.adobe.com/premiere/desktop/edit-projects/change-clip-sequence/navigation-controls-in-the-timeline.html) and [Final Cut range-selection reference](https://support.apple.com/en-ph/guide/final-cut-pro/ver28cca92/mac): 4 × 14 pixel straight green grips at both range edges, one 10 × 8 pixel triangle and a 1 pixel line for the playhead, and compact flat numbered orange event flags. The default playhead is blue, turning white on keyboard focus. There are no round grip backgrounds or focus rings. The remaining sections below describe the preceding published release.

This preceding local iteration at `http://127.0.0.1:4183/` passed 76 tests and its production build. New event tests covered centisecond positions, shared timestamps, stable identity during renaming/moving, chronological ordering, nonmutation of other events, case boundaries and invalid annotations. In-app browser checks exercised creating two events, clicking to seek, pointer dragging, arrow-key movement, double-click editing, invalid-time rejection, renaming, deletion, Escape/focus return and clearing annotations when another file loads. Changing passage boundaries preserves events. Hiding index curves preserves the event flags.

The timeline remains 129.3984375 CSS pixels high with curves on or off, with two events, and at both 1021 × 1026 and 390 × 844 viewports. The complete presentation and timeline fit the desktop viewport. The mobile editor stays inside the viewport without horizontal overflow. Current compact-control evidence from synthetic data only is `/tmp/conox-timeline-curves-qa/compact-final.png`. The earlier editor checks remain documented in `/tmp/conox-timeline-curves-qa/event-editor.png` and `/tmp/conox-timeline-curves-qa/event-editor-mobile.png`. Pointer dragging moved the compact start handle from 5 to 7 seconds, the end handle from 28 to 25.97 seconds, and the playhead from 16.02 to 18.12 seconds. Actual geometry is 4 × 14 pixels for the visible range grips and 10 × 8 pixels for the playhead triangle; their transparent input areas are larger. Event flags and both curve visibility states still fit without increasing height. The user's open recording and unfinished annotation were not reloaded or edited during these checks. This preceding editor kept annotations in memory; the current case-save workflow above adds file persistence without altering source data. No changes from this prototype were committed, pushed or published.

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

## 2026-10-27: Android 2.4 / iOS reference profiles

Local browser verification used only a synthetic32-second case. Android displayed 3/6/9-second windows and±25/50/120/250/475 µV; iOS retained 2/4/8 seconds. qNOX 100 was blank in Android and 100 in iOS on identical source bytes. Profile changes retained the playhead,3× speed, selected passage and event marker, and normalized incompatible scales. The native dark-blue Android DSA showed the known2 Hz and 10 Hz tones, held invalid windows, and revealed no future columns. The5/30/60-minute presets retained real duration, while Whole case fitted the recording. The60-minute view used2-second cells.

The synthetic monitor used its generated128 Hz EEG as Android FFT input. Pause, profile changes and Live→profile change→Live off were checked; returning from an iOS 120-minute period correctly chose an Android 30-minute period. French, German and English controls were checked. A saved Android case restored6 s,250 µV,60 min,3×, position10 s, passage9..15 s and its event marker. A CRC-damaged replacement was rejected while the open case and marker remained intact.

All three PNG downloads were inspected (1600×1200,1600×1120,1600×900). The Android block PDF was rendered with Poppler and inspected. An actualH.264MP4 exported9..15 s at 3×, lasted2.1888 s including encoder overhead, and its first/last frames were inspected. DSA progressed with exported time and retained blank future regions. The full-screen four-block preview was also inspected.

`npm run check` passed136 tests, structure checks, Prettier and Vite build. The pre-existing bundle-size warning remains. A local private-source check confirmed CRC for 7400 retained frames,236800 identical display samples across profiles,44 Android bands versus45 iOS bands, and unchanged source bytes. No private measurements or identifiers were added to the repository. Native Android execution, physical calibration and device timing remain unverified. Nothing was published.

## 2026-10-27: DSA verification and overwrite EEG restored

An independent harness compiled the unmodified decompiled FFTCalculationThread Java class and compared1346 synthetic windows (DC, tones, mixed/noisy sequences, impulses, transitions and reset): all59224 encoded spectral bytes matched. Scaled power error stayed below8.04e-13. Existing REA method bodies were checked against the extracted constructor, FFTCalculation and realft. four1 came from a complementary extraction using the same JADX build; no new REA Evidence or Android execution is claimed.

Two rendering defects were corrected: Android initially fills its bitmap from the left, and one-second cells remain distinct logical pixels before a single filtered scaling. Replay DSA axes now stay at the last published5-second boundary while the EEG and index playhead continue normally. Synthetic silence and noise tests explain the cyan colour without altering the algorithm or claiming an electrode calibration. The original synthetic iOS-style DSA is explicitly labelled as the original educational model.

EEG overwrite sweep is the default again. Browser verification confirmed its cursor/erase gap, optional scrolling and independent profile selection. Recorded playback used the same synthetic case at32seconds and9seconds per window: sweep cursor5/9, with a successful PNG export inspected visually. The new choice is validated, restored from saved metadata and synchronized to remote demos. Missing settings use the original sweep. French controls and the updated iOS-model label were verified. No console errors were reported.

The local monitor screenshot and the reproducible mathematical/rendering audits are retained outside the repository in conoxview-dsa-verification. No private source data or new dependencies were added. No publication was performed.

## 2026-10-27: Publication split between simulation and recorded cases

The synthetic simulation retains only the historical display, without an iOS/Android selector or platform label. Its EEG uses the historical centred vertical projection and defaults to the original overwrite sweep. The shared 128 Hz sample history supports the optional scrolling mode without changing the generated signal. DSA and indices remain educational models; a common raw-EEG calculation pipeline is future work.

The recorded-case reader retains both ConoxView references and their distinct decoding/rendering paths. Local browser verification loaded the artificial32-second case in Android, switched to iOS at32 seconds with3× playback speed, and confirmed that position and speed remained unchanged. qNOX100 was unavailable under Android and displayed100 under iOS. Returning to the synthetic simulation restored its historical controls without a reference selector.

The synthetic Live check selected a120-minute period and8-second EEG window, enabled the temporary60-second Live period, then disabled it and recovered120 minutes. SEF50 remained operable. Remote settings from older Android peers are normalized to the synthetic scale set and cannot switch rendering engines. Automated coverage includes invalid Android scales, compatible settings and Live return periods.
