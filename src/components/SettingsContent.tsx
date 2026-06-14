import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useOllamaStore } from '../store/useOllamaStore'
import { useRagStore } from '../store/useRagStore'
import { UploadCloud, Loader2, Trash2 } from 'lucide-react'
import { invoke } from '@tauri-apps/api/tauri'

function AppearanceSettings() {
  const theme = useAppStore(state => state.theme)
  const setTheme = useAppStore(state => state.setTheme)
  const accent = useAppStore(state => state.accent)
  const setAccent = useAppStore(state => state.setAccent)

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-medium text-textMain mb-4">Theme</h3>
        <div className="flex gap-4">
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${theme === 'dark' ? 'bg-primary/20 text-primary border border-primary' : 'bg-background border border-border text-textMuted hover:text-textMain'}`}
          >
            Dark Mode
          </button>
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${theme === 'light' ? 'bg-primary/20 text-primary border border-primary' : 'bg-background border border-border text-textMuted hover:text-textMain'}`}
          >
            Light Mode
          </button>
        </div>
      </div>
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-medium text-textMain mb-4">Typography & Accent</h3>
        <p className="text-sm text-textMuted mb-4">Configure font family and accent colors for the application.</p>
        <div className="flex gap-3">
          <div onClick={() => setAccent('blue')} className={`w-8 h-8 rounded-full bg-blue-500 cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 hover:ring-offset-background transition-all ${accent === 'blue' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-background' : ''}`}></div>
          <div onClick={() => setAccent('purple')} className={`w-8 h-8 rounded-full bg-purple-500 cursor-pointer hover:ring-2 hover:ring-purple-500 hover:ring-offset-2 hover:ring-offset-background transition-all ${accent === 'purple' ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-background' : ''}`}></div>
          <div onClick={() => setAccent('green')} className={`w-8 h-8 rounded-full bg-green-500 cursor-pointer hover:ring-2 hover:ring-green-500 hover:ring-offset-2 hover:ring-offset-background transition-all ${accent === 'green' ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-background' : ''}`}></div>
          <div onClick={() => setAccent('orange')} className={`w-8 h-8 rounded-full bg-orange-500 cursor-pointer hover:ring-2 hover:ring-orange-500 hover:ring-offset-2 hover:ring-offset-background transition-all ${accent === 'orange' ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-background' : ''}`}></div>
        </div>
      </div>
    </div>
  )
}

