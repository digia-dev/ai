import { useState, useCallback } from 'react';
import rehypeHighlight from 'rehype-highlight';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, Download, X, Code, FileText, Eye, Maximize2, Minimize2 } from 'lucide-react';

export interface Artifact {
  id: string;
  type: 'code' | 'markdown' | 'file';
  language?: string;
  title?: string;
  content: string;
  fileName?: string;
  downloadUrl?: string;
}

interface ArtifactPanelProps {
  artifacts: Artifact[];
  activeArtifactId: string | null;
  onSelectArtifact: (id: string | null) => void;
  onClose: () => void;
}

function CodeBlock({ children, className, ...props }: any) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (className) {
    return (
      <div className="relative group">
        {language && (
          <span className="absolute top-2 left-3 text-[10px] text-gray-400 font-mono">{language}</span>
        )}
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-opacity p-1 rounded bg-gray-700/50"
          title="Salin kode"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </button>
        <pre className={className} {...props}>
          {children}
        </pre>
      </div>
    );
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
}

export default function ArtifactPanel({ artifacts, activeArtifactId, onSelectArtifact, onClose }: ArtifactPanelProps) {
  const [activeTab, setActiveTab] = useState<'code' | 'preview' | 'files'>('code');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeArtifact = artifacts.find(a => a.id === activeArtifactId);

  const handleCopyCode = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }, []);

  const handleDownload = useCallback((artifact: Artifact) => {
    if (artifact.downloadUrl) {
      window.open(artifact.downloadUrl, '_blank');
      return;
    }
    const blob = new Blob([artifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = artifact.fileName || `artifact.${artifact.language || 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const codeArtifacts = artifacts.filter(a => a.type === 'code');
  const fileArtifacts = artifacts.filter(a => a.type === 'file');

  if (!activeArtifact) {
    return (
      <div className={`border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col ${isFullscreen ? 'w-full h-full' : 'w-[480px]'}`}>
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <span className="text-sm font-semibold dark:text-white">Artifacts</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-gray-400 hover:text-black dark:hover:text-white"
              title={isFullscreen ? "Kembali" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-black dark:hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {artifacts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Code className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Belum ada artifacts</p>
              <p className="text-xs mt-1">Klik blok kode di chat untuk melihat di sini</p>
            </div>
          ) : (
            <div className="space-y-2">
              {codeArtifacts.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Kode</span>
                  <div className="mt-1 space-y-1">
                    {codeArtifacts.map(a => (
                      <button
                        key={a.id}
                        onClick={() => onSelectArtifact(a.id)}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center gap-2">
                          <Code className="w-3 h-3 text-gray-400" />
                          <span className="font-medium dark:text-white">{a.language || 'code'}</span>
                          {a.title && <span className="text-gray-400 truncate">— {a.title}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {fileArtifacts.length > 0 && (
                <div className="mt-4">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">File</span>
                  <div className="mt-1 space-y-1">
                    {fileArtifacts.map(a => (
                      <button
                        key={a.id}
                        onClick={() => onSelectArtifact(a.id)}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-3 h-3 text-gray-400" />
                          <span className="font-medium dark:text-white">{a.fileName || 'file'}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col ${isFullscreen ? 'w-full h-full' : 'w-[480px]'}`}>
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectArtifact(null)}
            className="text-gray-400 hover:text-black dark:hover:text-white text-xs"
          >
            ← Kembali
          </button>
          <span className="text-sm font-semibold dark:text-white">
            {activeArtifact.title || activeArtifact.language || activeArtifact.fileName || 'Artifact'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {activeArtifact.type === 'code' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('code')}
                className={`px-2 py-1 text-[10px] rounded transition-colors ${activeTab === 'code' ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                <Code className="w-3 h-3 inline mr-1" />Kode
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-2 py-1 text-[10px] rounded transition-colors ${activeTab === 'preview' ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                <Eye className="w-3 h-3 inline mr-1" />Preview
              </button>
            </div>
          )}
          <button
            onClick={() => handleCopyCode(activeArtifact.content)}
            className="text-gray-400 hover:text-black dark:hover:text-white"
            title={copiedCode ? "Tersalin" : "Salin"}
          >
            {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={() => handleDownload(activeArtifact)}
            className="text-gray-400 hover:text-black dark:hover:text-white"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-gray-400 hover:text-black dark:hover:text-white"
            title={isFullscreen ? "Kembali" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-black dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeArtifact.type === 'code' && activeTab === 'code' && (
          <div className="p-4">
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-xs leading-relaxed">
              <code>{activeArtifact.content}</code>
            </pre>
          </div>
        )}

        {activeArtifact.type === 'code' && activeTab === 'preview' && (
          <div className="p-4">
            {activeArtifact.language === 'html' ? (
              <iframe
                srcDoc={activeArtifact.content}
                className="w-full h-[500px] border border-gray-200 dark:border-gray-600 rounded-lg bg-white"
                title="Preview"
              />
            ) : activeArtifact.language === 'css' ? (
              <div className="space-y-2">
                <div className="p-4 bg-white border border-gray-200 dark:border-gray-600 rounded-lg">
                  <style>{activeArtifact.content}</style>
                  <p className="text-sm">Preview CSS</p>
                </div>
              </div>
            ) : activeArtifact.language === 'javascript' || activeArtifact.language === 'js' ? (
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-xs leading-relaxed">
                <code>{activeArtifact.content}</code>
              </div>
            ) : (
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-xs leading-relaxed">
                <code>{activeArtifact.content}</code>
              </div>
            )}
          </div>
        )}

        {activeArtifact.type === 'markdown' && (
          <div className="p-4 prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              rehypePlugins={[rehypeHighlight]}
              components={{
                pre: ({ children, ...props }) => (
                  <CodeBlock {...props}>{children}</CodeBlock>
                ),
              }}
            >
              {activeArtifact.content}
            </ReactMarkdown>
          </div>
        )}

        {activeArtifact.type === 'file' && (
          <div className="p-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg p-6 text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium dark:text-white">{activeArtifact.fileName}</p>
              <p className="text-xs text-gray-400 mt-1">File siap di-download</p>
              <button
                onClick={() => handleDownload(activeArtifact)}
                className="mt-4 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                <Download className="w-3 h-3 inline mr-1.5" />
                Download File
              </button>
            </div>
          </div>
        )}
      </div>

      {artifacts.length > 1 && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 overflow-x-auto">
          <div className="flex gap-1">
            {artifacts.map(a => (
              <button
                key={a.id}
                onClick={() => onSelectArtifact(a.id)}
                className={`px-2 py-1 text-[10px] rounded shrink-0 transition-colors ${
                  a.id === activeArtifactId
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                }`}
              >
                {a.type === 'code' && <Code className="w-2.5 h-2.5 inline mr-0.5" />}
                {a.type === 'file' && <FileText className="w-2.5 h-2.5 inline mr-0.5" />}
                {a.title || a.language || a.fileName || 'Artifact'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
