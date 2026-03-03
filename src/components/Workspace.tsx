import { useState } from 'react';
import { InputPanel } from './InputPanel';
import { GraphView } from './GraphView';
import { Sidebar } from './Sidebar';
import { parseYaml } from '../core/parser';
import type { ParseResult, K8sResource } from '../core/types';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export function Workspace() {
    const [parsedData, setParsedData] = useState<ParseResult | null>(null);
    const [selectedNode, setSelectedNode] = useState<K8sResource | null>(null);

    const handleProcessYaml = (yamlString: string) => {
        try {
            const result = parseYaml(yamlString);

            if (result.errors.length > 0) {
                toast.error(`Parsed with formatting errors or empty documents. Check console for details.`, { duration: 4000 });
                console.warn('Parsing errors:', result.errors);
            }

            if (result.resources.length > 0) {
                setParsedData(result);
                setSelectedNode(null);
                toast.success(`Loaded ${result.resources.length} resources successfully`);
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
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
