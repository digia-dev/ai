import { useState } from 'react';
import { Download, FileText, Code, Check } from 'lucide-react';

interface Message {
  id: number;
  role: string;
  content: string;
  createdAt?: string;
}

interface ExportMenuProps {
  messages: Message[];
  title: string;
}

export default function ExportMenu({ messages, title }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exported, setExported] = useState<string | null>(null);

  const exportMarkdown = () => {
    let md = `# ${title}\n\n`;
    md += `*Exported from Tara AI on ${new Date().toLocaleDateString('id-ID')}*\n\n---\n\n`;

    for (const msg of messages) {
      const role = msg.role === 'user' ? '**You**' : '**Tara**';
      const time = msg.createdAt ? ` (${new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})` : '';
      md += `### ${role}${time}\n\n${msg.content}\n\n---\n\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);

    setExported('md');
    setTimeout(() => setExported(null), 2000);
  };

  const exportText = () => {
    let txt = `${title}\n${'='.repeat(title.length)}\n\n`;
    txt += `Exported from Tara AI on ${new Date().toLocaleDateString('id-ID')}\n\n`;

    for (const msg of messages) {
      const role = msg.role === 'user' ? 'You' : 'Tara';
      const time = msg.createdAt ? ` (${new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})` : '';
      txt += `[${role}]${time}\n${msg.content}\n\n`;
    }

    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    setExported('txt');
    setTimeout(() => setExported(null), 2000);
  };

  const exportJSON = () => {
    const data = {
      title,
      exportedAt: new Date().toISOString(),
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExported('json');
    setTimeout(() => setExported(null), 2000);
  };

  const printPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #333; }
    h1 { font-size: 24px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    .meta { color: #666; font-size: 12px; margin-bottom: 30px; }
    .message { margin-bottom: 20px; padding: 12px 16px; border-radius: 8px; }
    .user { background: #f5f5f5; margin-left: 40px; }
    .assistant { background: #fff; border: 1px solid #e5e5e5; margin-right: 40px; }
    .role { font-weight: 600; font-size: 12px; color: #666; margin-bottom: 4px; }
    .content { font-size: 14px; line-height: 1.6; white-space: pre-wrap; }
    .time { font-size: 11px; color: #999; margin-top: 4px; }
    @media print { .message { break-inside: avoid; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">Exported from Tara AI • ${new Date().toLocaleDateString('id-ID')}</div>
`;

    for (const msg of messages) {
      const role = msg.role === 'user' ? 'You' : 'Tara';
      const cls = msg.role === 'user' ? 'user' : 'assistant';
      const time = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
      html += `  <div class="message ${cls}">
    <div class="role">${role}</div>
    <div class="content">${msg.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    ${time ? `<div class="time">${time}</div>` : ''}
  </div>\n`;
    }

    html += `</body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();

    setExported('pdf');
    setTimeout(() => setExported(null), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Export percakapan"
      >
        <Download className="w-3.5 h-3.5" />
        Export
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 min-w-[180px]">
            <button
              onClick={exportMarkdown}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-gray-300"
            >
              {exported === 'md' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <FileText className="w-3.5 h-3.5 text-gray-400" />}
              Markdown (.md)
            </button>
            <button
              onClick={exportText}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-gray-300"
            >
              {exported === 'txt' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <FileText className="w-3.5 h-3.5 text-gray-400" />}
              Teks (.txt)
            </button>
            <button
              onClick={exportJSON}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-gray-300"
            >
              {exported === 'json' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Code className="w-3.5 h-3.5 text-gray-400" />}
              JSON (.json)
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            <button
              onClick={printPDF}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-gray-300"
            >
              {exported === 'pdf' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Download className="w-3.5 h-3.5 text-gray-400" />}
              Cetak / PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
