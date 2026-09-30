// Provider errors deliberately exclude response bodies, credentials and transcript text.
export class ProviderError extends Error {
  code: string;
  requestId: string | null;
  constructor(code: string, requestId: string | null = null) {
    super(code);
    this.code = code;
    this.requestId = requestId;
  }
}

export async function providerRequest(
  form: FormData, key: string, clientRequestId: string,
  fetcher: typeof fetch = fetch, timeoutMs = 90000,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'X-Client-Request-Id': clientRequestId },
      body: form, signal: controller.signal,
    });
    const requestId = response.headers.get('x-request-id');
    if (!response.ok) {
      await response.body?.cancel();
      throw new ProviderError('provider_http_' + response.status, requestId);
    }
    const result = await response.json().catch(() => { throw new ProviderError('provider_invalid_json', requestId); });
    return { result, requestId };
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError(controller.signal.aborted ? 'provider_timeout' : 'provider_network_error');
  } finally {
    clearTimeout(timer);
  }
}
