# yd-mcp-react-chat-demo

A lightweight React (Vite + TypeScript) demo that sends GraphQL requests to a Cloudflare Worker. The UI mimics the terminal screenshot you shared: type a natural-language question, the Worker issues a GraphQL mutation such as `{ askQuestion { answer } }`, and the response appears right beneath the question.

## Tech stack
- React 18 with Vite 5 for fast local dev
- `graphql-request` as the minimal GraphQL client
- Cloudflare Workers (sample script included) as the Q&A endpoint

## Getting started
1. **Install deps**
   ```bash
   npm install
   ```
2. **Configure env** – copy `.env.example` to `.env` and set your Worker URL (and optional bearer token):
   ```bash
   cp .env.example .env
   ```
3. **Run locally**
   ```bash
   npm run dev
   ```
   Vite runs on <http://localhost:5173> by default.

## Request/response format (GraphQL)
The browser and the Worker communicate via GraphQL. Equivalent `curl` request:

```bash
curl -X POST $WORKER/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query":"mutation($question:String!){ askQuestion(question:$question){ answer askedAt }}",
    "variables":{"question":"解释下什么是云计算"}
  }'
```

The Worker replies with standard GraphQL JSON:

```json
{
  "data": {
    "askQuestion": {
      "answer": "云计算是一种通过互联网提供计算资源的模式...",
      "askedAt": "2025-11-08T15:30:00.000Z"
    }
  }
}
```

The React component renders the `question` and `answer` pair as stacked chat bubbles.

## Sample Cloudflare Worker
`workers/chat-graphql-worker.ts` exposes the exact GraphQL schema shown above: it inspects the `askQuestion` mutation and returns a canned `answer`. Replace the placeholder logic with AI calls, search results, or any other data source.

Deploying the Worker (basic flow):
1. Install Wrangler and log in – `npm i -g wrangler && wrangler login`.
2. Copy the script into your Worker project (or import it as a module).
3. Update your `wrangler.toml` to set the route and bindings you need.
4. `wrangler deploy` to publish.

## Environment variables
| Name | Description |
| --- | --- |
| `VITE_WORKER_GRAPHQL_ENDPOINT` | Required. Full HTTPS URL to the GraphQL Worker (e.g. `https://chat-api.your-worker.workers.dev/graphql`). |
| `VITE_WORKER_API_TOKEN` | Optional bearer token if your Worker requires auth. |

## Next steps
- Swap the sample answer generator with your actual AI/search pipeline and persist the conversation if needed.
- Add authentication (e.g. Cloudflare Access or JWT) and forward the token in request headers via `VITE_WORKER_API_TOKEN`.
- Enhance the UI with streaming responses, markdown rendering, or citations.
