import type { K8sResource, K8sRelationship } from './types';

export function buildRelationships(resources: K8sResource[]): K8sRelationship[] {
    const edges: K8sRelationship[] = [];
    const resourceMap = new Map<string, K8sResource>();

    resources.forEach(res => resourceMap.set(res.id, res));

    resources.forEach(res => {
        switch (res.kind) {
            case 'Ingress':
                const rules = res.spec?.rules || [];
                rules.forEach((rule: any) => {
                    const paths = rule.http?.paths || [];
                    paths.forEach((path: any) => {
                        const svcName = path.backend?.service?.name || path.backend?.serviceName;
                        if (svcName) {
                            const targetId = `service-${res.metadata.namespace || 'default'}-${svcName}`.toLowerCase();
                            edges.push({
                                id: `${res.id}-to-${targetId}`,
                                source: res.id,
                                target: targetId,
                                type: 'ingress',
                                isBroken: !resourceMap.has(targetId)
                            });
                        }
                    });
                });
                break;

            case 'Service':
                const selector = res.spec?.selector;
                if (selector) {
                    resources.filter(r =>
                        ['Deployment', 'StatefulSet', 'DaemonSet', 'Pod'].includes(r.kind)
                    ).forEach(target => {
                        const labels = target.kind === 'Pod'
                            ? target.metadata?.labels
                            : target.spec?.template?.metadata?.labels;

                        if (labels) {
                            const matches = Object.entries(selector).every(([k, v]) => labels[k] === v);
                            if (matches) {
                                edges.push({
                                    id: `${res.id}-to-${target.id}`,
                                    source: res.id,
                                    target: target.id,
                                    type: 'selector'
                                });
                            }
                        }
                    });

                    const hasMatch = edges.some(e => e.source === res.id && e.type === 'selector');
                    if (!hasMatch) {
                        edges.push({
                            id: `${res.id}-broken-selector`,
                            source: res.id,
                            target: 'unknown',
                            type: 'selector',
                            isBroken: true
                        });
                    }
                }
                break;

            case 'Deployment':
            case 'StatefulSet':
            case 'DaemonSet':
            case 'Job':
            case 'CronJob':
            case 'Pod':
                const podSpec = res.kind === 'Pod' ? res.spec : res.spec?.template?.spec;
                if (podSpec) {
                    const containers = [...(podSpec.containers || []), ...(podSpec.initContainers || [])];

                    containers.forEach(container => {
                        container.env?.forEach((e: any) => {
                            if (e.valueFrom?.configMapKeyRef) {
                                const cmName = e.valueFrom.configMapKeyRef.name;
                                const targetId = `configmap-${res.metadata.namespace || 'default'}-${cmName}`.toLowerCase();
                                edges.push({
                                    id: `${res.id}-env-${targetId}`,
                                    source: res.id,
                                    target: targetId,
                                    type: 'env',
                                    label: cmName,
                                    isBroken: !resourceMap.has(targetId)
                                });
                            }
                            if (e.valueFrom?.secretKeyRef) {
                                const secretName = e.valueFrom.secretKeyRef.name;
                                const targetId = `secret-${res.metadata.namespace || 'default'}-${secretName}`.toLowerCase();
                                edges.push({
                                    id: `${res.id}-env-${targetId}`,
                                    source: res.id,
                                    target: targetId,
                                    type: 'env',
                                    label: secretName,
                                    isBroken: !resourceMap.has(targetId)
                                });
                            }
                        });

                        container.envFrom?.forEach((e: any) => {
                            if (e.configMapRef) {
                                const cmName = e.configMapRef.name;
                                const targetId = `configmap-${res.metadata.namespace || 'default'}-${cmName}`.toLowerCase();
                                edges.push({
                                    id: `${res.id}-envfrom-${targetId}`,
                                    source: res.id,
                                    target: targetId,
                                    type: 'env',
                                    label: cmName,
                                    isBroken: !resourceMap.has(targetId)
                                });
                            }
                            if (e.secretRef) {
                                const secretName = e.secretRef.name;
                                const targetId = `secret-${res.metadata.namespace || 'default'}-${secretName}`.toLowerCase();
                                edges.push({
                                    id: `${res.id}-envfrom-${targetId}`,
                                    source: res.id,
                                    target: targetId,
                                    type: 'env',
                                    label: secretName,
                                    isBroken: !resourceMap.has(targetId)
                                });
                            }
                        });
                    });

                    podSpec.volumes?.forEach((vol: any) => {
                        if (vol.configMap) {
                            const cmName = vol.configMap.name;
                            const targetId = `configmap-${res.metadata.namespace || 'default'}-${cmName}`.toLowerCase();
                            edges.push({
                                id: `${res.id}-vol-${targetId}`,
                                source: res.id,
                                target: targetId,
                                type: 'volume',
                                label: cmName,
                                isBroken: !resourceMap.has(targetId)
                            });
                        }
                        if (vol.secret) {
                            const secretName = vol.secret?.secretName;
                            if (secretName) {
                                const targetId = `secret-${res.metadata.namespace || 'default'}-${secretName}`.toLowerCase();
                                edges.push({
                                    id: `${res.id}-vol-${targetId}`,
                                    source: res.id,
                                    target: targetId,
                                    type: 'volume',
                                    label: secretName,
                                    isBroken: !resourceMap.has(targetId)
                                });
                            }
                        }
                        if (vol.persistentVolumeClaim) {
                            const pvcName = vol.persistentVolumeClaim.claimName;
                            const targetId = `persistentvolumeclaim-${res.metadata.namespace || 'default'}-${pvcName}`.toLowerCase();
                            edges.push({
                                id: `${res.id}-vol-${targetId}`,
                                source: res.id,
                                target: targetId,
                                type: 'volume',
                                label: pvcName,
                                isBroken: !resourceMap.has(targetId)
                            });
                        }
                    });

                    if (podSpec.serviceAccountName) {
                        const saName = podSpec.serviceAccountName;
                        const targetId = `serviceaccount-${res.metadata.namespace || 'default'}-${saName}`.toLowerCase();
                        edges.push({
                            id: `${res.id}-sa-${targetId}`,
                            source: res.id,
                            target: targetId,
                            type: 'serviceAccount',
                            isBroken: saName !== 'default' && !resourceMap.has(targetId)
                        });
                    }
                }
                break;

            case 'HorizontalPodAutoscaler':
                const targetRef = res.spec?.scaleTargetRef;
                if (targetRef) {
                    const targetId = `${targetRef.kind}-${res.metadata.namespace || 'default'}-${targetRef.name}`.toLowerCase();
                    edges.push({
                        id: `${res.id}-hpa-${targetId}`,
                        source: res.id,
                        target: targetId,
                        type: 'hpa',
                        isBroken: !resourceMap.has(targetId)
                    });
                }
                break;

            case 'NetworkPolicy':
                const podSelector = res.spec?.podSelector?.matchLabels;
                if (podSelector) {
                    resources.filter(r =>
                        ['Deployment', 'StatefulSet', 'DaemonSet', 'Pod'].includes(r.kind) &&
                        (r.metadata.namespace || 'default') === (res.metadata.namespace || 'default')
                    ).forEach(target => {
                        const labels = target.kind === 'Pod'
                            ? target.metadata?.labels
                            : target.spec?.template?.metadata?.labels;

                        if (labels) {
                            const matches = Object.entries(podSelector).every(([k, v]) => labels[k] === v);
                            if (matches) {
                                edges.push({
                                    id: `${res.id}-to-${target.id}`,
                                    source: res.id,
                                    target: target.id,
                                    type: 'networkPolicy'
                                });
                            }
                        }
                    });
                }
                break;
        }
    });

    return edges;
}
