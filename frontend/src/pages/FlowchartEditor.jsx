import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import axios from "axios";
import { nodeTypes } from "../components/FlowNodes";

/* =========================
   LMS API client
   isAuth.js reads from req.cookies.token — so withCredentials: true is required
   ========================= */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  withCredentials: true,   // sends the httpOnly cookie that isAuth.js reads
});

/* =========================
   Helpers
   ========================= */

function nextId(prefix, existing) {
  let i = 1;
  while (existing.has(`${prefix}${i}`)) i++;
  return `${prefix}${i}`;
}

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || el.isContentEditable;
}

function formatAxiosError(e) {
  const status = e?.response?.status;
  const data = e?.response?.data;
  const msg = data?.error || data?.message || e?.message || "Unknown error";
  return {
    message: msg,
    details: {
      status,
      url: e?.config?.url,
      method: e?.config?.method,
      response: data,
    },
  };
}

/* =========================
   Options
   ========================= */

const NODE_TYPE_OPTIONS = [
  { value: "start",     label: "Start (oval)" },
  { value: "process",   label: "Process (rounded)" },
  { value: "decision",  label: "Decision (diamond)" },
  { value: "io",        label: "Input/Output (parallelogram)" },
  { value: "merge",     label: "Merge (circle)" },
  { value: "direction", label: "Direction (arrow inside)" },
  { value: "end",       label: "End (oval)" },
];

const EDGE_TYPE_OPTIONS = [
  { value: "default",    label: "Default" },
  { value: "straight",   label: "Straight" },
  { value: "step",       label: "Step" },
  { value: "smoothstep", label: "Smooth" },
];

const EDGE_MARKER_OPTIONS = [
  { value: "arrow",  label: "Arrow" },
  { value: "closed", label: "Closed Arrow" },
  { value: "none",   label: "None" },
];

const ALLOWED_NODE_TYPES = new Set([
  "start", "end", "process", "decision", "io", "merge", "direction",
]);

const ALLOWED_EDGE_TYPES = new Set([
  "smoothstep", "step", "straight", "default",
]);

/* =========================
   sanitizeGraph — exact copy from original FlowX Editor
   cleans up AI output before rendering
   ========================= */
function uniqueIds(items, prefix) {
  const seen = new Set();
  return items.map((it, idx) => {
    let id = String(it.id || `${prefix}${idx + 1}`);
    while (seen.has(id))
      id = `${prefix}${idx + 1}_${Math.random().toString(16).slice(2, 6)}`;
    seen.add(id);
    return { ...it, id };
  });
}

