// Web version of music service

export interface ITunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100: string;
  previewUrl: string;
  releaseDate?: string;
}

export interface UserMusicPreferences {
  birthday: string;
  ageRange: {
    startYear: number;
    endYear: number;
  };
  targetYears: number[];
}

class MusicService {
  // Web version - simplified for demo

  // Calculate the years when user was 15-40 years old
  calculateAgeRange(birthday: string): { startYear: number; endYear: number; targetYears: number[] } {
    const birthDate = new Date(birthday);
    const currentYear = new Date().getFullYear();
    
    // Calculate when user was 15 and 40
    const age15Year = birthDate.getFullYear() + 15;
    const age40Year = birthDate.getFullYear() + 40;
    
    // Ensure we don't go beyond current year
    const endYear = Math.min(age40Year, currentYear);
    const startYear = Math.min(age15Year, endYear);
    
    // Generate array of years from start to end
    const targetYears: number[] = [];
    for (let year = startYear; year <= endYear; year++) {
      targetYears.push(year);
    }
    
    return { startYear, endYear, targetYears };
  }

  // Get personalized tracks based on user's age range
  async getPersonalizedTracks(birthday: string): Promise<ITunesTrack[]> {
    const { targetYears } = this.calculateAgeRange(birthday);
    
    if (targetYears.length === 0) {
      // Fallback to 80s if no valid years
      return this.getFallbackTracks();
    }

    const allTracks: ITunesTrack[] = [];
    
    // Fetch tracks for each year in the user's age range
    for (const year of targetYears) {
      try {
        const yearTracks = await this.getTracksForYear(year);
        allTracks.push(...yearTracks);
      } catch (error) {
        console.error(`Error fetching tracks for year ${year}:`, error);
        // Continue with other years
      }
    }

    // If we don't have enough tracks, add some fallback tracks
    if (allTracks.length < 50) {
      const fallbackTracks = await this.getFallbackTracks();
      allTracks.push(...fallbackTracks);
    }

    // Remove duplicates and filter tracks with preview URLs
    const uniqueTracks = this.removeDuplicateTracks(allTracks);
    const tracksWithPreview = uniqueTracks.filter(track => track.previewUrl);

    return tracksWithPreview;
  }

  // Get tracks for a specific year
  private async getTracksForYear(year: number): Promise<ITunesTrack[]> {
    try {
      // Search for popular songs from that year
      const response = await fetch(
        `https://itunes.apple.com/search?term=${year}&entity=song&limit=50&sort=popularity`
      );
      const data = await response.json();
      if (!data.results) return [];
      return data.results.map((track: any) => ({
        trackId: track.trackId,
        trackName: track.trackName,
        artistName: track.artistName,
        artworkUrl100: track.artworkUrl100,
        previewUrl: track.previewUrl,
        releaseDate: track.releaseDate,
      }));
    } catch (error) {
      console.error('Error fetching tracks from iTunes:', error);
      return [];
    }
  }

  // Fallback tracks (e.g., 80s hits)
  private async getFallbackTracks(): Promise<ITunesTrack[]> {
    try {
      const response = await fetch(
        `https://itunes.apple.com/search?term=1980s&entity=song&limit=50&sort=popularity`
      );
      const data = await response.json();
      if (!data.results) return [];
      return data.results.map((track: any) => ({
        trackId: track.trackId,
        trackName: track.trackName,
        artistName: track.artistName,
        artworkUrl100: track.artworkUrl100,
        previewUrl: track.previewUrl,
        releaseDate: track.releaseDate,
      }));
    } catch (error) {
      console.error('Error fetching fallback tracks:', error);
      return [];
    }
  }

  // Remove duplicate tracks by trackId
  private removeDuplicateTracks(tracks: ITunesTrack[]): ITunesTrack[] {
    const seen = new Set();
    return tracks.filter(track => {
      if (seen.has(track.trackId)) return false;
      seen.add(track.trackId);
      return true;
    });
  }

  // Get user music preferences (stub for web)
  async getUserMusicPreferences(): Promise<UserMusicPreferences | null> {
    // Implement as needed for web
    return null;
  }

  // Get a mix of tracks from different decades
  async getDecadeMixTracks(): Promise<ITunesTrack[]> {
    const decades = ['1980s', '1990s', '2000s', '2010s', '2020s'];
    const allTracks: ITunesTrack[] = [];
    for (const decade of decades) {
      try {
        const response = await fetch(
          `https://itunes.apple.com/search?term=${decade}&entity=song&limit=10&sort=popularity`
        );
        const data = await response.json();
        if (data.results) {
          allTracks.push(...data.results.map((track: any) => ({
            trackId: track.trackId,
            trackName: track.trackName,
            artistName: track.artistName,
            artworkUrl100: track.artworkUrl100,
            previewUrl: track.previewUrl,
            releaseDate: track.releaseDate,
          })));
        }
      } catch (error) {
        console.error(`Error fetching tracks for decade ${decade}:`, error);
      }
    }
    return this.removeDuplicateTracks(allTracks);
  }

  // Quiz title based on birthday
  getQuizTitle(birthday: string | null): string {
    if (!birthday) return 'Music Memory Quiz';
    const birthYear = new Date(birthday).getFullYear();
    if (birthYear >= 1980 && birthYear <= 2005) {
      return 'Modern Music Memory Quiz';
    } else if (birthYear < 1980) {
      return '80s & 90s Music Memory Quiz';
    }
    return 'Music Memory Quiz';
  }

  // Quiz description based on birthday
  getQuizDescription(birthday: string | null): string {
    if (!birthday) return 'Test your memory with popular music across different decades!';
    const birthYear = new Date(birthday).getFullYear();
    if (birthYear >= 1980 && birthYear <= 2005) {
      return 'Test your memory with modern hits from the 2000s and 2010s!';
    } else if (birthYear < 1980) {
      return 'Test your memory with classic hits from the 80s and 90s!';
    }
    return 'Test your memory with popular music across different decades!';
  }
}

export default new MusicService(); 