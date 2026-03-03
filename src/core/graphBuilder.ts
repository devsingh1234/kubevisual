import type { Node, Edge } from '@xyflow/react';
import type { ParseResult } from './types';

export function buildGraph(parsedData: ParseResult) {
    const { resources, relationships, diagnostics = [], securityFindings = [] } = parsedData;

    const nodes: Node[] = resources.map((res) => {
        const nodeDiagnostics = diagnostics.filter(d => d.resourceRef.id === res.id);
        const nodeFindings = securityFindings.filter(f => f.resourceRef.id === res.id);

        const hasCritical = nodeFindings.some(f => f.severity === 'critical');
        const hasError = nodeDiagnostics.some(d => d.type === 'error');
        const hasWarning = nodeDiagnostics.some(d => d.type === 'warning') || nodeFindings.some(f => f.severity === 'high');

        let status: 'critical' | 'error' | 'warning' | 'normal' = 'normal';
        if (hasCritical) status = 'critical';
        else if (hasError) status = 'error';
        else if (hasWarning) status = 'warning';

        return {
            id: res.id,
            type: 'k8sNode',
            position: { x: 0, y: 0 },
            data: {
                resource: res,
                label: res.metadata.name,
                kind: res.kind,
                namespace: res.metadata.namespace || 'default',
                status,
                diagnosticsCount: nodeDiagnostics.length,
                findingsCount: nodeFindings.length
            },
        };
    });

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
