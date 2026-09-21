// Node's own modules, taken through Jest (the test files carry no Node typings).
const fs = jest.requireActual('fs');
const path = jest.requireActual('path');

// The challenge administration feature (manage, join requests, tagging, the join-request row)
// was written before the theme refactor, with hard-coded values. This keeps it on the design
// system: colors, opacities, radii, type and spacing come from `constants/theme`, sizes are named.
const ROOT = path.resolve(__dirname, '..', '..');

const FILES = [
  // Join requests render directly inside this screen now — no separate
  // app/challenge/[id]/join-requests.tsx any more (per explicit feedback
  // that two screens for one job was redundant).
  'app/challenge/[id]/manage.tsx',
  'components/layout/ScreenHeader.tsx',
  'components/spaces/JoinRequestListItem.tsx',
  'components/challenge/ChallengeParticipantManageRow.tsx',
  'components/challenge/ChallengeParticipantManageRowSkeleton.tsx',
  'components/challenge/TagParticipantsSheet.tsx',
];

const source = (file: string) => fs.readFileSync(path.join(ROOT, file), 'utf8');

// What is written in a file, with its comments taken out (a comment may quote a value).
const code = (file: string) =>
  source(file)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

describe.each(FILES)('%s', (file) => {
  it('has no hex color and no rgb() / rgba() literal: every color is a token', () => {
    expect(code(file)).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(code(file)).not.toMatch(/\brgba?\(/);
  });

  it('has no opacity literal: an alpha is a token (`fillOpacity`, `textOpacity`, `glass`)', () => {
    expect(code(file)).not.toMatch(/withAlpha\([^)]*,\s*\d*\.\d+\s*\)/);
    expect(code(file)).not.toMatch(/\bopacity:\s*\d*\.\d+/);
  });

  it('has no radius or border-width literal: they are `radius.*` and `borderWidth.*`', () => {
    expect(code(file)).not.toMatch(/borderRadius:\s*\d/);
    expect(code(file)).not.toMatch(/borderWidth:\s*\d/);
  });

  it('has no font size or weight literal: type is a `Text` variant', () => {
    expect(code(file)).not.toMatch(/font(Size|Weight|Family):/);
    expect(code(file)).not.toMatch(/letterSpacing:/);
  });

  it('has no bare size in its styles: a size is a named constant (a 0, as in `minWidth: 0`, is a flex trick, not a size)', () => {
    expect(code(file)).not.toMatch(/\b(width|height|minHeight|maxHeight|minWidth):\s*[1-9]/);
  });

  it('has no bare gap or padding: those are `spacing.*`', () => {
    expect(code(file)).not.toMatch(/\b(gap|margin\w*|padding\w*):\s*-?\d/);
  });
});

describe('the manage screen (participants and, inline, join requests)', () => {
  const file = 'app/challenge/[id]/manage.tsx';

  it('is skeleton rows while it loads, not a spinner', () => {
    expect(source(file)).not.toContain('ActivityIndicator');
  });

  it("is in the challenge's own colors: the Skia backdrop, not the old flat glow", () => {
    expect(source(file)).toContain('ChallengeAccentBackdrop');
    expect(source(file)).not.toContain('ChallengeAccentGlow');
  });

  it('lays its header out with the shared ScreenHeader, not a copy of it', () => {
    expect(source(file)).toContain('ScreenHeader');
    expect(source(file)).not.toContain('headerSpacer');
  });
});

describe('the tag sheet', () => {
  it('is the shared bottom sheet, not a hand-rolled Modal with its own backdrop', () => {
    const tagSheet = source('components/challenge/TagParticipantsSheet.tsx');

    expect(tagSheet).toContain('BottomSheetModal');
    expect(tagSheet).not.toMatch(/from 'react-native'[^;]*Modal/s);
  });
});

describe('the join-request row', () => {
  it('is one component for Spaces and challenges: there is no second copy of it', () => {
    expect(fs.existsSync(path.join(ROOT, 'components/challenge/ChallengeJoinRequestListItem.tsx'))).toBe(false);
    expect(source('app/challenge/[id]/manage.tsx')).toContain('components/spaces/JoinRequestListItem');
    expect(source('app/messaging/spaces/[id]/join-requests.tsx')).toContain('components/spaces/JoinRequestListItem');
  });
});
