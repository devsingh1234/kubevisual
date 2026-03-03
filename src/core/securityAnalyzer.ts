import type { K8sResource, SecurityInsight } from './types';

export function analyzeSecurity(resource: K8sResource): SecurityInsight[] {
    const insights: SecurityInsight[] = [];

    const addInsight = (severity: 'high' | 'medium' | 'low', title: string, description: string) => {
        insights.push({
            resourceId: resource.id,
            severity,
            title,
            description
        });
    };

    switch (resource.kind) {
        case 'Deployment':
        case 'StatefulSet':
        case 'DaemonSet':
        case 'Job':
        case 'CronJob':
        case 'Pod':
            const spec = resource.kind === 'Pod' ? resource.spec : resource.spec?.template?.spec;
            if (!spec) break;

            const containers = [...(spec.containers || []), ...(spec.initContainers || [])];

            containers.forEach(container => {
                if (!container.resources?.limits?.memory || !container.resources?.limits?.cpu) {
                    addInsight('medium', 'Missing Resource Limits', `Container "${container.name}" lacks CPU or memory limits.`);
                }

                if (container.securityContext?.runAsUser === 0 || (!container.securityContext?.runAsNonRoot && !spec.securityContext?.runAsNonRoot)) {
                    addInsight('high', 'Container Running as Root', `Container "${container.name}" is potentially running as root. Configure runAsNonRoot: true.`);
                }

                if (container.securityContext?.privileged) {
                    addInsight('high', 'Privileged Container', `Container "${container.name}" is running in privileged mode.`);
                }

                if (container.image?.endsWith(':latest') || !container.image?.includes(':')) {
                    addInsight('low', 'Latest Image Tag', `Container "${container.name}" uses the ':latest' tag. Use versioned tags.`);
                }
            });
            break;

        case 'Service':
            if (resource.spec?.type === 'NodePort') {
                addInsight('medium', 'NodePort Exposure', 'Uses NodePort. Consider using an Ingress or LoadBalancer.');
            }
            break;

        case 'Ingress':
            if (!resource.spec?.tls || resource.spec.tls.length === 0) {
                addInsight('high', 'Missing TLS', 'Ingress has no TLS configured. Traffic is unencrypted.');
            }
            break;
    }

    return insights;
}
