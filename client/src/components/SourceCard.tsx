interface SourceCardProps {
  id: number;
  name: string;
  format: string;
  wordCount: number;
  onDelete: (id: number) => void;
}

export default function SourceCard({ id, name, format, wordCount, onDelete }: SourceCardProps) {
  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg mb-2">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center text-base">
          📄
        </div>
        <div>
          <div className="text-sm font-medium">{name}</div>
          <div className="text-xs text-gray-400">{format} · {wordCount.toLocaleString()} words</div>
        </div>
      </div>
      <button
        onClick={() => onDelete(id)}
        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50"
      >
        ×
      </button>
    </div>
  );
}
