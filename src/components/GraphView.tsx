import { useCallback, useEffect } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    Panel,
    type NodeMouseHandler,
    type Node,
    type Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { K8sNode } from './nodes/K8sNode';
import type { ParseResult } from '../core/types';
import { buildRelationships } from '../core/relationshipEngine';
import { buildGraph } from '../core/graphBuilder';
import { getLayoutedElements } from '../core/layoutEngine';
import { LayoutDashboard } from 'lucide-react';

const nodeTypes = {
    k8sNode: K8sNode,
};

interface GraphViewProps {
    parsedData: ParseResult | null;
    onNodeSelect: (node: any) => void;
}

export function GraphView({ parsedData, onNodeSelect }: GraphViewProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    const onInitLayout = useCallback((direction = 'TB') => {
        if (!parsedData || parsedData.resources.length === 0) {
            setNodes([]);
            setEdges([]);
            return;
        }

        const relationships = buildRelationships(parsedData.resources);
        const { nodes: rawNodes, edges: rawEdges } = buildGraph(parsedData.resources, relationships);
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rawNodes, rawEdges, direction);

        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);
    }, [parsedData, setNodes, setEdges]);

    useEffect(() => {
        onInitLayout();
    }, [onInitLayout]);

    const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
        onNodeSelect(node.data.resource);
    }, [onNodeSelect]);

    const onPaneClick = useCallback(() => {
        onNodeSelect(null);
    }, [onNodeSelect]);

    if (!parsedData || parsedData.resources.length === 0) {
        return (
            <div className="flex w-full h-full items-center justify-center bg-muted/20 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                No resources to display. Upload or paste a YAML file to get started.
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-background rounded-xl border shadow-sm overflow-hidden relative react-flow-wrapper">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                fitView
                className="bg-muted/10"
                minZoom={0.1}
                maxZoom={2}
            >
                <Background gap={24} size={2} color="hsl(var(--muted-foreground))" />
                <Controls className="bg-background border shadow-md rounded-md overflow-hidden !m-4" />

                <Panel position="top-right" className="bg-background/80 backdrop-blur-md border rounded-lg shadow-sm p-1.5 flex gap-1 m-4">
                    <button
                        onClick={() => onInitLayout('TB')}
                        className="p-2 hover:bg-muted rounded-md transition-colors text-foreground/80 hover:text-foreground"
                        title="Vertical Layout"
                    >
                        <LayoutDashboard className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onInitLayout('LR')}
                        className="p-2 hover:bg-muted rounded-md transition-colors text-foreground/80 hover:text-foreground"
                        title="Horizontal Layout"
                        style={{ transform: 'rotate(-90deg)' }}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                    </button>
                </Panel>
            </ReactFlow>
        </div>
    );
}
