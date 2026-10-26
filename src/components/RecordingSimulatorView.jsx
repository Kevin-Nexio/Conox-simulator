import * as React from "react";
import {
  ConoxMonitor,
  ConoxMetrics,
  ConoxEegPanel,
  ConoxDsaPanel,
  ConoxQconPanel,
  ConoxBell,
} from "./ConoxMonitor.jsx";
import { DisplayViewIcon } from "./DisplayViewIcon.jsx";
import RecordingPlot from "./RecordingPlot.jsx";
import { getRecordedIndices } from "../recordings/vectorPlots.js";
import { formatPosition, getViewRange } from "../recordings/playback.js";
import "../styles/recordingScene.css";

/** The simulator's actual monitor components, fed by the imported recording. */
export default function RecordingSimulatorView({
  data,
  dsaImage,
  position,
  settings,
  layout,
  t,
  displayViews,
  playing = false,
  onTogglePlaying,
  onSeek,
  onSettingsChange,
  locked = false,
}) {
  const indices = getRecordedIndices(data.recording, position);
  const displayView = settings.monitorView || "eeg-dsa";
  const range = getViewRange(
    position,
    data.recording.durationSeconds,
    settings.dsaWindow || data.recording.durationSeconds,
  );
  const choices =
    displayView === "eeg-dsa"
      ? ["eeg-index", "dsa-index", "all"]
      : ["eeg-dsa", "eeg-only", "dsa-only"];
  const change = (next) => onSettingsChange?.(next);
  const timeLabels = Array.from({ length: 5 }, (_, i) => (
    <span key={i}>
      {formatPosition(range.start + ((range.end - range.start) * i) / 4)}
    </span>
  ));
  const captionActions = (
    <div className="sb-dsa-caption-actions">
      {["sef50", "sef95"].map((key) => (
        <button
          type="button"
          key={key}
          className={`sb-sef-toggle ${key === "sef95" ? "sef95" : ""} ${settings[key] ? "active" : ""}`}
          aria-pressed={settings[key]}
          disabled={locked}
          onClick={() => change({ [key]: !settings[key] })}
        >
          {key.toUpperCase()}
          <i aria-hidden="true" />
        </button>
      ))}
      <button
        type="button"
        className="sb-view-direct"
        disabled={locked}
        onClick={() =>
          change({
            monitorView: displayView === "dsa-only" ? "eeg-dsa" : "dsa-only",
          })
        }
      >
        {displayView === "dsa-only" ? "EEG" : t("dsa.only")}
      </button>
    </div>
  );
  return (
    <div className="recording-simulator-view">
      <ConoxMonitor
        borderless={layout === "simulator-screen"}
        brandLabel={t("brand.open")}
        frameControls={
          <>
            <div className="sb-live-switch off recording-case-status">
              <span className="sb-live-dot" aria-hidden="true" />
              <strong>{t("recording.title")}</strong>
              <small>{formatPosition(position, true)}</small>
            </div>
            <div
              className="sb-qcon-alarm-key off recording-case-status"
              title={t("recording.experimentalShort")}
            >
              <ConoxBell className="sb-frame-alarm-bell" />
            </div>
          </>
        }
      >
        <ConoxMetrics indices={indices} />
        <ConoxEegPanel
          displayView={displayView}
          caption={
            <>
              <b>EEG</b>
              <span>{t("eeg.frontal")}</span>
              <em>{settings.eegWindow} s</em>
            </>
          }
          scale={
            <>
              <span>+</span>
              <b>{settings.amplitude}</b>
              <small>µV*</small>
              <span>−</span>
            </>
          }
        >
          <RecordingPlot
            kind="eeg"
            data={data}
            dsaImage={dsaImage}
            position={position}
            settings={settings}
            axes={false}
            width={1000}
            height={170}
          />
        </ConoxEegPanel>
        <ConoxDsaPanel
          displayView={displayView}
          caption={
            <>
              <b>DSA</b>
              <span>EEG</span>
              {captionActions}
            </>
          }
          frequencyAxis={
            <>
              {[45, 40, 35, 30, 25, 20, 15, 10, 5, 0].map((v) => (
                <span key={v}>{v}</span>
              ))}
              <b>Hz</b>
            </>
          }
          colorScale={
            <>
              <div
                className="sb-db-gradient"
                role="img"
                aria-label={t("dsa.scale")}
              />
              <div className="sb-db-labels">
                <button
                  type="button"
                  aria-label={t("dsa.scaleUp")}
                  disabled={locked || settings.colorOffset >= 16}
                  onClick={() =>
                    change({
                      colorOffset: Math.min(16, settings.colorOffset + 4),
                    })
                  }
                >
                  +
                </button>
                <span className="recording-db-unit">dB</span>
                <button
                  type="button"
                  aria-label={t("dsa.scaleDown")}
                  disabled={locked || settings.colorOffset <= -16}
                  onClick={() =>
                    change({
                      colorOffset: Math.max(-16, settings.colorOffset - 4),
                    })
                  }
                >
                  −
                </button>
              </div>
            </>
          }
          timeline={timeLabels}
        >
          <RecordingPlot
            kind="dsa"
            data={data}
            dsaImage={dsaImage}
            position={position}
            settings={settings}
            axes={false}
            width={900}
            height={260}
          />
        </ConoxDsaPanel>
        <ConoxQconPanel
          value={indices?.qcon}
          status={`${t("recording.position")} ${formatPosition(position, true)}`}
        />
        <div className="sb-view-switch" aria-label={t("recording.layout")}>
          {choices.map((view) => (
            <button
              type="button"
              className="sb-view-option"
              key={view}
              disabled={locked}
              onClick={() => change({ monitorView: view })}
              aria-label={displayViews[view].label}
            >
              <DisplayViewIcon view={view} />
              <small>{displayViews[view].label}</small>
            </button>
          ))}
        </div>
        <section
          className={`sb-trendbox ${["eeg-index", "dsa-index", "all"].includes(displayView) ? "" : "hidden"} ${displayView === "all" ? "layout-all-bottom" : ""}`}
          aria-label={t("recording.trends")}
          aria-hidden={!["eeg-index", "dsa-index", "all"].includes(displayView)}
        >
          <div className="sb-trend-scale">
            {[100, 75, 50, 25, 0].map((v) => (
              <span key={v}>{v}</span>
            ))}
          </div>
          {["eeg-index", "dsa-index", "all"].includes(displayView) && (
            <RecordingPlot
              kind="trends"
              data={data}
              position={position}
              settings={settings}
              axes={false}
              width={600}
              height={180}
            />
          )}
          <div className="sb-trend-legend">
            {["qcon", "qnox", "bsr", "emg"].map((key) => (
              <b key={key} className={key}>
                {{ qcon: "qCON", qnox: "qNOX", bsr: "BSR", emg: "EMG" }[key]}
              </b>
            ))}
          </div>
          <div className="sb-trend-time">{timeLabels}</div>
        </section>
        <section className="sb-assistant sb-case-picker recording-monitor-case">
          <h3>{t("recording.title")}</h3>
          <p>
            {t("recording.position")}{" "}
            <strong>{formatPosition(position, true)}</strong>
          </p>
          <p>
            {t("recording.duration")}{" "}
            <strong>{formatPosition(data.recording.durationSeconds)}</strong>
          </p>
          <button type="button" disabled={locked} onClick={() => onSeek?.(0)}>
            {t("recording.restart")}
          </button>
          <button
            type="button"
            disabled={locked}
            aria-pressed={playing}
            onClick={onTogglePlaying}
          >
            {t(playing ? "recording.pause" : "recording.play")}
          </button>
        </section>
        <div className="sb-monitor-footer recording-monitor-footer">
          <span>{t("recording.experimentalShort")}</span>
        </div>
      </ConoxMonitor>
    </div>
  );
}
