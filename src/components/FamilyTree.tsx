import {useCallback, useEffect, useMemo} from 'react'; // ✅ Добавили useEffect
import ReactFlow, {
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    Background,
    type Connection,
    Controls,
    type Edge,
    MarkerType,
    MiniMap,
    type Node,
    useEdgesState,
    useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import type {FamilyMember, Relationship} from '@/types/families';
import {getMemberFullName} from '@/types/families';

const MemberNode = ({ data }: { data: { member: FamilyMember } }) => {
  if (!data || !data.member) {
    return (
      <div className="w-32 h-24 bg-red-500/20 border border-red-500 rounded-xl flex items-center justify-center text-xs text-red-200">
        Ошибка данных
      </div>
    );
  }

  const m = data.member;
  const initials = `${m.first_name[0]}${m.last_name[0]}`.toUpperCase();

  return (
    <div className="glass-card w-40 p-3 flex flex-col items-center gap-2 border-[var(--glass-border)] hover:border-[var(--primary)] transition-colors shadow-lg bg-[var(--glass-bg)] backdrop-blur-md cursor-pointer group">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-bold text-lg overflow-hidden shadow-inner transition-transform group-hover:scale-110">
        {m.avatar_url ? (
          <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <div className="text-center w-full">
        <p className="text-white font-semibold text-sm leading-tight truncate w-full px-1 drop-shadow-md">
          {getMemberFullName(m)}
        </p>
        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-black/30 text-[10px] text-slate-300 uppercase tracking-wider border border-white/10">
          {m.gender === 'male' ? 'М' : m.gender === 'female' ? 'Ж' : '?'}
        </span>
      </div>
    </div>
  );
};

const nodeTypes = { member: MemberNode };

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: 80,
    ranksep: 100,
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => g.setNode(node.id, { width: 160, height: 120 }));
  edges.forEach((edge) => g.setEdge(edge.source, edge.target));

  dagre.layout(g);

  return {
    nodes: nodes.map((node) => {
      const nodeWithPosition = g.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 80,
          y: nodeWithPosition.y - 60,
        },
      };
    }),
    edges,
  };
};

interface Props {
  members: FamilyMember[];
  relationships: Relationship[];
}

export const FamilyTree = ({ members, relationships }: Props) => {
  const initialNodes = useMemo<Node[]>(() =>
    members.map((m) => ({
      id: m.id,
      type: 'member',
      data: { member: m },
      position: { x: 0, y: 0 },
    })),
  [members]);

  const initialEdges = useMemo<Edge[]>(() =>
    relationships.map((r) => {
      const isSpouse = r.relationship_type.toLowerCase().includes('spouse');
      return {
        id: `e-${r.source_id}-${r.target_id}`,
        source: r.source_id,
        target: r.target_id,
        type: isSpouse ? 'smoothstep' : 'default',
        animated: isSpouse,
        style: isSpouse
          ? { stroke: '#a855f7', strokeWidth: 2, strokeDasharray: '5 5' }
          : { stroke: '#22d3ee', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#22d3ee', width: 15, height: 15 },
        label: r.relationship_type === 'parent' ? 'родитель' : undefined,
        labelStyle: { fill: '#94a3b8', fontSize: 10, fontWeight: 600 },
        labelBgStyle: { fill: 'rgba(0,0,0,0.7)', rx: 4, ry: 4 },
      };
    }),
  [relationships]);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(initialNodes, initialEdges, 'TB'),
    [initialNodes, initialEdges],
  );

  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);

  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'default' }, eds)),
    [setEdges],
  );

  return (
    <div key={members.length} className="w-full h-[600px] rounded-2xl overflow-hidden border border-[var(--glass-border)] bg-black/20">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => setNodes((nds) => applyNodeChanges(changes, nds))}
        onEdgesChange={(changes) => setEdges((eds) => applyEdgeChanges(changes, eds))}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        className="bg-transparent"
      >
        <Background color="#475569" gap={20} size={1} />
        <Controls className="glass-card border-[var(--glass-border)] !bg-transparent" />
        <MiniMap className="glass-card border-[var(--glass-border)]" />
      </ReactFlow>
    </div>
  );
};