import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuiz } from '../contexts/QuizContext';
import { useUserProgress } from '../contexts/UserProgressContext';
import apiService from '../services/apiService';
import type { ITunesTrack } from '../contexts/QuizContext';

type Question = {
  id: string;
  track: ITunesTrack;
  options: string[];
  correctAnswer: string;
  userAnswer: string | null;
  status: 'unanswered' | 'correct' | 'incorrect' | 'skipped';
};

interface DailyQuizData {
  date: string;
  questionsAnswered: number;
  correct: number;
  incorrect: number;
  skipped: number;
}

const ChecklistScreen = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [screen, setScreen] = useState<'start' | 'quiz' | 'results'>('start');
  const [loading, setLoading] = useState(false);
  const [tracks, setTracks] = useState<ITunesTrack[]>([]);
  const [dailyData, setDailyData] = useState<DailyQuizData | null>(null);
  const [feedback, setFeedback] = useState<{ show: boolean; message: string; type: 'correct' | 'incorrect' | 'skipped' }>({ show: false, message: '', type: 'correct' });
  
  // Audio playback state for web
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const timerRef = useRef<number | null>(null);
  const autoStopRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Flag to prevent multiple simultaneous API calls
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);

  const { user } = useAuth();
  const { updateTodayProgress } = useAuth();
  const { setQuizState } = useQuiz();
  const { updateProgress } = useUserProgress();

  // Function to save daily stats to backend
  const saveDailyStatsToBackend = async () => {
    if (!user?.uid || !dailyData || dailyData.questionsAnswered === 0) {
      return;
    }
    
    try {
      // Clean the questions array to remove any circular references or large objects
      const cleanQuestions = questions.map(q => ({
        id: q.id,
        track: {
          trackId: q.track.trackId,
          trackName: q.track.trackName,
          artistName: q.track.artistName,
          artworkUrl100: q.track.artworkUrl100,
          previewUrl: q.track.previewUrl
        },
        options: q.options,
        correctAnswer: q.correctAnswer,
        userAnswer: q.userAnswer,
        status: q.status
      }));
      
      await apiService.saveQuizState(user.uid, cleanQuestions, currentQuestionIndex, {
        correct: dailyData.correct,
        incorrect: dailyData.incorrect,
        skipped: dailyData.skipped
      });
    } catch (error) {
      // Don't throw the error to prevent the app from crashing
    }
  };

  // Save stats when component unmounts or when navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (screen === 'quiz' && dailyData && dailyData.questionsAnswered > 0) {
        saveDailyStatsToBackend();
      }
    };

    const handlePageHide = () => {
      if (screen === 'quiz' && dailyData && dailyData.questionsAnswered > 0) {
        saveDailyStatsToBackend();
      }
    };

    // Add event listeners for window close and navigation
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      // This cleanup function runs when component unmounts
      if (screen === 'quiz' && dailyData && dailyData.questionsAnswered > 0) {
        saveDailyStatsToBackend();
      }
      
      // Remove event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [screen, dailyData]);

  // Load data when component mounts
  useEffect(() => {
    loadDailyQuizData();
    loadTracks();
    loadSavedQuizState();
  }, [user?.uid]);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
    };
  }, []);

  // Load saved quiz state from backend when component mounts
  const loadSavedQuizState = async () => {
    if (!user?.uid) return;

    try {
      // Get user data from backend
      const userData = await apiService.getUser(user.uid);
      if (userData && userData.progress && userData.progress.length > 0) {
        // Find today's progress
        const today = new Date().toISOString().split('T')[0];
        const todayProgress = userData.progress.find((p: any) => p.period === 'daily');
        
        if (todayProgress && todayProgress.stats) {
          const { totalQuestions, correctAnswers, incorrectAnswers, skippedAnswers } = todayProgress.stats;
          
          // Set daily data from backend
          setDailyData({
            date: today,
            questionsAnswered: totalQuestions || 0,
            correct: correctAnswers || 0,
            incorrect: incorrectAnswers || 0,
            skipped: skippedAnswers || 0,
          });

          // Check if there's an active quiz in progress (questions answered > 0 but < 10)
          if ((totalQuestions || 0) > 0 && (totalQuestions || 0) < 10) {
            // Check if there are saved questions in the user's progress
            if (todayProgress.quizQuestions && todayProgress.currentQuestionIndex !== undefined) {
              setQuestions(todayProgress.quizQuestions);
              setCurrentQuestionIndex(todayProgress.currentQuestionIndex);
              setCurrentQuestion(todayProgress.quizQuestions[todayProgress.currentQuestionIndex]);
              setScreen('quiz');
            }
          }
        }
      }
    } catch (error) {
      // Error loading saved quiz state
    }
  };

  // Load daily quiz data from backend
  const loadDailyQuizData = async () => {
    // Always initialize dailyData for today, regardless of API status
    const today = new Date().toISOString().split('T')[0];
    const newDailyData: DailyQuizData = {
      date: today,
      questionsAnswered: 0,
      correct: 0,
      incorrect: 0,
      skipped: 0,
    };
    setDailyData(newDailyData);

    if (!user?.uid) return;

    try {
      const userData = await apiService.getUser(user.uid);
      if (userData && userData.progress && userData.progress.length > 0) {
        const todayProgress = userData.progress.find((p: any) => p.period === 'daily');
        
        if (todayProgress && todayProgress.stats) {
          const { totalQuestions, correctAnswers, incorrectAnswers, skippedAnswers } = todayProgress.stats;
          setDailyData({
            date: today,
            questionsAnswered: totalQuestions || 0,
            correct: correctAnswers || 0,
            incorrect: incorrectAnswers || 0,
            skipped: skippedAnswers || 0,
          });
        }
      }
    } catch (error) {
      // Keep the initialized dailyData even if API fails
    }
  };

  const loadTracks = async () => {
    // Prevent multiple simultaneous API calls
    if (isLoadingTracks) {
      return;
    }
    
    try {
      setIsLoadingTracks(true);
      setLoading(true);
      
      // Check if we have cached tracks from today
      const today = new Date().toISOString().split('T')[0];
      const cachedTracks = localStorage.getItem(`cached_tracks_${today}`);
      
      if (cachedTracks) {
        const tracks = JSON.parse(cachedTracks);
        
        // Check if cached tracks have previewUrl values
        const hasPreviewUrls = tracks.some((track: any) => track.previewUrl && track.previewUrl.trim() !== '');
        
        if (hasPreviewUrls) {
          setTracks(tracks);
          setLoading(false);
          setIsLoadingTracks(false);
          return;
        } else {
          localStorage.removeItem(`cachedTracks_${today}`); // Clear invalid cache
        }
      }
      
      // Check if we've been rate limited recently
      const lastRateLimit = localStorage.getItem('last_rate_limit');
      const now = Date.now();
      if (lastRateLimit && (now - parseInt(lastRateLimit)) < 60000) { // 1 minute cooldown
        useFallbackTracks();
        setIsLoadingTracks(false);
        return;
      }
      
      // If no cached tracks, fetch from iTunes API
      const response = await fetch('https://itunes.apple.com/search?term=popular&media=music&entity=song&limit=50');
      
      if (!response.ok) {
        if (response.status === 429) {
          localStorage.setItem('last_rate_limit', now.toString());
          useFallbackTracks();
          setIsLoadingTracks(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Check if iTunes tracks have previewUrl values
        const tracksWithPreviewUrls = data.results.filter((track: any) => 
          track.previewUrl && track.previewUrl.trim() !== ''
        );
        
        if (tracksWithPreviewUrls.length >= 10) {
          setTracks(tracksWithPreviewUrls);
          // Cache the tracks for today
          localStorage.setItem(`cached_tracks_${today}`, JSON.stringify(tracksWithPreviewUrls));
        } else {
          useFallbackTracks();
        }
      } else {
        useFallbackTracks();
      }
    } catch (error) {
      useFallbackTracks();
    } finally {
      setLoading(false);
      setIsLoadingTracks(false);
    }
  };

  // Helper function to clear cache and force fresh tracks
  const clearCache = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.removeItem(`cached_tracks_${today}`);
    localStorage.removeItem('last_rate_limit');
    loadTracks();
  };

  // Helper function to use fallback tracks
  const useFallbackTracks = () => {
    const today = new Date().toISOString().split('T')[0];
    const fallbackTracks = [
      { trackId: 1, trackName: "Shape of You", artistName: "Ed Sheeran", previewUrl: "https://audio-samples.github.io/samples/mp3/blizzard_biased/blizzard_biased.mp3", artworkUrl100: "" },
      { trackId: 2, trackName: "Blinding Lights", artistName: "The Weeknd", previewUrl: "https://audio-samples.github.io/samples/mp3/blizzard_biased/blizzard_biased.mp3", artworkUrl100: "" },
      { trackId: 3, trackName: "Dance Monkey", artistName: "Tones and I", previewUrl: "https://audio-samples.github.io/samples/mp3/blizzard_biased/blizzard_biased.mp3", artworkUrl100: "" },
      { trackId: 4, trackName: "Bad Guy", artistName: "Billie Eilish", previewUrl: "https://audio-samples.github.io/samples/mp3/blizzard_biased/blizzard_biased.mp3", artworkUrl100: "" },
      { trackId: 5, trackName: "Old Town Road", artistName: "Lil Nas X", previewUrl: "https://audio-samples.github.io/samples/mp3/blizzard_biased/blizzard_biased.mp3", artworkUrl100: "" },
      { trackId: 6, trackName: "Someone You Loved", artistName: "Lewis Capaldi", previewUrl: "https://audio-samples.github.io/samples/mp3/blizzard_biased/blizzard_biased.mp3", artworkUrl100: "" },
      { trackId: 7, trackName: "Truth Hurts", artistName: "Lizzo", previewUrl: "https://audio-samples.github.io/samples/mp3/blizzard_biased/blizzard_biased.mp3", artworkUrl100: "" },
      { trackId: 8, trackName: "Sunflower", artistName: "Post Malone", previewUrl: "https://audio-samples.github.io/samples/mp3/blizzard_biased/blizzard_biased.mp3", artworkUrl100: "" },
      { trackId: 9, trackName: "Señorita", artistName: "Shawn Mendes", previewUrl: "https://audio-samples.github.io/samples/mp3/blizzard_biased/blizzard_biased.mp3", artworkUrl100: "" },
      { trackId: 10, trackName: "Circles", artistName: "Post Malone", previewUrl: "https://audio-samples.github.io/samples/mp3/blizzard_biased/blizzard_biased.mp3", artworkUrl100: "" },
      { trackId: 11, trackName: "Lose You To Love Me", artistName: "Selena Gomez", previewUrl: "https://audio-samples.github.io/samples/mp3/blizzard_biased/blizzard_biased.mp3", artworkUrl100: "" },
      { trackId: 12, trackName: "Memories", artistName: "Maroon 5", previewUrl: "https://audio-samples.github.io/samples/mp3/blizzard_biased/blizzard_biased.mp3", artworkUrl100: "" },
      { trackId: 13, trackName: "10,000 Hours", artistName: "Dan + Shay", previewUrl: "https://audio-samples.github.io/samples/mp3/blizzard_biased/blizzard_biased.mp3", artworkUrl100: "" },
      { trackId: 14, trackName: "Good As Hell", artistName: "Lizzo", previewUrl: "https://audio-samples.github.io/samples/mp3/blizzard_biased/blizzard_biased.mp3", artworkUrl100: "" },
      { trackId: 15, trackName: "Beautiful People", artistName: "Ed Sheeran", previewUrl: "https://audio-samples.github.io/samples/mp3/blizzard_biased/blizzard_biased.mp3", artworkUrl100: "" },
      { trackId: 16, trackName: "Lover", artistName: "Taylor Swift", previewUrl: "https://audio-samples.github.io/samples/mp3/blizzard_biased/blizzard_biased.mp3", artworkUrl100: "" },
      { trackId: 17, trackName: "The Bones", artistName: "Maren Morris", previewUrl: "https://audio-samples.github.io/samples/mp3/blizzard_biased/blizzard_biased.mp3", artworkUrl100: "" },
      { trackId: 18, trackName: "Roxanne", artistName: "Arizona Zervas", previewUrl: "https://audio-samples.github.io/samples/mp3/blizzard_biased/blizzard_biased.mp3", artworkUrl100: "" },
      { trackId: 19, trackName: "Graveyard", artistName: "Halsey", previewUrl: "https://audio-samples.github.io/samples/mp3/blizzard_biased/blizzard_biased.mp3", artworkUrl100: "" },
      { trackId: 20, trackName: "Don't Call Me Up", artistName: "Mabel", previewUrl: "https://audio-samples.github.io/samples/mp3/blizzard_biased/blizzard_biased.mp3", artworkUrl100: "" }
    ];
    setTracks(fallbackTracks);
    // Cache the fallback tracks
    localStorage.setItem(`cached_tracks_${today}`, JSON.stringify(fallbackTracks));
  };

  const generateQuizQuestions = (): Question[] => {
    const shuffledTracks = [...tracks].sort(() => Math.random() - 0.5);
    
    const questions = shuffledTracks.slice(0, 10).map((track, index) => {
      const otherTracks = shuffledTracks.filter(t => t.trackId !== track.trackId);
      const options = [track.trackName];
      
      // Helper function to check if two song titles are similar
      const areSimilarTitles = (title1: string, title2: string): boolean => {
        const cleanTitle1 = title1.toLowerCase().replace(/[^\w\s]/g, '').trim();
        const cleanTitle2 = title2.toLowerCase().replace(/[^\w\s]/g, '').trim();
        
        // If titles are exactly the same (ignoring case and punctuation), they're similar
        if (cleanTitle1 === cleanTitle2) return true;
        
        // If one title is contained within the other, they're similar
        if (cleanTitle1.includes(cleanTitle2) || cleanTitle2.includes(cleanTitle1)) return true;
        
        // Check if they share the same main word (e.g., "Popular" in different variations)
        const mainWords1 = cleanTitle1.split(/\s+/).filter(word => word.length > 2);
        const mainWords2 = cleanTitle2.split(/\s+/).filter(word => word.length > 2);
        
        // If they share any main word, they're similar
        const hasSharedMainWord = mainWords1.some(word1 => 
          mainWords2.some(word2 => word1 === word2 || word1.includes(word2) || word2.includes(word1))
        );
        
        if (hasSharedMainWord) return true;
        
        // Check if more than 50% of words match
        const matchingWords = mainWords1.filter(word => 
          mainWords2.some(w => w === word || w.includes(word) || word.includes(w))
        );
        
        const similarityRatio = matchingWords.length / Math.max(mainWords1.length, mainWords2.length);
        return similarityRatio > 0.5;
      };
      
      // Add 3 random incorrect options that are not similar to the correct answer
      let attempts = 0;
      const maxAttempts = 50; // Prevent infinite loops
      
      for (let i = 0; i < 3 && attempts < maxAttempts; i++) {
        const randomTrack = otherTracks[Math.floor(Math.random() * otherTracks.length)];
        if (randomTrack && 
            !options.includes(randomTrack.trackName) && 
            !areSimilarTitles(track.trackName, randomTrack.trackName)) {
          options.push(randomTrack.trackName);
        } else {
          attempts++;
          i--; // Retry this iteration
        }
      }
      
      // If we couldn't find enough dissimilar options, fill with any unique options
      while (options.length < 4 && attempts < maxAttempts) {
        const randomTrack = otherTracks[Math.floor(Math.random() * otherTracks.length)];
        if (randomTrack && !options.includes(randomTrack.trackName)) {
          options.push(randomTrack.trackName);
        }
        attempts++;
      }
      
      // Shuffle options
      const shuffledOptions = options.sort(() => Math.random() - 0.5);
      
      return {
        id: `question_${index}`,
        track,
        options: shuffledOptions,
        correctAnswer: track.trackName,
        userAnswer: null,
        status: 'unanswered' as const
      };
    });
    
    return questions;
  };

  const handleStartQuiz = async () => {
    const quizQuestions = generateQuizQuestions();
    
    if (quizQuestions.length === 0) {
      alert('No tracks available for quiz. Please try again.');
      return;
    }
    
    setQuestions(quizQuestions);
    setCurrentQuestionIndex(0);
    setCurrentQuestion(quizQuestions[0]);
    setScreen('quiz');

    // Save quiz state to backend
    if (user?.uid) {
      try {
        await apiService.saveQuizState(user.uid, quizQuestions, 0, {
          correct: dailyData?.correct || 0,
          incorrect: dailyData?.incorrect || 0,
          skipped: dailyData?.skipped || 0
        });
        
      } catch (error) {
        // Error saving quiz state
      }
    }

    // Initialize quiz state
    const initialQuizState = {
      questions: quizQuestions,
      currentQuestionIndex: 0,
      correctCount: dailyData?.correct || 0,
      incorrectCount: dailyData?.incorrect || 0,
      skippedCount: dailyData?.skipped || 0,
      quizId: `quiz_${Date.now()}`,
      startTime: Date.now(),
    };

    // Update QuizContext
    setQuizState(initialQuizState);

    // Save quiz state
    if (user?.uid) {
      // The following lines were removed as per the edit hint:
      // await saveQuizState(user.uid);
    }
    
    // Start the first question
    setTimeout(() => {
      startQuestion();
    }, 100); // Small delay to ensure state is set
  };

  const startQuestion = async () => {
    if (!currentQuestion) {
      return;
    }

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

      // Create new audio element
      
      // Check if previewUrl is empty or invalid
      if (!currentQuestion.track.previewUrl || currentQuestion.track.previewUrl.trim() === '') {
        throw new Error('No preview URL available');
      }
      
      const audio = new Audio(currentQuestion.track.previewUrl);
      audioRef.current = audio;
      
      // Set volume
      audio.volume = volume;
      
      // Set up audio event listeners
      audio.addEventListener('loadedmetadata', () => {
        // Audio loaded
      });

      audio.addEventListener('timeupdate', () => {
        // Track time but don't store it since we're not displaying it
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        if (timerRef.current) clearInterval(timerRef.current);
      });

      audio.addEventListener('error', () => {
        console.error('Audio error occurred');
        setIsPlaying(false);
        // Fallback to timer-based simulation if audio fails
        const duration = Math.floor(Math.random() * 21) + 10;
        
        timerRef.current = setInterval(() => {
          // Simulate playback progress
          if (timerRef.current) {
            clearInterval(timerRef.current);
            setIsPlaying(false);
          }
        }, duration * 1000);

        autoStopRef.current = setTimeout(() => {
          setIsPlaying(false);
          if (timerRef.current) clearInterval(timerRef.current);
        }, duration * 1000);
      });

      // Start playing
      await audio.play();
      setIsPlaying(true);

      // Auto-stop after 30 seconds (iTunes preview limit)
      autoStopRef.current = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        setIsPlaying(false);
      }, 30000);

    } catch (error) {
      // Fallback to timer-based simulation
      const duration = Math.floor(Math.random() * 21) + 10;
      setIsPlaying(true);
      
      timerRef.current = setInterval(() => {
        // Simulate playback progress
        if (timerRef.current) {
          clearInterval(timerRef.current);
          setIsPlaying(false);
        }
      }, duration * 1000);

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
        // Fallback to timer-based logic
        if (isPlaying) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsPlaying(false);
        } else {
          setIsPlaying(true);
          // Restart timer logic here
        }
      }
    } catch (error) {
      // Error toggling playback
    }
  };

  const handleRestart = async () => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
        setIsPlaying(true);
      } else {

        // Restart timer logic here
      }
    } catch (error) {
      // Error restarting track
    }
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    
    // Update audio volume if audio element exists
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const showAnswerFeedback = (status: 'correct' | 'incorrect' | 'skipped') => {
    let message = '';
    
    if (status === 'correct') {
      message = 'Correct! 🎉';
    } else if (status === 'incorrect') {
      message = `Incorrect! 😔 The correct answer was: ${currentQuestion?.correctAnswer}`;
    } else {
      message = 'Skipped! 🤷‍♂️';
    }
    
    setFeedback({
      show: true,
      message: message,
      type: status
    });
    
    setTimeout(() => {
      setFeedback({ show: false, message: '', type: 'correct' });
      // Move to next question after feedback
      handleNextQuestion();
    }, 3000); // Increased time to 3 seconds so users can read the correct answer
  };

  const handleAnswer = async (selectedAnswer: string) => {
    if (!currentQuestion || !dailyData) {
      return;
    }

    // Stop audio playback when answer is selected
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    setIsPlaying(false);

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const status: 'unanswered' | 'correct' | 'incorrect' | 'skipped' = selectedAnswer === 'idk' ? 'skipped' : (isCorrect ? 'correct' : 'incorrect');

    // Update question
    const updatedQuestion = { ...currentQuestion, userAnswer: selectedAnswer, status };
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex] = updatedQuestion;
    setQuestions(updatedQuestions);

    // Update daily data locally (don't save to backend yet)
    const updatedDailyData = { ...dailyData };
    updatedDailyData.questionsAnswered += 1;
    
    if (status === 'correct') {
      updatedDailyData.correct += 1;
    } else if (status === 'incorrect') {
      updatedDailyData.incorrect += 1;
    } else {
      updatedDailyData.skipped += 1;
    }
    
    setDailyData(updatedDailyData);

    // Update local progress in AuthContext (no API call)
    updateTodayProgress(updatedDailyData.correct, updatedDailyData.incorrect, updatedDailyData.skipped);
    
    // Save quiz state to backend (questions and current index, AND current daily stats)
    if (user?.uid) {
      try {
        await apiService.saveQuizState(user.uid, updatedQuestions, currentQuestionIndex, {
          correct: updatedDailyData.correct,
          incorrect: updatedDailyData.incorrect,
          skipped: updatedDailyData.skipped
        });
        
      } catch (error) {
        // Error saving quiz state
      }
    }

    // Show feedback and automatically move to next question
    showAnswerFeedback(status);
  };

  const handleSkip = async () => {
    if (!currentQuestion) return;

    // Stop audio playback when skipping
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    setIsPlaying(false);

    // Update question
    const updatedQuestion = { ...currentQuestion, userAnswer: 'idk', status: 'skipped' as const };
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex] = updatedQuestion;
    setQuestions(updatedQuestions);

    // Update daily data locally (don't save to backend yet)
    const updatedDailyData = { ...dailyData! };
    updatedDailyData.questionsAnswered += 1;
    updatedDailyData.skipped += 1;
    setDailyData(updatedDailyData);

    // Update local progress in AuthContext (no API call)
    updateTodayProgress(updatedDailyData.correct, updatedDailyData.incorrect, updatedDailyData.skipped);

    // Save quiz state to backend (questions and current index, AND current daily stats)
    if (user?.uid) {
      try {
        await apiService.saveQuizState(user.uid, updatedQuestions, currentQuestionIndex, {
          correct: updatedDailyData.correct,
          incorrect: updatedDailyData.incorrect,
          skipped: updatedDailyData.skipped
        });
        
      } catch (error) {
        // Error saving quiz state
      }
    }

    // Show feedback and automatically move to next question
    showAnswerFeedback('skipped');
  };

  const handleNextQuestion = async () => {
    
    
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex >= questions.length) {
      
      // Don't save state here, let finishQuiz handle the final save
      finishQuiz();
    } else {
      
      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestion(questions[nextIndex]);
      
      // Save current index to backend only if not the last question
      if (user?.uid) {
        try {
          apiService.saveQuizState(user.uid, questions, nextIndex, {
            correct: dailyData?.correct || 0,
            incorrect: dailyData?.incorrect || 0,
            skipped: dailyData?.skipped || 0
          });
          
        } catch (error) {
          // Error saving quiz state
        }
      }
      
      // Start the next question
      startQuestion();
    }
  };

  const finishQuiz = async () => {
    
    
    // Calculate final stats from the questions array
    const correct = questions.filter(q => q.status === 'correct').length;
    const incorrect = questions.filter(q => q.status === 'incorrect').length;
    const skipped = questions.filter(q => q.status === 'skipped').length;
    
    
    
    // Update daily data with final stats
    const updatedDailyData = {
      ...dailyData!,
      questionsAnswered: questions.length,
      correct: correct,
      incorrect: incorrect,
      skipped: skipped,
    };
    
    setDailyData(updatedDailyData);

    // Save final daily stats to backend
    if (user?.uid) {
      try {
        await apiService.saveQuizState(user.uid, questions, currentQuestionIndex, {
          correct: correct,
          incorrect: incorrect,
          skipped: skipped
        });
        
      } catch (error) {
        // Error saving final daily stats
      }
    }

    // Clear saved quiz state from backend
    if (user?.uid) {
      try {
        await apiService.clearQuizState(user.uid);

      } catch (error) {
        // Error clearing quiz state
      }
    }

    // Update backend progress
    try {
      if (user?.uid) {
        await updateProgress({
          quizId: `quiz_${Date.now()}`,
          totalQuestions: questions.length,
          correct: correct,
          incorrect: incorrect,
          skipped: skipped,
          timeSpent: 0, // TODO: Calculate actual time spent
          quizCompleted: true
        });
      }
    } catch (error) {
      // Error updating progress
    }

    setScreen('results');
  };

  const renderStartScreen = () => {
    // Check if there's an active quiz in progress (questions answered but quiz not completed)
    const hasActiveQuiz = dailyData && dailyData.questionsAnswered > 0 && questions.length > 0 && currentQuestionIndex < questions.length;

    return (
      <div style={{ padding: 20, textAlign: 'center', width: '100%', maxWidth: '100%' }}>
        <h1 style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 16 }}>Music Memory Quiz</h1>
        <p style={{ fontSize: 18, color: '#666', marginBottom: 32 }}>
          Test your memory with popular music! Listen to song previews and identify the artist.
        </p>
        
        {dailyData && (
          <div style={{ background: '#EFF6FF', padding: 16, borderRadius: 8, marginBottom: 24 }}>
            <h3 style={{ marginBottom: 8 }}>Today's Progress</h3>
            <p>Questions Answered: {dailyData.questionsAnswered}</p>
            <p>Correct: {dailyData.correct}</p>
            <p>Incorrect: {dailyData.incorrect}</p>
            <p>Skipped: {dailyData.skipped}</p>
          </div>
        )}
        
        {hasActiveQuiz ? (
          <button
            onClick={async () => {
              // Resume the quiz by reloading the component
              await loadSavedQuizState();
            }}
            style={{
              padding: '16px 32px',
              fontSize: 18,
              fontWeight: 'bold',
              background: '#10B981',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              marginBottom: 12,
            }}
          >
            🔄 Continue Quiz (Question {dailyData?.questionsAnswered || 0} of {questions.length})
          </button>
        ) : (
          <button
            onClick={handleStartQuiz}
            style={{
              padding: '16px 32px',
              fontSize: 18,
              fontWeight: 'bold',
              background: '#2563EB',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginBottom: 12,
            }}
          >
            {loading ? 'Loading...' : 'Start Quiz'}
          </button>
        )}
        
        <button
          onClick={clearCache}
          style={{
            padding: '8px 16px',
            fontSize: 14,
            background: 'transparent',
            color: '#6B7280',
            border: '1px solid #D1D5DB',
            borderRadius: 6,
            cursor: 'pointer',
            marginTop: 8,
          }}
        >
          🔄 Refresh Tracks (Clear Cache)
        </button>
      </div>
    );
  };

  const renderQuizScreen = () => {
    if (!currentQuestion) {
      return (
        <div style={{ padding: 20, textAlign: 'center', width: '100%', maxWidth: '100%' }}>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>No Quiz Available</h2>
          <p style={{ color: '#666', marginBottom: 24 }}>Please click "Start Quiz" to begin.</p>
          <button
            onClick={() => setScreen('start')}
            style={{
              padding: '12px 24px',
              fontSize: 16,
              background: '#2563EB',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Back to Start
          </button>
        </div>
      );
    }
    
    return (
      <div style={{ padding: 20, width: '100%', maxWidth: '100%', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <button
              onClick={() => setScreen('start')}
              style={{
                padding: '8px 16px',
                fontSize: 14,
                background: '#6B7280',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              ← Back to Start
            </button>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
                Question {currentQuestionIndex + 1} of {questions.length}
              </h2>
              <p style={{ color: '#666' }}>Listen to the song and identify the artist</p>
            </div>
            <div style={{ width: 100 }}></div> {/* Spacer for centering */}
          </div>
        </div>
        
        <div style={{ background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <button
              onClick={handlePlayPause}
              style={{
                padding: '12px 24px',
                fontSize: 16,
                background: isPlaying ? '#DC2626' : '#10B981',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                marginRight: 8,
              }}
            >
              {isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
            <button
              onClick={handleRestart}
              style={{
                padding: '12px 24px',
                fontSize: 16,
                background: '#6B7280',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              ⏹️ Stop
            </button>
          </div>
          
          <div style={{ 
            marginBottom: 16, 
            padding: '16px', 
            backgroundColor: '#FFFFFF', 
            borderRadius: '12px', 
            border: '2px solid #2563EB',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: 18, fontWeight: 'bold', color: '#2563EB' }}>🔊 Volume Control</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: '8px' }}>
              <span style={{ fontSize: 16, color: '#333', minWidth: 70, fontWeight: '600' }}>Volume:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                style={{
                  width: '250px',
                  height: '12px',
                  borderRadius: '6px',
                  background: '#E0E0E0',
                  outline: 'none',
                  cursor: 'pointer',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                }}
              />
              <span style={{ fontSize: 16, color: '#2563EB', minWidth: 50, fontWeight: 'bold' }}>{Math.round(volume * 100)}%</span>
            </div>
            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <span style={{ fontSize: 14, color: '#666', fontStyle: 'italic' }}>Drag the slider to adjust volume</span>
            </div>
            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <button 
                onClick={() => console.log('Volume test button clicked, current volume:', volume)}
                style={{
                  padding: '8px 16px',
                  fontSize: 14,
                  background: '#2563EB',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Test Volume Slider
              </button>
            </div>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>What is the song title?</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  style={{
                    padding: '12px 16px',
                    fontSize: 16,
                    background: '#F3F4F6',
                    border: '1px solid #D1D5DB',
                    borderRadius: 8,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#E5E7EB';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#F3F4F6';
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={handleSkip}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              background: 'transparent',
              color: '#6B7280',
              border: '1px solid #D1D5DB',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Skip Question
          </button>
        </div>
        
        {feedback.show && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: feedback.type === 'correct' ? '#10B981' : feedback.type === 'incorrect' ? '#DC2626' : '#6B7280',
            color: '#fff',
            padding: '16px 24px',
            borderRadius: 8,
            fontSize: 18,
            fontWeight: 'bold',
            zIndex: 1000,
          }}>
            {feedback.message}
          </div>
        )}
      </div>
    );
  };

  const renderResultsScreen = () => {
    const correct = questions.filter(q => q.status === 'correct').length;
    const incorrect = questions.filter(q => q.status === 'incorrect').length;
    const skipped = questions.filter(q => q.status === 'skipped').length;
    const total = questions.length;
    const percentage = total > 0 ? (correct / total) * 100 : 0;
    
    return (
      <div style={{ padding: 20, textAlign: 'center', width: '100%', maxWidth: '100%' }}>
        <h1 style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 16 }}>Quiz Complete!</h1>
        
        <div style={{ background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Your Results</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#10B981' }}>{correct}</div>
              <div style={{ color: '#666' }}>Correct</div>
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#DC2626' }}>{incorrect}</div>
              <div style={{ color: '#666' }}>Incorrect</div>
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#6B7280' }}>{skipped}</div>
              <div style={{ color: '#666' }}>Skipped</div>
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: percentage >= 80 ? '#10B981' : percentage >= 60 ? '#F59E0B' : '#DC2626' }}>
            {percentage.toFixed(1)}% Accuracy
          </div>
        </div>
        
        <button
          onClick={() => setScreen('start')}
          style={{
            padding: '16px 32px',
            fontSize: 18,
            fontWeight: 'bold',
            background: '#2563EB',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            marginRight: 16,
          }}
        >
          Take Another Quiz
        </button>
        
        <Link
          to="/dashboard"
          style={{
            display: 'inline-block',
            padding: '16px 32px',
            fontSize: 18,
            fontWeight: 'bold',
            background: '#6B7280',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: 8,
          }}
        >
          View Dashboard
        </Link>
      </div>
    );
  };



  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#F8FAFC' }}>
      {screen === 'start' && renderStartScreen()}
      {screen === 'quiz' && renderQuizScreen()}
      {screen === 'results' && renderResultsScreen()}
    </div>
  );
};

export default ChecklistScreen; 