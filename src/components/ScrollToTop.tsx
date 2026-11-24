import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      type="button"
      id="btn-to-top"
      onClick={scrollToTop}
      aria-label="Retour en haut de page"
      className={`fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#1F1F1F] hover:bg-[#111111] text-[#C62828] hover:text-white border border-[#C62828]/40 hover:border-[#111111] shadow-lg shadow-black/30 flex items-center justify-center transition-all duration-300 transform cursor-pointer group active:scale-90 ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
          : 'opacity-0 translate-y-4 scale-90 pointer-events-none'
      }`}
      title="Retour en haut de page"
    >
      <ArrowUp className="w-5 h-5 transition-transform duration-200 group-hover:-translate-y-1" />
    </button>
  );
};
