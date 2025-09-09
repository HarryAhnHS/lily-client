import React from 'react';
import Image from 'next/image';
import LilyLogo from '@/assets/Lily.png';

const LoadingSpinner = ({ size = 'medium', className = '', inline = false }) => {
  // Size classes for the container
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-24 h-24',
  };

  const spinnerContent = (
    <div
      className={`${sizeClasses[size]} relative flex items-center justify-center ${className} animate-spin-slow`}
    >
      <Image 
        src={LilyLogo}
        alt="Lily Logo Loading"
        width={100}
        height={100}
        priority
        className="w-full h-full object-contain"
      />
    </div>
  );

  if (inline) {
    return (
      <>
        {spinnerContent}
        <style jsx global>{`
          @keyframes spin-slow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spin-slow 2s linear infinite;
          }
        `}</style>
      </>
    );
  }

  return (
    <div className="h-full w-full fixed inset-0 flex items-center justify-center z-50">
      {spinnerContent}
      
      <style jsx global>{`
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner; 