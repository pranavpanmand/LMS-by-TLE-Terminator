import { GoogleGenerativeAI } from "@google/generative-ai";
import Flowchart from "../models/Flowchart.model.js";

/* =========================
   JSON Schema sent to Gemini — exact copy from FlowX
   ========================= */
const FLOWCHART_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["nodes", "edges"],
  properties: {
    nodes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "type", "position", "data"],
        properties: {
          id:   { type: "string" },
          type: {
            type: "string",
            enum: ["start", "end", "process", "decision", "io", "merge", "direction"],
          },
          position: {
            type: "object",
            additionalProperties: false,
            required: ["x", "y"],
            properties: {
              x: { type: "number" },
              y: { type: "number" },
            },
          },
          data: {
            type: "object",
            additionalProperties: false,
            required: ["label", "bg", "border", "text", "dir"],
            properties: {
              label:  { type: "string" },
              bg:     { type: "string" },
              border: { type: "string" },
              text:   { type: "string" },
              dir:    { type: "string", enum: ["right", "left", "up", "down"] },
            },
          },
        },
      },
    },
    edges: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "source", "target", "type", "label", "animated", "sourceHandle", "targetHandle"],
        properties: {
          id:           { type: "string" },
          source:       { type: "string" },
          target:       { type: "string" },
          type:         { type: "string" },
          label:        { type: "string" },
          animated:     { type: "boolean" },
          sourceHandle: { type: "string", enum: ["ts", "rs", "bs", "ls"] },
          targetHandle: { type: "string", enum: ["t", "r", "b", "l"] },
          markerEnd: {
            type: "object",
            additionalProperties: false,
            required: ["type", "width", "height"],
            properties: {
              type:   { type: "string", enum: ["arrow", "closed"] },
              width:  { type: "number" },
              height: { type: "number" },
            },
          },
        },
      },
    },
  },
};

/* =========================
   System prompt — exact copy from FlowX
   ========================= */
const SYSTEM_PROMPT = `
You generate ReactFlow graphs as JSON ONLY (no markdown, no backticks).
Return exactly one JSON object with shape: { "nodes": [...], "edges": [...] } and nothing else.

PRIMARY GOALS:
1) MINIMIZE EDGE COUNT:
   - Use the minimum number of edges required to keep the flow correct and understandable.
   - Do NOT add decorative edges, duplicate edges, or "helper" edges.
   - Each node should have at most 2 outgoing edges (only decisions can have 2).
   - Prefer linear flow when possible.

2) DIRECTED EDGES WITH ARROWS:
   - Every edge MUST be directed and MUST include markerEnd (arrowhead).
   - markerEnd must be: { "type": "closed", "width": 18, "height": 18 } for ALL edges.

LAYOUT (clean + readable):
- Left-to-right flow (main direction).
- Use a grid layout.
- Spacing: dx ≈ 260 per step, dy ≈ 160 between branches.
- Align y positions to multiples of 80 (0, 80, 160, 240...).
- Avoid edge crossings. Keep the layout compact but not cramped.
- Decisions: YES branch above, NO branch below.

NODE TYPES:
- Allowed node types: start, end, process, decision, io, merge, direction
- Use direction nodes sparingly (only when they meaningfully improve readability).
- Keep nodes <= 10 unless the user asks for more.

NODE DATA REQUIRED:
Every node MUST include data: { label, bg, border, text, dir }
- For non-direction nodes, dir MUST be "right".
- For direction nodes, dir must be one of: right, left, up, down.
- Use palette:
  start:    bg "#E8F5E9", border "#A5D6A7"
  end:      bg "#FFEBEE", border "#FFCDD2"
  process:  bg "#E3F2FD", border "#90CAF9"
  decision: bg "#F3E8FF", border "#C4B5FD"
  io:       bg "#FFFDE7", border "#FFE082"
  merge:    bg "#F1F5F9", border "#CBD5E1"
  direction:bg "#ECFEFF", border "#67E8F9"
  text:     "#0F172A" for all nodes

EDGE RULES (handles + minimal edges):
- Each edge MUST include:
  { id, source, target, type, label, animated, sourceHandle, targetHandle, markerEnd }
- Default edge type: "smoothstep".
- For decision branches use "step".
- label MUST be "" for normal edges.
- For decision edges only: label "yes" and "no".
- animated MUST be false unless the user explicitly requests animated edges.

HANDLE RULES (use multiple connect points):
- Use handles to keep edges clean:
  - Normal left->right: sourceHandle="rs", targetHandle="l"
  - Up branch:          sourceHandle="ts", targetHandle="b"
  - Down branch:        sourceHandle="bs", targetHandle="t"
  - Back/left (rare):   sourceHandle="ls", targetHandle="r"
- For decision nodes:
  - YES edge: sourceHandle="ts", targetHandle="b"
  - NO edge:  sourceHandle="bs", targetHandle="t"

ID RULES:
- Node ids: n1,n2,n3...
- Edge ids: e1,e2,e3...
- Do not reuse ids. Do not create unused nodes/edges.

Now generate the graph for the user request.
`;

