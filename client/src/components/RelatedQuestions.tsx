import { ChevronRight } from 'lucide-react';

interface RelatedQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
}

export default function RelatedQuestions({ questions, onQuestionClick }: RelatedQuestionsProps) {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="mb-4 pl-11 animate-fade-in">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Pertanyaan terkait:</p>
      <div className="space-y-1">
        {questions.map((q, i) => (
          <button
            key={i}
            onClick={() => onQuestionClick(q)}
            className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors group"
          >
            <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
            <span>{q}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
