# yd-mcp-react-chat-demo

A lightweight React (Vite + TypeScript) demo that sends GraphQL requests to a Cloudflare Worker. The UI behaves like a compact chat client: it loads the latest messages and lets you send a new one with a single mutation. Use it as a starting point for experimenting with Worker-hosted GraphQL APIs.

## Tech stack
- React 18 with Vite 5 for fast local dev
- `graphql-request` as the tiny GraphQL client
- Cloudflare Workers (sample script included) as the GraphQL endpoint

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

## GraphQL shape used by the UI
```graphql
query GetMessages {
  messages {
    id
    text
    sender
    timestamp
  }
}

mutation SendMessage($text: String!, $sender: String!) {
  sendMessage(text: $text, sender: $sender) {
    id
    text
    sender
    timestamp
  }
}
```
Your Worker only needs to implement the two operations above, but you can easily extend the component to support subscriptions or streaming results.

## Sample Cloudflare Worker
`workers/chat-graphql-worker.ts` contains a fully inlined Worker script that handles the exact queries/mutations used in the UI. It stores chat history in-memory for simplicity, but you can wire it up to KV/Durable Objects/R2 by replacing the `MessageStore` implementation.

Deploying the Worker (basic flow):
1. Install Wrangler and log in – `npm i -g wrangler && wrangler login`.
2. Copy the script into your Worker project (or import it as a module).
3. Update your `wrangler.toml` to set the route and bindings you need.
4. `wrangler deploy` to publish.

## Environment variables
| Name | Description |
| --- | --- |
| `VITE_WORKER_GRAPHQL_ENDPOINT` | Required. Full HTTPS URL to the Worker (e.g. `https://chat-api.your-worker.workers.dev/graphql`). |
| `VITE_WORKER_API_TOKEN` | Optional bearer token if your Worker requires auth. |

## Next steps
- Replace the in-memory store with Durable Objects or KV for persistence.
- Add authentication (e.g. Cloudflare Access or JWT) and forward the token in `graphqlClient` headers.
- Expand the schema for typing indicators, streaming answers, or quoting previous messages.
