import { useEffect, useState, useRef } from 'react'
import { Send, Plus, Zap, User, Bot, Loader2, Copy, Edit3, Download, Settings } from 'lucide-react'
import { useOllamaStore } from '../store/useOllamaStore'
import { CustomizeModal } from './CustomizeModal'

export function ChatArea() {
  const [input, setInput] = useState('')
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messages = useOllamaStore(state => state.sessions.find(s => s.id === state.currentSessionId)?.messages ?? [])
  const initPolling = useOllamaStore(state => state.initPolling)
  const fetchModels = useOllamaStore(state => state.fetchModels)
  const localModels = useOllamaStore(state => state.localModels)
  const selectedModel = useOllamaStore(state => state.selectedModel)
  const setSelectedModel = useOllamaStore(state => state.setSelectedModel)
  const isOnline = useOllamaStore(state => state.isOnline)
  const isGenerating = useOllamaStore(state => state.isGenerating)
  const streamingText = useOllamaStore(state => state.streamingText)
  const sendMessage = useOllamaStore(state => state.sendMessage)
  const abortGeneration = useOllamaStore(state => state.abortGeneration)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initPolling()
    fetchModels()
  }, [initPolling, fetchModels])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  const handleSend = () => {
    if (input.trim() && !isGenerating) {
      sendMessage(input)
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileAttach = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Logic for file handling would go here.
      console.log('File selected:', file.name)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center px-6 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="font-bold text-xl tracking-tight">Ning</div>
          <div className="text-xs px-2 py-1 bg-white/5 rounded-full text-textMuted border border-white/10 flex items-center gap-1">
            <Zap size={12} className="text-amber-400" />
            Local Thinking Total Protection
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-surface border border-border text-sm rounded-md px-3 py-1.5 outline-none focus:border-primary max-w-[200px] truncate"
          >
            {localModels.map((m) => (
              <option key={m.name} value={m.name}>{m.name}</option>
            ))}
            {localModels.length === 0 && <option value="llama3.2:1b">llama3.2:1b</option>}
          </select>
        </div>
      </header>

      {/* Main Chat Content */}
      <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
              <Zap size={32} />
            </div>
            <h1 className="text-2xl font-medium text-textMain mb-2">How can I help you today?</h1>
            <p className="text-textMuted text-sm text-center max-w-sm">Your AI is running locally and privately. Try asking a question or request a task.</p>
          </div>
        ) : (
          <div className="w-full max-w-4xl flex flex-col gap-6 pb-20">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-surface text-textMuted border border-border' : 'bg-primary/20 text-primary'}`}>
                  {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>
                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                  <div className={`px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-surface border border-border text-textMain' : 'text-textMain'} group relative`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                    {/* Action icons */}
                    <div className={`absolute -bottom-8 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'right-0' : 'left-0'}`}>
                      <button className="p-1.5 text-textMuted hover:text-textMain bg-surface border border-border rounded shadow-sm transition-colors" title="Copy">
                        <Copy size={12} />
                      </button>
                      {msg.role === 'user' ? (
                        <button className="p-1.5 text-textMuted hover:text-textMain bg-surface border border-border rounded shadow-sm transition-colors" title="Edit">
                          <Edit3 size={12} />
                        </button>
                      ) : (
                        <button className="p-1.5 text-textMuted hover:text-textMain bg-surface border border-border rounded shadow-sm transition-colors" title="Download">
                          <Download size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isGenerating && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary/20 text-primary">
                  <Bot size={18} />
                </div>
                <div className="flex flex-col items-start max-w-[80%]">
                  <div className="px-4 py-3 text-textMain">
                    {streamingText === '' ? (
                      <div className="flex items-center gap-2 text-textMuted text-sm italic">
                        <Loader2 size={16} className="animate-spin" />
                        Ning respons...
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed">{streamingText}<span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse"></span></p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area */}
      <div className="p-4 px-6 shrink-0 max-w-4xl mx-auto w-full">
        <div className="bg-surface border border-border rounded-2xl p-2 flex items-end shadow-lg focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleFileAttach}
            className="p-3 text-textMuted hover:text-textMain hover:bg-white/5 rounded-xl transition-colors"
            title="Attach file"
          >
            <Plus size={20} />
          </button>

          <button
            onClick={() => setIsCustomizeModalOpen(true)}
            className="p-3 text-textMuted hover:text-textMain hover:bg-white/5 rounded-xl transition-colors"
            title="Personalize"
          >
            <Settings size={20} />
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            className="flex-1 bg-transparent border-none outline-none resize-none max-h-48 min-h-[44px] p-3 text-textMain placeholder:text-textMuted text-base disabled:opacity-50"
            placeholder={isGenerating ? "Waiting for response..." : "Ask Ning..."}
            rows={1}
          />

          <div className="flex items-center gap-2 ml-2">
            {isGenerating && (
              <button
                onClick={abortGeneration}
                className="p-3 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-xl transition-colors shrink-0 border border-red-500/30"
                title="Stop"
              >
                <div className="w-4 h-4 bg-current rounded-[2px]" />
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={isGenerating || !input.trim()}
              className={`p-3 rounded-xl transition-colors flex shrink-0 ${isGenerating || !input.trim()
                ? 'bg-surface border border-border text-textMuted cursor-not-allowed'
                : 'bg-primary text-white hover:bg-blue-600'
                }`}
            >
              {isGenerating ? <Loader2 size={20} className="animate-spin text-primary" /> : <Send size={20} className="ml-1" />}
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-4 flex items-center justify-between text-xs text-textMuted">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
            Engine: {isOnline ? 'Running' : 'Offline (Mock Mode)'}
            {isOnline && <span className="text-green-400 font-medium ml-1 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">{selectedModel}</span>}
          </div>
          <div>
            RAM: 2.1GB / 16GB • VRAM: 4.5GB / 8GB
          </div>
        </footer>
      </div>

      <CustomizeModal
        isOpen={isCustomizeModalOpen}
        onClose={() => setIsCustomizeModalOpen(false)}
      />
    </div>
  )
}
