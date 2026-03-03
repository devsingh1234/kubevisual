import { describe, it, expect } from 'vitest';
import { calculateRiskScore } from '../core/riskScorer';
import type { Diagnostic, SecurityFinding } from '../core/diagnosticsTypes';

describe('Risk Scorer', () => {
    it('calculates a score of 0 for no issues', () => {
        const result = calculateRiskScore([], []);
        expect(result.totalScore).toBe(0);
        expect(result.level).toBe('Low');
    });

    it('accrues points correctly and caps at 100', () => {
        const diags: Diagnostic[] = [
            { id: '1', type: 'error', category: 'relationship', message: 'err', resourceRef: {} as any },
            { id: '2', type: 'error', category: 'configuration', message: 'err', resourceRef: {} as any },
            { id: '3', type: 'warning', category: 'network', message: 'warn', resourceRef: {} as any }
        ];
        // 10 + 10 + 5 = 25

        const sec: SecurityFinding[] = [
            { id: '4', severity: 'critical', category: 'network', message: 'crit', resourceRef: {} as any },
            { id: '5', severity: 'high', category: 'container', message: 'high', resourceRef: {} as any },
            { id: '6', severity: 'critical', category: 'secret', message: 'crit', resourceRef: {} as any },
            { id: '7', severity: 'critical', category: 'secret', message: 'crit', resourceRef: {} as any },
        ];
        // 25 + 15 + 25 + 25 = 90
        // Total = 115

        const result = calculateRiskScore(diags, sec);
        expect(result.totalScore).toBe(60);
        expect(result.level).toBe('High');
        expect(result.breakdown.validationIssues).toBe(3);
        expect(result.breakdown.securityIssues).toBe(4);
    });
});
