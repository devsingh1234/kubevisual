import type { K8sResource } from './types';
import type { SecurityFinding } from './diagnosticsTypes';

export function analyzeSecurity(resource: K8sResource): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    const addFinding = (severity: SecurityFinding['severity'], category: SecurityFinding['category'], message: string) => {
        findings.push({
            id: crypto.randomUUID(),
            severity,
            category,
            message,
            resourceRef: {
                kind: resource.kind,
                name: resource.metadata?.name || 'unknown',
                namespace: resource.metadata?.namespace || 'default',
                id: resource.id
            }
        });
    };

    switch (resource.kind) {
        case 'Deployment':
        case 'StatefulSet':
        case 'DaemonSet':
        case 'Job':
        case 'CronJob':
        case 'Pod': {
            const spec = resource.kind === 'Pod' ? resource.spec : resource.spec?.template?.spec;
            if (!spec) break;

            const containers = [...(spec.containers || []), ...(spec.initContainers || [])];

            if (!spec.securityContext && containers.every(c => !c.securityContext)) {
                addFinding('medium', 'container', 'No securityContext defined at pod or container level.');
            }

            containers.forEach(container => {
                // Resource Limits
                if (!container.resources?.limits) {
                    addFinding('high', 'resource', `Container "${container.name}" has no resource limits defined.`);
                } else {
                    if (!container.resources.limits.memory) addFinding('medium', 'resource', `Container "${container.name}" missing memory limit.`);
                    if (!container.resources.limits.cpu) addFinding('medium', 'resource', `Container "${container.name}" missing CPU limit.`);
                }

                if (!container.resources?.requests?.cpu) {
                    addFinding('medium', 'resource', `Container "${container.name}" missing CPU request.`);
                }
                if (!container.resources?.requests?.memory) {
                    addFinding('medium', 'resource', `Container "${container.name}" missing memory request.`);
                }

                // Security Context
                if (container.securityContext?.privileged) {
                    addFinding('critical', 'container', `Container "${container.name}" has privileged: true.`);
                }

                if (container.securityContext?.allowPrivilegeEscalation) {
                    addFinding('high', 'container', `Container "${container.name}" allows privilege escalation.`);
                }

                if (container.securityContext?.runAsUser === 0 || (!container.securityContext?.runAsNonRoot && !spec.securityContext?.runAsNonRoot)) {
                    addFinding('high', 'container', `Container "${container.name}" is not explicitly restricted from running as root (runAsNonRoot not set).`);
                }

                // Image Tagging
                if (container.image?.endsWith(':latest') || !container.image?.includes(':')) {
                    addFinding('low', 'container', `Container "${container.name}" uses the ":latest" or absent tag.`);
                }

                // Secret Mounts via Env
                if (container.env) {
                    container.env.forEach((e: any) => {
                        if (e.valueFrom?.secretKeyRef) {
                            addFinding('medium', 'secret', `Secret mounted as environment variable in "${container.name}". Consider volume mounts.`);
                        }
                    });
                }
            });
            break;
        }

        case 'Service':
            if (resource.spec?.type === 'NodePort') {
                addFinding('high', 'network', 'Service type is NodePort. This exposes ports on the host nodes.');
            }
            break;

        case 'Ingress':
            if (!resource.spec?.tls || resource.spec.tls.length === 0) {
                addFinding('critical', 'network', 'Ingress without TLS configured allows unencrypted traffic.');
            }
            if (resource.spec?.rules) {
                resource.spec.rules.forEach((rule: any) => {
                    if (rule.host?.startsWith('*')) {
                        addFinding('high', 'network', 'Ingress uses a wildcard host which can lead to traffic routing issues or hijack.');
                    }
                });
            }
            break;

        case 'ConfigMap':
            if (resource.data) {
                const sensitiveKeywords = ['PASSWORD', 'TOKEN', 'KEY', 'SECRET', 'CREDENTIAL'];
                Object.keys(resource.data).forEach(k => {
                    const u = k.toUpperCase();
                    if (sensitiveKeywords.some(sw => u.includes(sw))) {
                        addFinding('critical', 'secret', `ConfigMap contains potentially plaintext sensitive values in key "${k}".`);
                    }
                });
            }
            break;
    }

    return findings;
}
