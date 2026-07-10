import { mockEventLedger } from "../data/mockEventLedger.js";
import {
  getEventsByCorrelationId,
  getLatestSequenceNo,
  validateEventLedger,
} from "../services/eventLedgerService.js";

function formatActor(actor) {
  if (!actor) return "unknown";
  return actor.actorId ? `${actor.displayName} (${actor.actorId})` : actor.displayName;
}

function formatTarget(target) {
  if (!target) return "unknown";
  return `${target.targetType}:${target.targetId}`;
}

export default function EventLedgerPanel({ ledger = mockEventLedger }) {
  const validation = validateEventLedger(ledger);
  const firstCorrelationId = ledger[0]?.correlationId || "";
  const correlationEvents = getEventsByCorrelationId(ledger, firstCorrelationId);
  const latestSequenceNo = getLatestSequenceNo(ledger, firstCorrelationId);

  return (
    <section className="panel event-ledger-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">P0-003 MOCK EVENT LEDGER</p>
          <h2>Mock Event Ledger</h2>
          <p className="lead">
            Read-only mock audit history for correlation, actor, target, and sequence checks. This is not a formal approval record, not a production log, and not evidence of external execution.
          </p>
        </div>
        <span className="badge">{validation.valid ? "valid mock ledger" : "invalid mock ledger"}</span>
      </div>

      <div className="stats mini-stats">
        <div className="stat-card"><span>Events</span><strong>{ledger.length}</strong><p>Mock records only</p></div>
        <div className="stat-card"><span>Correlation</span><strong>{validation.summary.correlations}</strong><p>{firstCorrelationId}</p></div>
        <div className="stat-card"><span>Latest Seq</span><strong>{latestSequenceNo}</strong><p>No sequence mutation</p></div>
        <div className="stat-card"><span>Validation</span><strong>{validation.errors.length}</strong><p>fail-closed errors</p></div>
      </div>

      <div className="event-ledger-table" aria-label="Mock Event Ledger read-only table">
        <div className="event-ledger-row event-ledger-row--head">
          <span>Seq</span>
          <span>Event</span>
          <span>Actor</span>
          <span>Target</span>
          <span>Occurred</span>
          <span>Value</span>
        </div>
        {correlationEvents.map((event) => (
          <div className="event-ledger-row" key={event.eventId}>
            <span>{event.sequenceNo}</span>
            <strong>{event.eventName}</strong>
            <span>{formatActor(event.actor)}</span>
            <span>{formatTarget(event.target)}</span>
            <span>{event.occurredAt}</span>
            <span>{event.valueType}</span>
          </div>
        ))}
      </div>

      <div className="mission-list">
        <div>Append-only helper: existing events are never edited, deleted, or replaced.</div>
        <div>Safety note: an event record does not grant execution permission, owner approval, publishing permission, or actual revenue recognition.</div>
        <div>Storage note: this panel reads static mock seed data and does not write Event Ledger data to LocalStorage.</div>
      </div>
    </section>
  );
}
