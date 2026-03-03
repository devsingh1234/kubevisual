import { useState } from 'react';
import { InputPanel } from './InputPanel';
import { GraphView } from './GraphView';
import { Sidebar } from './Sidebar';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { parseYaml } from '../core/parser';
import { buildRelationships } from '../core/relationshipEngine';
import { runValidations } from '../core/validationEngine';
import { analyzeSecurity } from '../core/securityAnalyzer';
import { calculateRiskScore } from '../core/riskScorer';
import type { ParseResult, K8sResource } from '../core/types';
import type { SecurityFinding } from '../core/diagnosticsTypes';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export function Workspace() {
    const [parsedData, setParsedData] = useState<ParseResult | null>(null);
    const [selectedNode, setSelectedNode] = useState<K8sResource | null>(null);
    const [showDiagnostics, setShowDiagnostics] = useState(false);

    const handleProcessYaml = (yamlString: string) => {
        try {
            const rawResult = parseYaml(yamlString);

            if (rawResult.errors.length > 0) {
                toast.error(`Parsed with formatting errors or empty documents. Check console for details.`, { duration: 4000 });
                console.warn('Parsing errors:', rawResult.errors);
            }

            if (rawResult.resources.length > 0) {
                // Phase 2: Run engines synchronously for now
                const relationships = buildRelationships(rawResult.resources);
                const diagnostics = runValidations(rawResult.resources, relationships);

                const securityFindings: SecurityFinding[] = [];
                rawResult.resources.forEach(res => {
                    securityFindings.push(...analyzeSecurity(res));
                });

                const riskSummary = calculateRiskScore(diagnostics, securityFindings);

                const finalResult: ParseResult = {
                    ...rawResult,
                    relationships,
                    diagnostics,
                    securityFindings,
                    riskSummary
                };

                setParsedData(finalResult);
                setSelectedNode(null);
                setShowDiagnostics(false);
                toast.success(`Loaded ${rawResult.resources.length} resources successfully`);
            } else {
                toast.error('No valid Kubernetes resources found in the provided YAML.');
            }
        } catch (err: any) {
            toast.error(`Error processing YAML: ${err.message}`);
        }
    };

    const handleClear = () => {
        setParsedData(null);
        setSelectedNode(null);
        setShowDiagnostics(false);
    };

    const handleSelectResourceFromDiagnostics = (resourceId: string) => {
        if (!parsedData) return;
        const resource = parsedData.resources.find(r => r.id === resourceId);
        if (resource) {
            setSelectedNode(resource);
        }
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-background overflow-hidden text-foreground">
            <Toaster position="top-center" />

            <InputPanel
                onProcess={handleProcessYaml}
                onClear={handleClear}
                hasData={parsedData !== null}
            />

            {parsedData && (
                <div className="flex-1 flex overflow-hidden relative">
                    {/* Floating Risk Badge / Diagnostics Toggle */}
                    {parsedData.riskSummary && (
                        <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
                            <button
                                onClick={() => {
                                    setSelectedNode(null);
                                    setShowDiagnostics(!showDiagnostics);
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm transition-all focus:outline-none ${parsedData.riskSummary.level === 'Critical' ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/20' :
                                        parsedData.riskSummary.level === 'High' ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20' :
                                            parsedData.riskSummary.level === 'Moderate' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/20' :
                                                'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/20'
                                    }`}
                            >
                                <div className="text-xs font-bold uppercase tracking-wide">Risk Score:</div>
                                <div className="font-extrabold text-lg leading-none">{parsedData.riskSummary.totalScore}</div>
                            </button>
                        </div>
                    )}

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex-1 h-full p-6 relative"
                    >
                        <GraphView
                            parsedData={parsedData}
                            onNodeSelect={setSelectedNode}
                        />
                    </motion.div>

                    <AnimatePresence>
                        {selectedNode && (
                            <motion.div
                                initial={{ opacity: 0, x: 450, width: 0 }}
                                animate={{ opacity: 1, x: 0, width: 450 }}
                                exit={{ opacity: 0, x: 450, width: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="border-l shadow-2xl h-full flex-shrink-0 bg-card z-20 overflow-hidden"
                            >
                                <Sidebar node={selectedNode} onClose={() => setSelectedNode(null)} />
                            </motion.div>
                        )}
                        {showDiagnostics && !selectedNode && (
                            <motion.div
                                initial={{ opacity: 0, x: 450, width: 0 }}
                                animate={{ opacity: 1, x: 0, width: 450 }}
                                exit={{ opacity: 0, x: 450, width: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="shadow-2xl h-full flex-shrink-0 z-20 overflow-hidden"
                            >
                                <DiagnosticsPanel
                                    diagnostics={parsedData.diagnostics}
                                    securityFindings={parsedData.securityFindings}
                                    riskSummary={parsedData.riskSummary}
                                    onClose={() => setShowDiagnostics(false)}
                                    onSelectResource={handleSelectResourceFromDiagnostics}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
