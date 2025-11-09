import { FormEvent, useState } from 'react';
import './app.css';
import { graphqlClient } from './lib/graphqlClient';
import type { QAItem } from './types/chat';

const idFactory = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const ASK_QUESTION_MUTATION = /* GraphQL */ `
  mutation AskQuestion($question: String!) {
    askQuestion(question: $question) {
      answer
      askedAt
    }
  }
`;

type AskQuestionResult = {
  askQuestion?: {
    answer: string;
    askedAt?: string;
  };
};

type LegacyJsonResult = {
  answer?: string;
};

export default function App() {
  const [history, setHistory] = useState<QAItem[]>([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = ((await graphqlClient.request<AskQuestionResult & LegacyJsonResult>(
        ASK_QUESTION_MUTATION,
        { question: trimmed }
      )) ?? {}) as AskQuestionResult & LegacyJsonResult & Record<string, unknown>;
      debugger
      const payload = response?.askQuestion;
      const answerFromGraphQL = payload?.answer;
      const fallbackAnswer =
        response && typeof response === 'object' && 'answer' in response
          ? (response as LegacyJsonResult).answer
          : undefined;
      const finalAnswer = answerFromGraphQL ?? fallbackAnswer;

      if (!finalAnswer) {
        throw new Error('Worker 没有返回 answer 字段');
      }

      const entry: QAItem = {
        id: idFactory(),
        question: trimmed,
        answer: finalAnswer,
        askedAt: payload?.askedAt ?? new Date().toISOString()
      };
      setHistory((prev) => [...prev, entry]);
      setQuestion('');
    } catch (err) {
      console.error('Failed to get answer from Worker', err);
      const message = err instanceof Error ? err.message : '请求失败，请稍后再试。';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="app">
      <section className="chat-panel">
        <header>
          <div>
            <h1>Changgongcai Cloudflare Worker 问答演示</h1>
            <p className="subtitle">使用 GraphQL mutation 发送问题，Worker 返回结构化回答</p>
          </div>
          {isLoading && <span className="status">正在请求...</span>}
        </header>

        <div className="messages" aria-live="polite">
          {history.length === 0 && <p className="empty">请输入问题，Worker 会返回回答内容。</p>}
          {history.map((item) => (
            <article key={item.id} className="exchange">
              <div className="bubble question">
                <span className="label">提问</span>
                <p>{item.question}</p>
                <time dateTime={item.askedAt}>{new Date(item.askedAt).toLocaleTimeString()}</time>
              </div>
              <div className="bubble answer">
                <span className="label">回答</span>
                <p>{item.answer}</p>
              </div>
            </article>
          ))}
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          <textarea
            name="question"
            rows={3}
            placeholder="例如：解释下什么是云计算？"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? '提交中...' : '发送问题'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </section>
      <aside className="info-panel">
        <h2>调用约定</h2>
        <p>GraphQL 请求示例：</p>
        <pre>{`curl -X POST $WORKER/graphql \\
  -H "Content-Type: application/json" \\
  -d '{"query":"mutation($question:String!){ askQuestion(question:$question){ answer askedAt }}","variables":{"question":"解释下什么是云计算"}}'`}</pre>
        <p>
          Worker 返回 <code>{'{"data":{"askQuestion":{"answer":"...","askedAt":"..."}}}'}</code>，组件会把回答显示在问题下方。
        </p>
        <p>
          在 <code>.env</code> 中配置 <code>VITE_WORKER_GRAPHQL_ENDPOINT</code> 指向你的 Cloudflare Worker，若需要鉴权可继续使用{' '}
          <code>VITE_WORKER_API_TOKEN</code>。
        </p>
      </aside>
    </main>
  );
}
