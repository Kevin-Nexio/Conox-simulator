import * as React from "react";
import { formatPosition, parsePosition } from "../recordings/playback.js";

export default function RecordingEventEditor({
  initial,
  markers,
  duration,
  onSave,
  onDelete,
  onSeek,
  onClose,
  t,
}) {
  const dialogRef = React.useRef(null);
  const nameRef = React.useRef(null);
  const titleId = React.useId();
  const noteId = React.useId();
  const [draft, setDraft] = React.useState(() => ({
    ...initial,
    time: formatPosition(initial.time, true),
  }));
  const [error, setError] = React.useState(false);
  const close = () => {
    dialogRef.current.close();
    onClose();
  };
  React.useLayoutEffect(() => {
    const previous = document.activeElement;
    dialogRef.current.showModal();
    nameRef.current.focus();
    nameRef.current.select();
    return () => {
      if (dialogRef.current?.open) dialogRef.current.close();
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  const select = (marker) => {
    setDraft({ ...marker, time: formatPosition(marker.time, true) });
    setError(false);
    nameRef.current.focus();
    nameRef.current.select();
  };
  const save = (event) => {
    event.preventDefault();
    const time = parsePosition(draft.time);
    if (
      !draft.label.trim() ||
      time === null ||
      time < 0 ||
      time > duration ||
      !onSave({ ...draft, time })
    ) {
      setError(true);
      return;
    }
    close();
  };
  return (
    <dialog
      className="recording-event-dialog"
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={noteId}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div className="recording-event-dialog-heading">
        <h2 id={titleId}>{t("recording.eventMarkers")}</h2>
        <button
          type="button"
          className="recording-event-close"
          aria-label={t("recording.eventClose")}
          onClick={close}
        >
          ×
        </button>
      </div>
      <form onSubmit={save} className="recording-event-form">
        <label>
          {t("recording.eventName")}
          <input
            ref={nameRef}
            value={draft.label}
            maxLength={80}
            required
            onChange={(event) => {
              setDraft({ ...draft, label: event.target.value });
              setError(false);
            }}
          />
        </label>
        <label>
          {t("recording.eventTime")}
          <input
            type="text"
            inputMode="decimal"
            value={draft.time}
            aria-invalid={error || undefined}
            onChange={(event) => {
              setDraft({ ...draft, time: event.target.value });
              setError(false);
            }}
          />
        </label>
        <button type="submit" className="sb-btn">
          {t("recording.eventSave")}
        </button>
      </form>
      {error && (
        <p className="recording-event-error" role="alert">
          {t("recording.eventInvalid", {
            duration: formatPosition(duration, true),
          })}
        </p>
      )}
      <p id={noteId} className="recording-event-note">
        {t("recording.eventSessionOnly")}
      </p>
      {markers.length > 0 && (
        <ol className="recording-event-list">
          {markers.map((marker) => (
            <li key={marker.id}>
              <button
                type="button"
                className="recording-event-jump"
                title={t("recording.eventGo")}
                onClick={() => {
                  onSeek(marker.time);
                  close();
                }}
              >
                <time>{formatPosition(marker.time, true)}</time>
                <span>{marker.label}</span>
              </button>
              <button
                type="button"
                aria-label={`${t("recording.eventEdit")} : ${marker.label}`}
                onClick={() => select(marker)}
              >
                {t("recording.eventEdit")}
              </button>
              <button
                type="button"
                className="recording-event-delete"
                aria-label={`${t("recording.eventDelete")} : ${marker.label}`}
                onClick={() => {
                  onDelete(marker.id);
                  if (draft.id === marker.id)
                    setDraft({ ...draft, id: null, label: "" });
                }}
              >
                {t("recording.eventDelete")}
              </button>
            </li>
          ))}
        </ol>
      )}
    </dialog>
  );
}
