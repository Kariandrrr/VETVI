import { useEffect, useMemo, useRef } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    type Edge,
    MarkerType,
    MiniMap,
    type Node,
    useNodesState,
    useEdgesState,
    Handle,
    Position,
    type NodeProps
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import dagre from 'dagre';
import type { FamilyMember, Relationship } from '@/types/families';
import { getMemberFullName } from '@/types/families';
import { calculateGenerations } from '@/utils/generationCalculator';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;
const GENERATION_GAP_Y = 240;
const NODE_GAP_X = 140;

const getAvatarUrl = (avatarUrl: string | null | undefined): string | undefined => {
    if (!avatarUrl) return undefined;
    const cleanPath = avatarUrl.replace(/^\//, '');
    const cleanBaseUrl = API_BASE_URL.replace(/\/$/, '');
    return `${cleanBaseUrl}/${cleanPath}`;
};

interface IncomingRelationship {
    source_id?: string;
    target_id?: string;
    from_member_id?: string;
    to_member_id?: string;
    relationship_type: 'parent_child' | 'spouse' | 'sibling';
}

type MemberNode = Node<{ member: FamilyMember }, 'member'>;
type GenerationGroupNode = Node<{ label: string }, 'generationGroup'>;
type AppNode = MemberNode | GenerationGroupNode;

const MemberNodeComponent = ({ data }: NodeProps<MemberNode>) => {
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
        <div className="bg-slate-950 rounded-xl p-3 border border-slate-700 min-w-[220px] shadow-2xl relative overflow-visible group hover:border-cyan-500/50 transition-colors">
            <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2.5 !h-2.5" />
            <div className={`absolute top-0 right-4 w-3 h-1 rounded-b-full ${isAlive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-500'}`}></div>

            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden border border-slate-700">
                    {avatarUrl ? (
                        <img src={avatarUrl} className="w-full h-full rounded-full object-cover" alt="" />
                    ) : (
                        <span className="text-xs text-slate-400">{getInitials()}</span>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold text-xs truncate" title={fullName}>{fullName}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5 truncate">
                        {m.gender === 'male' ? 'Мужчина' : m.gender === 'female' ? 'Женщина' : 'Не указано'}
                        {!isAlive && ' 🕊️'}
                    </p>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2.5 !h-2.5" />
        </div>
    );
};

const GenerationGroupNodeComponent = ({ data }: NodeProps<GenerationGroupNode>) => {
    return (
        <div className="w-full h-full border border-dashed border-slate-700/30 bg-slate-900/10 rounded-2xl flex items-start p-4 pointer-events-none box-border">
            <span className="text-xs font-bold tracking-widest text-slate-500 uppercase select-none">
                {data.label}
            </span>
        </div>
    );
};

interface Props {
    members: FamilyMember[];
    relationships: Relationship[];
    fullscreen?: boolean;
}

export const FamilyTree = ({ members, relationships, fullscreen = false }: Props) => {
    const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const flowRef = useRef<HTMLDivElement>(null);

    const nodeTypes = useMemo(() => ({
        member: MemberNodeComponent,
        generationGroup: GenerationGroupNodeComponent
    }), []);

    const validMembers = useMemo(() => members?.filter(m => m && m.id) || [], [members]);
    const memberIdsSet = useMemo(() => new Set(validMembers.map(m => m.id)), [validMembers]);

    const validRelationships = useMemo(() => {
        if (!relationships) return [];
        const raw = relationships as unknown as IncomingRelationship[];
        return raw
            .filter(r => r)
            .map(r => ({
                ...r,
                source_id: r.source_id || r.from_member_id || '',
                target_id: r.target_id || r.to_member_id || ''
            }))
            .filter(r => r.source_id && r.target_id && memberIdsSet.has(r.source_id) && memberIdsSet.has(r.target_id)) as Relationship[];
    }, [relationships, memberIdsSet]);

    useEffect(() => {
        if (validMembers.length === 0) return;

        try {
            const genMap = calculateGenerations(validMembers, validRelationships);

            const g = new dagre.graphlib.Graph();
            g.setDefaultEdgeLabel(() => ({}));
            g.setGraph({ rankdir: 'TB', nodesep: NODE_GAP_X, ranksep: GENERATION_GAP_Y });

            validMembers.forEach((m) => {
                g.setNode(m.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
            });

            validRelationships.forEach((r) => {
                if (r.relationship_type === 'parent_child') {
                    g.setEdge(r.source_id, r.target_id);
                }
            });

            dagre.layout(g);

            const computedNodes: AppNode[] = [];
            const generationRows: Record<number, { minX: number; maxX: number }> = {};

            g.nodes().forEach((nodeId) => {
                const dagreNode = g.node(nodeId);
                const member = validMembers.find(m => m.id === nodeId);
                if (!member || !dagreNode) return;

                let genIdx = genMap.get(nodeId) ?? 0;
                if (genMap.size === 0 || Array.from(genMap.values()).every(v => v === 0)) {
                    genIdx = Math.round(dagreNode.y / GENERATION_GAP_Y);
                }

                const posX = dagreNode.x - NODE_WIDTH / 2;
                const posY = genIdx * GENERATION_GAP_Y + 100;

                if (!generationRows[genIdx]) {
                    generationRows[genIdx] = { minX: posX, maxX: posX + NODE_WIDTH };
                } else {
                    generationRows[genIdx].minX = Math.min(generationRows[genIdx].minX, posX);
                    generationRows[genIdx].maxX = Math.max(generationRows[genIdx].maxX, posX + NODE_WIDTH);
                }

                computedNodes.push({
                    id: nodeId,
                    type: 'member',
                    data: { member },
                    position: { x: posX, y: posY },
                    style: { zIndex: 100 },
                });
            });

            const backgroundGroups: AppNode[] = [];
            Object.keys(generationRows).forEach((genStr) => {
                const genIdx = parseInt(genStr, 10);
                const row = generationRows[genIdx];

                const paddingX = 160;
                const width = Math.max((row.maxX - row.minX) + paddingX * 2, 1000);
                const startX = row.minX - paddingX;

                let label = `Поколение ${genIdx + 1}`;
                if (genIdx === 0) label = "👴👵 Прародители";
                else if (genIdx === 1) label = "👨👩 Родители";
                else if (genIdx === 2) label = "👶🧒 Дети";

                backgroundGroups.push({
                    id: `gen-group-${genIdx}`,
                    type: 'generationGroup',
                    data: { label },
                    position: { x: startX, y: genIdx * GENERATION_GAP_Y + 30 },
                    width: width,
                    height: NODE_HEIGHT + 130,
                    style: { zIndex: 1 },
                    selectable: false,
                    draggable: false,
                });
            });

            const computedEdges: Edge[] = validRelationships.map((r) => {
                const isSpouse = r.relationship_type === 'spouse';

                let edgeClassName = 'edge-parent-child';
                if (r.relationship_type === 'spouse') edgeClassName = 'edge-spouse';
                else if (r.relationship_type === 'sibling') edgeClassName = 'edge-sibling';

                return {
                    id: `${r.source_id}-${r.target_id}-${r.relationship_type}`,
                    source: r.source_id,
                    target: r.target_id,
                    type: isSpouse ? 'straight' : 'smoothstep',
                    animated: r.relationship_type === 'parent_child',
                    className: edgeClassName,
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 16,
                        height: 16,
                    },
                    label: isSpouse ? '💑' : undefined,
                    labelStyle: { fill: '#fff', fontSize: 11, fontWeight: 'bold' },
                    labelBgPadding: [4, 2],
                    labelBgBorderRadius: 6,
                    labelBgStyle: { fill: '#0f172a', fillOpacity: 0.9 },
                };
            });

            setNodes([...backgroundGroups, ...computedNodes]);
            setEdges(computedEdges);
        } catch (error) {
            console.error("Ошибка построения дерева:", error);
        }
    }, [validMembers, validRelationships, memberIdsSet, setNodes, setEdges]);

    const containerStyle = fullscreen
        ? { width: '100vw', height: '100vh' }
        : { width: '100%', height: '650px' };

    if (validMembers.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-700 bg-black/20 flex items-center justify-center" style={containerStyle}>
                <p className="text-slate-400 flex flex-col items-center gap-2">
                    <span className="text-2xl">🌳</span>
                    Нет участников для отображения
                </p>
            </div>
        );
    }

    return (
        <div
            ref={flowRef}
            className="rounded-2xl border border-slate-800 bg-slate-950/20 relative overflow-hidden"
            style={containerStyle}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.15 }}
                minZoom={0.05}
                maxZoom={1.5}
                snapToGrid={true}
                snapGrid={[20, 20]}
                proOptions={{ hideAttribution: true }}
            >
                {/* Фикс сетки: убираем конфликтующий gap */}
                <Background color="#334155" size={1} />
                <Controls />
                <MiniMap
                    maskColor="rgba(15, 15, 35, 0.7)"
                    pannable
                    zoomable
                />
            </ReactFlow>

            {/* Легенда */}
            <div className="absolute bottom-4 right-4 bg-slate-900/95 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 shadow-2xl pointer-events-none z-50">
                <div className="font-bold mb-2 text-white text-xs">Легенда связей:</div>
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-0.5 bg-emerald-500"></div>
                        <span>Родитель → Ребенок (Изумрудная)</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-0.5 border-t-2 border-dashed border-pink-500"></div>
                        <span>Супруги (Розовый пунктир)</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-0.5 border-t-2 border-dotted border-indigo-500"></div>
                        <span>Братья/Сестры (Синий пунктир)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};