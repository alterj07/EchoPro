import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import musicService, { type ITunesTrack } from '../services/musicService';

function PlayScreen() {
  const [tracks, setTracks] = useState<ITunesTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [maxPlaybackTime, setMaxPlaybackTime] = useState(30);
  const [volume, setVolume] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const timerRef = useRef<number | null>(null);
  const autoStopRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { user } = useAuth();

  // Load tracks when component mounts
  useEffect(() => {
    loadTracks();
  }, []);

  // Set current track when tracks are loaded
  useEffect(() => {
    if (tracks.length > 0 && currentTrackIndex === 0) {
      console.log('Tracks loaded, current track index:', currentTrackIndex);
    }
  }, [tracks, currentTrackIndex]);



  const loadTracks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get a mix of decades for all users
      const tracks = await musicService.getDecadeMixTracks();
      setTracks(tracks);
      
      // Auto-play the first track if we have tracks
      if (tracks.length > 0) {
        console.log('Auto-playing first track');
        // Small delay to ensure state is set
        setTimeout(async () => {
          await playTrack(0);
        }, 100);
      }
    } catch (error) {
      console.error('Error loading tracks:', error);
      setError('Failed to load music tracks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const playTrack = async (trackIndex: number) => {
    if (trackIndex < 0 || trackIndex >= tracks.length) return;
    
    try {
      // Clear any existing timers and audio
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = ''; // Clear the source
        audioRef.current = null;
      }
      
      setIsPlaying(false);
      setPlaybackDuration(0);
      setCurrentTrackIndex(trackIndex);
      
      const track = tracks[trackIndex];
      console.log('Loading audio from URL:', track.previewUrl);
      console.log('Track details:', {
        index: trackIndex,
        name: track.trackName,
        artist: track.artistName,
        previewUrl: track.previewUrl
      });
      
      // Check if previewUrl is empty or invalid
      if (!track.previewUrl || track.previewUrl.trim() === '') {
        console.log('No preview URL available, using fallback timer');
        throw new Error('No preview URL available');
      }
      
      const audio = new Audio(track.previewUrl);
      audioRef.current = audio;
      
      // Set volume
      audio.volume = volume;
      
      // Set up audio event listeners
      audio.addEventListener('loadedmetadata', () => {
        console.log('Audio loaded, duration:', audio.duration);
        setMaxPlaybackTime(Math.min(audio.duration, 30)); // Cap at 30 seconds
      });

      audio.addEventListener('timeupdate', () => {
        setPlaybackDuration(Math.floor(audio.currentTime));
      });

      audio.addEventListener('ended', () => {
        console.log('Audio ended naturally');
        setIsPlaying(false);
        if (timerRef.current) clearInterval(timerRef.current);
      });

      audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        setIsPlaying(false);
        // Fallback to timer-based simulation if audio fails
        const duration = Math.floor(Math.random() * 21) + 10;
        setMaxPlaybackTime(duration);
        setPlaybackDuration(0);
        
        timerRef.current = setInterval(() => {
          setPlaybackDuration(prev => {
            if (prev >= duration) {
              if (timerRef.current) clearInterval(timerRef.current);
              setIsPlaying(false);
              return prev;
            }
            return prev + 1;
          });
        }, 1000);

        autoStopRef.current = setTimeout(() => {
          setIsPlaying(false);
          if (timerRef.current) clearInterval(timerRef.current);
        }, duration * 1000);
      });

      // Start playing
      await audio.play();
      setIsPlaying(true);
      console.log('Started playing track:', track.trackName);

      // Auto-stop after 30 seconds (iTunes preview limit)
      autoStopRef.current = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        setIsPlaying(false);
        console.log('Auto-stopped track playback');
      }, 30000);

    } catch (error) {
      console.error('Error playing track:', error);
      // Fallback to timer-based simulation
      const duration = Math.floor(Math.random() * 21) + 10;
      setMaxPlaybackTime(duration);
      setPlaybackDuration(0);
      setIsPlaying(true);
      
      timerRef.current = setInterval(() => {
        setPlaybackDuration(prev => {
          if (prev >= duration) {
            if (timerRef.current) clearInterval(timerRef.current);
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      autoStopRef.current = setTimeout(() => {
        setIsPlaying(false);
        if (timerRef.current) clearInterval(timerRef.current);
      }, duration * 1000);
    }
  };

  const handlePlayPause = async () => {
    try {
      if (audioRef.current) {
        if (isPlaying) {
          // Pause audio
          audioRef.current.pause();
          if (timerRef.current) clearInterval(timerRef.current);
          setIsPlaying(false);
        } else {
          // Resume audio
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } else {
        // No audio loaded, start playing current track
        if (tracks.length > 0) {
          await playTrack(currentTrackIndex);
        } else {
          console.log('No tracks available to play');
        }
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const handleNext = () => {
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    playTrack(nextIndex);
  };

  const handlePrevious = () => {
    const prevIndex = currentTrackIndex === 0 ? tracks.length - 1 : currentTrackIndex - 1;
    playTrack(prevIndex);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTrack = tracks[currentTrackIndex];

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <div style={{ padding: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: '#1A1A1A',
          letterSpacing: '0.5px',
          margin: '0 0 32px 0'
        }}>
          Music Player
        </h1>

        {loading && (
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '24px',
            borderRadius: '20px',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <p style={{ color: '#666666', fontSize: '16px' }}>Loading music tracks...</p>
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: '#FEE2E2',
            border: '1px solid #FCA5A5',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
            color: '#DC2626'
          }}>
            {error}
            <button 
              onClick={loadTracks}
              style={{
                marginLeft: '12px',
                padding: '8px 16px',
                backgroundColor: '#DC2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        )}



        {!loading && tracks.length > 0 && (
          <>
            {/* Now Playing Section */}
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
                Now Playing
              </h2>
              
              {currentTrack && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{
                    width: '120px',
                    height: '120px',
                    backgroundColor: '#E0E0E0',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {currentTrack.artworkUrl100 ? (
                      <img 
                        src={currentTrack.artworkUrl100} 
                        alt="Album Art"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ color: '#666666', fontSize: '14px' }}>No Art</span>
                    )}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: '300px' }}>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#1A1A1A',
                      marginBottom: '8px'
                    }}>
                      {currentTrack.trackName}
                    </h3>
                    <p style={{
                      color: '#666666',
                      fontSize: '16px',
                      marginBottom: '16px'
                    }}>
                      {currentTrack.artistName}
                    </p>
                    
                    {/* Progress Bar */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: '#E0E0E0',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${(playbackDuration / maxPlaybackTime) * 100}%`,
                          height: '100%',
                          backgroundColor: '#3B82F6',
                          transition: 'width 0.1s ease'
                        }} />
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: '#666666',
                        marginTop: '4px'
                      }}>
                        <span>{formatTime(playbackDuration)}</span>
                        <span>{formatTime(maxPlaybackTime)}</span>
                      </div>
                    </div>
                    
                    {/* Volume Control */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        color: '#666666',
                        marginBottom: '4px'
                      }}>
                        Volume
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        style={{
                          width: '100%',
                          maxWidth: '200px'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Playback Controls */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '16px',
                marginTop: '24px'
              }}>
                <button
                  onClick={handlePrevious}
                  style={{
                    padding: '12px',
                    backgroundColor: '#F3F4F6',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ⏮️
                </button>
                
                <button
                  onClick={handlePlayPause}
                  style={{
                    padding: '16px',
                    backgroundColor: '#3B82F6',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    width: '64px',
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                  }}
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>
                
                <button
                  onClick={handleNext}
                  style={{
                    padding: '12px',
                    backgroundColor: '#F3F4F6',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ⏭️
                </button>
              </div>
            </div>

            {/* Track List */}
            <div style={{
              backgroundColor: '#FFFFFF',
              padding: '24px',
              borderRadius: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                marginBottom: '20px',
                color: '#1A1A1A',
                letterSpacing: '0.5px'
              }}>
                All Tracks ({tracks.length})
              </h2>
              
              <div style={{
                display: 'grid',
                gap: '12px',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {tracks.map((track, index) => (
                  <div
                    key={track.trackId}
                    onClick={() => playTrack(index)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '12px',
                      backgroundColor: index === currentTrackIndex ? '#F0F9FF' : '#F8FAFC',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      border: index === currentTrackIndex ? '2px solid #3B82F6' : '2px solid transparent',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#E0E0E0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      {track.artworkUrl100 ? (
                        <img 
                          src={track.artworkUrl100} 
                          alt="Album Art"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ color: '#666666', fontSize: '12px' }}>No Art</span>
                      )}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#1A1A1A',
                        marginBottom: '4px'
                      }}>
                        {track.trackName}
                      </h4>
                      <p style={{
                        color: '#666666',
                        fontSize: '14px'
                      }}>
                        {track.artistName}
                      </p>
                    </div>
                    
                    {index === currentTrackIndex && isPlaying && (
                      <div style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: '#3B82F6',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: 'white'
                      }}>
                        ▶️
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!loading && tracks.length === 0 && !error && (
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '24px',
            borderRadius: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <p style={{ color: '#666666', fontSize: '16px' }}>No tracks available. Please try refreshing the page.</p>
            <button 
              onClick={loadTracks}
              style={{
                marginTop: '16px',
                padding: '12px 24px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Load Tracks
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayScreen; 



