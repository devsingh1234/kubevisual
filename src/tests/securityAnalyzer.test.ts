import { describe, it, expect } from 'vitest';
import { analyzeSecurity } from '../core/securityAnalyzer';
import type { K8sResource } from '../core/types';

describe('Security Analyzer', () => {
    it('detects missing limits and requests in Pod containers', () => {
        const pod: K8sResource = {
            id: 'pod1', kind: 'Pod', apiVersion: 'v1', metadata: { name: 'test' },
            spec: {
                containers: [{ name: 'c1', image: 'nginx', resources: {} }]
            }
        } as any;

        const findings = analyzeSecurity(pod);
        expect(findings.some(f => f.message.includes('no resource limits'))).toBe(true);
        expect(findings.some(f => f.message.includes('missing CPU request'))).toBe(true);
        expect(findings.some(f => f.message.includes('No securityContext'))).toBe(true);
    });

    it('detects privileged containers', () => {
        const pod: K8sResource = {
            id: 'pod1', kind: 'Pod', apiVersion: 'v1', metadata: { name: 'test' },
            spec: {
                containers: [{ name: 'c1', image: 'nginx', securityContext: { privileged: true, runAsNonRoot: true } }]
            }
        } as any;

        const findings = analyzeSecurity(pod);
        expect(findings.some(f => f.message.includes('privileged: true'))).toBe(true);
    });

    it('detects NodePort services', () => {
        const svc: K8sResource = {
            id: 'svc1', kind: 'Service', apiVersion: 'v1', metadata: { name: 'svc' },
            spec: { type: 'NodePort' }
        } as any;

        const findings = analyzeSecurity(svc);
        expect(findings.some(f => f.message.includes('NodePort'))).toBe(true);
    });

    it('detects sensitive ConfigMap data', () => {
        const cm: K8sResource = {
            id: 'cm1', kind: 'ConfigMap', apiVersion: 'v1', metadata: { name: 'cm' },
            data: {
                'DB_PASSWORD': 'plaintext-pass',
                'API_KEY': '12345'
            }
        } as any;

        const findings = analyzeSecurity(cm);
        expect(findings.length).toBe(2);
        expect(findings.some(f => f.message.includes('key "DB_PASSWORD"'))).toBe(true);
    });
});
