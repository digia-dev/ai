import { useRef, useEffect } from 'react';
import { Paperclip, Mic, MicOff, ArrowUp, Loader2, Globe } from 'lucide-react';
import { ACCEPTED_FILE_TYPES } from '../lib/constants';

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  onSend: (text?: string) => void;
  onUpload?: (files: FileList) => void;
  onVoice?: () => void;
  isRecording?: boolean;
  loading?: boolean;
  uploading?: boolean;
  placeholder?: string;
  showUpload?: boolean;
  showVoice?: boolean;
  webSearch?: boolean;
  onToggleSearch?: () => void;
}

export default function ChatInput({
  input,
  setInput,
  onSend,
  onUpload,
  onVoice,
  isRecording = false,
  loading = false,
  uploading = false,
  placeholder = 'Tanya apa saja ke Tara...',
  showUpload = true,
  showVoice = true,
  webSearch = false,
  onToggleSearch,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="px-3 py-3 md:px-5 md:py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 safe-bottom">
      <div className="max-w-2xl mx-auto">
        <div className="flex gap-2 items-end">
          {showUpload && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-11 h-11 md:w-10 md:h-10 rounded-xl border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white shrink-0 disabled:opacity-50"
                title="Unggah sumber"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-5 h-5" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={ACCEPTED_FILE_TYPES}
                multiple
                onChange={(e) => e.target.files && onUpload?.(e.target.files)}
              />
            </>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            inputMode="text"
            enterKeyHint="send"
            className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm outline-none resize-none min-h-[48px] md:min-h-[44px] max-h-[200px] focus:border-black dark:focus:border-blue-500 bg-gray-50 dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />

          {showVoice && (
            <button
              onClick={onVoice}
              className={`w-11 h-11 md:w-10 md:h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                isRecording
                  ? 'border-red-300 bg-red-50 dark:bg-red-900/30 text-red-500 animate-pulse-recording'
                  : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white'
              }`}
              title={isRecording ? 'Hentikan rekaman' : 'Input suara'}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={() => onSend()}
            disabled={loading || !input.trim()}
            className="w-11 h-11 md:w-10 md:h-10 bg-black dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center shrink-0 hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>

        {onToggleSearch && (
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={onToggleSearch}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
                webSearch
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title={webSearch ? 'Web search aktif (+50 token)' : 'Aktifkan web search'}
            >
              <Globe className="w-3 h-3" />
              {webSearch ? 'Cari di web' : 'Tanpa web'}
            </button>
            {webSearch && (
              <span className="text-[10px] text-blue-500 dark:text-blue-400">+50 token</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
