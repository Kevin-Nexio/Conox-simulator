import test from "node:test";
import assert from "node:assert/strict";
import { saveEventMarker } from "../src/recordings/eventMarkers.js";

test("named events retain exact positions and can share a timestamp", () => {
  const first = saveEventMarker(
    [],
    { id: "a", label: "  Induction  ", time: 12.345 },
    60,
  );
  assert.deepEqual(first, [{ id: "a", label: "Induction", time: 12.35 }]);
  const next = saveEventMarker(
    first,
    { id: "b", label: "Bolus", time: 12.35 },
    60,
  );
  assert.equal(next.length, 2);
  assert.equal(next[1].label, "Bolus");
  assert.equal(first.length, 1);
});

test("moving or renaming an event preserves its identity and other events", () => {
  const events = [
    { id: "a", label: "Induction", time: 10 },
    { id: "b", label: "Réveil", time: 40 },
  ];
  const updated = saveEventMarker(
    events,
    { id: "b", label: "Stimulus", time: 5 },
    60,
  );
  assert.deepEqual(updated, [
    { id: "b", label: "Stimulus", time: 5 },
    events[0],
  ]);
  assert.equal(events[1].label, "Réveil");
  assert.equal(events[1].time, 40);
});

test("events accept case boundaries but never silently clamp an invalid time", () => {
  for (const time of [0, 60])
    assert.ok(saveEventMarker([], { id: "a", label: "Limite", time }, 60));
  for (const time of [-1, 60.01, NaN, Infinity, null, "12"])
    assert.equal(
      saveEventMarker([], { id: "a", label: "Événement", time }, 60),
      null,
    );
  assert.equal(
    saveEventMarker([], { id: "a", label: "Événement", time: 0 }, 0),
    null,
  );
});

test("empty or oversized names and missing IDs cannot create unusable annotations", () => {
  for (const label of ["", "  ", null, "x".repeat(81)])
    assert.equal(saveEventMarker([], { id: "a", label, time: 10 }, 60), null);
  assert.equal(saveEventMarker([], { label: "Événement", time: 10 }, 60), null);
  assert.ok(
    saveEventMarker([], { id: "a", label: "x".repeat(80), time: 10 }, 60),
  );
});
