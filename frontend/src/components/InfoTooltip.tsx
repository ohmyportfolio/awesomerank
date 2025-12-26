import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './InfoTooltip.css';

interface InfoTooltipProps {
  title: string;
  description: string;
  example?: string;
}

interface TooltipPosition {
  top: number;
  left: number;
  transformOrigin: string;
}

export const InfoTooltip = ({ title, description, example }: InfoTooltipProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const calculatePosition = () => {
    if (!buttonRef.current) return null;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = Math.min(280, viewportWidth - 32);
    const tooltipHeight = 200; // approximate max height
    const padding = 16;

    // Calculate horizontal position - center on button
    let left = buttonRect.left + buttonRect.width / 2 - tooltipWidth / 2;

    // Keep within viewport horizontally
    if (left < padding) {
      left = padding;
    } else if (left + tooltipWidth > viewportWidth - padding) {
      left = viewportWidth - tooltipWidth - padding;
    }

    // Calculate vertical position (prefer below, fallback to above)
    let top: number;
    let transformOrigin: string;

    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;

    if (spaceBelow >= tooltipHeight + 12 || spaceBelow >= spaceAbove) {
      // Show below button
      top = buttonRect.bottom + 8;
      transformOrigin = 'top center';
    } else {
      // Show above button
      top = buttonRect.top - tooltipHeight - 8;
      transformOrigin = 'bottom center';
    }

    // Ensure top is not negative
    if (top < padding) {
      top = padding;
    }

    return { top, left, transformOrigin };
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        const newPos = calculatePosition();
        if (newPos) setTooltipPos(newPos);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen]);

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isOpen) {
      const newPos = calculatePosition();
      if (newPos) {
        setTooltipPos(newPos);
        setIsOpen(true);
      }
    } else {
      setIsOpen(false);
    }
  };

  const tooltipContent = (
    <AnimatePresence>
      {isOpen && tooltipPos && (
        <motion.div
          ref={tooltipRef}
          className="info-tooltip-popup"
          style={{
            position: 'fixed',
            top: tooltipPos.top,
            left: tooltipPos.left,
            transformOrigin: tooltipPos.transformOrigin,
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15 }}
        >
          <div className="info-tooltip-title">{title}</div>
          <div className="info-tooltip-desc">{description}</div>
          {example && (
            <div className="info-tooltip-example">
              <span className="info-tooltip-example-label">Example:</span> {example}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <span className="info-tooltip-wrapper">
      <button
        ref={buttonRef}
        type="button"
        className="info-tooltip-btn"
        onClick={handleOpen}
        aria-label="More information"
      >
        ?
      </button>
      {createPortal(tooltipContent, document.body)}
    </span>
  );
};
