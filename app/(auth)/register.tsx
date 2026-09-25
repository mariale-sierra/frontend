import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { Icon } from '../../components/ui/icon';
import { Stack } from '../../components/layout/stack';
import { FloatingLabelInput } from '../../components/auth/FloatingLabelInput';
import { WelcomeGlowBackground } from '../../components/onboarding/WelcomeGlowBackground';
import { FloatingFriendAvatar } from '../../components/onboarding/FloatingFriendAvatar';
import { useAuth } from '../../hooks/useAuth';
import { useErrorNotificationStore } from '../../store/errorNotificationStore';
import { activityColors, colors, fillOpacity, radius, shadows, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { createRegisterSchema, type RegisterFormValues } from '../../validation/authSchemas';

const INTRO_COUNT = 3;
// Page 1 ("Real challenges, real routines") got a second photo, per explicit
// request — an overlapping "fanned card" pair instead of one image (see
// `fanWrap`/`fanImageLeft`/`fanImageRight`/`fanImageShadow` below). The
// other two pages still take a single image.
//
// All 4 files re-encoded 2026-09-25 — real bug, per explicit "screens
// shouldn't load until the images have loaded, show a spinner" report: the
// source photos were ~7MB/1920px-wide originals (one of them a PNG), never
// compressed, despite this project's own established precedent for exactly
// this situation (`login-register.jpg`, deliberately re-encoded to ~116KB —
// see AuthScreenBackground.tsx). Resized to 480px on the long edge (plenty
// for a 128px on-screen display size at 3x/retina) and re-saved as JPEG
// quality 82, ~45-56KB each now — the actual fix for the load delay; the
// loading gate below (`introImagesReady`) is the safety net on top of it.
const INTRO_IMAGES = [
  [
    // [0] renders LEFT + in FRONT (on top, with a shadow) — the original
    // photo this page already had, staying put where it always was. [1]
    // renders RIGHT + BEHIND — the newly-added second photo, per explicit
    // "keep the one that was on the left, on the left... the new one sits
    // behind the old one" correction.
    require('../../assets/images/real_challenges,real_routines.jpg'),
    require('../../assets/images/real_challenges,real_routines2.jpg'),
  ],
  require('../../assets/images/log_daily,build_a_streak.jpg'),
  require('../../assets/images/better_with_friends.jpg'),
];
// One increment per intro `<Image>` mounted below (2 fan images on page 0,
// 1 each on pages 1-2) — the loading gate waits for all 4.
const TOTAL_INTRO_IMAGES = 4;
// 84 -> 168 ("twice its size") -> 112 (trimmed back 1/3) -> 128 ("a tinsy
// bit bigger"), all per explicit follow-up requests.
const IMAGE_SIZE = 128;
// The fanned pair's own geometry — offset apart and tilted opposite ways,
// inner edges overlapping substantially, the first slightly left/behind,
// the second slightly right/in front (a shadow, and drawn second/on top).
// Offset widened 22 -> 40, per explicit "way too much overlap, the goal is
// for both images to be visible" — less of each photo now sits hidden
// behind the other.
const FAN_OFFSET = 40;
const FAN_ROTATION_DEG = 6;
// Widened alongside FAN_OFFSET so the container still has enough room for
// both images (plus their rotation overhang) without clipping either one.
const FAN_EXTRA_WIDTH = 100;
const FAN_EXTRA_HEIGHT = 44;
// The "Log daily, build a streak" page's own demo streak badge — counts up
// from 0 each time this page becomes current, illustrating the exact badge
// ProfileHeader.tsx overlaps on the avatar, per explicit request.
const STREAK_DEMO_PAGE = 1;
const STREAK_DEMO_TARGET = 7;
const STREAK_DEMO_TICK_MS = 110;
// The "Better with friends" page's own pair of floating placeholder
// avatars, per explicit request — plain first names, not real users; only
// hashed by `UserAvatar` to pick two different `activityColors` (see
// FloatingFriendAvatar.tsx), no other significance.
const FRIENDS_DEMO_PAGE = 2;
const FRIEND_AVATAR_NAMES: [string, string] = ['Maya', 'Jordan'];
// 36 -> 44, per explicit "make them bigger" follow-up.
const FRIEND_AVATAR_SIZE = 44;
const FIELD_COUNT = 3;
const TOTAL_STEPS = INTRO_COUNT + FIELD_COUNT;

// One color per step, a rainbow-ish progression across the whole journey —
// `flexibility` (blue) opens it, per explicit "more blue" request on the
// first intro page.
// [1] ("log daily, build a streak") and [3] ("what's your email") swapped
// per explicit request — cardioLow now opens the intro's streak page,
// cardioIntense now opens the email step.
const STEP_COLORS = [
  activityColors.flexibility,
  activityColors.cardioLow,
  activityColors.mindBody,
  activityColors.cardioIntense,
  activityColors.strength,
  activityColors.functional,
];

type FieldStepKey = 'email' | 'username' | 'password';

function fieldStepKeyFor(step: number): FieldStepKey {
  if (step === 3) return 'email';
  if (step === 4) return 'username';
  return 'password';
}

const FIELD_META: Record<
  FieldStepKey,
  {
    keyboardType: 'default' | 'email-address';
    secure: boolean;
    textContentType: 'emailAddress' | 'username' | 'newPassword';
  }
> = {
  email: { keyboardType: 'email-address', secure: false, textContentType: 'emailAddress' },
  username: { keyboardType: 'default', secure: false, textContentType: 'username' },
  password: { keyboardType: 'default', secure: true, textContentType: 'newPassword' },
};

/**
 * The full account-creation journey, reached only by tapping "Register" on
 * login — per explicit redesign request (2026-09-24): "the first thing the
 * user will see is the login screen; if they click register, they see the
 * stage 0 screens AND a new profile creation flow... they have to have the
 * same activity gradient flow, match the stage 0 ones." Six steps, one
 * shared dark-screen-plus-rising-glow background (`WelcomeGlowBackground`),
 * a different activity color per step:
 *
 * 0-2: the former `welcome.tsx` intro pages, unchanged content, still a real
 *      swipeable pager (`ScrollView pagingEnabled`) — Skip jumps straight to
 *      the email step (there's no separate "go to login" case any more,
 *      since reaching this screen at all already means the user chose to
 *      register). Own dot indicator at the bottom, unchanged from before. A
 *      "log in instead" text button (same style as Skip) sits top-left,
 *      distinct from Skip — that only skips the intro, this exits the whole
 *      flow. Each page also carries a small rounded/`surface`-outlined photo
 *      above its title (`assets/images/<page-name>.jpg`, per explicit
 *      request) — the "Log daily, build a streak" page's photo additionally
 *      overlaps the same streak badge `ProfileHeader.tsx` uses on the
 *      avatar, counting up from 0 to `STREAK_DEMO_TARGET` each time that
 *      page becomes current, as a small preview of the real feature.
 * 3-5: one field per screen (email, username, password) — Typeform-style,
 *      each gated behind its own validation (`trigger(fieldName)`) before
 *      Next advances; back is always free. Reworked a second time
 *      (2026-09-24) per an explicit Mobbin/Revolut-style reference: content
 *      top-left anchored instead of vertically centered (so the keyboard
 *      never covers it), a real context subtitle under the title, a single
 *      floating-label input (`FloatingLabelInput` — replaces an earlier
 *      "card wrapping an already-pill input" double-pill look), and a
 *      3-segment progress bar up top instead of the intro pages' dots.
 *
 * The account is actually created at the END of the password step (email +
 * username + password all in hand) — `register()` resolves, then this
 * navigates DIRECTLY to `/onboarding/practices` (badges), synchronously, no
 * `await` in between: see that navigation call's own comment, and
 * app/_layout.tsx's `RootNavigator`, for the exact class of race this
 * avoids.
 */
export default function Register() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { register } = useAuth();
  const { show } = useErrorNotificationStore();
  const scrollRef = useRef<ScrollView>(null);

  const [step, setStep] = useState(0);
  const [introPage, setIntroPage] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [streakDemoCount, setStreakDemoCount] = useState(0);
  // Gates the intro pager behind a spinner until every intro photo has
  // actually decoded — per explicit "the screens shouldn't load until the
  // images have loaded, until the user can see a spinner" report. The pager
  // (and its `<Image>`s) still mount underneath immediately, so loading
  // starts right away — only their VISIBILITY is held back; see
  // `styles.contentLoading` below.
  const [loadedImageCount, setLoadedImageCount] = useState(0);
  const introImagesReady = loadedImageCount >= TOTAL_INTRO_IMAGES;
  function handleIntroImageSettled() {
    // Counts errors too (not just successful loads) — a broken image must
    // never leave the spinner stuck forever.
    setLoadedImageCount((c) => c + 1);
  }

  const schema = useMemo(() => createRegisterSchema(t), [t]);
  const { control, trigger, getValues } = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', username: '', password: '' },
  });

  const introPages = [
    { title: t('welcome.page1.title'), description: t('welcome.page1.description'), image: INTRO_IMAGES[0] },
    { title: t('welcome.page2.title'), description: t('welcome.page2.description'), image: INTRO_IMAGES[1] },
    { title: t('welcome.page3.title'), description: t('welcome.page3.description'), image: INTRO_IMAGES[2] },
  ];

  // Counts up from 0 to STREAK_DEMO_TARGET every time the "Log daily, build
  // a streak" page becomes current — illustrating the same streak badge
  // ProfileHeader.tsx overlaps on the avatar, per explicit request.
  useEffect(() => {
    if (introPage !== STREAK_DEMO_PAGE) {
      setStreakDemoCount(0);
      return;
    }
    setStreakDemoCount(0);
    let current = 0;
    const id = setInterval(() => {
      current += 1;
      setStreakDemoCount(current);
      if (current >= STREAK_DEMO_TARGET) clearInterval(id);
    }, STREAK_DEMO_TICK_MS);
    return () => clearInterval(id);
  }, [introPage]);

  const isIntro = step < INTRO_COUNT;
  const color = STEP_COLORS[step];
  const fieldKey = !isIntro ? fieldStepKeyFor(step) : null;

  // Syncs a freshly (re)mounted intro ScrollView to `introPage` — needed
  // because it and `fieldContent` below are a ternary, so returning from a
  // field step to intro unmounts and remounts it, which would otherwise
  // reset to its native default offset (x=0, page 0) — see the ScrollView's
  // own history for the full story. Runs via `useEffect` (after the
  // ScrollView has actually mounted, so `scrollRef.current` is valid),
  // keyed ONLY on `isIntro` flipping true — not on `introPage` itself. Real
  // bug, fixed 2026-09-25, per explicit "the next button takes you from the
  // first screen to the third": an earlier attempt used the ScrollView's own
  // `contentOffset` prop instead, recomputed from `introPage` on every
  // render — `contentOffset` is NOT purely a one-time initial value in this
  // RN version, changing it on an already-mounted ScrollView can itself
  // trigger a real scroll. Since `introPage` also changes on every
  // button/swipe advance (which already does its own explicit
  // `scrollRef.current?.scrollTo(...)` — see `handleNext`), that stacked a
  // SECOND, redundant scroll on top of the first, compounding one page of
  // travel into two. Depending only on `isIntro` (which never changes while
  // paging through 0/1/2 — only when entering/leaving intro entirely) means
  // this now fires exactly once per real (re)mount, never during normal
  // page-to-page navigation.
  useEffect(() => {
    if (isIntro) {
      scrollRef.current?.scrollTo({ x: introPage * width, animated: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIntro]);

  function handleIntroScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextPage = Math.round(e.nativeEvent.contentOffset.x / width);
    if (nextPage !== introPage) {
      setIntroPage(nextPage);
      setStep(nextPage);
    }
  }

  function handleSkipIntro() {
    setStep(INTRO_COUNT);
  }

  function handleBack() {
    if (step === INTRO_COUNT) {
      // No `scrollRef.current?.scrollTo(...)` here — this fires while the
      // ScrollView is still unmounted (we're on a field step), so the ref
      // is always null at this point; it used to silently no-op. The
      // `useEffect` keyed on `isIntro` (above) is what actually puts it on
      // the right page once it remounts — see that effect's own comment.
      const lastIntroPage = INTRO_COUNT - 1;
      setStep(lastIntroPage);
      setIntroPage(lastIntroPage);
    } else if (step > INTRO_COUNT) {
      setStep(step - 1);
    }
  }

  async function handleNext() {
    if (isIntro) {
      if (introPage < INTRO_COUNT - 1) {
        const next = introPage + 1;
        setIntroPage(next);
        setStep(next);
        scrollRef.current?.scrollTo({ x: next * width, animated: true });
      } else {
        setStep(INTRO_COUNT);
      }
      return;
    }

    const currentFieldKey = fieldStepKeyFor(step);
    const valid = await trigger(currentFieldKey);
    if (!valid) return;

    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      return;
    }

    // Last step (password) just validated — create the account.
    setSubmitting(true);
    try {
      const { email, username, password } = getValues();
      await register(email, username, password);
      // Direct, synchronous call right after register() resolves — lands in
      // the same batch as the isAuthenticated flip it just caused, so
      // RootNavigator's own effect never gets a chance to send this
      // somewhere else first. See this file's own doc comment above.
      router.replace('/onboarding/practices');
    } catch (error: any) {
      // `Alert.alert` (used here at first, matching the old single-form
      // register screen) doesn't reliably render on every platform this app
      // ships to — real bug, likely cause of "the badges screen is still
      // missing": a rejected `register()` call (e.g. the backend's own
      // `ConflictException('Email already in use')` for a re-used test
      // email — very likely given how many times this flow has been
      // retested today) would fail SILENTLY from the user's point of view
      // instead of visibly explaining why nothing moved past the password
      // step. The app's own cross-platform error toast — already used one
      // screen later, by practices.tsx's own save-failure case — doesn't
      // have that gap.
      show({ message: error?.response?.data?.message || t('auth.register.createAccountFailed') });
    } finally {
      setSubmitting(false);
    }
  }

  const buttonLabel = isIntro
    ? t('welcome.next')
    : step === TOTAL_STEPS - 1
      ? t('auth.register.createAccountCta')
      : t('common.actions.continue');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <WelcomeGlowBackground color={color} fadeKey={step} />

      {/* Mounted underneath immediately (so its `<Image>`s start loading
          right away) but visually held back until every intro photo has
          settled — see `loadedImageCount`/`introImagesReady` above. Only
          applies on the intro pages: the field steps have no images to wait
          on, and by the time a user reaches them the intro photos are long
          since loaded. */}
      <View style={[styles.content, isIntro && !introImagesReady && styles.contentLoading]}>
      <View style={[styles.topRow, { paddingTop: insets.top + spacing.md }]}>
        {!isIntro ? (
          <Pressable onPress={handleBack} hitSlop={8} accessibilityRole="button">
            <Icon name="chevron-back-outline" size={24} color={colors.paper} />
          </Pressable>
        ) : (
          // Distinct from Skip (which only skips the intro pages, landing on
          // the email step) — this exits the whole register flow and
          // returns to login, per explicit request, same text-button style.
          <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button">
            <Text variant="label" weight="bold" tone="secondary">
              {t('auth.login.switchAction')}
            </Text>
          </Pressable>
        )}
        {isIntro && (
          <Pressable onPress={handleSkipIntro} hitSlop={8} accessibilityRole="button">
            <Text variant="label" weight="bold" tone="secondary">
              {t('welcome.skip')}
            </Text>
          </Pressable>
        )}
      </View>

      {!isIntro && (
        <View style={styles.progressTrack}>
          {Array.from({ length: FIELD_COUNT }, (_, i) => (
            <View
              key={i}
              style={[styles.progressSegment, i <= step - INTRO_COUNT && styles.progressSegmentActive]}
            />
          ))}
        </View>
      )}

      {isIntro ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleIntroScrollEnd}
          style={styles.pager}
          contentContainerStyle={styles.pagerContent}
        >
          {introPages.map((p, i) => (
            <View key={i} style={[styles.page, { width }]}>
              {/* Same fixed title/description anchor as the old welcome
                  carousel — see that history for why (varying description
                  length must never shift the title's position). The image
                  sits INSIDE this same bottom-anchored slot, directly above
                  the title, rather than as its own separate block above the
                  slot — since it's the same fixed size on every page, the
                  title's own position stays exactly as consistent as before,
                  just with the image now genuinely adjacent to it instead of
                  floating over empty space. */}
              <View style={styles.titleSlot}>
                {Array.isArray(p.image) ? (
                  // Fanned pair: [1] (the new photo) renders FIRST — right,
                  // tilted clockwise, no shadow, so it paints underneath —
                  // then [0] (the original photo) renders SECOND — left,
                  // tilted counterclockwise, with a shadow, on top. Position
                  // and z-order are independent (`fanImageLeft`/`Right` own
                  // the placement, `fanImageShadow` owns "is this the one in
                  // front" — see this component's own doc comment for why
                  // that split matters here).
                  <View style={styles.fanWrap}>
                    <Image
                      source={p.image[1]}
                      style={[styles.fanImageBase, styles.fanImageRight]}
                      onLoad={handleIntroImageSettled}
                      onError={handleIntroImageSettled}
                    />
                    <Image
                      source={p.image[0]}
                      style={[styles.fanImageBase, styles.fanImageLeft, styles.fanImageShadow]}
                      onLoad={handleIntroImageSettled}
                      onError={handleIntroImageSettled}
                    />
                  </View>
                ) : (
                  <View style={styles.imageWrap}>
                    <Image
                      source={p.image}
                      style={styles.image}
                      onLoad={handleIntroImageSettled}
                      onError={handleIntroImageSettled}
                    />
                    {i === STREAK_DEMO_PAGE && (
                      <View style={styles.streakBadge}>
                        <Icon name="flame-outline" size={12} color={colors.ink} />
                        <Text variant="caption" weight="bold" inverse>
                          {streakDemoCount}
                        </Text>
                      </View>
                    )}
                    {i === FRIENDS_DEMO_PAGE && (
                      <>
                        <FloatingFriendAvatar
                          username={FRIEND_AVATAR_NAMES[0]}
                          size={FRIEND_AVATAR_SIZE}
                          wiggleDirection={-1}
                          style={styles.friendAvatarLeft}
                        />
                        <FloatingFriendAvatar
                          username={FRIEND_AVATAR_NAMES[1]}
                          size={FRIEND_AVATAR_SIZE}
                          delayMs={220}
                          wiggleDirection={1}
                          style={styles.friendAvatarRight}
                        />
                      </>
                    )}
                  </View>
                )}
                <Text variant="title" align="center">
                  {p.title}
                </Text>
              </View>
              <View style={styles.descriptionSlot}>
                <Text variant="body" tone="secondary" align="center" style={styles.description}>
                  {p.description}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.fieldContent}>
          <Stack gap="xs" style={styles.fieldHeading}>
            <Text variant="title">{t(`auth.register.step.${fieldKey}Title`)}</Text>
            <Text variant="body" tone="secondary">
              {t(`auth.register.step.${fieldKey}Subtitle`)}
            </Text>
          </Stack>

          <Controller
            control={control}
            name={fieldKey as FieldStepKey}
            render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
              <FloatingLabelInput
                label={t(`common.fields.${fieldKey}`)}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={Boolean(error)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType={FIELD_META[fieldKey as FieldStepKey].keyboardType}
                secureTextEntry={FIELD_META[fieldKey as FieldStepKey].secure}
                textContentType={FIELD_META[fieldKey as FieldStepKey].textContentType}
              />
            )}
          />
        </View>
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        {isIntro && (
          <View style={styles.dots}>
            {introPages.map((_, i) => (
              <View key={i} style={[styles.dot, i === introPage && styles.dotActive]} />
            ))}
          </View>
        )}

        <Button variant="primary" size="md" onPress={handleNext} loading={submitting} style={styles.button}>
          {buttonLabel}
        </Button>
      </View>
      </View>

      {isIntro && !introImagesReady && (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.paper} />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  content: {
    flex: 1,
  },
  // Held invisible (not unmounted) while the intro photos are still
  // decoding, so their `<Image>` elements stay mounted and keep loading —
  // see `introImagesReady` above.
  contentLoading: {
    opacity: 0,
  },
  loadingOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: withAlpha(colors.paper, fillOpacity.chip),
  },
  progressSegmentActive: {
    backgroundColor: colors.primary,
  },
  pager: {
    flex: 1,
  },
  pagerContent: {
    flexGrow: 1,
  },
  page: {
    paddingHorizontal: spacing.xl,
  },
  // spacing.md -> spacing.sm ("directly above the title") -> spacing.xl
  // ("the gap needs to be bigger"), both per explicit follow-ups.
  imageWrap: {
    alignSelf: 'center',
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    // `spacing.xl` + half of `FAN_EXTRA_HEIGHT`, not just `spacing.xl` — per
    // explicit "I like the gap on the real challenges screen most, apply it
    // to the other two" follow-up. Both this box and `fanWrap` used the same
    // literal `marginBottom` already, but `fanWrap` is `FAN_EXTRA_HEIGHT`
    // (44) taller than its own photo content (the tilted images sit inset
    // within it, `top: FAN_EXTRA_HEIGHT / 2`), so the VISIBLE gap under the
    // fanned photos was always 22px bigger than under a single image, same
    // margin number notwithstanding. Matching that here instead of changing
    // `fanWrap` keeps the fan page's already-liked spacing untouched.
    marginBottom: spacing.xl + FAN_EXTRA_HEIGHT / 2,
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: radius.big,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  // The overlapping "fanned card" pair (page 1 only) — see the render logic
  // for the placement/tilt reasoning.
  fanWrap: {
    alignSelf: 'center',
    width: IMAGE_SIZE + FAN_EXTRA_WIDTH,
    height: IMAGE_SIZE + FAN_EXTRA_HEIGHT,
    marginBottom: spacing.xl,
  },
  fanImageBase: {
    position: 'absolute',
    top: FAN_EXTRA_HEIGHT / 2,
    left: FAN_EXTRA_WIDTH / 2,
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: radius.big,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  // Position only — independent of which image is in front (see the render
  // logic's own comment for why that's a separate concern here).
  fanImageLeft: {
    transform: [{ translateX: -FAN_OFFSET }, { rotate: `-${FAN_ROTATION_DEG}deg` }],
  },
  fanImageRight: {
    transform: [{ translateX: FAN_OFFSET }, { rotate: `${FAN_ROTATION_DEG}deg` }],
  },
  // Whichever image renders on top gets this — not tied to left/right.
  fanImageShadow: {
    ...shadows.md,
  },
  // Same badge ProfileHeader.tsx overlaps on the avatar (flame + count),
  // re-centered for this component's own (smaller) image size.
  streakBadge: {
    position: 'absolute',
    bottom: -spacing.sm,
    left: '50%',
    transform: [{ translateX: -24 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.big,
    borderWidth: 3,
    borderColor: colors.ink,
    backgroundColor: colors.primary,
  },
  // One on each side, upper corners — positioning only, `FloatingFriendAvatar`
  // itself owns the outline/shadow/motion (see that file's own doc comment
  // for why the split works the same way `fanImageBase`/`fanImageLeft`/
  // `fanImageRight` already split placement from visuals above).
  // `top` raised -10 -> -18, per explicit "place the little profile pics a
  // bit further up, like a tinsy bit" follow-up.
  friendAvatarLeft: {
    position: 'absolute',
    top: -18,
    left: -14,
  },
  friendAvatarRight: {
    position: 'absolute',
    top: -18,
    right: -14,
  },
  // `flex: 1`/`flex: 1` (an even 50/50 split of the content area) used to put
  // the title/image group's own anchor point (its bottom edge, since this
  // slot bottom-anchors its content) exactly at the content area's
  // mathematical midpoint — real bug, per explicit "the title is pushed way
  // too far down, it should be the focal point" report: the header row and
  // footer (dots/button) already claim real space above and below the
  // content area, so that math-midpoint reads LOWER than the screen's actual
  // visual center once you account for them, especially now that a real
  // image sits in this same bottom-anchored group above the title. Giving
  // `titleSlot` a smaller share (0.8 vs. 1.2) moves that boundary — and so
  // the image+title group's anchor point — up, closer to where the eye
  // actually expects the focal point to sit.
  // Flex rebalanced 0.8 -> 1.2 (descriptionSlot: 1.2 -> 0.8), per explicit
  // "the title and image are still up" follow-up — this is what actually
  // moves the title/image's fixed anchor point (the boundary between these
  // two boxes, where titleSlot's flex-end packs its content) down toward
  // the screen's real center; centering descriptionSlot's own text (the
  // previous attempt) never touched this boundary at all, since titleSlot
  // is a separate box sized independently of it.
  titleSlot: {
    flex: 1.2,
    justifyContent: 'flex-end',
  },
  // Back to `justifyContent: 'flex-start'` (not `'center'`) — centering
  // pulled the description text DOWN away from the title to sit in the
  // middle of its own box, which is what actually caused "title/image still
  // up": the title's position didn't move, but the description visibly
  // drifting away from it read as the title being stranded. flex-start
  // keeps the description hugging the title (just `paddingTop.md` between
  // them); the leftover dead space before the footer is instead shrunk at
  // the source, by giving this box a smaller flex share (see `titleSlot`'s
  // own comment) rather than redistributed internally.
  descriptionSlot: {
    flex: 0.8,
    justifyContent: 'flex-start',
    paddingTop: spacing.md,
  },
  description: {
    paddingHorizontal: spacing.md,
  },
  // Top-anchored, not centered — per explicit Mobbin/Revolut-style
  // reference request, so the keyboard never has to cover the title/input
  // (they're already near the top, well clear of where the keyboard rises
  // from).
  // Real bug, fixed 2026-09-24, per explicit "the action button is
  // misplaced" report: dropping `justifyContent: 'center'` for the
  // top-anchored redesign also dropped `flex: 1` along with it — without it,
  // this sized to its own content instead of filling the remaining space,
  // so `footer` below it was no longer pushed to the bottom of the screen
  // (it just sat directly under the input instead). `flex: 1` alone (no
  // `justifyContent`) fills the space AND keeps the content top-anchored —
  // the two are independent, this only needed the second one back.
  fieldContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
    gap: spacing.xl,
  },
  fieldHeading: {
    paddingHorizontal: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: withAlpha(colors.paper, fillOpacity.subtle),
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.primary,
  },
  button: {
    alignSelf: 'stretch',
  },
});
