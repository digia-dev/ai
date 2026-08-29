import { useState, useCallback, useMemo } from 'react';
import type { Artifact } from '../components/ArtifactPanel';

interface Message {
  id: number;
  role: string;
  content: string;
  outputFiles?: any[];
}

export function useArtifacts(messages: Message[]) {
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);

  const artifacts = useMemo(() => {
    const result: Artifact[] = [];
    let artifactId = 0;

    for (const msg of messages) {
      if (msg.role !== 'assistant' || !msg.content) continue;

      const codeBlockRegex = /```(\w+)?\s*(?:title=([^\n]*))?\n([\s\S]*?)```/g;
      let match;

      while ((match = codeBlockRegex.exec(msg.content)) !== null) {
        const language = match[1] || 'text';
        const title = match[2] || undefined;
        const content = match[3].trim();

        if (content.length > 10) {
          result.push({
            id: `artifact-${msg.id}-${artifactId++}`,
            type: 'code',
            language,
            title,
            content,
          });
        }
      }

      if (msg.outputFiles && msg.outputFiles.length > 0) {
        for (const file of msg.outputFiles) {
          result.push({
            id: `file-${msg.id}-${artifactId++}`,
            type: 'file',
            fileName: file.name,
            content: '',
            downloadUrl: file.downloadUrl,
          });
        }
      }
    }

    return result;
  }, [messages]);

  const selectArtifact = useCallback((id: string | null) => {
    setActiveArtifactId(id);
  }, []);

  const closeArtifact = useCallback(() => {
    setActiveArtifactId(null);
  }, []);

  return {
    artifacts,
    activeArtifactId,
    selectArtifact,
    closeArtifact,
  };
}
