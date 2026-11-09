import { useEffect, useMemo, useRef, useState } from "react";
import { ReactFlow, Controls, Handle, Position, useReactFlow } from "@xyflow/react";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, CodeIcon, GitPullRequestIcon, CheckmarkCircle01Icon, Rocket01Icon, Mail01Icon } from "@hugeicons/core-free-icons";
import { pipelineStates, pipelineLayout } from "@/lib/fix-pipeline";
import "@xyflow/react/dist/style.css";
import "./fix-pipeline.css";

const icons = { scope: Search01Icon, patch: CodeIcon, pr: GitPullRequestIcon, review: CheckmarkCircle01Icon, ship: Rocket01Icon, notify: Mail01Icon };
const positions = { top: Position.Top, right: Position.Right, bottom: Position.Bottom, left: Position.Left };
const stateLabels = { waiting: "Waiting", active: "In progress", complete: "Complete", failed: "Needs attention", stopped: "Stopped", skipped: "Skipped" };
function PipelineNode({ data, selected }) {
  return <div className={`fix-node ${selected ? "is-selected" : ""} state-${data.state}`}>
    {data.input && <Handle type="target" position={positions[data.input]} id="in" isConnectable={false} />}
    <div className="flex items-center justify-between gap-3"><span className="fix-node-icon"><HugeiconsIcon icon={icons[data.id]} size={19} aria-hidden="true" /></span><span className="text-[11px] font-medium">{stateLabels[data.state]}</span></div>
    <h3 className="mt-3 text-sm font-semibold">{data.label}</h3>
    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{data.detail}</p>
    {data.prUrl && <a className="nodrag nopan mt-2 inline-block text-xs font-medium underline underline-offset-4" href={data.prUrl} target="_blank" rel="noreferrer" onClick={event => event.stopPropagation()}>Open PR #{data.prNumber || ""}</a>}
    {data.output && <Handle type="source" position={positions[data.output]} id="out" isConnectable={false} />}
  </div>;
}
const nodeTypes = { pipeline: PipelineNode };
function FitLayout({ columns, width, height }) {
  const { setViewport, viewportInitialized } = useReactFlow();
  useEffect(() => {
    if (!viewportInitialized || !width) return;
    const graphWidth = (columns - 1) * 300 + 248;
    const graphHeight = (Math.ceil(6 / columns) - 1) * 210 + 166;
    const zoom = Math.min(1, (width - 40) / graphWidth, (height - 40) / graphHeight);
    const frame = requestAnimationFrame(() => setViewport({ x: (width - graphWidth * zoom) / 2, y: (height - graphHeight * zoom) / 2, zoom }, { duration: 0 }));
    return () => cancelAnimationFrame(frame);
  }, [columns, width, height, setViewport, viewportInitialized]);
  return null;
}
export default function FixPipeline({ run, selectedStage, onSelect }) {
  const { resolvedTheme } = useTheme();
  const container = useRef(null);
  const [width, setWidth] = useState(0);
  const [moved, setMoved] = useState({ columns: 0, positions: {} });
  const columns = width && width < 480 ? 1 : width && width < 800 ? 2 : 3;
  const height = columns === 1 ? 1270 : columns === 2 ? 690 : 480;
  useEffect(() => {
    const resize = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    resize.observe(container.current); return () => resize.disconnect();
  }, []);
  const states = useMemo(() => pipelineStates(run), [run]);
  const nodes = useMemo(() => pipelineLayout(columns).map((layout, index) => ({ id: layout.id, type: "pipeline", position: moved.columns === columns ? moved.positions[layout.id] || layout.position : layout.position, selected: selectedStage === layout.id, draggable: true, deletable: false, ariaRole: "button", ariaLabel: `${states[index].label}: ${stateLabels[states[index].state]}. ${states[index].detail}`, style: { width: 248, height: 166 }, data: { ...states[index], ...layout, ...(["pr", "review"].includes(layout.id) && run?.prUrl ? { prUrl: run.prUrl, prNumber: run.prNumber } : {}) } })), [columns, moved, states, selectedStage, run?.prUrl, run?.prNumber]);
  function changeNodes(changes) {
    const positions = changes.filter(change => change.type === "position" && change.position);
    if (!positions.length) return;
    setMoved(previous => ({ columns, positions: { ...(previous.columns === columns ? previous.positions : {}), ...Object.fromEntries(positions.map(change => [change.id, change.position])) } }));
  }
  const edges = useMemo(() => nodes.slice(0, -1).map((node, index) => ({ id: `${node.id}-${nodes[index + 1].id}`, source: node.id, target: nodes[index + 1].id, sourceHandle: "out", targetHandle: "in", type: "smoothstep", className: node.data.state === "complete" ? "fix-edge-complete" : "", style: { strokeWidth: 1.5 }, markerEnd: { type: "arrowclosed", color: "var(--muted-foreground)" } })), [nodes]);
  return <div ref={container} className="fix-pipeline" style={{ height }} role="region" aria-label="Fix pipeline" onKeyDownCapture={event => {
    const node = event.target.closest('.react-flow__node');
    if (node && event.target === node && ["Enter", " "].includes(event.key)) {
      event.preventDefault(); event.stopPropagation(); onSelect(node.dataset.id);
    }
  }}>
    <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodeClick={(_, node) => onSelect(node.id)} onNodesChange={changeNodes} nodesDraggable nodesConnectable={false} edgesFocusable={false} deleteKeyCode={null} elementsSelectable fitViewOptions={{ padding: 0.14, maxZoom: 1 }} minZoom={0.25} maxZoom={1.5} panOnDrag={columns !== 1} zoomOnScroll={false} preventScrolling={false} zoomOnDoubleClick={false} colorMode={resolvedTheme === "dark" ? "dark" : "light"} proOptions={{ hideAttribution: false }}>
      <Controls showInteractive={false} />
      <FitLayout columns={columns} width={width} height={height} />
    </ReactFlow>
  </div>;
}
