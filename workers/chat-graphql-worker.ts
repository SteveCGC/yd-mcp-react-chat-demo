export interface Env {}

interface GraphQLPayload {
  query?: string;
  variables?: Record<string, unknown>;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
}

/** Simple in-memory message store (replace with Durable Objects/KV in production). */
class MessageStore {
  private messages: ChatMessage[] = [];

  list() {
    return this.messages;
  }

  append(text: string, sender: string) {
    const entry: ChatMessage = {
      id: crypto.randomUUID(),
      text,
      sender,
      timestamp: new Date().toISOString()
    };
    this.messages.push(entry);
    return entry;
  }
}

const store = new MessageStore();

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('GraphQL endpoint ready', {
        headers: { 'content-type': 'text/plain' }
      });
    }

    let payload: GraphQLPayload;
    try {
      payload = await request.json<GraphQLPayload>();
    } catch {
      return json({ errors: [{ message: 'Invalid JSON body' }] }, 400);
    }

    const query = payload.query ?? '';
    const variables = payload.variables ?? {};

    if (query.includes('GetMessages')) {
      return json({ data: { messages: store.list() } });
    }

    if (query.includes('SendMessage')) {
      const text = String(variables.text ?? '').trim();
      const sender = String(variables.sender ?? 'anonymous').trim();

      if (!text) {
        return json({ errors: [{ message: 'text is required' }] }, 422);
      }

      const message = store.append(text, sender || 'anonymous');
      return json({ data: { sendMessage: message } });
    }

    return json({ errors: [{ message: 'Unsupported operation' }] }, 400);
  }
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}
