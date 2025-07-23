import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

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
  private userId: string | null = null;

  setUserId(userId: string) {
    this.userId = userId;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
    };
  }

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
      
      if (data.results && Array.isArray(data.results)) {
        return data.results.filter((track: ITunesTrack) => track.previewUrl);
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching tracks for year ${year}:`, error);
      return [];
    }
  }

  // Get fallback tracks (80s music) if personalized tracks fail
  private async getFallbackTracks(): Promise<ITunesTrack[]> {
    try {
      const response = await fetch(
        `https://itunes.apple.com/search?term=1980s&entity=song&limit=100`
      );
      const data = await response.json();
      
      if (data.results && Array.isArray(data.results)) {
        return data.results.filter((track: ITunesTrack) => track.previewUrl);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching fallback tracks:', error);
      return [];
    }
  }

  // Remove duplicate tracks based on track name and artist
  private removeDuplicateTracks(tracks: ITunesTrack[]): ITunesTrack[] {
    const seen = new Set<string>();
    return tracks.filter(track => {
      const key = `${track.trackName.toLowerCase()}-${track.artistName.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Get user's music preferences from backend
  async getUserMusicPreferences(): Promise<UserMusicPreferences | null> {
    if (!this.userId) {
      throw new Error('User ID not set');
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/users/${this.userId}/profile`,
        { headers: this.getHeaders() }
      );

      const profile = response.data.profile;
      if (profile && profile.birthday) {
        const { startYear, endYear, targetYears } = this.calculateAgeRange(profile.birthday);
        return {
          birthday: profile.birthday,
          ageRange: { startYear, endYear },
          targetYears
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting user music preferences:', error);
      return null;
    }
  }

  // Get a mix of decades for users who don't have birthday set
  async getDecadeMixTracks(): Promise<ITunesTrack[]> {
    const decades = ['1970s', '1980s', '1990s', '2000s', '2010s'];
    const allTracks: ITunesTrack[] = [];

    for (const decade of decades) {
      try {
        const response = await fetch(
          `https://itunes.apple.com/search?term=${decade}&entity=song&limit=20`
        );
        const data = await response.json();
        
        if (data.results && Array.isArray(data.results)) {
          allTracks.push(...data.results.filter((track: ITunesTrack) => track.previewUrl));
        }
      } catch (error) {
        console.error(`Error fetching ${decade} tracks:`, error);
      }
    }

    return this.removeDuplicateTracks(allTracks);
  }

  // Get quiz title based on user's age range
  getQuizTitle(birthday: string | null): string {
    if (!birthday) {
      return 'Music Memory Quiz';
    }

    const { startYear, endYear } = this.calculateAgeRange(birthday);
    const currentYear = new Date().getFullYear();
    
    if (endYear >= currentYear - 5) {
      return 'Modern Music Memory Quiz';
    } else if (startYear >= 1990) {
      return '90s & 2000s Music Memory Quiz';
    } else if (startYear >= 1980) {
      return '80s & 90s Music Memory Quiz';
    } else if (startYear >= 1970) {
      return '70s & 80s Music Memory Quiz';
    } else {
      return 'Classic Music Memory Quiz';
    }
  }

  // Get quiz description based on user's age range
  getQuizDescription(birthday: string | null): string {
    if (!birthday) {
      return 'Test your knowledge of popular music across different decades!';
    }

    const { startYear, endYear } = this.calculateAgeRange(birthday);
    const currentYear = new Date().getFullYear();
    
    if (endYear >= currentYear - 5) {
      return 'Test your knowledge of modern hits and recent chart-toppers!';
    } else if (startYear >= 1990) {
      return 'Test your knowledge of 90s and 2000s music hits!';
    } else if (startYear >= 1980) {
      return 'Test your knowledge of 80s and 90s classic hits!';
    } else if (startYear >= 1970) {
      return 'Test your knowledge of 70s and 80s classic hits!';
    } else {
      return 'Test your knowledge of classic music hits!';
    }
  }
}

export const musicService = new MusicService();
export default musicService; 