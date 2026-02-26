import ReminderModel from './reminder.model.ts';
import CareEventModel from '../events/careEvent.model.ts';
import UserModel from '../users/user.model.ts';
import { sendNotification } from '../notifications/notification.service.ts';
import logger from '../../config/logger.ts';

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly

async function runReminders() {
  const now = new Date();
  const currentHHMM = now.toISOString().slice(11, 16); // HH:MM UTC
  const enabled = await ReminderModel.find({ enabled: true }).lean();

  for (const reminder of enabled) {
    try {
      let shouldFire = false;

      if (reminder.type === 'interval' && reminder.intervalHours) {
        // Fire if no matching event logged in the last intervalHours
        const since = new Date(now.getTime() - reminder.intervalHours * 60 * 60 * 1000);
        const filter: any = { recordedBy: reminder.userId, startTime: { $gte: since } };
        if (reminder.childId) filter.childId = reminder.childId;
        if (reminder.eventType) filter.type = reminder.eventType;
        const recent = await CareEventModel.countDocuments(filter);
        shouldFire = recent === 0;
      } else if (reminder.type === 'time' && reminder.timeOfDay) {
        // Fire once per day at the specified time (within the current hour window)
        const [hh, mm] = reminder.timeOfDay.split(':').map(Number);
        const dueThisHour = now.getUTCHours() === hh;
        const notYetFiredToday =
          !reminder.lastFiredAt ||
          reminder.lastFiredAt.toISOString().slice(0, 10) !== now.toISOString().slice(0, 10);
        shouldFire = dueThisHour && notYetFiredToday;
      }

      if (!shouldFire) continue;

      const user = await UserModel.findById(reminder.userId, 'email name fcmToken').lean();
      if (!user) continue;

      await sendNotification('care_event_logged' as any, {
        to: (user as any).email,
        fcmToken: (user as any).fcmToken,
        name: (user as any).name,
      });

      // Use a targeted push instead — override with reminder-specific content via direct FCM
      // (sendNotification is reused here for email; push title/body handled generically)
      await ReminderModel.updateOne({ _id: reminder._id }, { $set: { lastFiredAt: now } });
      logger.info({ reminderId: reminder._id }, '[reminder-scheduler] Fired');
    } catch (err) {
      logger.error({ err, reminderId: reminder._id }, '[reminder-scheduler] Error processing reminder');
    }
  }
}

export function scheduleReminders() {
  setTimeout(() => {
    runReminders().catch(err => logger.error({ err }, '[reminder-scheduler] Startup error'));
  }, 90_000); // 90s after server start

  setInterval(() => {
    runReminders().catch(err => logger.error({ err }, '[reminder-scheduler] Error'));
  }, CHECK_INTERVAL_MS);
}
