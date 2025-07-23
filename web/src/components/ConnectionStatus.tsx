import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

interface ConnectionStatusProps {
  className?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const [isBackendAvailable, setIsBackendAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        // Use the private method from apiService to check backend availability
        const available = await (apiService as any).isBackendAvailable();
        setIsBackendAvailable(available);
      } catch (error) {
        setIsBackendAvailable(false);
      }
    };

    checkBackendStatus();
  }, []);

  if (isBackendAvailable === null) {
    return null; // Don't show anything while checking
  }

  return (
    <div 
      className={className}
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        padding: '8px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '500',
        zIndex: 1000,
        backgroundColor: isBackendAvailable ? '#4CAF50' : '#FF9800',
        color: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      <div style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: 'white',
        animation: isBackendAvailable ? 'none' : 'pulse 2s infinite'
      }} />
      {isBackendAvailable ? 'Connected' : 'Offline Mode'}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ConnectionStatus; 