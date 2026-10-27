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
import {
  getRecordedFrame,
  getRecordingRange,
  formatPlotPosition,
} from "../recordings/vectorPlots.js";
import RecordingImpedances from "./RecordingImpedances.jsx";
import {
  RECORDING_DSA_GRADIENT,
  getDsaScaleTicks,
} from "../recordings/dsaScale.js";
import { formatPosition } from "../recordings/playback.js";
import "../styles/recordingScene.css";
import nativeLegend from "../assets/conoxview-dsa-scale.png?inline";
import androidLegend from "../assets/conoxview-android-dsa-scale.png?inline";
import {
  getReferenceProfile,
  isNativeSpectrum,
} from "../recordings/referenceProfiles.js";

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
  const frame = getRecordedFrame(data.recording, position);
  const indices = frame?.indices;
  const nativeSpectrum = isNativeSpectrum(data.spectrum);
  const profile = getReferenceProfile(data.referenceProfile);
  const android = profile.id === "android-2.4";
  const displayView = settings.monitorView || "eeg-dsa";
  const range = getRecordingRange(
    data.recording,
    position,
    settings.dsaWindow,
    { batchSeconds: android ? 5 : 0 },
  );
  const trendRange = getRecordingRange(
    data.recording,
    position,
    settings.dsaWindow,
  );
  const choices =
    displayView === "eeg-dsa"
      ? ["eeg-index", "dsa-index", "all"]
      : ["eeg-dsa", "eeg-only", "dsa-only"];
  const change = (next) => onSettingsChange?.(next);
  const cycle = (key, values) =>
    change({
      [key]: values[(values.indexOf(settings[key]) + 1) % values.length],
    });
  const labelsForRange = (range) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i}>
        {formatPlotPosition(range.start + ((range.end - range.start) * i) / 4)}
      </span>
    ));
  const timeLabels = labelsForRange(range);
  const captionActions = (
    <div className="sb-dsa-caption-actions">
      {(nativeSpectrum ? [] : ["sef50", "sef95"]).map((key) => (
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
    <div
      className="recording-simulator-view"
      data-sensor-severity={frame?.monitorState?.severity}
    >
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
        <ConoxMetrics indices={indices} missingValue={android ? "" : "--"} />
        <ConoxEegPanel
          displayView={displayView}
          caption={
            <>
              <b>EEG</b>
              <span>{t("reference.eegChannel")}</span>
              <button
                type="button"
                className="recording-scale-button"
                title={t("recording.nextEegWindow")}
                aria-label={t("recording.nextEegWindow")}
                disabled={locked}
                onClick={() => cycle("eegWindow", profile.eegWindows)}
              >
                {settings.eegWindow} s
              </button>
            </>
          }
          scale={
            <>
              <span>-</span>
              <button
                type="button"
                className="recording-scale-button"
                title={t("recording.nextAmplitude")}
                aria-label={t("recording.nextAmplitude")}
                disabled={locked}
                onClick={() => cycle("amplitude", profile.amplitudes)}
              >
                {android ? "±" : ""}
                {settings.amplitude}
              </button>
              <small>µV</small>
              <span>-</span>
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
              <span>{android ? "FFT (dB)" : "EEG"}</span>
              {captionActions}
            </>
          }
          frequencyAxis={
            <>
              {[
                45,
                40,
                35,
                30,
                25,
                20,
                15,
                10,
                5,
                nativeSpectrum && !android ? 1 : 0,
              ].map((v) => (
                <span key={v}>{v}</span>
              ))}
              <b>Hz</b>
            </>
          }
          colorScale={
            <>
              {nativeSpectrum ? (
                <img
                  className="recording-native-legend"
                  src={android ? androidLegend : nativeLegend}
                  alt={t("recording.referenceScale")}
                />
              ) : (
                <>
                  <div
                    className="recording-dsa-key"
                    role="img"
                    aria-label={t("dsa.scale")}
                  >
                    <div
                      className="recording-dsa-gradient"
                      style={{ background: RECORDING_DSA_GRADIENT }}
                    />
                    {getDsaScaleTicks(settings.colorOffset).map(
                      ({ value, fraction }) => (
                        <span
                          key={fraction}
                          className="recording-dsa-tick"
                          style={{ top: `${fraction * 100}%` }}
                        >
                          {value}
                        </span>
                      ),
                    )}
                  </div>
                  <div className="sb-db-labels recording-dsa-adjust">
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
              )}
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
          missingValue={android ? "" : "--"}
          value={indices?.qcon}
          statusClassName={`recording-sensor-${frame?.monitorState?.severity || "unknown"}`}
          status={t(
            `recording.state.${frame?.monitorState?.kind || "unknown"}`,
            { code: frame?.status },
          )}
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
          <div className="sb-trend-time">{labelsForRange(trendRange)}</div>
        </section>
        <section className="sb-assistant sb-case-picker recording-monitor-case">
          <h3>{t("recording.title")}</h3>
          <RecordingImpedances
            referenceProfile={profile.id}
            values={frame?.impedances}
            states={frame?.impedanceStates}
            t={t}
          />
          <p>
            {t("recording.position")}{" "}
            <strong>
              {formatPosition(position, true)} /{" "}
              {formatPosition(data.recording.durationSeconds)}
            </strong>
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
          <span>
            {profile.name} · {t("recording.experimentalShort")}
          </span>
        </div>
      </ConoxMonitor>
    </div>
  );
}