function sanitizeGraph(raw) {
  const g = raw || { nodes: [], edges: [] };

  const SOURCE_HANDLES = new Set(["ts", "rs", "bs", "ls"]);
  const TARGET_HANDLES = new Set(["t", "r", "b", "l"]);

  // --- nodes ---
  let nodes = (g.nodes || []).map((n, i) => {
    const type = ALLOWED_NODE_TYPES.has(n?.type) ? n.type : "process";
    const data = n?.data || {};
    return {
      id: String(n?.id || `n${i + 1}`),
      type,
      position: {
        x: Number.isFinite(n?.position?.x) ? n.position.x : i * 260,
        y: Number.isFinite(n?.position?.y) ? n.position.y : 0,
      },
      data: {
        label:  typeof data.label  === "string" ? data.label  : "",
        bg:     typeof data.bg     === "string" ? data.bg     : "#E3F2FD",
        border: typeof data.border === "string" ? data.border : "#90CAF9",
        text:   typeof data.text   === "string" ? data.text   : "#0F172A",
        dir:
          type === "direction"
            ? ["right", "left", "up", "down"].includes(data.dir)
              ? data.dir
              : "right"
            : "right",
      },
    };
  });

  nodes = uniqueIds(nodes, "n");
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const nodeIdSet = new Set(nodes.map((n) => n.id));

  // --- edges ---
  let edges = (g.edges || []).map((e, i) => ({
    id:           String(e?.id || `e${i + 1}`),
    source:       String(e?.source || ""),
    target:       String(e?.target || ""),
    type:         ALLOWED_EDGE_TYPES.has(e?.type) ? e.type : "smoothstep",
    label:        typeof e?.label === "string" ? e.label : "",
    animated:     Boolean(e?.animated),
    sourceHandle: SOURCE_HANDLES.has(e?.sourceHandle) ? e.sourceHandle : null,
    targetHandle: TARGET_HANDLES.has(e?.targetHandle) ? e.targetHandle : null,
    style:        e?.style,
    markerEnd:    e?.markerEnd,
  }));

  edges = uniqueIds(edges, "e");

  // 1) Remove invalid endpoints + self loops
  edges = edges.filter(
    (e) =>
      e.source &&
      e.target &&
      e.source !== e.target &&
      nodeIdSet.has(e.source) &&
      nodeIdSet.has(e.target),
  );

  // 2) Remove duplicate edges (same source+target+label)
  const seen = new Set();
  edges = edges.filter((e) => {
    const key = `${e.source}->${e.target}::${e.label || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 3) Force arrowheads (directed)
  edges = edges.map((e) => {
    const t = e?.markerEnd?.type;
    if (t === "closed" || t === MarkerType.ArrowClosed) {
      return { ...e, markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 } };
    }
    if (t === "arrow" || t === MarkerType.Arrow) {
      return { ...e, markerEnd: { type: MarkerType.Arrow, width: 18, height: 18 } };
    }
    return { ...e, markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 } };
  });

  // 4) Auto-assign handles for cleanliness (unless AI already provided valid ones)
  edges = edges.map((e) => {
    if (e.sourceHandle && e.targetHandle) return e;

    const s = nodesById.get(e.source);
    const t = nodesById.get(e.target);
    if (!s || !t) return { ...e, sourceHandle: e.sourceHandle || "rs", targetHandle: e.targetHandle || "l" };

    const dx = (t.position?.x ?? 0) - (s.position?.x ?? 0);
    const dy = (t.position?.y ?? 0) - (s.position?.y ?? 0);

    if (dx >= Math.abs(dy)) return { ...e, sourceHandle: "rs", targetHandle: "l" };
    if (dy < 0)             return { ...e, sourceHandle: "ts", targetHandle: "b" };
    return                         { ...e, sourceHandle: "bs", targetHandle: "t" };
  });

  // 5) Cap size for safety
  if (nodes.length > 60)  nodes = nodes.slice(0, 60);
  if (edges.length > 120) edges = edges.slice(0, 120);

  return { nodes, edges };
}

/* =========================
   Editor
   ========================= */

export default function FlowchartEditor() {
  const nav = useNavigate();
  const { id } = useParams();

  const [title, setTitle] = useState("");

  // error bar
  const [errorBar, setErrorBar] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const clearErrBar = useCallback(() => {
    setErrorBar(null);
    setShowDetails(false);
  }, []);

  const setErrBar = useCallback((title, eOrMsg, detailsOverride) => {
    if (!eOrMsg) return;
    if (typeof eOrMsg === "string") {
      setErrorBar({ title, message: eOrMsg, details: detailsOverride || null });
      return;
    }
    const { message, details } = formatAxiosError(eOrMsg);
    setErrorBar({ title, message, details: detailsOverride ?? details });
  }, []);

  async function copyErrorDetails() {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify({ title: errorBar?.title, message: errorBar?.message, details: errorBar?.details }, null, 2)
      );
    } catch { /* ignore */ }
  }

  // local history (undo/redo only local)
  const [history, setHistory] = useState(() => ({
    past:    [],
    present: { nodes: [], edges: [] },
    future:  [],
  }));

  const nodes = history.present.nodes;
  const edges = history.present.edges;
  const stagedRef = useRef(history.present);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  useEffect(() => {
    stagedRef.current = history.present;
  }, [history.present]);

  // autosave state
  const [saveStatus, setSaveStatus] = useState("idle");
  const loadedRef      = useRef(false);
  const saveTimerRef   = useRef(null);
  const saveInFlightRef = useRef(false);
  const savePendingRef  = useRef(false);

  const commit = useCallback((nextPresent) => {
    setHistory((h) => ({
      past:    [...h.past, h.present].slice(-50),
      present: nextPresent,
      future:  [],
    }));
    stagedRef.current = nextPresent;
  }, []);

  const stage = useCallback((nextPresent) => {
    setHistory((h) => ({ ...h, present: nextPresent }));
    stagedRef.current = nextPresent;
  }, []);

  const stripSelection = (present) => ({
    nodes: present.nodes.map((n) => ({ ...n, selected: false })),
    edges: present.edges.map((e) => ({ ...e, selected: false })),
  });

  const undoLocal = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h;
      const prev = stripSelection(h.past[h.past.length - 1]);
      return { past: h.past.slice(0, -1), present: prev, future: [h.present, ...h.future] };
    });
    setActiveNodeId(null);
    setActiveEdgeId(null);
  }, []);

  const redoLocal = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const next = stripSelection(h.future[0]);
      return { past: [...h.past, h.present], present: next, future: h.future.slice(1) };
    });
    setActiveNodeId(null);
    setActiveEdgeId(null);
  }, []);

  /* =========================
     Inspector selection
     ========================= */

  const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes]);
  const selectedEdges = useMemo(() => edges.filter((e) => e.selected), [edges]);
  const selectionSummary = `${selectedNodes.length} node(s), ${selectedEdges.length} edge(s)`;

  const [activeNodeId, setActiveNodeId] = useState(null);
  const [activeEdgeId, setActiveEdgeId] = useState(null);

  const activeNode = useMemo(() => nodes.find((n) => n.id === activeNodeId) || null, [nodes, activeNodeId]);
  const activeEdge = useMemo(() => edges.find((e) => e.id === activeEdgeId) || null, [edges, activeEdgeId]);

  const onSelectionChange = useCallback(({ nodes: selN, edges: selE }) => {
    if (selN?.length === 1 && (!selE || selE.length === 0)) {
      setActiveNodeId(selN[0].id);
      setActiveEdgeId(null);
    } else if (selE?.length === 1 && (!selN || selN.length === 0)) {
      setActiveEdgeId(selE[0].id);
      setActiveNodeId(null);
    } else {
      setActiveNodeId(null);
      setActiveEdgeId(null);
    }
  }, []);

  /* =========================
     Left panel defaults
     ========================= */

  const [newNodeType,   setNewNodeType]   = useState("process");
  const [newNodeLabel,  setNewNodeLabel]  = useState("New Node");
  const [newNodeBg,     setNewNodeBg]     = useState("#E3F2FD");
  const [newNodeBorder, setNewNodeBorder] = useState("#90CAF9");
  const [newNodeText,   setNewNodeText]   = useState("#0F172A");

  const [edgeType,     setEdgeType]     = useState("smoothstep");
  const [edgeLabel,    setEdgeLabel]    = useState("");
  const [edgeDashed,   setEdgeDashed]   = useState(false);
  const [edgeAnimated, setEdgeAnimated] = useState(false);
  const [edgeMarker,   setEdgeMarker]   = useState("closed");

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy,   setAiBusy]   = useState(false);

  /* =========================
     Load from LMS backend
     LMS returns { id, name, nodes, edges, updatedAt } — not wrapped in "graph"
     ========================= */

  useEffect(() => {
    (async () => {
      clearErrBar();
      setSaveStatus("idle");
      loadedRef.current = false;

      try {
        const r = await api.get(`/api/flowcharts/${id}`);
        setTitle(r.data?.name || "Flowchart");

        // LMS backend returns nodes/edges at top level (not inside r.data.graph)
        const g = {
          nodes: r.data?.nodes || [],
          edges: r.data?.edges || [],
        };

        const present = {
          nodes: (g.nodes).map((n) => ({
            ...n,
            data: {
              label:  n?.data?.label  ?? "",
              bg:     n?.data?.bg     ?? "#E3F2FD",
              border: n?.data?.border ?? "#90CAF9",
              text:   n?.data?.text   ?? "#0F172A",
              dir:    n?.data?.dir    ?? "right",
              ...(n.data || {}),
            },
          })),
          edges: (g.edges).map((e) => ({
            ...e,
            type:     e?.type     ?? "smoothstep",
            label:    e?.label    ?? "",
            animated: Boolean(e?.animated),
          })),
        };

        setHistory({ past: [], present, future: [] });
        stagedRef.current = present;
        loadedRef.current = true;
      } catch (e) {
        setErrBar("Load failed", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* =========================
     Autosave (debounced + queued) — sends { graph: { nodes, edges } }
     ========================= */

  const doSaveNow = useCallback(async () => {
    if (!loadedRef.current) return;

    if (saveInFlightRef.current) {
      savePendingRef.current = true;
      return;
    }

    saveInFlightRef.current = true;
    savePendingRef.current  = false;
    setSaveStatus("saving");

    try {
      await api.put(`/api/flowcharts/${id}`, { graph: stagedRef.current });
      setSaveStatus("saved");
      setTimeout(() => {
        setSaveStatus((s) => (s === "saved" ? "idle" : s));
      }, 700);
    } catch (e) {
      setSaveStatus("error");
      setErrBar("Autosave failed", e);
    } finally {
      saveInFlightRef.current = false;
      if (savePendingRef.current) {
        savePendingRef.current = false;
        doSaveNow();
      }
    }
  }, [id, setErrBar]);

  const scheduleSave = useCallback(() => {
    if (!loadedRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus((s) => (s === "saving" ? "saving" : "idle"));
    saveTimerRef.current = setTimeout(() => { doSaveNow(); }, 450);
  }, [doSaveNow]);

  useEffect(() => {
    if (!loadedRef.current) return;
    scheduleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.present]);

  /* =========================
     Canvas handlers
     ========================= */

  const onNodesChange = useCallback(
    (changes) => {
      const nextNodes   = applyNodeChanges(changes, stagedRef.current.nodes);
      const nextPresent = { ...stagedRef.current, nodes: nextNodes };
      const shouldCommit = changes.some((c) => c.type === "add" || c.type === "remove");
      (shouldCommit ? commit : stage)(nextPresent);
    },
    [commit, stage],
  );

  const onEdgesChange = useCallback(
    (changes) => {
      const nextEdges   = applyEdgeChanges(changes, stagedRef.current.edges);
      const nextPresent = { ...stagedRef.current, edges: nextEdges };
      const shouldCommit = changes.some((c) => c.type === "add" || c.type === "remove");
      (shouldCommit ? commit : stage)(nextPresent);
    },
    [commit, stage],
  );

  const onConnect = useCallback(
    (params) => {
      const style = edgeDashed ? { strokeDasharray: "6 4" } : undefined;

      const markerEnd =
        edgeMarker === "none"
          ? undefined
          : {
              type:   edgeMarker === "arrow" ? MarkerType.Arrow : MarkerType.ArrowClosed,
              width:  18,
              height: 18,
            };

      const ids  = new Set(stagedRef.current.edges.map((e) => e.id));
      const eid  = nextId("e", ids);

      const nextEdges = addEdge(
        { ...params, id: eid, type: edgeType, label: edgeLabel || undefined, style, animated: edgeAnimated, markerEnd },
        stagedRef.current.edges,
      );

      commit({ ...stagedRef.current, edges: nextEdges });
    },
    [commit, edgeType, edgeLabel, edgeDashed, edgeAnimated, edgeMarker],
  );

  const onNodeDragStop = useCallback(() => {
    commit(stagedRef.current);
  }, [commit]);

  /* =========================
     Actions
     ========================= */

  const addNode = useCallback(() => {
    const ids = new Set(stagedRef.current.nodes.map((n) => n.id));
    const nid = nextId("n", ids);

    const node = {
      id:   nid,
      type: newNodeType,
      position: {
        x: 160 + stagedRef.current.nodes.length * 30,
        y: 130 + stagedRef.current.nodes.length * 18,
      },
      data: {
        label:  newNodeLabel || "New Node",
        bg:     newNodeBg,
        border: newNodeBorder,
        text:   newNodeText,
        ...(newNodeType === "direction" ? { dir: "right" } : {}),
      },
    };

    commit({ ...stagedRef.current, nodes: [...stagedRef.current.nodes, node] });
  }, [commit, newNodeType, newNodeLabel, newNodeBg, newNodeBorder, newNodeText]);

  const deleteSelected = useCallback(() => {
    const selNodeIds = new Set(stagedRef.current.nodes.filter((n) => n.selected).map((n) => n.id));
    const selEdgeIds = new Set(stagedRef.current.edges.filter((e) => e.selected).map((e) => e.id));
    if (selNodeIds.size === 0 && selEdgeIds.size === 0) return;

    const nextNodes = stagedRef.current.nodes.filter((n) => !selNodeIds.has(n.id));
    const nextEdges = stagedRef.current.edges.filter((e) => {
      if (selEdgeIds.has(e.id))                                   return false;
      if (selNodeIds.has(e.source) || selNodeIds.has(e.target))   return false;
      return true;
    });

    commit({ nodes: nextNodes, edges: nextEdges });
    setActiveNodeId(null);
    setActiveEdgeId(null);
  }, [commit]);

  const updateActiveNode = useCallback(
    (patch) => {
      if (!activeNodeId) return;
      const nextNodes = stagedRef.current.nodes.map((n) => {
        if (n.id !== activeNodeId) return n;
        return { ...n, ...patch, data: { ...(n.data || {}), ...(patch.data || {}) } };
      });
      commit({ ...stagedRef.current, nodes: nextNodes });
    },
    [commit, activeNodeId],
  );

  const updateActiveEdge = useCallback(
    (patch) => {
      if (!activeEdgeId) return;
      const nextEdges = stagedRef.current.edges.map((e) =>
        e.id === activeEdgeId ? { ...e, ...patch } : e,
      );
      commit({ ...stagedRef.current, edges: nextEdges });
    },
    [commit, activeEdgeId],
  );

  const onKeyDown = useCallback(
    (e) => {
      if (isTypingTarget(e.target)) return;
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const mod   = isMac ? e.metaKey : e.ctrlKey;

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redoLocal(); else undoLocal();
        return;
      }
      if (mod && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
        e.preventDefault();
        redoLocal();
        return;
      }
      if (e.key === "Delete") {
        e.preventDefault();
        deleteSelected();
      }
    },
    [undoLocal, redoLocal, deleteSelected],
  );

  /* =========================
     AI generate
     LMS backend returns { nodes, edges } directly (no "graph" wrapper)
     ========================= */

  async function aiGenerate() {
    clearErrBar();
    setAiBusy(true);
    try {
      const r = await api.post(`/api/flowcharts/generate`, { prompt: aiPrompt });

      // LMS backend returns { nodes, edges } at top level when no name given
      const present = sanitizeGraph(r.data);
      setHistory({ past: [], present, future: [] });
      stagedRef.current = present;
      // autosave effect fires automatically after setHistory
    } catch (e) {
      setErrBar("AI generation failed", e, {
        ...(formatAxiosError(e).details || {}),
        note: "Backend check: GEMINI_API_KEY and GEMINI_MODEL in .env",
      });
    } finally {
      setAiBusy(false);
    }
  }

  /* =========================
     Visual helpers
     ========================= */

  const miniMapNodeColor = (node) => node?.data?.bg || "#e2e8f0";

  const renderedEdges = useMemo(() => {
    return edges.map((e) =>
      e.selected
        ? { ...e, style: { ...(e.style || {}), stroke: "#38BDF8", strokeWidth: 3 } }
        : { ...e, style: { ...(e.style || {}), stroke: e.style?.stroke || "#0F172A", strokeWidth: e.style?.strokeWidth || 2.5 } },
    );
  }, [edges]);

  /* =========================
     Styles
     ========================= */

  const small       = { fontSize: 12, color: "#64748b" };
  const panelHeader = { padding: "14px 14px 12px", borderBottom: "1px solid #e2e8f0", background: "white" };
  const section     = { background: "white", border: "1px solid #e2e8f0", borderRadius: 16, boxShadow: "0 1px 8px rgba(15,23,42,0.06)", padding: 14 };
  const h2          = { fontWeight: 900, fontSize: 14, margin: 0 };
  const label       = { fontSize: 12, color: "#64748b", marginTop: 10 };

  const savePill = (() => {
    if (saveStatus === "saving") return { text: "Saving…",    bg: "#fef9c3", fg: "#854d0e", bd: "#fde68a" };
    if (saveStatus === "saved")  return { text: "Saved",      bg: "#dcfce7", fg: "#166534", bd: "#bbf7d0" };
    if (saveStatus === "error")  return { text: "Save error", bg: "#ffe4e6", fg: "#9f1239", bd: "#fecdd3" };
    return { text: " ", bg: "transparent", fg: "#64748b", bd: "transparent" };
  })();

  /* =========================
     Render
     ========================= */

  return (
    <div
      style={{ height: "100vh", width: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", height: 58, borderBottom: "1px solid #e2e8f0", background: "white", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => nav("/flowcharts")}
            style={{ padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: 8, background: "white", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
          >
            ← Back
          </button>
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontWeight: 900, fontSize: 14 }}>{title || "Flowchart"}</div>
            <div style={small}>Local undo/redo • Autosave enabled</div>
          </div>
        </div>

        <div
          style={{
            padding: "6px 10px", borderRadius: 999,
            border: `1px solid ${savePill.bd}`,
            background: savePill.bg, color: savePill.fg,
            fontSize: 12, fontWeight: 800, minWidth: 86, textAlign: "center",
          }}
        >
          {savePill.text}
        </div>
      </div>

      {/* Error bar */}
      {errorBar && (
        <div style={{ borderBottom: "1px solid #fecaca", background: "#fff1f2", flexShrink: 0 }}>
          <div style={{ padding: "10px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 900, color: "#991b1b" }}>{errorBar.title}</div>
              <div style={{ fontSize: 13, color: "#7f1d1d", marginTop: 2, wordBreak: "break-word" }}>
                {errorBar.message}
              </div>
              {showDetails && errorBar.details && (
                <pre style={{ marginTop: 10, padding: 10, borderRadius: 12, background: "rgba(15,23,42,0.06)", overflow: "auto", fontSize: 12, color: "#0f172a", maxHeight: 220 }}>
                  {JSON.stringify(errorBar.details, null, 2)}
                </pre>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ padding: "5px 10px", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer", fontSize: 12 }} onClick={() => setShowDetails((v) => !v)}>
                {showDetails ? "Hide" : "Details"}
              </button>
              <button style={{ padding: "5px 10px", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer", fontSize: 12 }} onClick={copyErrorDetails}>Copy</button>
              <button style={{ padding: "5px 10px", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer", fontSize: 12 }} onClick={clearErrBar}>✕</button>
            </div>
          </div>
        </div>
      )}

      {/* 3-column layout */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "390px 1fr 390px", overflow: "hidden", background: "#f8fafc" }}>

        {/* LEFT: Create panel */}
        <aside style={{ borderRight: "1px solid #e2e8f0", background: "white", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={panelHeader}>
            <div style={{ fontWeight: 900 }}>Create</div>
            <div style={small}>Shift+click multi-select • Drag box select • Del deletes • Ctrl+Z / Ctrl+Y</div>
          </div>

          {/* Scrollable top + fixed AI footer */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Scrollable */}
            <div style={{ flex: 1, overflow: "auto", padding: 14, display: "grid", gap: 14, alignContent: "start" }}>

              {/* History */}
              <section style={section}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <h3 style={h2}>History</h3>
                  <span style={small}>Local</span>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button
                    style={{ flex: 1, padding: "7px 0", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, opacity: canUndo ? 1 : 0.5 }}
                    onClick={undoLocal} disabled={!canUndo}
                  >Undo</button>
                  <button
                    style={{ flex: 1, padding: "7px 0", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, opacity: canRedo ? 1 : 0.5 }}
                    onClick={redoLocal} disabled={!canRedo}
                  >Redo</button>
                </div>
                <div style={{ marginTop: 10, ...small }}>Autosaves after changes (including undo/redo).</div>
              </section>

              {/* Add node */}
              <section style={section}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <h3 style={h2}>Add node</h3>
                  <span style={small}>Nodes: {nodes.length}</span>
                </div>

                <div style={label}>Type</div>
                <select style={{ marginTop: 6, width: "100%", padding: "7px 8px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }}
                  value={newNodeType} onChange={(e) => setNewNodeType(e.target.value)}>
                  {NODE_TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>

                <div style={label}>Label</div>
                <input style={{ marginTop: 6, width: "100%", padding: "7px 8px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }}
                  value={newNodeLabel} onChange={(e) => setNewNodeLabel(e.target.value)} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
                  {[
                    ["Fill",   newNodeBg,     setNewNodeBg],
                    ["Border", newNodeBorder, setNewNodeBorder],
                    ["Text",   newNodeText,   setNewNodeText],
                  ].map(([lbl, val, setter]) => (
                    <div key={lbl}>
                      <div style={small}>{lbl}</div>
                      <input type="color" style={{ padding: 6, height: 44, marginTop: 6, width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer" }}
                        value={val} onChange={(e) => setter(e.target.value)} />
                    </div>
                  ))}
                </div>

                <button
                  onClick={addNode}
                  style={{ marginTop: 12, width: "100%", padding: "8px 0", background: "#3b82f6", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                >
                  + Add node
                </button>
              </section>

              {/* Edge defaults */}
              <section style={section}>
                <h3 style={h2}>New edge defaults</h3>

                <div style={label}>Type</div>
                <select style={{ marginTop: 6, width: "100%", padding: "7px 8px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }}
                  value={edgeType} onChange={(e) => setEdgeType(e.target.value)}>
                  {EDGE_TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>

                <div style={label}>Marker</div>
                <select style={{ marginTop: 6, width: "100%", padding: "7px 8px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }}
                  value={edgeMarker} onChange={(e) => setEdgeMarker(e.target.value)}>
                  {EDGE_MARKER_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>

                <div style={label}>Label</div>
                <input style={{ marginTop: 6, width: "100%", padding: "7px 8px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }}
                  value={edgeLabel} onChange={(e) => setEdgeLabel(e.target.value)} />

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                  <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="checkbox" checked={edgeDashed}   onChange={(e) => setEdgeDashed(e.target.checked)} />
                    <span style={small}>Dashed</span>
                  </label>
                  <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="checkbox" checked={edgeAnimated} onChange={(e) => setEdgeAnimated(e.target.checked)} />
                    <span style={small}>Animated</span>
                  </label>
                </div>

                <div style={{ marginTop: 10, ...small }}>Tip: drag from any handle to connect.</div>
              </section>

              <div style={{ height: 8 }} />
            </div>

            {/* Fixed AI footer — always visible */}
            <div style={{ borderTop: "1px solid #e2e8f0", padding: 14, background: "white", flexShrink: 0 }}>
              <section style={{ ...section, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <h3 style={h2}>AI generate</h3>
                  <span style={small}>{aiBusy ? "Working…" : " "}</span>
                </div>

                <textarea
                  style={{ marginTop: 10, minHeight: 92, resize: "vertical", width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe the flowchart…"
                />

                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button
                    style={{ flex: 1, padding: "8px 0", background: "#3b82f6", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: aiBusy || !aiPrompt.trim() ? 0.6 : 1 }}
                    onClick={aiGenerate}
                    disabled={aiBusy || !aiPrompt.trim()}
                  >
                    {aiBusy ? "Generating…" : "Generate"}
                  </button>
                  <button
                    style={{ width: 90, padding: "8px 0", border: "1px solid #e2e8f0", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", background: "white" }}
                    onClick={() => setAiPrompt("")}
                    disabled={aiBusy || !aiPrompt}
                  >
                    Clear
                  </button>
                </div>
              </section>
            </div>
          </div>
        </aside>

        {/* CENTER: Canvas */}
        <main style={{ position: "relative", height: "100%", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 14, top: 14, zIndex: 10, padding: "10px 12px", borderRadius: 16, border: "1px solid #e2e8f0", background: "rgba(255,255,255,0.86)", backdropFilter: "blur(10px)", boxShadow: "0 1px 8px rgba(15,23,42,0.06)" }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Selected: <span style={{ fontWeight: 800, color: "#0f172a" }}>{selectionSummary}</span>
            </div>
          </div>

          <ReactFlow
            nodes={nodes}
            edges={renderedEdges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            onSelectionChange={onSelectionChange}
            fitView
            selectionOnDrag
            snapToGrid
            snapGrid={[15, 15]}
          >
            <Controls />
            <MiniMap pannable zoomable nodeColor={miniMapNodeColor} maskColor="rgba(15, 23, 42, 0.08)" />
            <Background variant="dots" gap={14} size={1} />
          </ReactFlow>
        </main>

        {/* RIGHT: Inspector */}
        <aside style={{ borderLeft: "1px solid #e2e8f0", background: "white", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={panelHeader}>
            <div style={{ fontWeight: 900 }}>Inspector</div>
            <div style={small}>Edit selected node/edge</div>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: 14, display: "grid", gap: 14, alignContent: "start" }}>

            {/* Selection / Delete */}
            <section style={section}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h3 style={h2}>Selection</h3>
                <span style={small}>{selectionSummary}</span>
              </div>
              <button
                style={{ marginTop: 12, width: "100%", padding: "8px 0", background: "#ef4444", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: selectedNodes.length === 0 && selectedEdges.length === 0 ? 0.5 : 1 }}
                onClick={deleteSelected}
                disabled={selectedNodes.length === 0 && selectedEdges.length === 0}
              >
                Delete selected
              </button>
              <div style={{ marginTop: 10, ...small }}>Tip: Shift+click to toggle selection.</div>
            </section>

            {/* Node inspector */}
            {activeNode && (
              <section style={section}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <h3 style={h2}>Node</h3>
                  <span style={small}>{activeNode.id}</span>
                </div>

                <div style={label}>Label</div>
                <input
                  style={{ marginTop: 6, width: "100%", padding: "7px 8px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }}
                  value={activeNode.data?.label ?? ""}
                  onChange={(e) => updateActiveNode({ data: { label: e.target.value } })}
                />

                {activeNode.type === "direction" && (
                  <>
                    <div style={label}>Arrow direction</div>
                    <select
                      style={{ marginTop: 6, width: "100%", padding: "7px 8px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }}
                      value={activeNode.data?.dir || "right"}
                      onChange={(e) => updateActiveNode({ data: { dir: e.target.value } })}
                    >
                      {["right","left","up","down"].map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
                  {[
                    ["Fill",   activeNode.data?.bg     || "#E3F2FD", (v) => updateActiveNode({ data: { bg: v } })],
                    ["Border", activeNode.data?.border || "#90CAF9", (v) => updateActiveNode({ data: { border: v } })],
                    ["Text",   activeNode.data?.text   || "#0F172A", (v) => updateActiveNode({ data: { text: v } })],
                  ].map(([lbl, val, setter]) => (
                    <div key={lbl}>
                      <div style={small}>{lbl}</div>
                      <input type="color" style={{ padding: 6, height: 44, marginTop: 6, width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer" }}
                        value={val} onChange={(e) => setter(e.target.value)} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Edge inspector */}
            {activeEdge && (
              <section style={section}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <h3 style={h2}>Edge</h3>
                  <span style={small}>{activeEdge.id}</span>
                </div>

                <div style={label}>Label</div>
                <input
                  style={{ marginTop: 6, width: "100%", padding: "7px 8px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }}
                  value={activeEdge.label ?? ""}
                  onChange={(e) => updateActiveEdge({ label: e.target.value })}
                />

                <div style={label}>Type</div>
                <select
                  style={{ marginTop: 6, width: "100%", padding: "7px 8px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }}
                  value={activeEdge.type || "default"}
                  onChange={(e) => updateActiveEdge({ type: e.target.value })}
                >
                  {EDGE_TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>

                <div style={label}>Marker</div>
                <select
                  style={{ marginTop: 6, width: "100%", padding: "7px 8px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }}
                  value={
                    activeEdge.markerEnd?.type === MarkerType.Arrow       ? "arrow"
                    : activeEdge.markerEnd?.type === MarkerType.ArrowClosed ? "closed"
                    : "none"
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    updateActiveEdge({
                      markerEnd: v === "none" ? undefined : {
                        type:   v === "arrow" ? MarkerType.Arrow : MarkerType.ArrowClosed,
                        width:  18,
                        height: 18,
                      },
                    });
                  }}
                >
                  {EDGE_MARKER_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                  <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="checkbox"
                      checked={Boolean(activeEdge.style?.strokeDasharray)}
                      onChange={(e) => updateActiveEdge({ style: e.target.checked ? { ...(activeEdge.style || {}), strokeDasharray: "6 4" } : { ...(activeEdge.style || {}), strokeDasharray: undefined } })}
                    />
                    <span style={small}>Dashed</span>
                  </label>
                  <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="checkbox"
                      checked={Boolean(activeEdge.animated)}
                      onChange={(e) => updateActiveEdge({ animated: e.target.checked })}
                    />
                    <span style={small}>Animated</span>
                  </label>
                </div>

                <button
                  style={{ marginTop: 12, width: "100%", padding: "8px 0", background: "#ef4444", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                  onClick={() => {
                    commit({ ...stagedRef.current, edges: stagedRef.current.edges.filter((e) => e.id !== activeEdge.id) });
                    setActiveEdgeId(null);
                  }}
                >
                  Delete this edge
                </button>
              </section>
            )}

            {!activeNode && !activeEdge && (
              <section style={section}>
                <h3 style={h2}>Nothing selected</h3>
                <div style={{ marginTop: 8, ...small }}>Click a node or edge to edit it here.</div>
              </section>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}