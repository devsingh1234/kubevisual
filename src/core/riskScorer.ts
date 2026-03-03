import type { Diagnostic, SecurityFinding, RiskSummary } from './diagnosticsTypes';

export function calculateRiskScore(diagnostics: Diagnostic[], securityFindings: SecurityFinding[]): RiskSummary {
    let totalScore = 0;

    // Weight validation issues
    let validationIssues = 0;
    diagnostics.forEach(diag => {
        if (diag.type === 'error') {
            totalScore += 10;
            validationIssues++;
        } else if (diag.type === 'warning') {
            totalScore += 5;
            validationIssues++;
        } else if (diag.type === 'info') {
            totalScore += 1;
        }
    });

    // Weight security findings
    let securityIssues = 0;
    securityFindings.forEach(finding => {
        if (finding.severity === 'critical') {
            totalScore += 10;
            securityIssues++;
        } else if (finding.severity === 'high') {
            totalScore += 5;
            securityIssues++;
        } else if (finding.severity === 'medium') {
            totalScore += 3;
            securityIssues++;
        } else if (finding.severity === 'low') {
            totalScore += 1;
        }
    });

    // Cap at 100
    totalScore = Math.min(100, totalScore);

    let level: "Low" | "Moderate" | "High" | "Critical" = "Low";
    if (totalScore >= 80) level = "Critical";
    else if (totalScore >= 50) level = "High";
    else if (totalScore >= 20) level = "Moderate";

    // If no issues at all, force 0
    if (validationIssues === 0 && securityIssues === 0) {
        totalScore = 0;
        level = "Low";
    }

    return {
        totalScore,
        level,
        breakdown: {
            validationIssues,
            securityIssues
        }
    };
}
