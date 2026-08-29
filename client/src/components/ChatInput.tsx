import { useRef, useEffect } from 'react';
import { Paperclip, Mic, MicOff, ArrowUp, Loader2 } from 'lucide-react';
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
    <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-2xl mx-auto flex gap-2 items-end">
        {showUpload && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white shrink-0 disabled:opacity-50"
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
          className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm outline-none resize-none min-h-[44px] max-h-[200px] focus:border-black dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />

        {showVoice && (
          <button
            onClick={onVoice}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
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
          className="w-10 h-10 bg-black dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center shrink-0 hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
