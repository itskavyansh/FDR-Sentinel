import React from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'error';
  onClose: () => void;
}

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: 'bg-green-700 text-white',
    info: 'bg-blue-700 text-white',
    error: 'bg-red-700 text-white',
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm ${colors[type]} animate-pulse-once`}>
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  );
}

interface ToastState {
  message: string;
  type: 'success' | 'info' | 'error';
}

export function useToast() {
  const [toast, setToast] = React.useState<ToastState | null>(null);
  const show = React.useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
  }, []);
  const hide = React.useCallback(() => setToast(null), []);
  return { toast, show, hide };
}
