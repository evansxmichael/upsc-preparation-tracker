"use client";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
      <div className="bg-white border border-gray-200 rounded-lg p-5 max-w-sm w-full mx-4 shadow-xl">
        <h3 className="font-serif font-bold text-gray-900 text-lg">{title}</h3>
        <p className="text-sm text-gray-600 mt-2 font-sans">{message}</p>
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-mono font-medium rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-xs font-mono font-medium rounded bg-[#991b1b] text-white hover:bg-red-800"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
}