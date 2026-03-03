export interface Diagnostic {
    id: string;
    type: "error" | "warning" | "info";
    category: "relationship" | "network" | "storage" | "configuration" | "security";
    message: string;
    resourceRef: {
        kind: string;
        name: string;
        namespace: string;
        id: string;
    };
}

export interface SecurityFinding {
    id: string;
    severity: "critical" | "high" | "medium" | "low";
    category: "container" | "resource" | "network" | "secret" | "general";
    message: string;
    resourceRef: {
        kind: string;
        name: string;
        namespace: string;
        id: string;
    };
}

export interface RiskSummary {
    totalScore: number;
    level: "Low" | "Moderate" | "High" | "Critical";
    breakdown: {
        validationIssues: number;
        securityIssues: number;
    };
}
