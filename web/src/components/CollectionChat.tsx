'use client';

import { useChat } from 'ai/react';
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../lib/auth-context';

const TOOL_LABELS: Record<string, string> = {
  search_devices: 'Searching collection',
  list_all_devices: 'Loading full inventory',
  list_devices: 'Loading devices',
  get_device_details: 'Loading device details',
  get_financial_summary: 'Loading financials',
};

export function CollectionChat() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
  });
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const checkChatEnabled = async () => {
      try {
        const response = await fetch('/api/chat/config');
        const data = await response.json();
        setIsEnabled(data.enabled);
      } catch (error) {
        console.error('Failed to check chat configuration:', error);
        setIsEnabled(false);
      } finally {
        setIsChecking(false);
      }
    };
    checkChatEnabled();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Don't render anything if not authenticated, chat is disabled, or still checking
  if (authLoading || !isAuthenticated || isChecking || !isEnabled) {
    return null;
  }

  const chatContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--muted)]">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h2 className="font-semibold text-[var(--foreground)]">Collection Assistant</h2>
        </div>
        {isMobile && (
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-[var(--card)] rounded text-[var(--foreground)]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-[var(--muted-foreground)] mt-8">
            <p className="mb-2">Ask me about your collection!</p>
            <p className="text-sm">Try questions like:</p>
            <ul className="text-sm mt-2 space-y-1">
              <li className="text-blue-600">"What Macintosh computers do I have?"</li>
              <li className="text-blue-600">"Show me devices for sale"</li>
              <li className="text-blue-600">"What's my financial summary?"</li>
              <li className="text-blue-600">"Find devices with 68040 CPU"</li>
            </ul>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Tool call indicators */}
            {message.role === 'assistant' && (message as any).toolInvocations?.map((invocation: any) => (
              <div key={invocation.toolCallId} className="flex items-center gap-1.5 mb-1 px-2 py-1 rounded text-xs text-[var(--muted-foreground)] bg-[var(--muted)]">
                {invocation.state !== 'result' ? (
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span>{TOOL_LABELS[invocation.toolName] ?? invocation.toolName}</span>
                {invocation.state === 'result' && invocation.result?.totalCount != null && (
                  <span className="opacity-60">— {invocation.result.totalCount} devices</span>
                )}
                {invocation.state === 'result' && invocation.result?.count != null && (
                  <span className="opacity-60">— {invocation.result.count} results</span>
                )}
              </div>
            ))}
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[var(--card)] text-[var(--foreground)]'
              }`}
            >
              <div className="prose prose-sm max-w-none text-sm">
                {message.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                ) : (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      code: ({ children }) => <code className="bg-[var(--muted)] px-1 rounded text-xs">{children}</code>,
                      a: ({ href, children }) => (
                        <a 
                          href={href} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[var(--card)] rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[var(--muted-foreground)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-[var(--muted-foreground)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-[var(--muted-foreground)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="text-red-500 text-sm text-center">
            Error: {error.message}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-[var(--border)]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about your collection..."
            className="flex-1 px-4 py-2 border border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-[var(--muted-foreground)]"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );

  // Mobile: Floating button + Modal
  if (isMobile) {
    return (
      <>
        {/* Floating chat button */}
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center z-40"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>

        {/* Modal */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsOpen(false)}
            />
            {/* Modal content */}
            <div className="relative w-full h-[85vh] bg-[var(--background)] rounded-t-2xl shadow-xl flex flex-col">
              {chatContent}
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop: Collapsible sidebar
  return (
    <>
      {/* Toggle button when closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-2 py-4 rounded-l-lg shadow-lg hover:bg-blue-700 transition-colors z-40"
          title="Open Collection Assistant"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-[var(--background)] shadow-xl transform transition-transform duration-300 z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        {/* Close button */}
        {isOpen && (
          <button
            onClick={() => setIsOpen(false)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full bg-[var(--background)] px-1 py-4 rounded-l-lg shadow-lg hover:bg-[var(--card)] transition-colors"
            title="Close"
          >
            <svg className="w-4 h-4 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {chatContent}
      </div>
    </>
  );
}
