import type { AiSuggestionDto, ArtworkIdea } from '@platform/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Lightbulb, Send, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { EmptyState, ErrorText, PageHeader } from '../components/ui';
import { api } from '../lib/api';
import { useAiUsage, useSuggestions } from '../lib/ai';

type Msg = { role: 'user' | 'assistant'; content: string };
const STORE = 'assistant-chat';

const starters = ['What should I paint next?', 'Which of my collections sells best?', 'Help me price a new 60 x 80 cm painting.', 'Write an Instagram caption for my latest work.'];

function loadChat(): Msg[] {
  try {
    return JSON.parse(sessionStorage.getItem(STORE) ?? '[]') as Msg[];
  } catch {
    return [];
  }
}

export function AssistantPage() {
  const usage = useAiUsage();
  const u = usage.data;
  return (
    <>
      <PageHeader
        title="AI assistant"
        description="Ask about your work and sales, plan what to paint next, or get help with words. It knows your catalog, not anyone else’s."
        actions={u && u.configured && <span className="text-sm text-stone-500">{u.usedTokens.toLocaleString()} / {u.limitTokens.toLocaleString()} tokens this month</span>}
      />
      {u && !u.configured ? (
        <EmptyState title="The AI assistant is not set up yet">The platform administrator needs to add an Anthropic API key.</EmptyState>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
          <ChatCard />
          <IdeasCard />
        </div>
      )}
    </>
  );
}

function ChatCard() {
  const qc = useQueryClient();
  const [messages, setMessages] = useState<Msg[]>(loadChat);
  const [draft, setDraft] = useState('');
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify(messages.slice(-40)));
    } catch {
      // Storage may be unavailable; the chat still works for this visit.
    }
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [messages]);

  const send = useMutation({
    mutationFn: (history: Msg[]) => api<{ reply: string }>('/ai/chat', { method: 'POST', json: { messages: history.slice(-40) } }),
    onSuccess: ({ reply }) => {
      setMessages(m => [...m, { role: 'assistant', content: reply }]);
      qc.invalidateQueries({ queryKey: ['ai', 'usage'] });
    },
  });

  const ask = (text: string) => {
    const content = text.trim();
    if (!content || send.isPending) return;
    const next = [...messages, { role: 'user' as const, content }];
    setMessages(next);
    setDraft('');
    send.mutate(next);
  };

  return (
    <div className="card flex h-[calc(100dvh-9rem)] min-h-[420px] flex-col p-0 xl:h-[640px]">
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm text-stone-500"><Sparkles size={16} /> Try one of these:</p>
            <div className="flex flex-wrap gap-2">
              {starters.map(s => (
                <button key={s} className="chip text-left" onClick={() => ask(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'ml-auto rounded-br-md bg-stone-900 text-stone-50' : 'rounded-bl-md bg-stone-100 text-stone-800'}`}>
            {m.content}
          </div>
        ))}
        {send.isPending && <div className="w-24 animate-pulse rounded-xl bg-stone-100 px-4 py-2.5 text-sm text-stone-400">Thinking…</div>}
        <ErrorText error={send.error} />
        <div ref={end} />
      </div>
      <form
        className="flex gap-2 border-t border-stone-200 p-3"
        onSubmit={e => {
          e.preventDefault();
          ask(draft);
        }}
      >
        <input className="input" placeholder="Ask anything about your art business…" value={draft} onChange={e => setDraft(e.target.value)} />
        <button className="btn-primary" disabled={send.isPending || !draft.trim()} aria-label="Send"><Send size={16} /></button>
        {messages.length > 0 && <button type="button" className="btn-secondary" onClick={() => setMessages([])}>Clear</button>}
      </form>
    </div>
  );
}

function IdeasCard() {
  const qc = useQueryClient();
  const [theme, setTheme] = useState('');
  const ideas = useSuggestions({ kind: 'ideas' });
  const generate = useMutation({
    mutationFn: () => api<AiSuggestionDto>('/ai/ideas', { method: 'POST', json: { theme, count: 4 } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai'] }),
  });
  const latest = ideas.data?.find(s => s.status !== 'dismissed');
  const list = (latest?.output as { ideas: ArtworkIdea[] } | undefined)?.ideas ?? [];

  return (
    <div className="card space-y-4">
      <h2 className="display flex items-center gap-2 text-2xl"><Lightbulb size={16} /> Ideas for new work</h2>
      <form
        className="flex gap-2"
        onSubmit={e => {
          e.preventDefault();
          generate.mutate();
        }}
      >
        <input className="input" placeholder="Optional theme, e.g. rainy season, small sizes" value={theme} onChange={e => setTheme(e.target.value)} />
        <button className="btn-primary shrink-0" disabled={generate.isPending}>{generate.isPending ? 'Thinking…' : 'Suggest'}</button>
      </form>
      <ErrorText error={generate.error} />
      {list.length === 0 ? (
        <p className="text-sm text-stone-500">Ideas are based on your collections and what has sold.</p>
      ) : (
        <ul className="space-y-3">
          {list.map(idea => (
            <li key={idea.title} className="rounded-lg border border-stone-200 p-3 text-sm">
              <p className="font-medium">{idea.title}</p>
              <p className="mt-1">{idea.concept}</p>
              <p className="mt-1 text-stone-500">Palette: {idea.palette}</p>
              <p className="mt-1 text-xs text-stone-500">{idea.whyItFits}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
