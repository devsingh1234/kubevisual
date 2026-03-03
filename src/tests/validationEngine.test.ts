import { describe, it, expect } from 'vitest';
import { runValidations } from '../core/validationEngine';
import type { K8sResource, K8sRelationship } from '../core/types';

describe('Validation Engine', () => {
    it('detects duplicate resource names in same namespace', () => {
        const resources: K8sResource[] = [
            { id: '1', kind: 'Deployment', apiVersion: 'v1', metadata: { name: 'app', namespace: 'default' }, spec: {} } as any,
            { id: '2', kind: 'Deployment', apiVersion: 'v1', metadata: { name: 'app', namespace: 'default' }, spec: {} } as any
        ];
        const diags = runValidations(resources, []);
        expect(diags.length).toBe(2);
        expect(diags[0].type).toBe('error');
        expect(diags[0].message).toContain('Duplicate Deployment name');
    });

    it('detects missing service selectors', () => {
        const resources: K8sResource[] = [
            { id: 'service1', kind: 'Service', apiVersion: 'v1', metadata: { name: 'svc' }, spec: { selector: { app: 'missing' } } } as any
        ];
        const diags = runValidations(resources, []);
        expect(diags.length).toBe(1);
        expect(diags[0].message).toContain('does not match any Deployment');
    });

    it('detects multiple services pointing to the same backend', () => {
        const resources: K8sResource[] = [
            { id: 'svc1', kind: 'Service', apiVersion: 'v1', metadata: { name: 'svc1' }, spec: {} } as any,
            { id: 'svc2', kind: 'Service', apiVersion: 'v1', metadata: { name: 'svc2' }, spec: {} } as any,
            { id: 'dep1', kind: 'Deployment', apiVersion: 'v1', metadata: { name: 'dep1' } } as any,
        ];
        const rels: K8sRelationship[] = [
            { id: 'r1', source: 'svc1', target: 'dep1', type: 'selector' },
            { id: 'r2', source: 'svc2', target: 'dep1', type: 'selector' }
        ];
        const diags = runValidations(resources, rels);
        expect(diags.length).toBe(2);
        expect(diags[0].message).toContain('Multiple services are pointing to the same workload backend');
    });
});
