import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary text-white hover:bg-indigo-700 shadow-md shadow-indigo-200',
      secondary: 'bg-secondary text-white hover:bg-green-600 shadow-md shadow-green-100',
      outline: 'border border-slate-200 text-slate-600 hover:bg-slate-50',
      ghost: 'text-slate-600 hover:bg-slate-100',
      danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-md shadow-rose-100',
    };
    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      icon: 'p-2',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-[8px] font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-4 h-4" />}
        {children}
      </button>
    );
  }
);

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = ({ className, children, ...props }: CardProps) => (
  <div className={cn('bg-white rounded-[16px] shadow-sm border border-slate-100 p-6', className)} {...props}>
    {children}
  </div>
);

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-1 w-full">
      {label && <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>}
      <input
        ref={ref}
        className={cn(
          'w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm',
          error && 'border-rose-500 focus:ring-rose-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-[10px] text-rose-500 font-medium">{error}</p>}
    </div>
  )
);

// ─── Progress ─────────────────────────────────────────────────────────────────
export const Progress = ({ value = 0, max = 100, className }: { value: number; max?: number; className?: string }) => (
  <div className={cn('w-full bg-slate-100 rounded-full h-2 overflow-hidden', className)}>
    <div 
      className="bg-primary h-full transition-all duration-500 ease-out"
      style={{ width: `${(value / max) * 100}%` }}
    />
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner = ({ className }: { className?: string }) => (
  <div className={cn('animate-spin border-4 border-indigo-100 border-t-indigo-600 rounded-full w-10 h-10', className)} />
);

export * from './CATSimulationModal';
