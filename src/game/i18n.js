import { METRICS, PATHS } from "./content.js";
import { PATTERN_REFERENCES } from "./scenarios.js";
import en from "./locales/en.json" with { type: "json" };
import fr from "./locales/fr.json" with { type: "json" };
import de from "./locales/de.json" with { type: "json" };
import frContent from "./locales/fr-content.json" with { type: "json" };
import deContent from "./locales/de-content.json" with { type: "json" };

export const GAME_LOCALES = [
  { code: "en", name: "English" },
  { code: "de", name: "Deutsch" },
  { code: "fr", name: "Français" },
];
export const GAME_LOCALE_KEY = "conox.game.locale";
const PATH_FIELDS = [
  "title",
  "audience",
  "tag",
  "description",
  "support",
  "outcome",
];
const MISSION_FIELDS = [
  "title",
  "intro",
  "prompt",
  "scene",
  "guide",
  "question",
  "takeaway",
  "reference",
];

// The existing English catalogue remains the source for both content and rules.
// Only these text fields are translated; IDs, scores, sources and scenarios stay shared.
export const EN_CONTENT = {};
function collect(prefix, item, fields) {
  for (const field of fields) EN_CONTENT[`${prefix}.${field}`] = item[field];
}
for (const metric of METRICS)
  collect(`metrics.${metric.id}`, metric, ["detail"]);
for (const reference of PATTERN_REFERENCES)
  collect(`references.${reference.scenarioId}`, reference, [
    "label",
    "description",
  ]);
for (const path of PATHS) {
  collect(`paths.${path.id}`, path, PATH_FIELDS);
  for (const mission of path.missions) {
    collect(`missions.${mission.id}`, mission, MISSION_FIELDS);
    for (const option of mission.options)
      collect(
        `missions.${mission.id}.options.${option.id}`,
        option,
        option.feedback ? ["label", "feedback"] : ["label"],
      );
  }
}

export const GAME_MESSAGES = {
  en: { ...en, ...EN_CONTENT },
  fr: { ...fr, ...frContent },
  de: { ...de, ...deContent },
};

export function supportedGameLocale(value) {
  const language =
    typeof value === "string" ? value.toLowerCase().split(/[-_]/)[0] : "";
  return GAME_LOCALES.some((item) => item.code === language) ? language : null;
}

export function getInitialGameLocale(environment = globalThis) {
  try {
    const storage = environment.localStorage;
    for (const key of [GAME_LOCALE_KEY, "conox.locale"]) {
      const saved = supportedGameLocale(storage?.getItem(key));
      if (saved) return saved;
    }
  } catch {
    // Privacy settings may block storage. Language detection still works.
  }
  const navigator = environment.navigator;
  for (const language of navigator?.languages ?? [navigator?.language]) {
    const supported = supportedGameLocale(language);
    if (supported) return supported;
  }
  return "en";
}

export function createGameI18n(requestedLocale) {
  const locale = supportedGameLocale(requestedLocale) ?? "en";
  const messages = GAME_MESSAGES[locale];
  const t = (key, values = {}) => {
    const template = messages[key] ?? GAME_MESSAGES.en[key] ?? key;
    return template.replace(/\{\{(\w+)\}\}/g, (_, name) => values[name] ?? "");
  };
  const translateFields = (prefix, item, fields) => ({
    ...item,
    ...Object.fromEntries(
      fields.map((field) => [field, t(`${prefix}.${field}`)]),
    ),
  });
  const localizeReference = (item) =>
    translateFields(`references.${item.scenarioId}`, item, [
      "label",
      "description",
    ]);
  return {
    locale,
    t,
    formatList: (items) =>
      new Intl.ListFormat(locale, { type: "conjunction" }).format(items),
    metrics: METRICS.map((item) =>
      translateFields(`metrics.${item.id}`, item, ["detail"]),
    ),
    paths: PATHS.map((path) => ({
      ...translateFields(`paths.${path.id}`, path, PATH_FIELDS),
      missions: path.missions.map((mission) => ({
        ...translateFields(`missions.${mission.id}`, mission, MISSION_FIELDS),
        options: mission.options.map((option) =>
          translateFields(
            `missions.${mission.id}.options.${option.id}`,
            option,
            option.feedback ? ["label", "feedback"] : ["label"],
          ),
        ),
        ...(mission.references
          ? { references: mission.references.map(localizeReference) }
          : {}),
      })),
    })),
  };
}
