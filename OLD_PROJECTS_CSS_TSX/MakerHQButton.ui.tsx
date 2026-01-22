// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/web/webshell/topbar/navigation/makerhq/MakerHQButton.ui.tsx
import { ChevronDown } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { MakerHQMegamenu } from './MakerHQMegamenu.ui';
// CSS now owned by PulseOS DS

interface MakerHQButtonProps {
  onMouseMove?: (e: React.MouseEvent) => void;
}

export const MakerHQButton: React.FC<MakerHQButtonProps> = ({ onMouseMove }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="makerhq-container">
      <button
        className="makerhq-button rich-glass-button"
        onMouseMove={onMouseMove}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <span className="makerhq-label">MakerHQ</span>
        <ChevronDown className={`makerhq-chevron ${isOpen ? 'rotated' : ''}`} size={16} />
      </button>

      {isOpen && (
        <MakerHQMegamenu
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
