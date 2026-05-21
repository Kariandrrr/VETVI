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

// Подключаем стили v12, которые прописаны у тебя в index.css
import '@xyflow/react/dist/style.css';

import dagre from 'dagre';
import type { FamilyMember, Relationship } from '@/types/families';
import { getMemberFullName } from '@/types/families';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;
const GENERATION_GAP_Y = 220; // Шаг между поколениями
const NODE_GAP_X = 160;       // Расстояние по горизонтали, чтобы карточки не слипались

const getAvatarUrl = (avatarUrl: string | null | undefined): string | undefined => {
    if (!avatarUrl) return undefined;
    const cleanPath = avatarUrl.replace(/^\//, '');
    const cleanBaseUrl = API_BASE_URL.replace(/\/$/, '');
    return `${cleanBaseUrl}/${cleanPath}`;
};

interface IncomingRelationship {
    id?: string;
    source_id?: string;
    target_id?: string;
    from_member_id?: string;
    to_member_id?: string;
    relationship_type: 'parent_child' | 'spouse' | 'sibling';
}

// Типизируем кастомную ноду для XYFlow v12
type MemberNode = Node<{ member: FamilyMember }, 'member'>;

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
            <Handle type="target" position={Position.Top} className="!bg-slate-500 !w-2 !h-2" />

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

            <Handle type="source" position={Position.Bottom} className="!bg-slate-500 !w-2 !h-2" />
        </div>
    );
};

interface Props {
    members: FamilyMember[];
    relationships: Relationship[];
    fullscreen?: boolean;
}

export const FamilyTree = ({ members, relationships, fullscreen = false }: Props) => {
    // Явно указываем типы генериков, чтобы убрать ошибку TS2345 (never[])
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const flowRef = useRef<HTMLDivElement>(null);

    const nodeTypes = useMemo(() => ({
        member: MemberNodeComponent
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
            // Инициализируем Dagre
            const g = new dagre.graphlib.Graph();
            g.setDefaultEdgeLabel(() => ({}));
            g.setGraph({
                rankdir: 'TB',
                nodesep: NODE_GAP_X,
                ranksep: GENERATION_GAP_Y
            });

            // Передаем узлы
            validMembers.forEach((m) => {
                g.setNode(m.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
            });

            // Строим связи только для иерархии (родитель-ребенок) внутри Dagre
            validRelationships.forEach((r) => {
                if (r.relationship_type === 'parent_child') {
                    g.setEdge(r.source_id, r.target_id);
                }
            });

            dagre.layout(g);

            // Вычисляем уровни (Y координаты) динамически, чтобы избежать каши
            const levels = new Map<string, number>();
            validMembers.forEach(m => levels.set(m.id, 0));

            // Проход по связям для выстраивания точных этажей поколений
            for (let i = 0; i < 4; i++) {
                validRelationships.forEach(r => {
                    if (r.relationship_type === 'parent_child') {
                        const parentLvl = levels.get(r.source_id) ?? 0;
                        const childLvl = levels.get(r.target_id) ?? 0;
                        if (childLvl <= parentLvl) {
                            levels.set(r.target_id, parentLvl + 1);
                        }
                    }
                    if (r.relationship_type === 'spouse' || r.relationship_type === 'sibling') {
                        const lvl1 = levels.get(r.source_id) ?? 0;
                        const lvl2 = levels.get(r.target_id) ?? 0;
                        if (lvl1 !== lvl2) {
                            const maxLvl = Math.max(lvl1, lvl2);
                            levels.set(r.source_id, maxLvl);
                            levels.set(r.target_id, maxLvl);
                        }
                    }
                });
            }

            // Рендерим ноды родственников
            const computedNodes: Node[] = validMembers.map((m) => {
                const dagreNode = g.node(m.id);
                const genLevel = levels.get(m.id) ?? 0;

                return {
                    id: m.id,
                    type: 'member',
                    data: { member: m },
                    // X берем у Dagre, Y — жестко по вычисленному уровню поколения
                    position: {
                        x: dagreNode ? (dagreNode.x - NODE_WIDTH / 2) : 0,
                        y: genLevel * GENERATION_GAP_Y + 60
                    },
                };
            });

            // Отрисовываем линии связей в соответствии с классами из твоего index.css
            const computedEdges: Edge[] = validRelationships.map((r) => {
                const isSpouse = r.relationship_type === 'spouse';
                let edgeClassName = 'edge-parent-child';

                if (isSpouse) edgeClassName = 'edge-spouse';
                else if (r.relationship_type === 'sibling') edgeClassName = 'edge-sibling';

                return {
                    id: `${r.source_id}-${r.target_id}-${r.relationship_type}`,
                    source: r.source_id,
                    target: r.target_id,
                    type: isSpouse ? 'straight' : 'smoothstep',
                    animated: r.relationship_type === 'parent_child',
                    className: edgeClassName, // Подхватывает стили цвета линий из глобального CSS
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

            setNodes(computedNodes);
            setEdges(computedEdges);
        } catch (error) {
            console.error("Ошибка обновления дерева:", error);
        }
    }, [validMembers, validRelationships, setNodes, setEdges]);

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