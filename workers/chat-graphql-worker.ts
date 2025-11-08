export interface Env {}

interface GraphQLPayload {
  query?: string;
  variables?: Record<string, unknown>;
}

interface AnswerTemplate {
  keywords: string[];
  answer: string;
}

const ANSWERS: AnswerTemplate[] = [
  {
    keywords: ['云计算', 'cloud computing'],
    answer:
      '云计算 (cloud computing) is the on-demand delivery of compute, storage, and networking resources over the internet. ' +
      'Users can provision capabilities such as processing power or databases without owning physical hardware, paying only for what they consume. ' +
      'Common service models include IaaS for raw infrastructure, PaaS for managed runtimes, and SaaS for complete applications.'
  },
  {
    keywords: ['worker', 'cloudflare'],
    answer:
      'Cloudflare Workers let you run JavaScript, Rust, or WASM on Cloudflare’s global network. ' +
      'They start instantly, scale automatically, and can sit in front of APIs to handle authentication, caching, or AI orchestration.'
  }
];

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('GraphQL endpoint ready', {
        headers: { 'content-type': 'text/plain; charset=utf-8' }
      });
    }

    let payload: GraphQLPayload;
    try {
      payload = (await request.json()) as GraphQLPayload;
    } catch {
      return graphQLJson({ errors: [{ message: 'Invalid JSON body' }] }, 400);
    }

    const query = payload.query ?? '';
    const variables = payload.variables ?? {};

    if (query.includes('askQuestion')) {
      const question = String(variables.question ?? '').trim();
      if (!question) {
        return graphQLJson({ errors: [{ message: 'question variable is required' }] }, 422);
      }

      const answer = buildAnswer(question);
      const askedAt = new Date().toISOString();
      return graphQLJson({ data: { askQuestion: { answer, askedAt } } });
    }

    return graphQLJson({ errors: [{ message: 'Unsupported operation' }] }, 400);
  }
};

function buildAnswer(question: string): string {
  const normalized = question.toLowerCase();
  const template = ANSWERS.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))
  );

  if (template) {
    return template.answer;
  }

  return `I heard your question: "${question}". Replace the sample worker logic with your own AI or knowledge-base call to return a richer answer.`;
}

function graphQLJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}
