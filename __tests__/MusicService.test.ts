import musicService from '../services/musicService';

describe('MusicService', () => {
  describe('calculateAgeRange', () => {
    it('should calculate correct age range for a 30-year-old user', () => {
      const currentYear = new Date().getFullYear();
      const birthday = `${currentYear - 30}-05-15`;
      
      const result = musicService.calculateAgeRange(birthday);
      
      // User is 30, so they were 15 in (currentYear - 15) and will be 40 in (currentYear + 10)
      // But since we can't go beyond current year, endYear will be currentYear
      expect(result.startYear).toBe(currentYear - 15); // When they were 15
      expect(result.endYear).toBe(currentYear); // Current year (can't go beyond)
      expect(result.targetYears).toContain(currentYear - 15);
      expect(result.targetYears.length).toBeGreaterThan(0);
    });

    it('should handle users older than 40', () => {
      const currentYear = new Date().getFullYear();
      const birthday = `${currentYear - 50}-01-01`;
      
      const result = musicService.calculateAgeRange(birthday);
      
      // User is 50, so they were 15 in (currentYear - 35) and 40 in (currentYear - 10)
      // But since we can't go beyond current year, endYear will be (currentYear - 10)
      expect(result.startYear).toBe(currentYear - 36); // When they were 15 (1974 + 15 = 1989, but limited by endYear)
      expect(result.endYear).toBe(currentYear - 11); // When they were 40 (1974 + 40 = 2014, but limited by currentYear)
      expect(result.targetYears.length).toBeGreaterThan(0);
    });

    it('should handle users younger than 15', () => {
      const currentYear = new Date().getFullYear();
      const birthday = `${currentYear - 10}-01-01`;
      
      const result = musicService.calculateAgeRange(birthday);
      
      // User is 10, so they will be 15 in (currentYear + 5) and 40 in (currentYear + 30)
      // But since we can't go beyond current year, both will be (currentYear + 5)
      expect(result.startYear).toBe(currentYear); // When they will be 15 (2014 + 15 = 2029, but limited by currentYear)
      expect(result.endYear).toBe(currentYear); // Same as start year (can't go beyond current year)
      expect(result.targetYears).toEqual([currentYear]);
    });
  });

  describe('getQuizTitle', () => {
    it('should return appropriate title for modern music', () => {
      const currentYear = new Date().getFullYear();
      const birthday = `${currentYear - 25}-01-01`;
      
      const title = musicService.getQuizTitle(birthday);
      
      expect(title).toBe('Modern Music Memory Quiz');
    });

    it('should return appropriate title for 80s/90s music', () => {
      const birthday = '1975-01-01';
      
      const title = musicService.getQuizTitle(birthday);
      
      expect(title).toBe('80s & 90s Music Memory Quiz');
    });

    it('should return generic title for null birthday', () => {
      const title = musicService.getQuizTitle(null);
      
      expect(title).toBe('Music Memory Quiz');
    });
  });

  describe('getQuizDescription', () => {
    it('should return appropriate description for modern music', () => {
      const currentYear = new Date().getFullYear();
      const birthday = `${currentYear - 25}-01-01`;
      
      const description = musicService.getQuizDescription(birthday);
      
      expect(description).toContain('modern hits');
    });

    it('should return appropriate description for 80s/90s music', () => {
      const birthday = '1975-01-01';
      
      const description = musicService.getQuizDescription(birthday);
      
      expect(description).toContain('80s and 90s');
    });

    it('should return generic description for null birthday', () => {
      const description = musicService.getQuizDescription(null);
      
      expect(description).toContain('popular music across different decades');
    });
  });
}); 