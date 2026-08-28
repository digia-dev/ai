export const MODEL_LIST = [
  { value: 'deepseek/deepseek-v4-flash', label: 'DeepSeek V4 Flash', context: '1M' },
  { value: 'deepseek/deepseek-v3.2', label: 'DeepSeek V3.2', context: '1M' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', context: '128K' },
  { value: 'openai/gpt-5.6-luna', label: 'GPT-5.6 Luna', context: '1M' },
  { value: 'openai/gpt-4.1-mini', label: 'GPT-4.1 Mini', context: '1M' },
  { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku', context: '200K' },
  { value: 'anthropic/claude-haiku-4.5', label: 'Claude Haiku 4.5', context: '200K' },
  { value: 'qwen/qwen3-coder', label: 'Qwen3 Coder', context: '262K' },
  { value: 'qwen/qwen3.5-flash', label: 'Qwen3.5 Flash', context: '1M' },
  { value: 'mistralai/mistral-nemo', label: 'Mistral Nemo', context: '131K' },
  { value: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', context: '131K' },
  { value: 'meta-llama/llama-4-scout', label: 'Llama 4 Scout', context: '1M' },
  { value: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', context: '1M' },
];

export const ACCEPTED_FILE_TYPES = '.pdf,.docx,.doc,.txt,.md,.csv,.html';

export const TOKEN_PROGRESS_MAX = 10000;

export function formatTokens(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function formatPrice(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`;
}
