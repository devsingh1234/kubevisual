import { X, Shield, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { Diagnostic, SecurityFinding, RiskSummary } from '../core/diagnosticsTypes';
import { cn } from '../lib/utils';

interface DiagnosticsPanelProps {
    diagnostics: Diagnostic[];
    securityFindings: SecurityFinding[];
    riskSummary: RiskSummary | null;
    onClose: () => void;
    onSelectResource: (id: string) => void;
}

export function DiagnosticsPanel({ diagnostics, securityFindings, riskSummary, onClose, onSelectResource }: DiagnosticsPanelProps) {
    const totalIssues = diagnostics.length + securityFindings.length;

    return (
        <div className="flex flex-col h-full bg-card text-card-foreground border-l w-[450px]">
            <div className="flex items-center justify-between p-4 border-b bg-muted/10">
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-lg">Diagnostics & Security</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Risk Summary Card */}
                {riskSummary && (
                    <div className="bg-muted/30 border rounded-xl p-4">
                        <div className="text-sm text-muted-foreground mb-1">Overall Project Risk</div>
                        <div className="flex items-end gap-3 mb-4">
                            <div className="text-4xl font-extrabold">{riskSummary.totalScore}</div>
                            <div className={cn(
                                "text-sm font-bold uppercase tracking-wider mb-1 px-2 py-0.5 rounded",
                                riskSummary.level === 'Critical' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                                    riskSummary.level === 'High' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                                        riskSummary.level === 'Moderate' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                                            'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            )}>
                                {riskSummary.level}
                            </div>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                            <div>Validation Issues: <span className="font-bold text-foreground">{riskSummary.breakdown.validationIssues}</span></div>
                            <div>Security Findings: <span className="font-bold text-foreground">{riskSummary.breakdown.securityIssues}</span></div>
                        </div>
                    </div>
                )}

                {totalIssues === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                        <Shield className="w-12 h-12 mb-4 opacity-20" />
                        <p>No issues found. Your architecture looks solid!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {securityFindings.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                    <Shield className="w-4 h-4" /> Security Findings ({securityFindings.length})
                                </h3>
                                <div className="space-y-2">
                                    {securityFindings.map(finding => (
                                        <div
                                            key={finding.id}
                                            className="p-3 bg-background border rounded-lg hover:border-primary/50 cursor-pointer transition-colors shadow-sm"
                                            onClick={() => onSelectResource(finding.resourceRef.id)}
                                        >
                                            <div className="flex items-start gap-2">
                                                {finding.severity === 'critical' || finding.severity === 'high' ? (
                                                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                                ) : (
                                                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium mb-1 relative">
                                                        {finding.message}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground font-mono bg-muted inline-block px-1.5 py-0.5 rounded">
                                                        {finding.resourceRef.kind}: {finding.resourceRef.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {diagnostics.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 mt-6 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Architecture Validations ({diagnostics.length})
                                </h3>
                                <div className="space-y-2">
                                    {diagnostics.map(diag => (
                                        <div
                                            key={diag.id}
                                            className="p-3 bg-background border rounded-lg hover:border-primary/50 cursor-pointer transition-colors shadow-sm"
                                            onClick={() => onSelectResource(diag.resourceRef.id)}
                                        >
                                            <div className="flex items-start gap-2">
                                                {diag.type === 'error' ? (
                                                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                                ) : diag.type === 'warning' ? (
                                                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                                ) : (
                                                    <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium mb-1 relative">
                                                        {diag.message}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground font-mono bg-muted inline-block px-1.5 py-0.5 rounded">
                                                        {diag.resourceRef.kind}: {diag.resourceRef.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
