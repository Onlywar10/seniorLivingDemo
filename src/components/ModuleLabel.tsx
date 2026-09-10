import { modules, type ModuleKey, type Lane } from "@/data/community";

const laneText: Record<Lane, string> = {
  fast: "Fast lane",
  approval: "Approval required",
  urgent: "Urgent · bypasses approval",
};

export function LaneTag({ lane }: { lane: Lane }) {
  return <span className={`lane lane-${lane}`}>{laneText[lane]}</span>;
}

/** Visible only when module structure is switched on (html[data-structure="on"]). */
export function ModuleLabel({ k, note }: { k: ModuleKey; note?: string }) {
  const m = modules[k];
  return (
    <div className="module-label" role="note" aria-label={`Module structure: ${m.name}`}>
      <span className="ml-k">{m.number ? `Module ${m.number}` : "Module"}</span>
      <span className="ml-v">
        <b>{m.name}</b>
      </span>
      <span className="ml-k">Editor</span>
      <span className="ml-v">{m.editor}</span>
      <span className="ml-k">Content type</span>
      <span className="ml-v">{m.contentType}</span>
      <span className="ml-k">Lane</span>
      <span className="ml-v">
        <LaneTag lane={m.lane} /> {note ?? m.laneNote}
      </span>
    </div>
  );
}
