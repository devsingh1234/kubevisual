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

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        try {
            const fileContents = await Promise.all(
                acceptedFiles.map(file => {
                    return new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onabort = () => reject(new Error('file reading was aborted'));
                        reader.onerror = () => reject(new Error('file reading has failed'));
                        reader.onload = () => {
                            const result = reader.result;
                            if (typeof result === 'string') {
                                resolve(result);
                            } else {
                                reject(new Error('file could not be read as string'));
                            }
                        };
                        reader.readAsText(file);
                    });
                })
            );

            if (fileContents.length > 0) {
                const combinedStr = fileContents.join('\n---\n');
                onProcess(combinedStr);
            }
        } catch (error) {
            console.error('Error reading files:', error);
        }
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
        <div className="flex flex-col h-full w-full items-center justify-center p-6 relative overflow-hidden">
            {/* Futuristic Background Elements */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-60 dark:opacity-40 pointer-events-none"></div>
            <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] opacity-50 dark:opacity-30 pointer-events-none"></div>

            <div className="absolute top-6 right-6 z-10">
                <ModeToggle />
            </div>

            <div className="w-full max-w-3xl relative z-10 flex flex-col">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="text-center mb-12"
                >
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 flex items-center justify-center gap-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-primary drop-shadow-sm">
                        <div className="p-3 bg-gradient-to-br from-primary to-purple-600 rounded-2xl text-white shadow-xl shadow-primary/40">
                            <FileJson className="w-10 h-10" />
                        </div>
                        KubeLens Pro
                    </h1>
                    <p className="text-xl text-muted-foreground/80 font-medium">Production-grade Kubernetes YAML Visualizer & Analyzer</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                    className="bg-background/40 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] overflow-hidden flex flex-col"
                >
                    <div className="flex border-b border-border/50 bg-muted/10 relative">
                        <button
                            className={cn("flex-1 py-5 text-sm font-semibold transition-all", activeTab === 'upload' ? "bg-background/50 border-b-2 border-primary text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/30")}
                            onClick={() => setActiveTab('upload')}
                        >
                            Upload File
                        </button>
                        <button
                            className={cn("flex-1 py-5 text-sm font-semibold transition-all", activeTab === 'paste' ? "bg-background/50 border-b-2 border-primary text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/30")}
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
                                            "w-full h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 transition-all cursor-pointer backdrop-blur-sm",
                                            isDragActive ? "border-primary bg-primary/10 scale-[0.99]" : "border-border/60 hover:border-primary/50 hover:bg-primary/5"
                                        )}
                                    >
                                        <input {...getInputProps()} />
                                        <motion.div
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                            className="p-5 bg-background/50 backdrop-blur-md border border-white/10 shadow-lg rounded-full mb-6"
                                        >
                                            <UploadCloud className="w-12 h-12 text-primary/80" />
                                        </motion.div>
                                        <p className="text-2xl font-semibold mb-3">Drag & drop your YAML manifests</p>
                                        <p className="text-base text-muted-foreground">Support for multi-document files (`---` separated)</p>
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
                                        className="flex-1 w-full bg-background/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5 font-mono text-sm resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 whitespace-pre transition-all hover:shadow-inner"
                                    />
                                    <motion.button
                                        whileHover={textInput.trim() ? { scale: 1.02 } : {}}
                                        whileTap={textInput.trim() ? { scale: 0.98 } : {}}
                                        onClick={handleProcessText}
                                        disabled={!textInput.trim()}
                                        className="mt-6 bg-gradient-to-r from-primary to-purple-600 text-white py-3.5 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                                    >
                                        Visualize Infrastructure
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
