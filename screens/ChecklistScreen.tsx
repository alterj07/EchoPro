import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuizContext } from '../QuizContext';
import TrackPlayer, { usePlaybackState, State } from 'react-native-track-player';
import { setupPlayer, addTrack } from '../services/trackPlayerService';

interface ITunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100: string;
  previewUrl: string;
}

const ChecklistScreen = () => {
  const [screen, setScreen] = useState('start');
  const [tracks, setTracks] = useState<ITunesTrack[]>([]);
  const handleStartQuiz = async () => {
    setScreen('question');
  };
  useEffect(() => {
    const loadTracks = async () => {
      const topTracks = await getTop80sTracks();
      setTracks(topTracks);
    };
    loadTracks();
    console.log(tracks);
  }, []);
  const playPreview = async (track: ITunesTrack) => {
    await TrackPlayer.reset();
    await TrackPlayer.add({
      id: track.trackId.toString(),
      url: track.previewUrl,
      title: track.trackName,
      artist: track.artistName,
    });
    await TrackPlayer.play();
  };
  const getTop80sTracks = async (): Promise<ITunesTrack[]> => {
    const response = await fetch(`https://itunes.apple.com/search?term=1980s&entity=song&limit=50`);
    const data = await response.json();
    return data.results;
  };
  const renderStartScreen = () => (
    <View style={styles.container}>
      <Text style={styles.title}>Music Quiz</Text>
      <TouchableOpacity style={styles.button} onPress={() => playPreview(tracks[0])}>
        <Text style={styles.buttonText}>Start Quiz</Text>
      </TouchableOpacity>
    </View>
  );

  const renderQuestionScreen = () => {
    return (
      <View style={styles.container}>
        <Text style={styles.questionText}>Question placeholder</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {screen === 'start' && renderStartScreen()}
      {screen === 'question' && renderQuestionScreen()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  questionText: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default ChecklistScreen; 