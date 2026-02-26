import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { useSubscriptionSettings } from './useSubscriptionSettings';
import { useLifetimeFreeEmails } from './useLifetimeFreeEmails';
import { useUserPaymentRequests } from './usePaymentRequests';

export type AccessResult =
  | 'loading'
  | 'allowed'
  | 'suspended'        // login_access OFF
  | 'feature_blocked'  // feature_access OFF
  | 'payment_required'; // subscription mode ON and not paid/trial

export function useSubscriptionAccess() {
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { settings, isLoading: settingsLoading } = useSubscriptionSettings();
  const { emails, isLoading: emailsLoading } = useLifetimeFreeEmails();
  const { hasActiveSubscription, pendingRequest, isLoading: paymentsLoading } = useUserPaymentRequests();

  const isLoading = authLoading || profileLoading || settingsLoading || emailsLoading || paymentsLoading;

  if (isLoading || !user || !profile) {
    return { access: 'loading' as AccessResult, isLoading: true, pendingRequest };
  }

  // Cast to access the new columns
  const profileData = profile as typeof profile & { login_access?: boolean; feature_access?: boolean };

  // 1. Login access OFF → suspended
  if (profileData.login_access === false) {
    return { access: 'suspended' as AccessResult, isLoading: false, pendingRequest };
  }

  // 2. Subscription mode OFF → allow (unless feature_access OFF)
  if (!settings?.subscription_mode_enabled) {
    if (profileData.feature_access === false) {
      return { access: 'feature_blocked' as AccessResult, isLoading: false, pendingRequest };
    }
    return { access: 'allowed' as AccessResult, isLoading: false, pendingRequest };
  }

  // 3. Feature access OFF → blocked
  if (profileData.feature_access === false) {
    return { access: 'feature_blocked' as AccessResult, isLoading: false, pendingRequest };
  }

  // 4. Lifetime free email → allow
  const isLifetimeFree = emails.some(
    e => e.email.toLowerCase() === (user.email ?? '').toLowerCase()
  );
  if (isLifetimeFree) {
    return { access: 'allowed' as AccessResult, isLoading: false, pendingRequest };
  }

  // 5. Active subscription → allow
  if (hasActiveSubscription) {
    return { access: 'allowed' as AccessResult, isLoading: false, pendingRequest };
  }

  // 6. Active trial → allow
  if (settings && profile) {
    const signupDate = new Date(profile.created_at);
    const trialEnd = new Date(signupDate);
    trialEnd.setDate(trialEnd.getDate() + settings.trial_days);
    if (new Date() < trialEnd) {
      return { access: 'allowed' as AccessResult, isLoading: false, pendingRequest };
    }
  }

  // 7. None of the above → payment required
  return { access: 'payment_required' as AccessResult, isLoading: false, pendingRequest };
}
