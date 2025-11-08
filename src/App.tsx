import { FormEvent, useCallback, useEffect, useState } from 'react';
import './app.css';
import { graphqlClient } from './lib/graphqlClient';
import type { ChatMessage } from './types/chat';

const GET_MESSAGES = /* GraphQL */ `
  query GetMessages {
    messages {
      id
      text
      sender
      timestamp
    }
  }
`;

const SEND_MESSAGE = /* GraphQL */ `
  mutation SendMessage($text: String!, $sender: String!) {
    sendMessage(text: $text, sender: $sender) {
      id
      text
      sender
      timestamp
    }
  }
`;

const DEFAULT_SENDER = 'browser-demo';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingText, setPendingText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      setError(null);
      const data = await graphqlClient.request<{ messages: ChatMessage[] }>(GET_MESSAGES);
      setMessages(data.messages ?? []);
    } catch (err) {
      console.error('Failed to load messages', err);
      setError('无法加载历史消息，请检查 Worker 是否已经部署。');
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pendingText.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await graphqlClient.request<{ sendMessage: ChatMessage }>(SEND_MESSAGE, {
        text: pendingText.trim(),
        sender: DEFAULT_SENDER
      });

      if (data.sendMessage) {
        setMessages((prev) => [...prev, data.sendMessage]);
      }
      setPendingText('');
    } catch (err) {
      console.error('Failed to send message', err);
      setError('发送失败，请查看浏览器控制台日志。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="app">
      <section className="chat-panel">
        <header>
          <h1>Cloudflare Worker GraphQL Chat</h1>
          <button type="button" onClick={fetchMessages} disabled={isLoading}>
            刷新
          </button>
        </header>
        <div className="messages" aria-live="polite">
          {messages.length === 0 && <p className="empty">暂无消息，发送第一条试试看。</p>}
          {messages.map((message) => (
            <article key={message.id} className="message">
              <div className="meta">
                <span className="sender">{message.sender}</span>
                <time dateTime={message.timestamp}>{new Date(message.timestamp).toLocaleTimeString()}</time>
              </div>
              <p>{message.text}</p>
            </article>
          ))}
        </div>
        <form className="composer" onSubmit={handleSubmit}>
          <textarea
            name="message"
            rows={3}
            placeholder="输入要发送到 Worker 的消息..."
            value={pendingText}
            onChange={(event) => setPendingText(event.target.value)}
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? '发送中...' : '发送'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </section>
      <aside className="info-panel">
        <h2>关于本示例</h2>
        <ul>
          <li>React + Vite + TypeScript</li>
          <li>GraphQL 请求由 `graphql-request` 发送到 Cloudflare Worker</li>
          <li>在 `.env` 文件中配置 Worker 地址和可选的 Bearer Token</li>
        </ul>
        <p>
          可在 <code>workers/chat-graphql-worker.ts</code> 查看与之匹配的 Worker 示例，实现更复杂的 schema时只需要扩展 GraphQL 解析逻辑即可。
        </p>
      </aside>
    </main>
  );
}
