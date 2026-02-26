import { Mistral } from '@mistralai/mistralai';
export class MistralProvider {
    client;
    model = 'mistral-medium-latest';
    constructor(apiKey) {
        this.client = new Mistral({ apiKey });
    }
    async generateCompletion(systemPrompt, userPrompt) {
        const response = await this.client.chat.complete({
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        });
        const content = response.choices?.[0]?.message?.content;
        if (typeof content !== 'string') {
            throw new Error('Unexpected AI response format');
        }
        return content;
    }
}
