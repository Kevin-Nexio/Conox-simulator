// Additional languages are static files, loaded only when selected.
export const EUROPE_LOCALES = [
  { code: "de", label: "DE", name: "Deutsch" },
  { code: "fr", label: "FR", name: "Français" },
  { code: "en", label: "EN", name: "English" },
  { code: "it", label: "IT", name: "Italiano" },
  { code: "es", label: "ES", name: "Español" },
  { code: "pt", label: "PT", name: "Português" },
  { code: "nl", label: "NL", name: "Nederlands" },
  { code: "da", label: "DA", name: "Dansk" },
  { code: "sv", label: "SV", name: "Svenska" },
  { code: "no", label: "NO", name: "Norsk" },
  { code: "fi", label: "FI", name: "Suomi" },
  { code: "is", label: "IS", name: "Íslenska" },
  { code: "et", label: "ET", name: "Eesti" },
  { code: "lv", label: "LV", name: "Latviešu" },
  { code: "lt", label: "LT", name: "Lietuvių" },
  { code: "pl", label: "PL", name: "Polski" },
  { code: "cs", label: "CS", name: "Čeština" },
  { code: "sk", label: "SK", name: "Slovenčina" },
  { code: "sl", label: "SL", name: "Slovenščina" },
  { code: "hr", label: "HR", name: "Hrvatski" },
  { code: "bs", label: "BS", name: "Bosanski" },
  { code: "sr", label: "SR", name: "Српски" },
  { code: "mk", label: "MK", name: "Македонски" },
  { code: "sq", label: "SQ", name: "Shqip" },
  { code: "ro", label: "RO", name: "Română" },
  { code: "hu", label: "HU", name: "Magyar" },
  { code: "bg", label: "BG", name: "Български" },
  { code: "el", label: "EL", name: "Ελληνικά" },
  { code: "tr", label: "TR", name: "Türkçe" },
  { code: "uk", label: "UK", name: "Українська" },
  { code: "ru", label: "RU", name: "Русский" },
  { code: "be", label: "BE", name: "Беларуская" },
  { code: "mt", label: "MT", name: "Malti" },
  { code: "ga", label: "GA", name: "Gaeilge" },
  { code: "hy", label: "HY", name: "Հայերեն" },
  { code: "ka", label: "KA", name: "ქართული" },
  { code: "az", label: "AZ", name: "Azərbaycanca" },
];
const loaded = {};
const pending = {};
const loaders = {
  it: () => import("./europe/it.js"),
  es: () => import("./europe/es.js"),
  pt: () => import("./europe/pt.js"),
  nl: () => import("./europe/nl.js"),
  da: () => import("./europe/da.js"),
  sv: () => import("./europe/sv.js"),
  no: () => import("./europe/no.js"),
  fi: () => import("./europe/fi.js"),
  is: () => import("./europe/is.js"),
  et: () => import("./europe/et.js"),
  lv: () => import("./europe/lv.js"),
  lt: () => import("./europe/lt.js"),
  pl: () => import("./europe/pl.js"),
  cs: () => import("./europe/cs.js"),
  sk: () => import("./europe/sk.js"),
  sl: () => import("./europe/sl.js"),
  hr: () => import("./europe/hr.js"),
  bs: () => import("./europe/bs.js"),
  sr: () => import("./europe/sr.js"),
  mk: () => import("./europe/mk.js"),
  sq: () => import("./europe/sq.js"),
  ro: () => import("./europe/ro.js"),
  hu: () => import("./europe/hu.js"),
  bg: () => import("./europe/bg.js"),
  el: () => import("./europe/el.js"),
  tr: () => import("./europe/tr.js"),
  uk: () => import("./europe/uk.js"),
  ru: () => import("./europe/ru.js"),
  be: () => import("./europe/be.js"),
  mt: () => import("./europe/mt.js"),
  ga: () => import("./europe/ga.js"),
  hy: () => import("./europe/hy.js"),
  ka: () => import("./europe/ka.js"),
  az: () => import("./europe/az.js"),
};
export const getLocaleCatalog = (locale) => loaded[locale];
export function supportedLocale(value) {
  const code =
    typeof value === "string" ? value.toLowerCase().split(/[-_]/)[0] : "";
  const normalized = code === "nb" || code === "nn" ? "no" : code;
  return EUROPE_LOCALES.some((item) => item.code === normalized)
    ? normalized
    : null;
}
export async function loadLocale(locale) {
  if (!loaders[locale] || loaded[locale]) return;
  pending[locale] ??= loaders[locale]()
    .then((module) => {
      loaded[locale] = module.default;
    })
    .catch((error) => {
      delete pending[locale];
      throw error;
    });
  return pending[locale];
}
