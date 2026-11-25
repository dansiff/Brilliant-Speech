import { toast } from 'sonner';

export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';

  private constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported in this browser');
      return false;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  public hasPermission(): boolean {
    return this.permission === 'granted';
  }

  public sendNotification(title: string, options?: NotificationOptions) {
    if (this.permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        ...options
      });
    }
  }

  /**
   * Schedules a reminder for practice.
   * Note: Pure browser scheduling is limited by tab lifecycle. 
   * For true background reminders, Push API would be needed.
   * This is a "Best Effort" local reminder.
   */
  public schedulePracticeReminder(timeStr: string) {
    // Basic logic: check every minute if it's currently the reminder time
    // In a real PWA this would be better handled via sync or push
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // We set a recurring check
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === hours && now.getMinutes() === minutes && now.getSeconds() === 0) {
        this.sendNotification('Time for Practice!', {
          body: 'Your scheduled speech practice session is ready. Let\'s make some progress!',
          tag: 'practice-reminder'
        });
      }
    }, 1000); // Check every second for precision on the exact minute
  }
}

export const notificationService = NotificationService.getInstance();
