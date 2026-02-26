import UserModel, { type OnboardingChecklist } from '../modules/users/user.model.ts';

type OnboardingStep = keyof OnboardingChecklist;

/**
 * Marks an onboarding step as complete for a user.
 * Fire-and-forget — never throws, logs nothing (non-critical).
 */
export function markOnboardingStep(userId: string, step: OnboardingStep): void {
  UserModel.updateOne(
    { _id: userId, [`onboarding.${step}`]: false },
    { $set: { [`onboarding.${step}`]: true } },
  ).catch(() => {});
}