/* =========================
   Manual validation — no Zod dependency
   ========================= */
function validateGraph(raw) {
  if (!raw || typeof raw !== "object")  return { ok: false, error: "Graph must be an object" };
  if (!Array.isArray(raw.nodes))        return { ok: false, error: "graph.nodes must be an array" };
  if (!Array.isArray(raw.edges))        return { ok: false, error: "graph.edges must be an array" };
  for (const n of raw.nodes) {
    if (!n.id)       return { ok: false, error: "Node missing id" };
    if (!n.type)     return { ok: false, error: `Node ${n.id} missing type` };
    if (!n.position) return { ok: false, error: `Node ${n.id} missing position` };
  }
  for (const e of raw.edges) {
    if (!e.id)     return { ok: false, error: "Edge missing id" };
    if (!e.source) return { ok: false, error: `Edge ${e.id} missing source` };
    if (!e.target) return { ok: false, error: `Edge ${e.id} missing target` };
  }
  return { ok: true };
}

/* =========================
   normalizeGraph
   ─────────────────────────────────────────────────────────────────────────────
   KEY FIX for arrows:
   markerEnd.type is kept as "closed" or "arrow" (the strings Gemini outputs
   and the strings the frontend sanitizeGraph explicitly checks for):

     if (t === "closed" || t === MarkerType.ArrowClosed)  → ArrowClosed
     if (t === "arrow"  || t === MarkerType.Arrow)        → Arrow

   DO NOT convert to "ArrowClosed" here — that string is NOT equal to
   MarkerType.ArrowClosed ("arrowclosed") and the frontend will ignore it.
   ========================= */
function normalizeGraph(raw) {
  const nodes = (raw.nodes || []).map((n) => ({
    ...n,
    position: {
      x: Number(n.position?.x ?? 0),
      y: Number(n.position?.y ?? 0),
    },
    data: {
      label:  "",
      bg:     "#E3F2FD",
      border: "#90CAF9",
      text:   "#0F172A",
      dir:    "right",
      ...(n.data || {}),
    },
  }));

  const edges = (raw.edges || []).map((e) => {
    // ── Normalise markerEnd ──────────────────────────────────────────────────
    // Goal: always output { type: "closed", width: 18, height: 18 }
    // "closed" is what the prompt asks for AND what the frontend checks for.
    // Any variant Gemini might return (ArrowClosed, arrowclosed, arrow_closed,
    // CLOSED, etc.) is mapped back to the canonical "closed" string.
    let markerEndType = "closed"; // default — every edge gets an arrowhead

    if (e.markerEnd && typeof e.markerEnd === "object") {
      const raw_type = String(e.markerEnd.type || "").toLowerCase().replace(/[^a-z]/g, "");
      // "arrow" without "closed" → plain open arrow
      if (raw_type === "arrow") {
        markerEndType = "arrow";
      }
      // anything containing "closed" (arrowclosed, closed, arrow_closed) → closed
      // anything else (empty, unknown) → default to "closed"
    }

    const markerEnd = {
      type:   markerEndType,            // "closed" or "arrow" — frontend handles both
      width:  Number(e.markerEnd?.width  ?? 18),
      height: Number(e.markerEnd?.height ?? 18),
    };

    return {
      ...e,
      type:         e.type  || "smoothstep",
      label:        e.label ?? "",
      animated:     Boolean(e.animated ?? false),
      markerEnd,                         // guaranteed to exist on every edge
      sourceHandle: e.sourceHandle ?? null,
      targetHandle: e.targetHandle ?? null,
    };
  });

  return { nodes, edges };
}

/* =========================
   Extract JSON from Gemini text — handles markdown fences
   ========================= */
function extractJSON(text) {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

/* =========================
   Helper: push version, keep last 10
   ========================= */
function pushVersionKeep10(flow, prevGraph) {
  flow.versions.push({ graph: prevGraph, createdAt: new Date() });
  if (flow.versions.length > 10) flow.versions = flow.versions.slice(-10);
}

/* =========================
   asyncHandler
   ========================= */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/* =========================
   CRUD
   ========================= */

// GET /api/flowcharts
export const listMine = asyncHandler(async (req, res) => {
  const items = await Flowchart.find({ userId: req.userId })
    .select("_id name updatedAt")
    .sort({ updatedAt: -1 });

  res.json(
    items.map((x) => ({ id: x._id, name: x.name, updatedAt: x.updatedAt }))
  );
});

// POST /api/flowcharts
export const createFlow = asyncHandler(async (req, res) => {
  const { name, courseId } = req.body ?? {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "name is required" });
  }

  const flow = await Flowchart.create({
    userId:   req.userId,
    name:     String(name).trim(),
    course:   courseId || null,
    current:  { nodes: [], edges: [] },
    versions: [],
  });

  res.status(201).json({ id: flow._id, name: flow.name });
});

