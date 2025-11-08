import { GraphQLClient } from 'graphql-request';

const fallbackEndpoint = 'https://your-worker-subdomain.workers.dev/graphql';
const endpoint = import.meta.env.VITE_WORKER_GRAPHQL_ENDPOINT ?? fallbackEndpoint;

if (!import.meta.env.VITE_WORKER_GRAPHQL_ENDPOINT) {
  console.warn('VITE_WORKER_GRAPHQL_ENDPOINT is not set, falling back to placeholder URL.');
}

export const graphqlClient = new GraphQLClient(endpoint, {
  headers: () => {
    const token = import.meta.env.VITE_WORKER_API_TOKEN;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
});
