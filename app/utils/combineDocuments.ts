import { Document } from '@langchain/core/documents';

export function combineDocuments(docs: Document[]): string {
    return docs.map((doc, i) => {
        const content = doc.pageContent;
        const metadata = doc.metadata;
        return `Document ${i + 1}:\n${content}\nMetadata: ${JSON.stringify(metadata)}\n`;
    }).join('\n---\n');
}