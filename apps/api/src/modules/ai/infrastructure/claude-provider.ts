import Anthropic from '@anthropic-ai/sdk';
import { DomainError, UpstreamError } from '../../../shared/errors.js';
import type { AiProvider, AiRequest, AiResult } from '../application/ports.js';

/**
 * Claude through the official SDK. Structured replies use JSON-schema output
 * so drafts always parse. Requests time out after 60s and the SDK retries
 * rate limits and server errors twice.
 */
export class ClaudeAiProvider implements AiProvider {
  readonly configured = true;
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new Anthropic({ apiKey, timeout: 60_000, maxRetries: 2 });
  }

  async generate(req: AiRequest): Promise<AiResult> {
    try {
      const response = await this.client.beta.messages.create({
        model: this.model,
        max_tokens: req.maxTokens ?? 8000,
        system: req.system,
        // If a safety check declines on this model, the API retries on a suitable one.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: {
          effort: req.effort ?? 'medium',
          ...(req.schema ? { format: { type: 'json_schema' as const, schema: req.schema } } : {}),
        },
        messages: req.messages.map(m => ({
          role: m.role,
          content: [
            ...(m.images ?? []).map(img => ({
              type: 'image' as const,
              source: { type: 'base64' as const, media_type: img.mediaType, data: img.data.toString('base64') },
            })),
            { type: 'text' as const, text: m.text },
          ],
        })),
      });

      if (response.stop_reason === 'refusal') {
        throw new DomainError('ai_declined', 'The assistant could not help with that request. Try rephrasing it.');
      }
      if (response.stop_reason === 'max_tokens' && req.schema) {
        throw new DomainError('ai_bad_output', 'The reply was too long to finish. Please try again.');
      }
      const text = response.content.flatMap(b => (b.type === 'text' ? [b.text] : [])).join('');
      return { text, usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens } };
    } catch (err) {
      if (err instanceof DomainError) throw err;
      if (err instanceof Anthropic.RateLimitError) throw new UpstreamError('The assistant is busy right now. Please try again in a minute.');
      if (err instanceof Anthropic.APIConnectionTimeoutError) throw new UpstreamError('The assistant took too long to answer. Please try again.');
      if (err instanceof Anthropic.APIError) throw new UpstreamError('The assistant is unavailable right now.', { status: err.status });
      throw err;
    }
  }
}

/** Used when no API key is set: every call explains that the assistant is off. */
export class DisabledAiProvider implements AiProvider {
  readonly configured = false;
  generate(): Promise<AiResult> {
    return Promise.reject(new DomainError('ai_not_configured', 'The AI assistant is not set up on this platform yet.'));
  }
}
