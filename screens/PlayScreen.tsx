import React, { useEffect, useState } from 'react';
import { View, Text, StatusBar, ScrollView, TouchableOpacity, Dimensions, Alert, Platform, Modal, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import Video from 'react-native-video';

const UPLOADED_VIDEOS_KEY = 'uploadedVideos';

function PlayScreen() {
  const [uploadedVideos, setUploadedVideos] = useState<{ uri: string; name: string }[]>([]);
  const [playingUri, setPlayingUri] = useState<string | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Asset | null>(null);
  const [videoName, setVideoName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<{ uri: string; name: string } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    loadUploadedVideos();
  }, []);

  const loadUploadedVideos = async () => {
    try {
      const data = await AsyncStorage.getItem(UPLOADED_VIDEOS_KEY);
      if (data) {
        setUploadedVideos(JSON.parse(data));
      }
    } catch (e) {
      console.error('Failed to load uploaded videos', e);
    }
  };

  const handleUpload = async () => {
    console.log('Upload button pressed');
    try {
      const result = await launchImageLibrary({
        mediaType: 'video',
        selectionLimit: 1,
        includeBase64: false,
        maxHeight: 0,
        maxWidth: 0,
        quality: 1,
      });
      
      console.log('Image picker result:', result);
      
      if (result.didCancel) {
        console.log('User cancelled video selection');
        return;
      }
      
      if (result.errorCode) {
        console.error('Image picker error:', result.errorCode, result.errorMessage);
        Alert.alert('Error', result.errorMessage || 'Failed to pick video');
        return;
      }
      
      const asset: Asset | undefined = result.assets?.[0];
      if (asset && asset.uri) {
        console.log('Selected video:', asset);
        setSelectedVideo(asset);
        // Set default name from file name
        const defaultName = asset.fileName || asset.uri.split('/').pop() || 'My Video';
        setVideoName(defaultName.replace(/\.[^/.]+$/, '')); // Remove file extension
        setShowNameModal(true);
      } else {
        console.log('No video selected or no URI available');
      }
    } catch (error) {
      console.error('Error in handleUpload:', error);
      Alert.alert('Error', 'Failed to upload video. Please try again.');
    }
  };

  const handleSaveVideo = async () => {
    if (!selectedVideo || !videoName.trim()) {
      Alert.alert('Error', 'Please enter a name for your video.');
      return;
    }

    try {
      const newVideo = { uri: selectedVideo.uri!, name: videoName.trim() };
      const newVideos = [newVideo, ...uploadedVideos];
      setUploadedVideos(newVideos);
      await AsyncStorage.setItem(UPLOADED_VIDEOS_KEY, JSON.stringify(newVideos));
      console.log('Video saved successfully');
      
      // Reset modal state
      setShowNameModal(false);
      setSelectedVideo(null);
      setVideoName('');
    } catch (error) {
      console.error('Error saving video:', error);
      Alert.alert('Error', 'Failed to save video. Please try again.');
    }
  };

  const handleCancelSave = () => {
    setShowNameModal(false);
    setSelectedVideo(null);
    setVideoName('');
  };

  const handleDeleteVideo = (video: { uri: string; name: string }) => {
    setVideoToDelete(video);
    setShowDeleteModal(true);
  };

  const confirmDeleteVideo = async () => {
    if (!videoToDelete) return;

    try {
      const newVideos = uploadedVideos.filter(video => video.uri !== videoToDelete.uri);
      setUploadedVideos(newVideos);
      await AsyncStorage.setItem(UPLOADED_VIDEOS_KEY, JSON.stringify(newVideos));
      console.log('Video deleted successfully');
      
      // Reset modal state
      setShowDeleteModal(false);
      setVideoToDelete(null);
    } catch (error) {
      console.error('Error deleting video:', error);
      Alert.alert('Error', 'Failed to delete video. Please try again.');
    }
  };

  const cancelDeleteVideo = () => {
    setShowDeleteModal(false);
    setVideoToDelete(null);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const closeVideo = () => {
    setPlayingUri(null);
    setIsFullscreen(false);
  };

  const getVideoPlayerStyle = () => {
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    
    if (isFullscreen) {
      return {
        width: screenHeight + 200, // Use height as width for landscape, extend beyond edges
        height: screenWidth + 200, // Use width as height for landscape, extend beyond edges
        backgroundColor: '#000',
        borderRadius: 0, // No border radius in fullscreen
        overflow: 'hidden' as const,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
        transform: [{ rotate: '90deg' }], // Rotate only the video content
      };
    } else {
      return {
        width: screenWidth - 40,
        height: 300,
        backgroundColor: '#000',
        borderRadius: 16,
        overflow: 'hidden' as const,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
      };
    }
  };

  const getVideoModalStyle = () => {
    if (isFullscreen) {
      return {
        position: 'absolute' as const,
        top: -100, // Extend beyond safe area to cover status bar
        left: -100, // Extend beyond safe area to cover any side elements
        right: -100,
        bottom: -100,
        backgroundColor: '#000',
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        zIndex: 99999, // Extremely high z-index to cover everything
        elevation: 99999, // For Android
      };
    } else {
      return {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        zIndex: 100,
      };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>My Music Videos</Text>
        <Text style={styles.subtitle}>Record and watch your performances</Text>
        
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleUpload}
          activeOpacity={0.7}
        >
          <Text style={styles.uploadButtonText}>📹 Add New Video</Text>
        </TouchableOpacity>
        
        {uploadedVideos.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No videos yet</Text>
            <Text style={styles.emptyStateText}>
              Tap "Add New Video" to upload your first performance!
            </Text>
          </View>
        )}
        
        {uploadedVideos.map((video, idx) => {
          return (
            <View key={video.uri} style={styles.videoCard}>
              {/* Video thumbnail placeholder */}
              <View style={styles.videoThumbnail}>
                <Text style={styles.thumbnailIcon}>🎬</Text>
                <Text style={styles.thumbnailText}>Video Preview</Text>
              </View>
              
              {/* Video name */}
              <Text style={styles.videoName}>
                {video.name}
              </Text>
              
              {/* Button container */}
              <View style={styles.buttonContainer}>
                {/* Large play button */}
                <TouchableOpacity
                  style={styles.playButton}
                  activeOpacity={0.7}
                  onPress={() => setPlayingUri(video.uri)}
                >
                  <View style={styles.playButtonContent}>
                    <View style={styles.playTriangle} />
                    <Text style={styles.playButtonText}>
                      Play Video
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Delete button */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  activeOpacity={0.7}
                  onPress={() => handleDeleteVideo(video)}
                >
                  <Text style={styles.deleteButtonText}>
                    🗑️ Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        
        {/* Video name input modal */}
        <Modal
          visible={showNameModal}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Name Your Video
              </Text>
              <Text style={styles.modalSubtitle}>
                Give your video a memorable name
              </Text>
              
              <TextInput
                style={styles.nameInput}
                placeholder="Enter video name"
                placeholderTextColor="#888"
                value={videoName}
                onChangeText={setVideoName}
                autoFocus={true}
                maxLength={50}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelSave}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveVideo}
                  activeOpacity={0.7}
                >
                  <Text style={styles.saveButtonText}>Save Video</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete confirmation modal */}
        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Delete Video?
              </Text>
              <Text style={styles.modalSubtitle}>
                Are you sure you want to delete "{videoToDelete?.name}"? This cannot be undone.
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={cancelDeleteVideo}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Keep Video</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.deleteConfirmButton}
                  onPress={confirmDeleteVideo}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteConfirmButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Video player modal */}
        {playingUri && (
          <Modal
            visible={true}
            transparent={true}
            animationType="fade"
          >
            <View style={getVideoModalStyle()}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeVideo}
                activeOpacity={0.7}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              
              <Video
                source={{ uri: playingUri }}
                style={getVideoPlayerStyle()}
                resizeMode="contain"
                controls={true}
                onEnd={() => setPlayingUri(null)}
              />
              
              <TouchableOpacity
                style={styles.fullscreenButton}
                onPress={toggleFullscreen}
                activeOpacity={0.7}
              >
                <Text style={styles.fullscreenButtonText}>
                  {isFullscreen ? '📱' : '🖥️'}
                </Text>
              </TouchableOpacity>
            </View>
          </Modal>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 36,
    color: '#1A1A1A',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 32,
    textAlign: 'center',
    fontWeight: '500',
  },
  uploadButton: {
    backgroundColor: '#2563EB',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 22,
    letterSpacing: 0.5,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    padding: 48,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyStateTitle: {
    color: '#666666',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  emptyStateText: {
    color: '#888888',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 24,
  },
  videoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  videoThumbnail: {
    width: '100%',
    height: 140,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#E0E0E0',
  },
  thumbnailIcon: {
    color: '#1A1A1A',
    fontWeight: 'bold',
    fontSize: 32,
  },
  thumbnailText: {
    color: '#666666',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  videoName: {
    fontSize: 26,
    color: '#1A1A1A',
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  playButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  playButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 20,
    borderBottomWidth: 20,
    borderLeftWidth: 28,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#FFFFFF',
    marginRight: 16,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 20,
    letterSpacing: 0.5,
  },
  deleteButton: {
    backgroundColor: '#6B7280',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6B7280',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 100,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  modalSubtitle: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
  },
  nameInput: {
    borderWidth: 3,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    padding: 20,
    fontSize: 18,
    marginBottom: 28,
    backgroundColor: '#FAFAFA',
    color: '#1A1A1A',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6B7280',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#059669',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteConfirmButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 30,
    zIndex: 101,
    backgroundColor: '#DC2626',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  fullscreenButton: {
    position: 'absolute',
    top: 60,
    right: 110,
    zIndex: 101,
    backgroundColor: '#2563EB',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fullscreenButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default PlayScreen; 