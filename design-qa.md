# Recorded case views: visual verification

final result: passed

## Source and implementation

The framed reference is `/var/folders/jd/szqcwwdd0ss1s91_jcfy5z000000gq/T/codex-clipboard-107f361c-4a04-4e94-987c-40ca18a8d769.png`, 2536 × 1762 pixels. The screen-only reference is `/var/folders/jd/szqcwwdd0ss1s91_jcfy5z000000gq/T/codex-clipboard-2d4f82a5-0d89-44e8-b751-7310b12e1271.png`, 5114 × 2880 pixels.

The existing simulator components were extracted into ConoxMonitor and reused in both the simulator and the recording player. The case uses its recorded signals, relative time and provisional-value notice. Synthetic case choices, classifications, LIVE status and device latency claims were intentionally replaced by recording information and playback controls.

Chrome rendered the local production build at `http://127.0.0.1:4173/`. Browser screenshots are `/tmp/conox-final-qa/screen-desktop.png`, `/tmp/conox-final-qa/frame-fullscreen.png`, `/tmp/conox-final-qa/screen-fullscreen.png` and `/tmp/conox-final-qa/blocks-final.png`. Captures are 1440 × 900 pixels at the browser's screenshot density. The other initial browser capture was 2560 × 1204 pixels. Requested smaller viewport overrides did not take effect; screenshots with a `1366` filename are also 1440 × 900 and do not constitute smaller-screen evidence.

The frame export is 1600 × 1120; the borderless export is 1600 × 900; the four-block SVG is 1600 × 1200. Source and implementation were normalized without stretching to 800 × 560 and 800 × 450 for comparison. Side-by-side full-view evidence is `/tmp/conox-final-qa/frame-comparison.png` and `/tmp/conox-final-qa/screen-comparison.png`. Recording data and simulator data represent different states; numerical values and signal shapes are not fidelity targets.

## Fidelity surfaces

Typography uses the original monitor components and their existing font stacks, weights and size limits. Four-block titles, values, units, axes and time labels are native SVG text. Its EEG, SEF and index curves are vector paths. The inspected browser scene contained 60 text elements, no presentation canvas, and one raster image containing only the DSA power map. The final PDF contains selectable accented text and exactly one embedded DSA image.

Layout follows the original metric strip, EEG above DSA, right qCON panel, view switch, case panel, frame and wordmark. Original CSS proportions and container units are reused. Passage and export controls share one toolbar. At 1440 × 900, document height is 900 pixels and both timeline and complete presentation remain visible. Display settings, file information and help are collapsible.

Colours, gradients, borders and monitor icons come from the simulator's existing styles and assets. Recorded trend legend colours match their plotted paths. The actual Fresenius Kabi and CONOX PNG assets are reused. Focused inspection of the exported frame at intrinsic resolution checked the logos, metric headers, qCON typography, graph captions, controls and footer. No new approximated brand assets were introduced.

Copy identifies an experimental imported recording. It does not copy synthetic classifications or imply that recorded values have been clinically validated. Missing indices remain gaps or `--`.

## Comparison history and repairs

The first frame export omitted the CONOX wordmark because its automatic image height was measured before decoding. This was a P1 asset mismatch. The export now waits for image decoding before snapshotting. Post-fix evidence is `/tmp/conox-final-qa/final-frame.png`, with both brand assets present.

Review also found a misleading native case button and mismatched trend legend colours. The button now says “Retour au début”; the legend uses the plotted colours. Hidden index trends are no longer generated in EEG + DSA mode. The export host explicitly clears the application's viewport minimum height so intrinsic export dimensions stay fixed.

No actionable P0, P1 or P2 visual differences remain for the tested desktop state. The source screen-only reference has a different original viewport and pixel density, so absolute font sizes at that source resolution are not compared as if both sources were identical viewports.

## Functional verification and limits

All five layout choices remain available. PNG files were downloaded for each. PNG, PDF and native H.264 video downloads were verified for the four-block view and both reused simulator views. The final optimized video decodes at 1600 × 900; its waveform and relative time advance between frames. The four-block PDF was parsed to verify selectable French text, units and its single DSA image. Fullscreen entry/exit, original graph switches and SEF controls were exercised. The browser error log was empty. Automated checks pass 67 tests, including export cancellation, time boundaries, missing-data gaps, translation parity and vector-PDF byte offsets.

Chrome is the verified browser for HTML-based monitor exports. Safari and the smaller mobile viewport were not verified in this run. Unsupported or unreadable HTML snapshots fail visibly instead of returning empty files. Private recording data and test exports remain outside the repository and published site.
