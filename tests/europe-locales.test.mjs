import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  EUROPE_LOCALES,
  loadLocale,
  getLocaleCatalog,
  supportedLocale,
} from "../src/i18n/catalog.js";
import { createGameI18n, GAME_MESSAGES } from "../src/game/i18n.js";
const source = JSON.parse(
  readFileSync(
    new URL("../scripts/i18n/source-en.json", import.meta.url),
    "utf8",
  ),
);
function flatten(v, path = "", out = {}) {
  if (typeof v === "string") out[path] = v;
  else if (v)
    for (const [key, value] of Object.entries(v))
      flatten(value, `${path}/${key}`, out);
  return out;
}
const placeholders = (value) =>
  [...value.matchAll(/\{\{\w+\}\}/g)].map((m) => m[0]).sort();
const tokens = (value) =>
  [
    ...value.matchAll(
      /\b(?:qCON|qNOX|CONOX|ConoxView|CXBIN|DSA|EEG|BSR|SQI|EMG)\b/g,
    ),
  ]
    .map((m) => m[0])
    .sort();
for (const { code } of EUROPE_LOCALES.filter(
  (item) => !["de", "fr", "en"].includes(item.code),
)) {
  test(`${code}: complete static catalogue, parameters and product names intact`, async () => {
    await loadLocale(code);
    const catalog = getLocaleCatalog(code),
      actual = flatten(catalog),
      expected = flatten(source);
    assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort());
    for (const [key, text] of Object.entries(actual)) {
      assert.ok(text.length > 0, `${code} ${key} empty`);
      assert.deepEqual(
        placeholders(text),
        placeholders(expected[key]),
        `${code} ${key} placeholders`,
      );
      assert.deepEqual(
        tokens(text),
        tokens(expected[key]),
        `${code} ${key} identifiers`,
      );
      assert.doesNotMatch(text, /ZXQPH|__K\d/, `${code} ${key} marker`);
    }
    const game = createGameI18n(code);
    assert.equal(game.t("common.start"), catalog.game["common.start"]);
    assert.deepEqual(
      Object.keys(catalog.game).sort(),
      Object.keys(GAME_MESSAGES.en).sort(),
    );
    const baseline = createGameI18n("en").paths;
    for (const [i, path] of game.paths.entries())
      for (const [j, mission] of path.missions.entries()) {
        assert.equal(mission.id, baseline[i].missions[j].id);
        assert.deepEqual(
          mission.options.map(({ id, correct }) => ({ id, correct })),
          baseline[i].missions[j].options.map(({ id, correct }) => ({
            id,
            correct,
          })),
        );
      }
  });
}
test("national language matching and Norwegian variants", () => {
  assert.equal(EUROPE_LOCALES.length, 37);
  assert.equal(supportedLocale("nb-NO"), "no");
  assert.equal(supportedLocale("it-CH"), "it");
  assert.equal(supportedLocale("rm-CH"), null);
});
