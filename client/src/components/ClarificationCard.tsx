interface ClarificationOption {
  id: string;
  label: string;
  description: string;
}

interface ClarificationCardProps {
  question: string;
  options: ClarificationOption[];
  onSelect: (label: string) => void;
}

export default function ClarificationCard({ question, options, onSelect }: ClarificationCardProps) {
  return (
    <div className="max-w-2xl mx-auto mb-4 ml-11">
      <div className="border border-gray-200 rounded-xl p-4 shadow-sm">
        <p className="text-sm font-medium mb-3">{question}</p>
        <div className="space-y-2">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.label)}
              className="w-full text-left px-3 py-2.5 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold">{opt.label}</span>
              {opt.description && (
                <span className="text-gray-500 ml-2">{opt.description}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
