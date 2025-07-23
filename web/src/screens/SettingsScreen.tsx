import React, { useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FontSizeContext } from '../contexts/fontSizeContext';

function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { fontSize, setFontSize } = useContext(FontSizeContext);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: '#1A1A1A',
          letterSpacing: '0.5px',
          margin: '0 0 32px 0'
        }}>
          Settings
        </h1>

        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '24px',
          borderRadius: '20px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            marginBottom: '20px',
            color: '#1A1A1A',
            letterSpacing: '0.5px'
          }}>
            Account Information
          </h2>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#666666',
              marginBottom: '8px'
            }}>
              Email
            </label>
            <div style={{ 
              padding: '12px 16px',
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              border: '2px solid #E0E0E0',
              fontSize: '16px',
              color: '#1A1A1A'
            }}>
              {user?.email || 'No email available'}
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '24px',
          borderRadius: '20px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            marginBottom: '20px',
            color: '#1A1A1A',
            letterSpacing: '0.5px'
          }}>
            Display Settings
          </h2>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#666666',
              marginBottom: '8px'
            }}>
              Font Size: {fontSize}px
            </label>
            <input
              type="range"
              min="16"
              max="32"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                background: '#E0E0E0',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              color: '#666666',
              marginTop: '4px'
            }}>
              <span>Small</span>
              <span>Large</span>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '24px',
          borderRadius: '20px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            marginBottom: '20px',
            color: '#1A1A1A',
            letterSpacing: '0.5px'
          }}>
            Account Actions
          </h2>
          <button
            onClick={signOut}
            style={{
              padding: '12px 24px',
              background: '#DC2626',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#B91C1C'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsScreen; 