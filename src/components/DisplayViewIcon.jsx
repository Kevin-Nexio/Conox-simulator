export const DISPLAY_VIEWS = {
  "eeg-index": {
    label: "EEG + Indizes",
    description: "EEG-Wellenform mit Indexverlauf",
  },
  "dsa-index": {
    label: "DSA + Indizes",
    description: "EEG wird durch das Spektrogramm ersetzt",
  },
  "eeg-dsa": {
    label: "EEG + DSA",
    description: "Indexverlauf wird durch das Spektrogramm ersetzt",
  },
  all: {
    label: "Alle Grafiken",
    description: "EEG, Spektrogramm und Indexverlauf",
  },
  "dsa-only": {
    label: "Nur DSA",
    description: "Nur das Spektrogramm anzeigen",
  },
  "eeg-only": {
    label: "Nur EEG",
    description: "Nur die EEG-Wellenform anzeigen",
  },
};

export function DisplayViewIcon({ view }) {
  const showEeg = ["eeg-index", "eeg-dsa", "all", "eeg-only"].includes(view);
  const showDsa = ["dsa-index", "eeg-dsa", "all", "dsa-only"].includes(view);
  const showIndex = ["eeg-index", "dsa-index", "all"].includes(view);

  return (
    <span className={`sb-view-preview ${view}`} aria-hidden="true">
      {showEeg && <i className="mini-eeg" />}
      {showDsa && <i className="mini-dsa" />}
      {showIndex && <i className="mini-index" />}
    </span>
  );
}

export function renderDisplayViewIcon(view) {
  return <DisplayViewIcon view={view} />;
}

// Compatibility alias for the original v42 build terminology.
export const DISPLAY_VIEW_ICON = renderDisplayViewIcon;
