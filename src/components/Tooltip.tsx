import React, { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ children, content, position = 'top', className = '' }: TooltipProps) {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-zinc-800 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-zinc-800 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-zinc-800 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-zinc-800 border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <div className={`relative group inline-block ${className} hover:z-[100]`}>
      {children}
      <div className={`absolute z-[100] invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 w-max max-w-[250px] px-3 py-2 text-xs font-medium text-white bg-zinc-800 rounded-lg shadow-xl pointer-events-none ${positionClasses[position]}`}>
        <div className="whitespace-normal leading-relaxed">{content}</div>
        <div className={`absolute border-4 ${arrowClasses[position]}`}></div>
      </div>
    </div>
  );
}
