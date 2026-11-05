import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import {
  createGameI18n,
  GAME_MESSAGES,
  GAME_LOCALE_KEY,
  getInitialGameLocale,
} from "../src/game/i18n.js";
import {
  METRICS,
  PATHS,
  mergeResult,
  parseProgress,
  isUnlocked,
} from "../src/game/content.js";
import { scenarioFor } from "../src/game/scenarios.js";

const placeholders = (value) =>
  [...value.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort();

test("all three game languages cover the same text and interpolation parameters", () => {
  const keys = Object.keys(GAME_MESSAGES.en).sort();
  for (const [locale, messages] of Object.entries(GAME_MESSAGES)) {
    assert.deepEqual(
      Object.keys(messages).sort(),
      keys,
      `${locale}: missing or obsolete translations`,
    );
    for (const key of keys) {
      assert.equal(typeof messages[key], "string", `${locale}.${key}`);
      assert.ok(messages[key].trim(), `${locale}.${key}: empty translation`);
      assert.deepEqual(
        placeholders(messages[key]),
        placeholders(GAME_MESSAGES.en[key]),
        `${locale}.${key}`,
      );
    }
  }
});

test("game components only request keys provided by every language", () => {
  const folder = new URL("../src/game/", import.meta.url);
  for (const file of readdirSync(folder).filter((name) =>
    name.endsWith(".jsx"),
  )) {
    const source = readFileSync(new URL(file, folder), "utf8");
    for (const [, key] of source.matchAll(/\bt\(\s*["']([^"']+)["']/g)) {
      for (const [locale, messages] of Object.entries(GAME_MESSAGES)) {
        assert.ok(Object.hasOwn(messages, key), `${file}: ${locale}.${key}`);
      }
    }
  }
});

test("translated missions preserve answers, evidence, scenarios and saved progress", () => {
  const original = structuredClone(PATHS);
  const score = mergeResult({}, "explore-goal", 85);
  const saved = JSON.stringify({ version: 3, results: score });
  for (const locale of ["en", "fr", "de"]) {
    const { paths, metrics } = createGameI18n(locale);
    assert.equal(paths.length, 3);
    assert.deepEqual(
      metrics.map(({ id, label, selector }) => ({ id, label, selector })),
      METRICS.map(({ id, label, selector }) => ({ id, label, selector })),
    );
    for (const [i, path] of paths.entries()) {
      assert.equal(path.id, PATHS[i].id);
      assert.equal(path.missions.length, 4);
      for (const [j, mission] of path.missions.entries()) {
        const source = PATHS[i].missions[j];
        assert.equal(mission.id, source.id);
        assert.equal(mission.kind, source.kind);
        assert.equal(mission.url, source.url);
        assert.deepEqual(mission.evidence, source.evidence);
        assert.equal(scenarioFor(mission), scenarioFor(source));
        assert.deepEqual(
          mission.options.map(({ id, correct }) => ({ id, correct })),
          source.options.map(({ id, correct }) => ({ id, correct })),
        );
        if (mission.references) {
          assert.deepEqual(
            mission.references.map(scenarioFor),
            source.references.map(scenarioFor),
          );
        }
        if (locale !== "en") {
          assert.notEqual(mission.question, source.question);
          assert.notEqual(mission.takeaway, source.takeaway);
          for (const [k, option] of mission.options.entries()) {
            assert.notEqual(option.label, source.options[k].label);
            if (option.feedback)
              assert.notEqual(option.feedback, source.options[k].feedback);
          }
        }
      }
    }
    assert.ok(isUnlocked(paths[1], 1, parseProgress(saved)));
    assert.equal(isUnlocked(paths[1], 2, parseProgress(saved)), false);
    assert.deepEqual(parseProgress(saved), score);
  }
  assert.deepEqual(
    PATHS,
    original,
    "localization must not mutate the shared catalogue",
  );
});

test("language choice prefers the game preference, then simulator, then supported browser languages", () => {
  const env = (saved, languages = ["de-CH"]) => ({
    localStorage: { getItem: (key) => saved[key] ?? null },
    navigator: { languages },
  });
  assert.equal(
    getInitialGameLocale(
      env({ [GAME_LOCALE_KEY]: "fr", "conox.locale": "de" }),
    ),
    "fr",
  );
  assert.equal(getInitialGameLocale(env({ "conox.locale": "en" })), "en");
  assert.equal(
    getInitialGameLocale(
      env({ [GAME_LOCALE_KEY]: "invalid" }, ["it-CH", "FR-CH"]),
    ),
    "it",
  );
  assert.equal(getInitialGameLocale(env({})), "de");
  assert.equal(getInitialGameLocale(env({}, ["es-ES"])), "es");
  assert.equal(
    getInitialGameLocale({ navigator: { language: "fr-CH" } }),
    "fr",
  );
  assert.equal(getInitialGameLocale({}), "en");
});

test("blocked storage does not prevent loading or browser language detection", () => {
  const env = {
    get localStorage() {
      throw new Error("Storage unavailable");
    },
    navigator: { languages: ["de-CH"] },
  };
  assert.equal(getInitialGameLocale(env), "de");
  assert.equal(
    getInitialGameLocale({
      localStorage: {
        getItem() {
          throw new Error("Blocked");
        },
      },
    }),
    "en",
  );
});

test("feedback uses the current language, complete sentences and an English fallback", () => {
  const fr = createGameI18n("fr-CH");
  const de = createGameI18n("de-CH");
  assert.equal(fr.formatList(["SQI", "EEG / DSA"]), "SQI et EEG / DSA");
  assert.equal(de.formatList(["SQI", "EEG / DSA"]), "SQI und EEG / DSA");
  assert.equal(
    fr.t("home.completed", { done: 0, total: 4 }),
    "0 / 4 terminées",
  );
  assert.equal(de.t("mission.role", { index: "qCON" }), "Aufgabe von qCON");
  assert.equal(createGameI18n("unsupported").t("common.start"), "Start");
  assert.equal(fr.t("unknown.key"), "unknown.key");
});
