import React from 'react';
import Image from 'next/image';
import LilyLogo from '@/assets/Lily.png';

const LoadingSpinner = ({ size = 'medium', className = '' }) => {
  // Size classes for the container
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-24 h-24',
  };

  return (
    <div className="h-screen w-screen fixed inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-50">
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