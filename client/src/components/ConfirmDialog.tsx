import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Ya, hapus',
  cancelLabel = 'Batal',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} maxWidth="max-w-sm">
      <div className="p-6 text-center">
        <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${danger ? 'bg-red-50' : 'bg-gray-100'}`}>
          <AlertTriangle className={`w-6 h-6 ${danger ? 'text-red-500' : 'text-gray-500'}`} />
        </div>
        <h3 className="font-semibold text-sm mb-2">{title}</h3>
        <p className="text-xs text-gray-500 mb-5">{message}</p>
        <div className="flex gap-2 justify-center">
          <button onClick={onCancel} className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-xs font-medium text-white ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-black hover:bg-gray-800'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
