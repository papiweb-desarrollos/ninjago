
import React, { useCallback } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  enhanced?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  enhanced = false,
  className, 
  onClick,
  ...props 
}) => {
  const baseStyle = "px-6 py-3 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-75 transition-all duration-300 transform hover:scale-105 active:scale-95";
  
  const variantStyles = {
    primary: "bg-sky-500 hover:bg-sky-600 text-white focus:ring-sky-400",
    secondary: "bg-slate-600 hover:bg-slate-700 text-slate-100 focus:ring-slate-500",
  };

  const enhancedStyles = enhanced ? "btn-enhanced ripple-effect" : "";

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (enhanced) {
      // Crear efecto de onda
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Remover ondas anteriores
      const existingRipples = button.querySelectorAll('.ripple');
      existingRipples.forEach(ripple => ripple.remove());
      
      // Crear nueva onda
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple 0.6s linear;
        left: ${x - 10}px;
        top: ${y - 10}px;
        width: 20px;
        height: 20px;
        pointer-events: none;
      `;
      
      button.appendChild(ripple);
      
      // Limpiar onda después de la animación
      setTimeout(() => {
        ripple.remove();
      }, 600);
    }
    
    onClick?.(e);
  }, [enhanced, onClick]);

  return (
    <button
      className={`${baseStyle} ${variantStyles[variant]} ${enhancedStyles} ${className || ''}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};
