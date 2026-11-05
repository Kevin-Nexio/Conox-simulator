import test from "node:test";
import assert from "node:assert/strict";
import {
  getPlaybackShortcut,
  isPlaybackControl,
  restorePlaybackFocusAfterPointer,
} from "../src/recordings/playbackShortcuts.js";

const context = {
  fullscreen: true,
  locked: false,
  position: 12,
  duration: 100,
};
const command = (event, changes = {}) =>
  getPlaybackShortcut(event, { ...context, ...changes });
const element = (tagName, attributes = {}, parentElement = null) => ({
  tagName,
  parentElement,
  getAttribute: (name) => attributes[name] ?? null,
});

test("fullscreen playback shortcuts seek by 5 s or 30 s and clamp to case bounds", () => {
  assert.deepEqual(command({ key: "ArrowLeft" }), {
    type: "seek",
    position: 7,
    preservePlaying: true,
  });
  assert.deepEqual(command({ key: "ArrowRight" }), {
    type: "seek",
    position: 17,
    preservePlaying: true,
  });
  assert.deepEqual(command({ key: "ArrowLeft", shiftKey: true }), {
    type: "seek",
    position: 0,
    preservePlaying: true,
  });
  assert.deepEqual(
    command({ key: "ArrowRight", shiftKey: true }, { position: 95 }),
    { type: "seek", position: 100, preservePlaying: true },
  );
  assert.equal(command({ key: "ArrowRight" }, { duration: NaN }), null);
});

test("Space toggles once while arrow key repeat remains available", () => {
  assert.deepEqual(command({ key: " " }), { type: "toggle" });
  assert.equal(command({ key: " ", repeat: true }), null);
  assert.deepEqual(command({ key: "ArrowRight", repeat: true }), {
    type: "seek",
    position: 17,
    preservePlaying: true,
  });
});

test("shortcuts work in normal view but remain disabled during export and composition", () => {
  assert.deepEqual(command({ key: " " }, { fullscreen: false }), {
    type: "toggle",
  });
  assert.deepEqual(
    command(
      { key: "ArrowRight", repeat: true },
      { fullscreen: false, position: 17 },
    ),
    { type: "seek", position: 22, preservePlaying: true },
  );
  assert.equal(command({ key: " " }, { locked: true }), null);
  for (const property of [
    "defaultPrevented",
    "isComposing",
    "ctrlKey",
    "altKey",
    "metaKey",
  ])
    assert.equal(command({ key: "ArrowRight", [property]: true }), null);
  assert.equal(command({ key: "ArrowDown" }), null);
});

test("native controls, editable text and nested button content retain their keys", () => {
  for (const tag of ["INPUT", "SELECT", "TEXTAREA", "BUTTON", "A", "SUMMARY"])
    assert.equal(command({ key: " ", target: element(tag) }), null);
  const buttonChild = element(
    "path",
    {},
    element("svg", {}, element("BUTTON")),
  );
  assert.equal(command({ key: " ", target: buttonChild }), null);
  const editor = element("DIV", { contenteditable: "plaintext-only" });
  assert.equal(
    command({ key: "ArrowRight", target: element("SPAN", {}, editor) }),
    null,
  );
  assert.equal(
    command({ key: "ArrowRight", target: element("DIV", { role: "slider" }) }),
    null,
  );
  assert.equal(
    isPlaybackControl(element("DIV", { contenteditable: "false" })),
    false,
  );
  assert.deepEqual(
    command({ key: " ", target: element("DIV", { role: "dialog" }) }),
    { type: "toggle" },
  );
});

test("pointer button activation restores stage focus for subsequent playback shortcuts", () => {
  let active;
  const stage = element("DIV", { role: "dialog" });
  stage.focus = (options) => {
    assert.deepEqual(options, { preventScroll: true });
    active = stage;
  };
  const button = element("BUTTON", {}, stage);
  const icon = element("svg", {}, button);
  active = button;
  assert.equal(
    restorePlaybackFocusAfterPointer(
      { detail: 1, target: icon, currentTarget: stage },
      true,
    ),
    true,
  );
  assert.equal(active, stage);
  assert.deepEqual(command({ key: " ", target: active }), { type: "toggle" });
  assert.deepEqual(command({ key: "ArrowRight", target: active }), {
    type: "seek",
    position: 17,
    preservePlaying: true,
  });
});

test("keyboard button activation and editing clicks retain focus", () => {
  let focusCalls = 0;
  const stage = element("DIV", { role: "dialog" });
  stage.focus = () => focusCalls++;
  const button = element("BUTTON", {}, stage);
  const click = (target, detail = 1) => ({
    target,
    detail,
    currentTarget: stage,
  });
  assert.equal(restorePlaybackFocusAfterPointer(click(button, 0), true), false);
  for (const tag of ["INPUT", "SELECT", "TEXTAREA", "SPAN"])
    assert.equal(
      restorePlaybackFocusAfterPointer(click(element(tag, {}, stage)), true),
      false,
    );
  assert.equal(
    restorePlaybackFocusAfterPointer(
      click(element("SPAN", { contenteditable: "" }, button)),
      true,
    ),
    false,
  );
  assert.equal(
    restorePlaybackFocusAfterPointer(click(element("BUTTON")), true),
    false,
  );
  assert.equal(focusCalls, 0);
});

test("pointer transport clicks restore focus in normal view too", () => {
  let focused = false;
  const reader = element("MAIN");
  reader.focus = () => {
    focused = true;
  };
  const button = element("BUTTON", {}, reader);
  assert.equal(
    restorePlaybackFocusAfterPointer({
      detail: 1,
      target: button,
      currentTarget: reader,
    }),
    true,
  );
  assert.equal(focused, true);
});
