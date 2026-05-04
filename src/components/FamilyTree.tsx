import React, {useCallback, useState} from 'react';
import ReactFlow, {
    addEdge,
    Background,
    type Connection,
    Controls,
    type Edge,
    MiniMap,
    type Node,
    useEdgesState,
    useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {FamilyMemberNode} from './FamilyMemberNode';
import {AddMemberDialog} from './AddMemberDialog';
import {Button} from '@/components/ui/button';
import {Trash2} from 'lucide-react';

interface FamilyTreeProps {
  showAddMember: boolean;
  onAddMemberClose: () => void;
}

const initialNodes: Node[] = [
  {
    id: '1',
    data: { label: 'Вы', relationship: 'self' },
    position: { x: 0, y: 0 },
    type: 'familyMember',
  },
];

const initialEdges: Edge[] = [];

const nodeTypes = {
  familyMember: FamilyMemberNode,
};

export const FamilyTree: React.FC<FamilyTreeProps> = ({
  showAddMember,
  onAddMemberClose,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const handleAddMember = (data: any) => {
    const newNode: Node = {
      id: `member-${Date.now()}`,
      data: { label: data.name, relationship: data.relationship },
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      type: 'familyMember',
    };
    setNodes((nds) => [...nds, newNode]);
    onAddMemberClose();
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) =>
      eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
    setSelectedNode(null);
  };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gradient-to-br from-emerald-50 via-cyan-50 to-purple-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800"
      >
        <Background
          color="#e0e7ff"
          gap={16}
          className="dark:opacity-20"
        />
        <Controls
          className="[&_button]:bg-white [&_button]:dark:bg-slate-800 [&_button]:border [&_button]:border-emerald-200 [&_button]:dark:border-emerald-900 [&_button]:text-slate-600 [&_button]:dark:text-slate-400"
        />
        <MiniMap
          className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900"
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>

      {/* Toolbar */}
      <div className="absolute top-4 right-4 z-40 flex gap-2">
        {selectedNode && (
          <Button
            onClick={() => handleDeleteNode(selectedNode)}
            variant="destructive"
            size="sm"
            className="bg-red-500 hover:bg-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Удалить
          </Button>
        )}
      </div>

      {/* Add Member Dialog */}
      <AddMemberDialog
        open={showAddMember}
        onOpenChange={onAddMemberClose}
        onAddMember={handleAddMember}
      />
    </div>
  );
};