// GET /api/flowcharts/:id
export const getOne = asyncHandler(async (req, res) => {
  const flow = await Flowchart.findOne({ _id: req.params.id, userId: req.userId });
  if (!flow) return res.status(404).json({ error: "Flowchart not found" });

  res.json({
    id:        flow._id,
    name:      flow.name,
    nodes:     flow.current.nodes,
    edges:     flow.current.edges,
    updatedAt: flow.updatedAt,
    versions:  flow.versions.length,
  });
});

// PUT /api/flowcharts/:id
export const updateOne = asyncHandler(async (req, res) => {
  const raw        = req.body?.graph ?? req.body;
  const normalized = normalizeGraph(raw);
  const check      = validateGraph(normalized);

  if (!check.ok) return res.status(400).json({ error: check.error });

  const flow = await Flowchart.findOne({ _id: req.params.id, userId: req.userId });
  if (!flow) return res.status(404).json({ error: "Flowchart not found" });

  pushVersionKeep10(flow, flow.current);
  flow.current = normalized;
  await flow.save();

  res.json({ ok: true, updatedAt: flow.updatedAt, versions: flow.versions.length });
});

// POST /api/flowcharts/:id/undo
export const undoOne = asyncHandler(async (req, res) => {
  const flow = await Flowchart.findOne({ _id: req.params.id, userId: req.userId });
  if (!flow)                 return res.status(404).json({ error: "Flowchart not found" });
  if (!flow.versions.length) return res.status(400).json({ error: "Nothing to undo" });

  const last    = flow.versions[flow.versions.length - 1];
  flow.versions = flow.versions.slice(0, -1);
  flow.current  = last.graph;
  await flow.save();

  res.json({ ok: true, nodes: flow.current.nodes, edges: flow.current.edges, versions: flow.versions.length });
});

// DELETE /api/flowcharts/:id
export const deleteOne = asyncHandler(async (req, res) => {
  const doc = await Flowchart.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!doc) return res.status(404).json({ error: "Flowchart not found" });
  res.json({ ok: true });
});

/* =========================
   AI Generate — exact FlowX approach
   POST /api/flowcharts/generate
   Body: { prompt, name?, courseId? }
   ========================= */
export const generate = asyncHandler(async (req, res) => {
  const { prompt, name, courseId } = req.body ?? {};

  if (!prompt || !String(prompt).trim()) {
    return res.status(400).json({ error: "prompt is required" });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY not set in .env" });
  }

  const genAI     = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const model     = genAI.getGenerativeModel({ model: modelName });

  const schemaText = JSON.stringify(FLOWCHART_JSON_SCHEMA, null, 2);

  // Exact FlowX approach: 3 separate content parts
  let rawText;
  try {
    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: `JSON_SCHEMA:\n${schemaText}` },
      { text: `USER_PROMPT:\n${String(prompt).trim()}` },
    ]);
    rawText = result?.response?.text?.() || "";
  } catch (e) {
    return res.status(500).json({
      error: e?.message || "Gemini request failed",
      hint:  "Check GEMINI_API_KEY and GEMINI_MODEL in .env",
    });
  }

  // Step 1: Extract JSON string
  const jsonStr = extractJSON(rawText);
  if (!jsonStr) {
    return res.status(502).json({
      error:   "Gemini returned no JSON",
      preview: rawText.slice(0, 300),
    });
  }

  // Step 2: Parse JSON
  let parsedRaw;
  try {
    parsedRaw = JSON.parse(jsonStr);
  } catch (e) {
    return res.status(502).json({
      error:   "Gemini returned malformed JSON",
      details: e.message,
      preview: jsonStr.slice(0, 300),
    });
  }

  // Step 3: Apply FlowX defaults before normalize
  for (const n of parsedRaw.nodes || []) {
    n.data        = n.data || {};
    n.data.label ??= "";
    n.data.bg    ??= "#E3F2FD";
    n.data.border ??= "#90CAF9";
    n.data.text  ??= "#0F172A";
    n.data.dir   ??= "right";
  }
  for (const e of parsedRaw.edges || []) {
    e.type     ??= "smoothstep";
    e.label    ??= "";
    e.animated ??= false;
    // Guarantee every edge has a markerEnd block BEFORE normalizeGraph runs
    // so normalizeGraph always has something to work with
    if (!e.markerEnd || typeof e.markerEnd !== "object") {
      e.markerEnd = { type: "closed", width: 18, height: 18 };
    }
  }

  // Step 4: Normalize (fixes positions, markerEnd type, missing fields)
  const graph = normalizeGraph(parsedRaw);

  // Step 5: Validate
  const check = validateGraph(graph);
  if (!check.ok) {
    return res.status(502).json({
      error:   "Generated graph failed validation",
      details: check.error,
    });
  }

  // Step 6: Persist if name was provided
  if (name && String(name).trim()) {
    try {
      const created = await Flowchart.create({
        userId:   req.userId,
        name:     String(name).trim(),
        course:   courseId || null,
        current:  graph,
        versions: [],
      });

      return res.status(201).json({
        id:    created._id,
        name:  created.name,
        nodes: created.current.nodes,
        edges: created.current.edges,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "A flowchart with that name already exists" });
      }
      throw err;
    }
  }

  return res.json({ nodes: graph.nodes, edges: graph.edges });
});