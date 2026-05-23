import type {FamilyMember, Relationship} from '@/types/families';

export const calculateGenerations = (
  members: FamilyMember[],
  relationships: Relationship[]
): Map<string, number> => {
  const generations = new Map<string, number>();
  const adjList = new Map<string, string[]>();
  const parentMap = new Map<string, string[]>();

  relationships.forEach(rel => {
    if (rel.relationship_type === 'parent_child') {
      if (!adjList.has(rel.source_id)) {
        adjList.set(rel.source_id, []);
      }
      adjList.get(rel.source_id)!.push(rel.target_id);

      if (!parentMap.has(rel.target_id)) {
        parentMap.set(rel.target_id, []);
      }
      parentMap.get(rel.target_id)!.push(rel.source_id);
    }
  });

  const rootMembers = members.filter(member => {
    const parents = parentMap.get(member.id);
    return !parents || parents.length === 0;
  });

  if (rootMembers.length === 0) {
    members.forEach(member => {
      generations.set(member.id, 0);
    });
    return generations;
  }

  const queue: { id: string; gen: number }[] = [];

  rootMembers.forEach(root => {
    generations.set(root.id, 0);
    queue.push({ id: root.id, gen: 0 });
  });

  while (queue.length > 0) {
    const { id, gen } = queue.shift()!;
    const children = adjList.get(id) || [];

    children.forEach(childId => {
      const currentGen = generations.get(childId);
      const newGen = gen + 1;

      if (currentGen === undefined || newGen > currentGen) {
        generations.set(childId, newGen);
        queue.push({ id: childId, gen: newGen });
      }
    });
  }

  relationships.forEach(rel => {
    if (rel.relationship_type === 'spouse') {
      const gen1 = generations.get(rel.source_id);
      const gen2 = generations.get(rel.target_id);

      if (gen1 !== undefined && gen2 !== undefined && gen1 !== gen2) {
        const minGen = Math.min(gen1, gen2);
        generations.set(rel.source_id, minGen);
        generations.set(rel.target_id, minGen);

        const updateDescendants = (memberId: string, newGen: number) => {
          const children = adjList.get(memberId) || [];
          children.forEach(childId => {
            const childGen = generations.get(childId);
            if (childGen !== undefined && childGen <= newGen) {
              const updatedGen = newGen + 1;
              generations.set(childId, updatedGen);
              updateDescendants(childId, updatedGen);
            }
          });
        };

        updateDescendants(rel.source_id, minGen);
        updateDescendants(rel.target_id, minGen);
      }
    }
  });

  return generations;
};

export const groupMembersByGeneration = (
  members: FamilyMember[],
  relationships: Relationship[]
): Map<number, FamilyMember[]> => {
  const generations = calculateGenerations(members, relationships);
  const grouped = new Map<number, FamilyMember[]>();

  members.forEach(member => {
    const gen = generations.get(member.id) ?? 0;
    if (!grouped.has(gen)) {
      grouped.set(gen, []);
    }
    grouped.get(gen)!.push(member);
  });

  return new Map([...grouped.entries()].sort((a, b) => a[0] - b[0]));
};

export const getGenerationRange = (
  members: FamilyMember[],
  relationships: Relationship[]
): { minGen: number; maxGen: number } => {
  const generations = calculateGenerations(members, relationships);
  let minGen = Infinity;
  let maxGen = -Infinity;

  generations.forEach(gen => {
    minGen = Math.min(minGen, gen);
    maxGen = Math.max(maxGen, gen);
  });

  return { minGen: minGen === Infinity ? 0 : minGen, maxGen: maxGen === -Infinity ? 0 : maxGen };
};

export const detectCycles = (
  members: FamilyMember[],
  relationships: Relationship[]
): boolean => {
  const adjList = new Map<string, string[]>();

  relationships.forEach(rel => {
    if (rel.relationship_type === 'parent_child') {
      if (!adjList.has(rel.source_id)) adjList.set(rel.source_id, []);
      adjList.get(rel.source_id)!.push(rel.target_id);
    }
  });

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const dfs = (nodeId: string): boolean => {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adjList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  };

  for (const member of members) {
    if (!visited.has(member.id)) {
      if (dfs(member.id)) return true;
    }
  }
  return false;
};