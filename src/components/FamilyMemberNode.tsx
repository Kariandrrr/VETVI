import React from 'react';
import { Handle, Position } from 'reactflow';
import { UserCircle } from 'lucide-react';

interface FamilyMemberNodeData {
  label: string;
  relationship: string;
}

export const FamilyMemberNode: React.FC<{ data: FamilyMemberNodeData }> = ({
  data,
}) => {
  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case 'self':
        return 'from-emerald-400 to-cyan-400';
      case 'parent':
        return 'from-purple-400 to-pink-400';
      case 'child':
        return 'from-blue-400 to-cyan-400';
      case 'sibling':
        return 'from-yellow-400 to-orange-400';
      default:
        return 'from-slate-400 to-slate-500';
    }
  };

  return (
    <div className={`px-4 py-2 shadow-lg rounded-lg border-2 border-white bg-gradient-to-r ${getRelationshipColor(data.relationship)} dark:border-slate-700`}>
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2">
        <UserCircle className="w-5 h-5 text-white" />
        <div>
          <div className="font-semibold text-white text-sm">{data.label}</div>
          <div className="text-xs text-white/80">{data.relationship}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};