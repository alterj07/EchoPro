import React from 'react';

function PlayScreen() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: '#1A1A1A',
          letterSpacing: '0.5px',
          margin: '0 0 32px 0'
        }}>
          Music Videos
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
            Featured Videos
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            <div style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '16px',
              padding: '20px',
              border: '2px solid #E0E0E0'
            }}>
              <div style={{
                width: '100%',
                height: '180px',
                backgroundColor: '#E0E0E0',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <span style={{ color: '#666666', fontSize: '16px' }}>Video Placeholder</span>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#1A1A1A',
                marginBottom: '8px'
              }}>
                Music Theory Basics
              </h3>
              <p style={{
                color: '#666666',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                Learn the fundamentals of music theory with interactive examples.
              </p>
            </div>

            <div style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '16px',
              padding: '20px',
              border: '2px solid #E0E0E0'
            }}>
              <div style={{
                width: '100%',
                height: '180px',
                backgroundColor: '#E0E0E0',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <span style={{ color: '#666666', fontSize: '16px' }}>Video Placeholder</span>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#1A1A1A',
                marginBottom: '8px'
              }}>
                Rhythm Training
              </h3>
              <p style={{
                color: '#666666',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                Improve your rhythm skills with guided exercises and practice.
              </p>
            </div>

            <div style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '16px',
              padding: '20px',
              border: '2px solid #E0E0E0'
            }}>
              <div style={{
                width: '100%',
                height: '180px',
                backgroundColor: '#E0E0E0',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <span style={{ color: '#666666', fontSize: '16px' }}>Video Placeholder</span>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#1A1A1A',
                marginBottom: '8px'
              }}>
                Ear Training
              </h3>
              <p style={{
                color: '#666666',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                Develop your musical ear with pitch and interval recognition.
              </p>
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
            Coming Soon
          </h2>
          <p style={{
            color: '#666666',
            fontSize: '16px',
            lineHeight: '1.6'
          }}>
            We're working on bringing you more interactive music learning content. 
            Stay tuned for new videos, tutorials, and practice sessions!
          </p>
        </div>
      </div>
    </div>
  );
}

export default PlayScreen; 