# Saved simulator cases, version 1

This is a simulator-specific extension to a CXBIN recording. A saved file uses the `.cxbin` extension and a `-simulateur` filename suffix. Native ConoxView/device compatibility is unverified. This extension must not be represented as an official CXBIN specification.

The file contains the entire original upload, followed by UTF-8 JSON and an 80-byte footer. The original prefix is copied byte for byte, including unrecognized fields and startup frames excluded from playback. No EEG samples, index bytes, clocks or counters are reconstructed or changed. The saved passage is a playback selection; it does not crop the recording.

## Byte layout

Let `S` be the original byte length and `M` the JSON byte length. File length is exactly `S + M + 80`. All footer integers are unsigned 32-bit little endian. Offsets below are relative to the footer start.

| Offset | Length | Meaning                                            |
| ------ | ------ | -------------------------------------------------- |
| 0      | 16     | ASCII `CONOX-SIM-CASE` followed by two zero bytes  |
| 16     | 4      | Version, currently 1                               |
| 20     | 4      | `S`, original source length                        |
| 24     | 4      | `M`, metadata length                               |
| 28     | 4      | Reserved flags, must be zero                       |
| 32     | 32     | SHA-256 of the exact source plus JSON bytes        |
| 64     | 16     | ASCII `CONOX-SIM-END` followed by three zero bytes |

The checksum detects inconsistent source/metadata bytes. It is not a signature, proof of authorship or clinical validation. Footer structure, lengths, flags, version, JSON and state bounds are validated separately. Source length is limited to 64 MiB and must be a multiple of 1024; metadata is limited to 1 MiB. Unknown versions, damaged data and invalid state fail explicitly before replacing the open case.

## Metadata

The JSON root has `format: "conox-simulator-case"`, `version: 1`, a source filename without folders in `sourceName`, and a validated `state` object. State includes locale, playhead position, speed, selection start/end, one of the three presentation layouts, EEG/DSA scales, grid and SEF toggles, monitor graph composition, named event markers, timeline index visibility and hidden index curves, and a preferred video container. Unsupported video preferences fall back to an available browser format.

Positions use relative seconds at centisecond precision. Marker IDs are unique, labels contain 1 to 80 characters, and up to 5000 markers are accepted. State is checked against the decoded recording duration, never a metadata duration. Unknown JSON keys are not copied into application state. Reopening always pauses playback; fullscreen is a browser interaction rather than saved case state.

Plain CXBIN files still load directly. For an enriched case, the worker checks the extension, decodes the original source with the same parser, validates the state and regenerates filtered EEG/DSA. Before transferring the input buffer to the worker, the player takes an immutable Blob snapshot. Saving therefore does not depend on the input file remaining unchanged or available on disk. The player only commits the new case, original-prefix Blob slice and state after successful loading. Failed or cancelled imports preserve the previously open case and annotations.

Resaving uses the stored original Blob slice and replaces the metadata extension, rather than nesting enriched files. The “Download original CXBIN” action downloads that same exact source prefix with its original filename. Nothing overwrites the user's input file. Recordings and annotations are held in browser memory until saved/downloaded; neither is sent to demo sessions or a server.
