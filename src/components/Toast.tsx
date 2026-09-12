import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

const Ctx = createContext<((message: string) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const [show, setShow] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const toast = useCallback((m: string) => {
    setMessage(m);
    setShow(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setShow(false), 2200);
  }, []);

  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className={'toast' + (show ? ' show' : '')} id="toast" role="status">{message}</div>
    </Ctx.Provider>
  );
}

export function useToast(): (message: string) => void {
  const t = useContext(Ctx);
  if (!t) throw new Error('useToast outside ToastProvider');
  return t;
}
