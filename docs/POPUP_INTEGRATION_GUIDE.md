/**
 * COMPLETE INTEGRATION GUIDE - Challenge Popups
 *
 * ⚠️ STALE (2026-08-28): written before this session's dead-route cleanup and
 * popup retokenize. `app/challenge/active-all.tsx` referenced below was
 * deleted — completion now fires from `app/(tabs)/challenges.tsx`. The
 * popup itself no longer uses `Card variant="basicGlass"` or bordered
 * `outline` buttons (solid `neutral`/`danger`/`primary` only now) — see
 * havit-design-system-SKILL.md's Components section for the current,
 * accurate integration points instead of this file. Kept for its still-valid
 * usage-pattern examples (the hook API itself didn't change), not as a
 * source of truth for current wiring.
 *
 * This guide shows where the popups have been integrated and how to add
 * additional instances (e.g., leave button, additional detail screens).
 */

// ============================================================================
// INTEGRATED LOCATIONS (Already Added)
// ============================================================================

/*
1. Challenge Detail Screen: app/challenge/[id]/index.tsx
   - ✅ Join confirmation popup integrated
   - Shows popup when "Join Challenge" button pressed
   - Handles API call on confirm

2. My Challenges Screen: app/challenge/active-all.tsx
   - ✅ Challenge completion notification integrated
   - Automatically shows popup when challenge completes
   - Refreshes data after user dismisses notification
*/

// ============================================================================
// HOW TO ADD: Leave Challenge to Detail Screen
// ============================================================================

import { useConfirmationPopup, useChallengeCompletion } from '../hooks/useConfirmationPopup';

/**
 * Example: Add leave confirmation to challenge detail screen
 * 
 * Step 1: Import the hook at the top of your screen component
 * Step 2: Create the leave popup instance
 * Step 3: Add a leave button
 * Step 4: Render the component
 */

// In app/challenge/[id]/index.tsx or similar detail screen:

export function ChallengeDetailWithLeaveExample() {
  const [challenge, setChallenge] = useState(null);

  // Step 2: Create leave popup
  const leavePopup = useConfirmationPopup({
    type: 'leave',
    challengeName: challenge?.name ?? 'Challenge',
    onConfirm: async () => {
      try {
        // Call your leave API
        await leaveChallengeAPI(challengeId);
        // Show success message
        Alert.alert('Left Challenge', 'You have left this challenge.');
        // Navigate back
        router.back();
      } catch (error) {
        Alert.alert('Error', 'Could not leave challenge.');
      }
    },
  });

  return (
    <View>
      {/* Step 3: Add leave button in a menu or actions bar */}
      <Button onPress={leavePopup.show}>Leave Challenge</Button>

      {/* Step 4: Render the popup component */}
      <leavePopup.Component />
    </View>
  );
}

// ============================================================================
// HOW TO ADD: Multiple Popups to Same Screen
// ============================================================================

/**
 * Example: Challenge detail with both join and leave options
 * (e.g., show join if not enrolled, leave if enrolled)
 */

export function ChallengeDetailWithBothActionsExample() {
  const [challenge, setChallenge] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const joinPopup = useConfirmationPopup({
    type: 'join',
    challengeName: challenge?.name ?? 'Challenge',
    onConfirm: async () => {
      await joinChallengeAPI(challengeId);
      setIsEnrolled(true);
      Alert.alert('Joined!', 'You are now part of this challenge.');
    },
  });

  const leavePopup = useConfirmationPopup({
    type: 'leave',
    challengeName: challenge?.name ?? 'Challenge',
    onConfirm: async () => {
      await leaveChallengeAPI(challengeId);
      setIsEnrolled(false);
      Alert.alert('Left Challenge', 'You have left this challenge.');
    },
  });

  return (
    <View>
      {/* Render both popups */}
      <joinPopup.Component />
      <leavePopup.Component />

      {/* Show appropriate button based on enrollment status */}
      {isEnrolled ? (
        <Button 
          variant="danger"
          onPress={leavePopup.show}
        >
          Leave Challenge
        </Button>
      ) : (
        <Button 
          variant="primary"
          onPress={joinPopup.show}
        >
          Join Challenge
        </Button>
      )}
    </View>
  );
}

// ============================================================================
// HOW TO ADD: Completion Popup to Any Screen
// ============================================================================

/**
 * Example: Show completion notification on home screen
 * when a challenge automatically completes
 */

export function HomeScreenWithCompletionExample() {
  const completion = useChallengeCompletion({
    onDismiss: (data) => {
      console.log(`Challenge ${data.challengeName} completed!`);
      // Refresh home screen data
      refreshHomeData();
    },
  });

  const [activeChallenges, setActiveChallenges] = useState([]);

  useEffect(() => {
    // Check if any challenge has completed when home screen loads
    activeChallenges.forEach((challenge) => {
      if (challenge.status === 'completed' && !challenge.hasShownCompletion) {
        completion.show({
          challengeId: challenge.id,
          challengeName: challenge.name,
          duration: '30 days',
        });
      }
    });
  }, [activeChallenges, completion]);

  return (
    <View>
      <completion.Component />
      {/* Your home screen content */}
    </View>
  );
}

// ============================================================================
// QUICK COPY-PASTE: Add Leave Button
// ============================================================================

/**
 * Use this template to quickly add a leave button to any challenge detail screen
 */

// Add to your imports:
// import { useConfirmationPopup } from '../hooks/useConfirmationPopup';

// Add in your component:
const leavePopup = useConfirmationPopup({
  type: 'leave',
  challengeName: challenge?.name ?? 'Challenge',
  onConfirm: async () => {
    try {
      await leaveChallenge(challengeId);
      // Success actions
      router.back();
    } catch {
      Alert.alert('Error', 'Could not leave challenge');
    }
  },
});

// Add button to your UI:
{/* <Button onPress={leavePopup.show} variant="danger">Leave</Button> */}

// Add component to JSX:
{/* <leavePopup.Component /> */}

// ============================================================================
// API Examples
// ============================================================================

/**
 * Add these endpoints to your challenge service:
 */

// In services/challenge/challenge.service.ts:

export async function leaveChallenge(id: string) {
  const response = await api.post(`/challenges/${id}/leave`);
  return response.data;
}

export async function completeChallenge(id: string) {
  const response = await api.post(`/challenges/${id}/complete`);
  return response.data;
}

// ============================================================================
// File Structure Reference
// ============================================================================

/*
✅ Files Already Created:
  - components/ui/confirmationPopup.tsx
    └─ Main popup component with join/leave/complete support

  - hooks/useConfirmationPopup.ts
    └─ useConfirmationPopup hook (join/leave confirmations)
    └─ useChallengeCompletion hook (completion notifications)

  - services/challenge/completion.service.ts
    └─ checkChallengeCompletion()
    └─ calculateDuration()
    └─ getTimeUntilCompletion()

  - components/ui/confirmationPopup.usage.tsx
    └─ Usage examples (reference only)

  - components/ui/challengeCompletion.integration.tsx
    └─ Integration examples (reference only)

✅ Screens with Integration:
  - app/challenge/[id]/index.tsx (Join)
  - app/challenge/active-all.tsx (Completion notification)
*/
