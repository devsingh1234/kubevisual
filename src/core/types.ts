import type { Diagnostic, SecurityFinding, RiskSummary } from './diagnosticsTypes';

export interface K8sResource {
    id: string; // unique identifier (kind-namespace-name)
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
        namespace?: string;
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
        [key: string]: any;
    };
    spec?: any;
    status?: any;
    data?: any;
    stringData?: any;
    rules?: any;
    [key: string]: any;
}

export interface K8sRelationship {
    id: string;
    source: string;
    target: string;
    type: 'selector' | 'env' | 'volume' | 'mount' | 'hpa' | 'ingress' | 'serviceAccount' | 'networkPolicy' | 'unknown';
    label?: string;
    isBroken?: boolean;
}



export interface ParseResult {
    resources: K8sResource[];
    relationships: K8sRelationship[];
    diagnostics: Diagnostic[];
    securityFindings: SecurityFinding[];
    riskSummary: RiskSummary | null;
    errors: string[];
}
