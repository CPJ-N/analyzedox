export function formatConvHistory(messages: string[]): string {
    if (messages.length === 0) return 'No conversation history.';

    return messages
        .map((message, i) => {
            const role = i % 2 === 0 ? 'Human' : 'Assistant';
            return `${role}: ${message}`;
        })
        .join('\n');
}
  
