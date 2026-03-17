import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const getFocusableElements = (container) => {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter((element) => {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    if (element.hidden || element.getAttribute('aria-hidden') === 'true') {
      return false;
    }

    return !element.hasAttribute('disabled');
  });
};

const useDialogAccessibility = ({ open, onClose, initialFocusRef }) => {
  const panelRef = useRef(null);
  const lastActiveRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    lastActiveRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const panel = panelRef.current;
    const lenis = window.__RED_MATERIALS_LENIS;
    const previousBodyOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    lenis?.stop?.();

    const focusTarget = initialFocusRef?.current instanceof HTMLElement
      ? initialFocusRef.current
      : getFocusableElements(panel)[0] ?? panel;

    const focusFrame = window.requestAnimationFrame(() => {
      focusTarget?.focus?.();
    });

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements(panel);

      if (!focusableElements.length) {
        event.preventDefault();
        panel?.focus?.();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      lenis?.start?.();
      lastActiveRef.current?.focus?.();
    };
  }, [initialFocusRef, onClose, open]);

  return panelRef;
};

export default useDialogAccessibility;