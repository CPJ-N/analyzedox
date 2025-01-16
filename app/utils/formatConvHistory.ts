export function formatConvHistory(messages: string[]): string {
    return messages.map((message, i) => {
        return i % 2 === 0 ? `Human: ${message}` : `AI: ${message}`;
    }).join('\n');
  }
  
