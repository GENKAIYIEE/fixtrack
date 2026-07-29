import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full p-8 space-y-4">
      <div className="relative flex items-center justify-center w-16 h-16">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-surface-container-high"></div>
        {/* Inner Spinning Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-secondary border-t-transparent animate-spin"></div>
        {/* Subtle glow effect */}
        <div className="absolute inset-0 rounded-full border-4 border-secondary opacity-20 blur-sm"></div>
      </div>
      {message && (
        <p className="text-on-surface-variant font-label-md animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}
