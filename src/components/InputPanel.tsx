import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileJson, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ModeToggle } from './ModeToggle';

interface InputPanelProps {
    onProcess: (yamlString: string) => void;
    onClear: () => void;
    hasData: boolean;
}

export function InputPanel({ onProcess, onClear, hasData }: InputPanelProps) {
    const [textInput, setTextInput] = useState('');
    const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');

    const onDrop = useCallback((acceptedFiles: File[]) => {
        acceptedFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onabort = () => console.log('file reading was aborted');
            reader.onerror = () => console.log('file reading has failed');
            reader.onload = () => {
                const binaryStr = reader.result;
                if (typeof binaryStr === 'string') {
                    onProcess(binaryStr);
                }
            };
            reader.readAsText(file);
        });
    }, [onProcess]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'text/yaml': ['.yaml', '.yml'], 'application/x-yaml': ['.yaml', '.yml'] } });

    const handleProcessText = () => {
        if (textInput.trim()) {
            onProcess(textInput);
        }
    };

    if (hasData) {
        return (
            <div className="flex items-center justify-between px-6 py-3 bg-card border-b z-10">
                <div className="flex items-center gap-2 text-primary font-bold text-xl">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                        <FileJson className="w-5 h-5 text-primary" />
                    </div>
                    KubeLens Pro
                </div>
                <div className="flex items-center gap-4">
                    <ModeToggle />
                    <button
                        onClick={onClear}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-destructive bg-destructive/10 rounded-md hover:bg-destructive/20 transition-colors"
                    >
                        <X className="w-4 h-4" />
                        Clear Graph
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full max-w-3xl mx-auto p-6 justify-center relative">
            <div className="absolute top-6 right-6">
                <ModeToggle />
            </div>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-center mb-10"
            >
                <h1 className="text-4xl font-extrabold tracking-tight mb-4 flex items-center justify-center gap-3">
                    <div className="p-2.5 bg-primary rounded-xl text-primary-foreground shadow-lg shadow-primary/30">
                        <FileJson className="w-8 h-8" />
                    </div>
                    KubeLens Pro
                </h1>
                <p className="text-lg text-muted-foreground">Production-grade Kubernetes YAML Visualizer & Analyzer</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                className="bg-card border rounded-2xl shadow-xl overflow-hidden flex flex-col"
            >
                <div className="flex border-b bg-muted/20 relative">
                    <button
                        className={cn("flex-1 py-4 text-sm font-semibold transition-all", activeTab === 'upload' ? "bg-background border-b-2 border-primary text-foreground" : "text-muted-foreground hover:bg-muted/50")}
                        onClick={() => setActiveTab('upload')}
                    >
                        Upload File
                    </button>
                    <button
                        className={cn("flex-1 py-4 text-sm font-semibold transition-all", activeTab === 'paste' ? "bg-background border-b-2 border-primary text-foreground" : "text-muted-foreground hover:bg-muted/50")}
                        onClick={() => setActiveTab('paste')}
                    >
                        Paste YAML
                    </button>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                    <AnimatePresence mode="wait">
                        {activeTab === 'upload' ? (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                                className="flex-1 flex flex-col items-center justify-center min-h-[350px] w-full"
                            >
                                <div
                                    {...getRootProps()}
                                    className={cn(
                                        "w-full h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-12 transition-all cursor-pointer",
                                        isDragActive ? "border-primary bg-primary/5 scale-[0.99]" : "border-border hover:border-primary/50 hover:bg-muted/30"
                                    )}
                                >
                                    <input {...getInputProps()} />
                                    <motion.div
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        className="p-4 bg-muted rounded-full mb-4"
                                    >
                                        <UploadCloud className="w-10 h-10 text-muted-foreground" />
                                    </motion.div>
                                    <p className="text-xl font-medium mb-2">Drag & drop your YAML manifests</p>
                                    <p className="text-sm text-muted-foreground">Support for multi-document files (`---` separated)</p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="paste"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="flex-1 flex flex-col h-full min-h-[350px]"
                            >
                                <textarea
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder={"apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: my-app\n..."}
                                    className="flex-1 w-full bg-muted/30 border rounded-xl p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary whitespace-pre transition-shadow hover:shadow-inner"
                                />
                                <motion.button
                                    whileHover={textInput.trim() ? { scale: 1.02 } : {}}
                                    whileTap={textInput.trim() ? { scale: 0.98 } : {}}
                                    onClick={handleProcessText}
                                    disabled={!textInput.trim()}
                                    className="mt-4 bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    Visualize Infrastructure
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
