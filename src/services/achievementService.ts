import { Achievement, SessionRecord } from '../types';
import { ACHIEVEMENTS } from '../achievements';

export interface UserStats {
  xp: number;
  streak: number;
  sessionsCompleted: number;
  highestScore: number;
  unlockedAchievementIds: string[];
}

class AchievementService {
  private levelFactor = 100; // 100 XP per level

  /**
   * Calculates the current level of a user based on their total XP
   */
  public calculateLevel(xp: number): number {
    return Math.floor(xp / this.levelFactor) + 1;
  }

  /**
   * Calculates the XP required to reach the next level
   */
  public getXpRequiredForNextLevel(xp: number): number {
    const currentLevel = this.calculateLevel(xp);
    return currentLevel * this.levelFactor;
  }

  /**
   * Calculates the progress percentage (0 to 100) toward the next level
   */
  public getLevelProgressPercentage(xp: number): number {
    const currentLevel = this.calculateLevel(xp);
    const xpInCurrentLevel = xp % this.levelFactor;
    return (xpInCurrentLevel / this.levelFactor) * 100;
  }

  /**
   * Checks if any new achievements have been unlocked
   * Returns a list of newly unlocked achievements
   */
  public evaluateNewUnlocks(
    stats: UserStats,
    newSessionScore?: number
  ): { newlyUnlocked: Achievement[]; updatedUnlockedIds: string[] } {
    const newlyUnlocked: Achievement[] = [];
    const updatedUnlockedIds = [...stats.unlockedAchievementIds];

    for (const achievement of ACHIEVEMENTS) {
      if (updatedUnlockedIds.includes(achievement.id)) {
        continue; // Already unlocked
      }

      let isConditionMet = false;
      const req = achievement.requirement;

      switch (req.type) {
        case 'points':
          isConditionMet = stats.xp >= req.value;
          break;
        case 'streak':
          isConditionMet = stats.streak >= req.value;
          break;
        case 'sessions':
          isConditionMet = stats.sessionsCompleted >= req.value;
          break;
        case 'score':
          const currentMax = Math.max(stats.highestScore, newSessionScore ?? 0);
          isConditionMet = currentMax >= req.value;
          break;
      }

      if (isConditionMet) {
        newlyUnlocked.push(achievement);
        updatedUnlockedIds.push(achievement.id);
      }
    }

    return {
      newlyUnlocked,
      updatedUnlockedIds
    };
  }

  /**
   * Safe check for active streak updates based on last active timestamp
   */
  public calculateUpdatedStreak(lastActiveDateStr?: string, currentStreak = 0): { newStreak: number; streakUpdated: boolean } {
    if (!lastActiveDateStr) {
      return { newStreak: 1, streakUpdated: true };
    }

    const today = new Date().toISOString().split('T')[0];
    const lastActive = new Date(lastActiveDateStr).toISOString().split('T')[0];

    if (today === lastActive) {
      return { newStreak: currentStreak, streakUpdated: false };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastActive === yesterdayStr) {
      return { newStreak: currentStreak + 1, streakUpdated: true };
    }

    // Streak broken
    return { newStreak: 1, streakUpdated: true };
  }
}

export const achievementService = new AchievementService();
