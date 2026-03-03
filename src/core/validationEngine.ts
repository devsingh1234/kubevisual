import type { K8sResource, K8sRelationship } from './types';
import type { Diagnostic } from './diagnosticsTypes';

export function runValidations(resources: K8sResource[], relationships: K8sRelationship[]): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    const addDiag = (
        type: Diagnostic['type'],
        category: Diagnostic['category'],
        message: string,
        resource: K8sResource
    ) => {
        diagnostics.push({
            id: crypto.randomUUID(),
            type,
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

    // 1. Detect Duplicate Names in Namespace
    const nameMap = new Map<string, K8sResource[]>();
    resources.forEach(res => {
        const key = `${res.kind}-${res.metadata?.namespace || 'default'}-${res.metadata?.name}`;
        if (!nameMap.has(key)) nameMap.set(key, []);
        nameMap.get(key)!.push(res);
    });

    nameMap.forEach(group => {
        if (group.length > 1) {
            group.forEach(res => addDiag('error', 'configuration', `Duplicate ${res.kind} name "${res.metadata?.name}" found in namespace "${res.metadata?.namespace || 'default'}"`, res));
        }
    });

    // 2. Validate Relationships
    resources.forEach(resource => {

        if (resource.kind === 'Service') {
            // Find all relationships where this Service is the source
            const targetRels = relationships.filter(r => r.source === resource.id && r.type === 'selector');
            if (targetRels.length === 0 && resource.spec?.selector) {
                addDiag('error', 'relationship', `Service selector does not match any Deployment or Pod labels.`, resource);
            }

            // Port validation
            if (resource.spec?.ports && Array.isArray(resource.spec.ports)) {
                targetRels.forEach(rel => {
                    const target = resources.find(r => r.id === rel.target);
                    if (target) {
                        const podSpec = target.kind === 'Pod' ? target.spec : target.spec?.template?.spec;
                        if (podSpec?.containers) {
                            resource.spec.ports.forEach((svcPort: any) => {
                                let matchFound = false;
                                podSpec.containers.forEach((container: any) => {
                                    if (container.ports) {
                                        container.ports.forEach((cPort: any) => {
                                            if (cPort.containerPort === svcPort.targetPort || cPort.name === svcPort.targetPort) {
                                                matchFound = true;
                                            }
                                        });
                                    }
                                });
                                // If targetPort is not explicitly set, it defaults to port
                                const targetPortToCheck = svcPort.targetPort || svcPort.port;
                                if (!matchFound) {
                                    addDiag('warning', 'network', `Service targetPort ${targetPortToCheck} may not match any containerPort in backing workloads.`, resource);
                                }
                            });
                        }
                    }
                });
            }
        }

        if (resource.kind === 'HorizontalPodAutoscaler') {
            const targetRel = relationships.find(r => r.source === resource.id && r.type === 'hpa');
            if (!targetRel || targetRel.isBroken) {
                addDiag('error', 'relationship', `HPA target deployment/resource does not exist.`, resource);
            }
        }

        if (resource.kind === 'Ingress') {
            const backendRels = relationships.filter(r => r.source === resource.id && r.type === 'ingress');
            if (backendRels.some(r => r.isBroken)) {
                addDiag('error', 'relationship', `Ingress references a non-existent Service.`, resource);
            }
        }

        if (resource.kind === 'PersistentVolumeClaim') {
            const userRels = relationships.filter(r => r.target === resource.id && r.type === 'volume');
            if (userRels.length === 0) {
                addDiag('warning', 'storage', `PVC is not mounted by any workload.`, resource);
            }
        }

        // 3. Cross-Namespace Checking
        // Check outgoing relationships to ensure they don't unexpectedly cross namespaces
        const outgoing = relationships.filter(r => r.source === resource.id);
        outgoing.forEach(rel => {
            const target = resources.find(r => r.id === rel.target);
            if (target) {
                const srcNs = resource.metadata?.namespace || 'default';
                const tgtNs = target.metadata?.namespace || 'default';
                // Valid cross-namespace exceptions exist (like external services) but typically selectors/mounts shouldn't
                if (srcNs !== tgtNs && rel.type !== 'unknown') {
                    addDiag('warning', 'relationship', `Cross-namespace reference from ${srcNs} to ${tgtNs} detected.`, resource);
                }
            }
        });

    });

    // 4. Multiple services pointing to same selector
    const services = resources.filter(r => r.kind === 'Service');
    const serviceTargets = new Map<string, string[]>();

    services.forEach(svc => {
        const targetRels = relationships.filter(r => r.source === svc.id && r.type === 'selector');
        targetRels.forEach(rel => {
            if (!serviceTargets.has(rel.target)) serviceTargets.set(rel.target, []);
            serviceTargets.get(rel.target)!.push(svc.id);
        });
    });

    serviceTargets.forEach((svcs) => {
        if (svcs.length > 1) {
            svcs.forEach(svcId => {
                const svc = resources.find(r => r.id === svcId);
                if (svc) {
                    addDiag('warning', 'network', `Multiple services are pointing to the same workload backend.`, svc);
                }
            })
        }
    });

    return diagnostics;
}
