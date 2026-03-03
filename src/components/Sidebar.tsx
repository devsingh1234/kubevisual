import type { K8sResource } from '../core/types';
import type { SecurityFinding } from '../core/diagnosticsTypes';
import { X, Info, ShieldAlert, Code2 } from 'lucide-react';
import YAML from 'yaml';
import { analyzeSecurity } from '../core/securityAnalyzer';

interface SidebarProps {
    node: K8sResource | null;
    onClose: () => void;
}

export function Sidebar({ node, onClose }: SidebarProps) {
    if (!node) return null;

    const yamlString = YAML.stringify(node, { indent: 2 });
    const securityInsights = analyzeSecurity(node);

    return (
        <div className="w-[450px] border-l bg-card flex flex-col h-full shadow-2xl relative z-20">
            <div className="flex items-center justify-between p-4 border-b bg-muted/10">
                <div>
                    <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                        {node.kind}
                    </div>
                    <h2 className="text-lg font-bold truncate pr-4" title={node.metadata.name}>
                        {node.metadata.name}
                    </h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <Info className="w-4 h-4 text-blue-500" />
                        <h3>Metadata</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-muted-foreground">Namespace:</div>
                        <div className="col-span-2 font-mono">{node.metadata.namespace || 'default'}</div>

                        <div className="text-muted-foreground">API Version:</div>
                        <div className="col-span-2 font-mono">{node.apiVersion}</div>
                    </div>

                    {node.metadata.labels && Object.keys(node.metadata.labels).length > 0 && (
                        <div className="mt-4">
                            <div className="text-xs font-medium text-muted-foreground mb-2">Labels</div>
                            <div className="flex flex-wrap gap-1.5">
                                {Object.entries(node.metadata.labels).map(([k, v]) => (
                                    <div key={k} className="px-2 py-1 text-[11px] bg-secondary text-secondary-foreground rounded-md font-mono border">
                                        <span className="opacity-70">{k}:</span> {v as string}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <hr className="border-border" />

                {securityInsights.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                            <ShieldAlert className="w-4 h-4" />
                            <h3>Security Insights</h3>
                        </div>
                        <div className="space-y-2">
                            {securityInsights.map((insight: SecurityFinding, idx: number) => (
                                <div key={idx} className="p-3 bg-destructive/10 border-l-2 border-destructive rounded-r-md">
                                    <div className="font-semibold text-sm text-destructive mb-1 capitalize flex items-center justify-between">
                                        {insight.category} Risk
                                        <span className="text-[10px] bg-destructive/20 px-2 rounded-full uppercase">{insight.severity}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">{insight.message}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {securityInsights.length > 0 && <hr className="border-border" />}

                <div className="space-y-3 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <Code2 className="w-4 h-4 text-amber-500" />
                        <h3>YAML Definition</h3>
                    </div>
                    <div className="relative flex-1 bg-muted/40 rounded-lg border overflow-hidden">
                        <pre className="p-4 text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                            {yamlString}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