function HardwareSettings() {
  const [cpuCores, setCpuCores] = useState<number | string>('Unknown')
  const [ram, setRam] = useState<string>('Unknown')
  const [gpu, setGpu] = useState<string>('Detecting...')

  useEffect(() => {
    // Try to get real hardware stats from Tauri backend
    const fetchTauriHardware = async () => {
      try {
        if (typeof window !== 'undefined' && '__TAURI__' in window) {
          const specs = await invoke<any>('get_system_specs')
          setCpuCores(`${specs.cpu_cores} Cores (${specs.cpu_brand})`)
          setRam(`${specs.free_memory} MB Free / ${specs.total_memory} MB Total`)
          setGpu(`OS: ${specs.os_name}`)
          return true
        }
      } catch (e) {
        console.error("Failed to fetch from Tauri", e)
      }
      return false
    }

    fetchTauriHardware().then((isTauri) => {
      if (!isTauri) {
        // Fallback to browser APIs if running in Web Mode
        if (navigator.hardwareConcurrency) {
          setCpuCores(`${navigator.hardwareConcurrency} Logical Cores`)
        }

        // @ts-ignore
        if (navigator.deviceMemory) {
          // @ts-ignore
          setRam(`~${navigator.deviceMemory} GB Total Memory`)
        } else {
          setRam('API not supported in this browser')
        }

        try {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (gl) {
            const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
              const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
              setGpu(renderer);
            } else {
              setGpu('WebGL Debug Info not available')
            }
          } else {
            setGpu('WebGL not supported')
          }
        } catch (e) {
          setGpu('Error detecting GPU')
        }
      }
    })
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-medium text-textMain mb-4">System Specifications</h3>
        <p className="text-xs text-textMuted mb-4">Note: Web APIs have limited hardware access. Full details will be available in the desktop version.</p>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-background rounded-lg border border-border">
            <span className="text-textMuted font-medium">CPU Cores</span>
            <span className="font-semibold text-textMain text-right">{cpuCores}</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-background rounded-lg border border-border">
            <span className="text-textMuted font-medium">RAM</span>
            <span className="font-semibold text-textMain text-right">{ram}</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-background rounded-lg border border-border">
            <span className="text-textMuted font-medium">GPU Renderer</span>
            <span className="font-semibold text-textMain text-right max-w-xs">{gpu}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function EngineSettings() {
  const { isOnline } = useOllamaStore()
  const [autoUpdate, setAutoUpdate] = useState(true)

  const handleStartServe = () => {
    alert("Since this application runs on the Web, we cannot execute terminal commands directly. Please run 'OLLAMA_ORIGINS=\"*\" ollama serve' in your terminal to connect this GUI with local models. Automatic OS access will be available in the Desktop version.")
  }

  const handleStopServe = () => {
    alert("Mohon matikan Ollama (Ctrl+C atau systemctl stop ollama) melalui terminal Anda. Akses OS otomatis akan terbuka di versi Desktop.")
  }

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-textMain">Core Engine</h3>
            <p className="text-sm text-textMuted mt-1">Core Engine Status.</p>
          </div>
          {isOnline ? (
            <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-xs font-bold border border-green-500/30 shadow-[0_0_8px_rgba(34,197,94,0.3)]">Online</span>
          ) : (
            <span className="px-3 py-1 bg-red-500/20 text-red-500 rounded-full text-xs font-bold border border-red-500/30">Offline</span>
          )}
        </div>

        <div className="flex gap-3 mb-6">
          <button onClick={handleStartServe} className="flex-1 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg text-sm font-medium transition-colors">
            Run Core Engine
          </button>
          <button onClick={handleStopServe} className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-sm font-medium transition-colors">
            Stop Engine
          </button>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-textMain">Auto-update Engine</span>
            <span className="text-xs text-textMuted mt-1">Automatically update the engine when a new version is available</span>
          </div>
          <div
            onClick={() => setAutoUpdate(!autoUpdate)}
            className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${autoUpdate ? 'bg-primary' : 'bg-surface border border-border'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${autoUpdate ? 'right-1' : 'left-1'}`}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

const POPULAR_MODELS = [
  { name: 'llama3.2:1b', desc: 'Sangat ringan, cocok untuk perangkat dengan RAM kecil.', size: '1.3 GB' },
  { name: 'llama3.2:3b', desc: 'Versi 3B yang lebih cerdas namun tetap ringan.', size: '2.0 GB' },
  { name: 'llama3.1:8b', desc: 'Model populer keseimbangan performa dan memori.', size: '4.7 GB' },
  { name: 'llama3:70b', desc: 'Model raksasa Meta untuk tugas berat (Butuh VRAM sangat besar).', size: '39 GB' },
  { name: 'qwen2.5:1.5b', desc: 'Ringan, pintar dan mendukung multi-bahasa dengan baik.', size: '1.6 GB' },
  { name: 'qwen2.5:7b', desc: 'Model pintar Alibaba yang menyaingi Llama 3.', size: '4.7 GB' },
  { name: 'qwen2.5:72b', desc: 'Model raksasa Qwen yang sangat cerdas.', size: '47 GB' },
  { name: 'gemma2:2b', desc: 'Dikembangkan oleh Google, ringan dan cepat.', size: '1.6 GB' },
  { name: 'gemma2:9b', desc: 'Model kuat dari Google untuk penalaran kompleks.', size: '5.5 GB' },
  { name: 'gemma2:27b', desc: 'Versi raksasa Gemma 2.', size: '16 GB' },
  { name: 'mistral:latest', desc: 'Cepat, context window besar, bagus untuk coding.', size: '4.1 GB' },
  { name: 'mistral-nemo', desc: 'Model kolaborasi Mistral dan Nvidia.', size: '7.1 GB' },
  { name: 'mixtral:8x7b', desc: 'Model MoE super cerdas yang membagi komputasi.', size: '26 GB' },
  { name: 'phi3:mini', desc: 'Model kecil Microsoft dengan performa setara model besar.', size: '2.3 GB' },
  { name: 'phi3:14b', desc: 'Versi medium Phi-3 yang lebih cerdas.', size: '7.9 GB' },
  { name: 'llava', desc: 'Model multimodal untuk memproses visi/gambar.', size: '4.7 GB' },
  { name: 'deepseek-coder-v2', desc: 'Sangat andal untuk tugas pemrograman (coding).', size: '8.9 GB' },
  { name: 'nomic-embed-text', desc: 'Model khusus embedding untuk RAG dan pencarian dokumen.', size: '274 MB' }
];

function HubSettings() {
  const { pullingModels, startPullModel, localModels } = useOllamaStore()
  const [customModel, setCustomModel] = useState('')

  const handleCustomPull = () => {
    if (customModel.trim()) {
      startPullModel(customModel.trim())
      setCustomModel('')
    }
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="bg-surface border border-border rounded-xl p-6 flex-1 flex flex-col overflow-hidden">
        <h3 className="text-lg font-medium text-textMain mb-2">AI Models Library</h3>
        <p className="text-sm text-textMuted mb-4">Browse Ollama's library of models.</p>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Ex. wizardlm2 or llama3:70b"
            value={customModel}
            onChange={(e) => setCustomModel(e.target.value)}
            className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-sm text-textMain placeholder-textMuted focus:outline-none focus:border-primary transition-colors"
          />
          <button
            onClick={handleCustomPull}
            disabled={!customModel.trim()}
            className="px-4 py-2 bg-primary text-background font-medium text-sm rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Custom Pull
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {POPULAR_MODELS.map((m) => {
            const isDownloaded = localModels.some(lm => lm.name === m.name || lm.name.startsWith(m.name));
            const pullingStatus = pullingModels[m.name];

            return (
              <div key={m.name} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                <div>
                  <h4 className="font-semibold text-textMain">{m.name}</h4>
                  <p className="text-xs text-textMuted mt-1">{m.desc} • Estimasi: {m.size}</p>
                </div>
                <div className="flex items-center gap-3 w-48 justify-end">
                  {isDownloaded ? (
                    <span className="text-sm font-medium px-3 py-1.5 text-green-500 bg-green-500/10 rounded-lg">Installed</span>
                  ) : pullingStatus ? (
                    <div className="flex flex-col items-end w-full">
                      <span className="text-xs text-primary mb-1 truncate max-w-full">{pullingStatus.status} {pullingStatus.progress}%</span>
                      <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${pullingStatus.progress}%` }}></div>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => startPullModel(m.name)} className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-textMain font-medium text-sm rounded-lg transition-colors border border-white/10 shrink-0">
                      Download
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ModelSettings() {
  const { localModels, runningModels, requestRunModel, stopModel, isWarningModalOpen, confirmRunModel, cancelRunModel } = useOllamaStore()

  return (
    <div className="space-y-6 relative">
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-medium text-textMain mb-2">Local Models</h3>
        <p className="text-sm text-textMuted mb-6">Manage downloaded models and memory allocation.</p>

        <div className="space-y-3">
          {localModels.length === 0 ? (
            <div className="p-4 bg-background rounded-lg border border-border text-center text-textMuted text-sm">
              No models available or engine is offline.
            </div>
          ) : (
            localModels.map((model) => {
              const isRunning = runningModels.includes(model.name);
              return (
                <div key={model.name} className={`p-4 bg-background rounded-lg border ${isRunning ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-textMain">{model.name}</h4>
                        {isRunning && <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>}
                      </div>
                      <p className="text-xs text-textMuted mt-1">
                        {isRunning ? `Memory usage: ~${(model.size / 1e9).toFixed(1)} GB VRAM` : `Idle - ${(model.size / 1e9).toFixed(1)} GB disk space`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {isRunning ? (
                        <button onClick={() => stopModel(model.name)} className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium text-sm rounded-lg transition-colors border border-red-500/20">Stop</button>
                      ) : (
                        <button onClick={() => requestRunModel(model.name)} className="px-4 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary font-medium border border-primary/30 text-sm rounded-lg transition-colors">Run</button>
                      )}
                      <button className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-textMuted font-medium text-sm rounded-lg transition-colors border border-white/10">Delete</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {isWarningModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm rounded-xl">
          <div className="bg-surface border border-border rounded-xl p-6 shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-red-400 mb-2">Hardware Overload Warning!</h3>
            <p className="text-sm text-textMuted mb-6 leading-relaxed">
              Another model is currently running in memory. Running multiple models simultaneously will consume significant VRAM and RAM, which may cause your system to hang or slow down drastically.
              <br /><br />
              It is highly recommended to "Stop" the currently running model before starting this one.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelRunModel}
                className="px-4 py-2 rounded-lg border border-border text-textMain hover:bg-white/5 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmRunModel}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors text-sm font-medium"
              >
                Run Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MCPServerSettings() {
  const { mcpServers, addMcpServer, removeMcpServer } = useAppStore();
  const [newServerName, setNewServerName] = useState('');
  const [newServerUrl, setNewServerUrl] = useState('');

  const handleAdd = () => {
    if (newServerName && newServerUrl) {
      addMcpServer({ name: newServerName, url: newServerUrl });
      setNewServerName('');
      setNewServerUrl('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-medium text-textMain mb-2">Model Context Protocol</h3>
        <p className="text-sm text-textMuted mb-6">Connect external tools to provide real-time context (File system, API, Web Search).</p>

        <div className="space-y-4 mb-8">
          {mcpServers.map(server => (
            <div key={server.id} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border group">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-textMain">{server.name}</h4>
                  <span className={`w-2 h-2 rounded-full ${server.status === 'connected' ? 'bg-green-500' : server.status === 'error' ? 'bg-red-500' : 'bg-gray-500'}`}></span>
                </div>
                <p className="text-xs text-textMuted mt-1">{server.url}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm rounded-lg transition-colors">Test</button>
                {server.id !== 'default-fs' && (
                  <button onClick={() => removeMcpServer(server.id)} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium text-sm rounded-lg transition-colors">Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-border">
          <h4 className="font-medium text-textMain mb-4">Add Custom Server</h4>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Server Name (e.g., Jira Search)"
              value={newServerName}
              onChange={(e) => setNewServerName(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-textMain focus:border-primary focus:outline-none"
            />
            <input
              type="text"
              placeholder="Server URL (http://... or stdio://)"
              value={newServerUrl}
              onChange={(e) => setNewServerUrl(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-textMain focus:border-primary focus:outline-none"
            />
            <button
              onClick={handleAdd}
              disabled={!newServerName || !newServerUrl}
              className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              Add Server
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RAGSettings() {
  const { isRagEnabled, toggleRag, uploadedFiles, isProcessing, addDocument, removeDocument } = useRagStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await addDocument(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-textMain">Retrieval-Augmented Generation</h3>
          <button
            onClick={toggleRag}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isRagEnabled ? 'bg-primary' : 'bg-gray-600'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isRagEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        <p className="text-sm text-textMuted mb-6">Manage your local vector database and documents. Enable to inject document context into chats.</p>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".txt,.md,.csv,application/pdf"
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer mb-6 group ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-textMuted mb-3 group-hover:text-primary transition-colors">
            {isProcessing ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <UploadCloud size={24} />
            )}
          </div>
          <h4 className="font-medium text-textMain mb-1">
            {isProcessing ? 'Memproses Dokumen (Extract & Embed)...' : 'Upload Documents'}
          </h4>
          <p className="text-xs text-textMuted max-w-xs">PDF, TXT, MD, CSV files. Files will be locally embedded via Ollama.</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-textMain mb-3">Indexed Collections</h4>
          <div className="space-y-2">
            {uploadedFiles.length === 0 ? (
              <div className="text-sm text-textMuted p-4 bg-background rounded-lg border border-border text-center">
                No documents indexed yet.
              </div>
            ) : (
              uploadedFiles.map(file => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-background border border-border rounded-lg group">
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-textMain truncate">{file.name}</p>
                    <p className="text-xs text-textMuted mt-0.5">{(file.size / 1024).toFixed(1)} KB • {new Date(file.uploadTime).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => removeDocument(file.id)}
                    className="p-2 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/10 rounded-md transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function SettingsContent() {
  const activeTab = useAppStore(state => state.activeSettingsTab)

  const renderContent = () => {
    switch (activeTab) {
      case 'Appearance': return <AppearanceSettings />
      case 'Hardware': return <HardwareSettings />
      case 'Engine': return <EngineSettings />
      case 'Hub': return <HubSettings />
      case 'Model': return <ModelSettings />
      case 'MCP Server': return <MCPServerSettings />
      case 'RAG': return <RAGSettings />
      default: return null
    }
  }

  return (
    <div className="flex-1 h-full bg-background flex flex-col relative z-0">
      <header className="h-16 border-b border-border flex items-center px-8 shrink-0">
        <h1 className="text-xl font-medium">{activeTab}</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
