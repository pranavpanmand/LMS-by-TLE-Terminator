import React from "react";
import { Handle, Position } from "@xyflow/react";

/* =========================
   Constants (consistent geometry)
   ========================= */

const S = {
  nodeW: 180,
  nodeH: 56,

  ovalW: 180,
  ovalH: 52,

  diamond: 120, // square rotated
  merge: 56,

  ioW: 190,
  ioH: 58,

  directionW: 210,
  directionH: 58,

  border: 2,
  handle: 10,
};

/* =========================
   Handles
   ========================= */

function HandlesAllSides({ connectable = true }) {
  const common = {
    isConnectable: connectable,
    style: { width: S.handle, height: S.handle, borderWidth: 2 },
  };
  return (
    <>
      <Handle type="target" position={Position.Top} id="t" {...common} />
      <Handle type="source" position={Position.Top} id="ts" {...common} />
      <Handle type="target" position={Position.Right} id="r" {...common} />
      <Handle type="source" position={Position.Right} id="rs" {...common} />
      <Handle type="target" position={Position.Bottom} id="b" {...common} />
      <Handle type="source" position={Position.Bottom} id="bs" {...common} />
      <Handle type="target" position={Position.Left} id="l" {...common} />
      <Handle type="source" position={Position.Left} id="ls" {...common} />
    </>
  );
}

/* =========================
   Base node (consistent padding + typography)
   ========================= */

function BaseCard({
  label,
  bg,
  border,
  text,
  width,
  height,
  rounded,
  selected,
  children,
  style,
}) {
  return (
    <div
      style={{
        width,
        height,
        padding: "10px 14px",
        borderRadius: rounded,
        border: `${S.border}px solid ${selected ? "#38BDF8" : border}`,
        background: bg,
        color: text,
        boxShadow: "0 1px 10px rgba(15,23,42,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 13,
        textAlign: "center",
        lineHeight: 1.15,
        position: "relative",
        ...style,
      }}
    >
      <div style={{ maxWidth: "100%", padding: "0 4px", overflow: "hidden", textOverflow: "ellipsis" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

/* =========================
   Node types
   ========================= */

export function StartNode({ data, selected }) {
  return (
    <BaseCard
      label={data?.label ?? "Start"}
      bg={data?.bg || "#E8F5E9"}
      border={data?.border || "#A5D6A7"}
      text={data?.text || "#0F172A"}
      width={S.ovalW}
      height={S.ovalH}
      rounded={999}
      selected={selected}
    >
      <HandlesAllSides />
    </BaseCard>
  );
}

export function EndNode({ data, selected }) {
  return (
    <BaseCard
      label={data?.label ?? "End"}
      bg={data?.bg || "#FFEBEE"}
      border={data?.border || "#FFCDD2"}
      text={data?.text || "#0F172A"}
      width={S.ovalW}
      height={S.ovalH}
      rounded={999}
      selected={selected}
    >
      <HandlesAllSides />
    </BaseCard>
  );
}

export function ProcessNode({ data, selected }) {
  return (
    <BaseCard
      label={data?.label ?? "Process"}
      bg={data?.bg || "#E3F2FD"}
      border={data?.border || "#90CAF9"}
      text={data?.text || "#0F172A"}
      width={S.nodeW}
      height={S.nodeH}
      rounded={18}
      selected={selected}
    >
      <HandlesAllSides />
    </BaseCard>
  );
}

export function InputNode({ data, selected }) {
  // Parallelogram with consistent size
  const bg = data?.bg || "#FFFDE7";
  const border = selected ? "#38BDF8" : data?.border || "#FFE082";
  const text = data?.text || "#0F172A";

  return (
    <div style={{ width: S.ioW, height: S.ioH, position: "relative" }}>
      <HandlesAllSides />
      <div
        style={{
          width: "100%",
          height: "100%",
          background: bg,
          border: `${S.border}px solid ${border}`,
          borderRadius: 16,
          transform: "skewX(-12deg)",
          boxShadow: "0 1px 10px rgba(15,23,42,0.08)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 16px",
          fontWeight: 700,
          fontSize: 13,
          color: text,
          textAlign: "center",
        }}
      >
        {data?.label ?? "Input / Output"}
      </div>
    </div>
  );
}

export function DecisionNode({ data, selected }) {
  // Diamond with consistent size
  const bg = data?.bg || "#F3E8FF";
  const border = selected ? "#38BDF8" : data?.border || "#C4B5FD";
  const text = data?.text || "#0F172A";

  return (
    <div style={{ width: S.diamond, height: S.diamond, position: "relative" }}>
      <HandlesAllSides />
      <div
        style={{
          position: "absolute",
          inset: 10,
          transform: "rotate(45deg)",
          background: bg,
          border: `${S.border}px solid ${border}`,
          borderRadius: 20,
          boxShadow: "0 1px 10px rgba(15,23,42,0.08)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 10px",
          fontWeight: 800,
          fontSize: 13,
          color: text,
          textAlign: "center",
          lineHeight: 1.15,
        }}
      >
        {data?.label ?? "Decision"}
      </div>
    </div>
  );
}

export function MergeNode({ data, selected }) {
  return (
    <div style={{ width: S.merge, height: S.merge, position: "relative" }}>
      <HandlesAllSides />
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 999,
          background: data?.bg || "#F1F5F9",
          border: `${S.border}px solid ${selected ? "#38BDF8" : data?.border || "#CBD5E1"}`,
          boxShadow: "0 1px 10px rgba(15,23,42,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          color: data?.text || "#0F172A",
        }}
      >
        {data?.label ?? "•"}
      </div>
    </div>
  );
}

export function DirectionNode({ data, selected }) {
  const dir = data?.dir || "right";
  const arrow = { right: "→", left: "←", up: "↑", down: "↓" }[dir];

  return (
    <BaseCard
      label=""
      bg={data?.bg || "#ECFEFF"}
      border={data?.border || "#67E8F9"}
      text={data?.text || "#0F172A"}
      width={S.directionW}
      height={S.directionH}
      rounded={18}
      selected={selected}
      style={{ justifyContent: "space-between", padding: "10px 14px" }}
    >
      <HandlesAllSides />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%" }}>
        <div style={{ fontWeight: 800, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {data?.label ?? "Direction"}
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1 }}>{arrow}</div>
      </div>
    </BaseCard>
  );
}

/* =========================
   Export nodeTypes map
   ========================= */

export const nodeTypes = {
  start: StartNode,
  end: EndNode,
  process: ProcessNode,
  decision: DecisionNode,
  io: InputNode,
  merge: MergeNode,
  direction: DirectionNode,
};