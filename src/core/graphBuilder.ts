import type { Node, Edge } from '@xyflow/react';
import type { K8sResource, K8sRelationship } from './types';

export function buildGraph(resources: K8sResource[], relationships: K8sRelationship[]) {
    const nodes: Node[] = resources.map((res) => ({
        id: res.id,
        type: 'k8sNode',
        position: { x: 0, y: 0 },
        data: {
            resource: res,
            label: res.metadata.name,
            kind: res.kind,
            namespace: res.metadata.namespace || 'default'
        },
    }));

    const edges: Edge[] = relationships.map((rel) => {
        let style = { stroke: '#64748b', strokeWidth: 1.5 };
        let animated = false;

        if (rel.isBroken) {
            style = { stroke: '#ef4444', strokeWidth: 2 } as any;
        }

        if (rel.type === 'selector' || rel.type === 'ingress') {
            animated = true;
        }

        return {
            id: rel.id,
            source: rel.source,
            target: rel.target,
            label: rel.label,
            animated,
            style,
            data: { type: rel.type }
        };
    });

    return { nodes, edges };
}
