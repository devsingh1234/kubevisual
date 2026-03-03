import { Handle, Position } from '@xyflow/react';
import {
    Box,
    Network,
    Database,
    Lock,
    Settings,
    Layers,
    Cpu,
    Globe,
    Shield,
    FileCode2,
    AlertTriangle,
    AlertCircle,
    BadgeAlert
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

const iconMap: Record<string, any> = {
    Pod: Box,
    Service: Network,
    Deployment: Layers,
    Ingress: Globe,
    ConfigMap: Settings,
    Secret: Lock,
    PersistentVolumeClaim: Database,
    StatefulSet: Database,
    DaemonSet: Layers,
    Job: Cpu,
    CronJob: Cpu,
    HorizontalPodAutoscaler: Settings,
    NetworkPolicy: Shield,
    default: FileCode2
};

const colorMap: Record<string, string> = {
    Pod: 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400',
    Service: 'bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400',
    Deployment: 'bg-purple-500/10 border-purple-500/50 text-purple-600 dark:text-purple-400',
    Ingress: 'bg-indigo-500/10 border-indigo-500/50 text-indigo-600 dark:text-indigo-400',
    ConfigMap: 'bg-amber-500/10 border-amber-500/50 text-amber-600 dark:text-amber-400',
    Secret: 'bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400',
    PersistentVolumeClaim: 'bg-cyan-500/10 border-cyan-500/50 text-cyan-600 dark:text-cyan-400',
    StatefulSet: 'bg-pink-500/10 border-pink-500/50 text-pink-600 dark:text-pink-400',
    NetworkPolicy: 'bg-slate-500/10 border-slate-500/50 text-slate-600 dark:text-slate-400'
};

export function K8sNode({ data, selected }: { data: any, selected: boolean }) {
    const Icon = iconMap[data.kind] || iconMap.default;
    const baseColors = colorMap[data.kind] || 'bg-gray-500/10 border-gray-500/50 text-gray-600 dark:text-gray-400';

    // Status overrides for borders
    let colors = baseColors;
    let StatusIcon = null;
    let statusColor = '';

    if (data.status === 'critical') {
        colors = baseColors.replace(/border-[a-z]+-500\/50/, 'border-red-600 dark:border-red-500 border-2');
        StatusIcon = BadgeAlert;
        statusColor = 'text-red-600 dark:text-red-400';
    } else if (data.status === 'error') {
        colors = baseColors.replace(/border-[a-z]+-500\/50/, 'border-red-500/80 border-2');
        StatusIcon = AlertCircle;
        statusColor = 'text-red-500';
    } else if (data.status === 'warning') {
        colors = baseColors.replace(/border-[a-z]+-500\/50/, 'border-amber-500/80 border-2');
        StatusIcon = AlertTriangle;
        statusColor = 'text-amber-500';
    }

    return (
        <div className={cn(
            "px-4 py-3 rounded-xl border-2 bg-background/95 backdrop-blur-sm min-w-[250px] transition-all duration-300 transform cursor-pointer relative",
            colors,
            selected
                ? "ring-2 ring-ring ring-offset-2 ring-offset-background shadow-xl scale-105 z-50"
                : "shadow-sm hover:shadow-md hover:scale-[1.02] hover:-translate-y-0.5"
        )}>
            {data.status === 'critical' && (
                <motion.div
                    initial={{ opacity: 0.5, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1.1 }}
                    transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
                    className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg z-10"
                    title="Critical Security Finding"
                >
                    <BadgeAlert className="w-4 h-4" />
                </motion.div>
            )}

            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-muted-foreground/30 left-1/2 -ml-1.5" />

            <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-background shadow-sm border", colors.split(' ')[0], colors.split(' ')[1])}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                    <div className="text-[11px] font-bold uppercase tracking-wider opacity-80 mb-0.5">
                        {data.kind}
                    </div>
                    <div className="font-medium text-foreground text-sm truncate" title={data.label}>
                        {data.label}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mt-3">
                {data.namespace && data.namespace !== 'default' && (
                    <div className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground inline-block">
                        ns: {data.namespace}
                    </div>
                )}

                {StatusIcon && (
                    <div className={cn("flex items-center gap-1 text-[10px] font-bold", statusColor)} title={`${data.diagnosticsCount} validations, ${data.findingsCount} security findings`}>
                        <StatusIcon className="w-3 h-3" />
                        {(data.diagnosticsCount || 0) + (data.findingsCount || 0)} issues
                    </div>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-muted-foreground/30 left-1/2 -ml-1.5 transition-colors hover:bg-primary" />
        </div>
    );
}
