import {useEffect, useMemo, useRef} from 'react';
import ReactFlow, {
    Background,
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 100;
const GENERATION_GAP_Y = 220;
const NODE_GAP_X = 120;

const getAvatarUrl = (avatarUrl: string | null | undefined): string | undefined => {
  if (!avatarUrl) return undefined;
  const cleanPath = avatarUrl.replace(/^\//, '');
  const cleanBaseUrl = API_BASE_URL.replace(/\/$/, '');
  return `${cleanBaseUrl}/${cleanPath}`;
};

const detectCycles = (members: FamilyMember[], relationships: Relationship[]): boolean => {
  const graph = new Map<string, string[]>();

  relationships.forEach(rel => {
    if (rel.relationship_type === 'parent_child' && rel.source_id && rel.target_id) {
      if (!graph.has(rel.source_id)) graph.set(rel.source_id, []);
      graph.get(rel.source_id)!.push(rel.target_id);
    }
  });

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const hasCycle = (nodeId: string): boolean => {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const children = graph.get(nodeId) || [];
    for (const child of children) {
      if (!visited.has(child)) {
        if (hasCycle(child)) return true;
      } else if (recursionStack.has(child)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  };

  for (const member of members) {
    if (!visited.has(member.id)) {
      if (hasCycle(member.id)) return true;
    }
  }

  return false;
};

interface EdgeStyle {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  markerEnd: { type: MarkerType; color: string };
}

const getEdgeStyle = (type: string): EdgeStyle => {
  switch (type) {
    case 'parent_child':
      return {
        stroke: '#10b981',
        strokeWidth: 2.5,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' }
      };
    case 'spouse':
      return {
        stroke: '#ec4899',
        strokeWidth: 2,
        strokeDasharray: '5,5',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#ec4899' }
      };
    case 'sibling':
      return {
        stroke: '#6366f1',
        strokeWidth: 2,
        strokeDasharray: '3,3',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' }
      };
    default:
      return {
        stroke: '#94a3b8',
        strokeWidth: 1,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' }
      };
  }
};


const MemberNode = ({ data }: { data: { member: FamilyMember } }) => {
  if (!data?.member) return null;
  const m = data.member;
  const fullName = getMemberFullName(m);
  const avatarUrl = getAvatarUrl(m.avatar_url);
  const isAlive = m.is_alive !== false;

  const getInitials = () => {
    const first = m.first_name?.[0] || '';
    const last = m.last_name?.[0] || '';
    return `${first}${last}`.toUpperCase() || '?';
  };

  return (
    <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 min-w-[160px] shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
      <div className={`absolute top-0 right-0 w-2 h-2 rounded-bl-lg ${isAlive ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden border border-slate-600">
          {avatarUrl ? (
            <img src={avatarUrl} className="w-full h-full rounded-full object-cover" alt="" />
          ) : (
            <span className="text-sm">{getInitials()}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white font-medium text-sm truncate" title={fullName}>{fullName}</p>
          <p className="text-slate-400 text-xs truncate">
            {m.gender === 'male' ? 'Мужчина' : m.gender === 'female' ? 'Женщина' : 'Не указано'}
            {!isAlive && ' 🕊️'}
          </p>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = { member: MemberNode };

interface Props {
  members: FamilyMember[];
  relationships: Relationship[];
  fullscreen?: boolean;
}

export const FamilyTree = ({ members, relationships, fullscreen = false }: Props) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const flowRef = useRef<HTMLDivElement>(null);

  const validMembers = useMemo(() => members?.filter(m => m && m.id) || [], [members]);
  const validRelationships = useMemo(() => relationships?.filter(r => r && r.source_id && r.target_id) || [], [relationships]);

  useEffect(() => {
    if (validMembers.length === 0) return;

    if (detectCycles(validMembers, validRelationships)) {
      console.warn("⚠️ Обнаружены циклы в родословной! Раскладка может быть некорректной.");
    }

    const graph = new dagre.graphlib.Graph();
    graph.setDefaultEdgeLabel(() => ({}));

    graph.setGraph({
      rankdir: 'TB',
      nodesep: NODE_GAP_X,
      ranksep: GENERATION_GAP_Y,
      align: 'UL',
    });

    validMembers.forEach((m) => {
      graph.setNode(m.id, {
        width: NODE_WIDTH,
        height: NODE_HEIGHT
      });
    });

    validRelationships.forEach((r) => {
      if (r.relationship_type === 'parent_child') {
        graph.setEdge(r.source_id, r.target_id);
      }
    });

    dagre.layout(graph);

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    graph.nodes().forEach((nodeId) => {
      const node = graph.node(nodeId);
      const member = validMembers.find(m => m.id === nodeId);
      if (!member) return;

      newNodes.push({
        id: nodeId,
        type: 'member',
        data: { member },
        position: { x: node.x - NODE_WIDTH / 2, y: node.y - NODE_HEIGHT / 2 },
      });
    });

    validRelationships.forEach((r) => {
      const edgeStyle = getEdgeStyle(r.relationship_type);
      newEdges.push({
        id: `${r.source_id}-${r.target_id}-${r.relationship_type}`,
        source: r.source_id,
        target: r.target_id,
        type: 'smoothstep',
        animated: r.relationship_type === 'parent_child',
        style: {
          stroke: edgeStyle.stroke,
          strokeWidth: edgeStyle.strokeWidth,
          ...(edgeStyle.strokeDasharray && { strokeDasharray: edgeStyle.strokeDasharray })
        },
        markerEnd: edgeStyle.markerEnd,
        label: r.relationship_type === 'spouse' ? '💑' : undefined,
        labelStyle: { fill: '#fff', fontSize: 14, fontWeight: 'bold' },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
        labelBgStyle: { fill: '#1e293b', fillOpacity: 0.8 },
      } as Edge);
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [validMembers, validRelationships, setNodes, setEdges]);

  const containerHeight = fullscreen ? '100vh' : '600px';

  if (validMembers.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-black/20 flex items-center justify-center" style={{ height: containerHeight }}>
        <p className="text-slate-400 flex flex-col items-center gap-2">
          <span className="text-2xl">🌳</span>
          Нет участников для отображения
        </p>
      </div>
    );
  }

  return (
    <div ref={flowRef} className="rounded-2xl border border-slate-700 bg-slate-900/50 relative overflow-hidden" style={{ height: containerHeight, width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        snapToGrid={true}
        snapGrid={[15, 15]}
        style={{ background: 'transparent' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#334155" gap={20} size={0.5} />
        <Controls />
        <MiniMap
          nodeStrokeColor={() => '#10b981'}
          nodeColor={() => '#1e293b'}
          maskColor="rgba(0,0,0,0.6)"
          pannable
          zoomable
        />
      </ReactFlow>

      {/* Легенда */}
      <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-700 text-xs text-slate-300 shadow-xl pointer-events-none z-10">
        <div className="font-bold mb-2 text-white">Легенда связей:</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 bg-emerald-500"></div>
            <span>Родитель → Ребенок</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 bg-pink-500" style={{ borderStyle: 'dashed', borderWidth: '1px', borderColor: '#ec4899' }}></div>
            <span>Супруги</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 bg-indigo-500" style={{ borderStyle: 'dotted', borderWidth: '1px', borderColor: '#6366f1' }}></div>
            <span>Братья/Сестры</span>
          </div>
        </div>
      </div>
    </div>
  );
};