import YAML from 'yaml';
import type { K8sResource, ParseResult } from './types';

export function parseYaml(yamlString: string): ParseResult {
    const result: ParseResult = {
        resources: [],
        errors: []
    };

    try {
        const documents = YAML.parseAllDocuments(yamlString);

        for (const doc of documents) {
            if (doc.errors && doc.errors.length > 0) {
                result.errors.push(...doc.errors.map(e => e.message));
                continue;
            }

            const json = doc.toJSON();
            if (!json || typeof json !== 'object') continue;

            if (json.kind && json.apiVersion && json.metadata && json.metadata.name) {
                const namespace = json.metadata.namespace || 'default';
                const id = `${json.kind}-${namespace}-${json.metadata.name}`.toLowerCase();

                result.resources.push({
                    ...json,
                    id
                } as K8sResource);
            } else if (json.items && Array.isArray(json.items)) {
                for (const item of json.items) {
                    if (item.kind && item.apiVersion && item.metadata && item.metadata.name) {
                        const namespace = item.metadata.namespace || 'default';
                        const id = `${item.kind}-${namespace}-${item.metadata.name}`.toLowerCase();
                        result.resources.push({ ...item, id } as K8sResource);
                    }
                }
            } else {
                result.errors.push(`Skipped document containing unrecognized format or missing required K8s fields.`);
            }
        }
    } catch (error: any) {
        result.errors.push(`Fatal parsing error: ${error.message}`);
    }

    return result;
}
