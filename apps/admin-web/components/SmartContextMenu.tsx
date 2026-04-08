import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';

interface SmartContextMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
}

export const SmartContextMenu: React.FC<SmartContextMenuProps> = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<'bottom-right' | 'top-right' | 'bottom-left' | 'top-left'>('bottom-right');
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) && 
        triggerRef.current && 
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Smart Positioning Logic
  useEffect(() => {
    if (isOpen && triggerRef.current && menuRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;

      const spaceBelow = windowHeight - triggerRect.bottom;
      const spaceRight = windowWidth - triggerRect.right;

      let vertical = 'bottom';
      let horizontal = 'right';

      // Check vertical space (buffer of 10px)
      if (spaceBelow < menuRect.height + 10 && triggerRect.top > menuRect.height) {
        vertical = 'top';
      }

      // Check horizontal space
      if (spaceRight < menuRect.width + 10 && triggerRect.left > menuRect.width) {
        horizontal = 'left';
      }

      setPosition(`${vertical}-${horizontal}` as any);
    }
  }, [isOpen]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right': return 'bottom-full left-0 mb-2 origin-bottom-left';
      case 'top-left': return 'bottom-full right-0 mb-2 origin-bottom-right';
      case 'bottom-left': return 'top-full right-0 mt-2 origin-top-right';
      case 'bottom-right': default: return 'top-full left-0 mt-2 origin-top-left';
    }
  };

  return (
    <div className="relative inline-block">
      <button 
        ref={triggerRef}
        onClick={toggleMenu}
        className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-ocean-500/20 text-ocean-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
      >
        {trigger}
      </button>

      {isOpen && (
        <div 
          ref={menuRef}
          className={`absolute z-50 w-48 bg-midnight-900 border border-midnight-700 rounded-xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-200 ${getPositionClasses()}`}
        >
          {children}
        </div>
      )}
    </div>
  );
};