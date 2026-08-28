import { useState } from 'react';
import { MODEL_LIST } from '../lib/constants';

export function useModels(defaultModel?: string) {
  const [currentModel, setCurrentModel] = useState(defaultModel || MODEL_LIST[0].value);
  return { currentModel, setCurrentModel, models: MODEL_LIST };
}
