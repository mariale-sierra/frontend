import type { TFunction } from 'i18next';
import { createLoginSchema, createRegisterSchema } from '../authSchemas';
import { createProfileEditSchema } from '../profileSchemas';
import { createChallengeNameSchema } from '../challengeSchemas';
import { createRoutineNameSchema } from '../routineSchemas';
import { createSpaceNameSchema } from '../spaceSchemas';

// A schema factory only needs `t` to resolve message strings — these tests
// care about validity, not exact copy (see i18n/__tests__/parity.test.ts for
// the en/es key-parity check), so a passthrough stub avoids booting the real
// i18next singleton just for this.
const t = ((key: string) => key) as TFunction;

describe('validation schemas', () => {
  it('login: requires email/password and validates email format', () => {
    const schema = createLoginSchema(t);
    expect(schema.safeParse({ email: '', password: '' }).success).toBe(false);
    expect(schema.safeParse({ email: 'not-an-email', password: 'x' }).success).toBe(false);
    expect(schema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
    // Autofill's trailing space is not an invalid address.
    expect(schema.safeParse({ email: 'a@b.com ', password: 'x' }).success).toBe(true);
  });

  it('register: requires email/username/password', () => {
    const schema = createRegisterSchema(t);
    expect(schema.safeParse({ email: 'a@b.com', username: '', password: 'Montaña-Lenta' }).success).toBe(false);
    expect(schema.safeParse({ email: 'a@b.com', username: '   ', password: 'Montaña-Lenta' }).success).toBe(false);
    expect(schema.safeParse({ email: 'a@b.com', username: 'esteban', password: 'Montaña-Lenta' }).success).toBe(true);
  });

  // B4: mirrors the backend password policy (src/auth/password-policy.ts).
  describe('register: password policy (B4)', () => {
    const schema = createRegisterSchema(t);
    const passwordIssues = (password: string, username = 'esteban', email = 'ana.lopez@b.com') => {
      const result = schema.safeParse({ email, username, password });
      return result.success
        ? []
        : result.error.issues.filter((i) => i.path[0] === 'password').map((i) => i.message);
    };

    it('requires at least 10 characters (the old 8-character passwords no longer pass)', () => {
      expect(passwordIssues('12345678')).toEqual(['common.validation.passwordMin']);
      expect(passwordIssues('Kx9!vQ2#m')).toEqual(['common.validation.passwordMin']);
      expect(passwordIssues('Kx9!vQ2#mP')).toEqual([]);
    });

    it('rejects more than 72 bytes', () => {
      expect(passwordIssues('ñ'.repeat(37))).toEqual(['common.errors.known.passwordTooLong']);
    });

    it.each([
      ['the username', 'xxESTEBANxx99'],
      ['the email local part', 'Ana.Lopez-segura'],
      ['the username in leetspeak', '3st3b4n-zebra-22'],
    ])('rejects a password containing %s', (_label, password) => {
      expect(passwordIssues(password)).toEqual(['common.errors.known.passwordContainsIdentity']);
    });

    // Post-audit B4-03-F01: same cases as the backend.
    it.each([
      '12345678901',
      '1234512345',
      '11223344556',
      '123456789a',
      '987654321a',
      'q1w2e3r4t5y6',
      'abcdabcdab',
      'aaaaaaaaaaaa',
    ])('rejects the trivial sequence or repetition %s', (password) => {
      expect(passwordIssues(password)).toEqual(['common.errors.known.passwordTooCommon']);
    });

    it.each(['Montaña-Lenta-Azul', 'Kx9!vQ2#mPz7', 'qwertyMangoPeludo', 'Lluvia_en_Xela_2026'])(
      'accepts a strong password: %s',
      (password) => {
        expect(passwordIssues(password)).toEqual([]);
      },
    );

    // Post-audit B4-03-F02.
    it('counts characters, not UTF-16 code units', () => {
      expect(passwordIssues('🔥🍕🎉🚀🌙')).toEqual(['common.validation.passwordMin']);
      expect(passwordIssues('🔥🍕🎉🚀🌙 luna roja')).toEqual([]);
    });

    it('leaves the common-password list to the server', () => {
      // The backend answers "Password is too common", mapped to the password step.
      expect(passwordIssues('password123')).toEqual([]);
    });
  });

  it('profile edit: display name required, bio optional/empty allowed', () => {
    const schema = createProfileEditSchema(t);
    expect(schema.safeParse({ displayName: '', bio: '' }).success).toBe(false);
    expect(schema.safeParse({ displayName: '   ', bio: '' }).success).toBe(false);
    expect(schema.safeParse({ displayName: 'Esteban', bio: '' }).success).toBe(true);
  });

  it('challenge name: title required', () => {
    const schema = createChallengeNameSchema(t);
    expect(schema.safeParse({ title: '' }).success).toBe(false);
    expect(schema.safeParse({ title: '75 Hard' }).success).toBe(true);
  });

  it('routine name: required', () => {
    const schema = createRoutineNameSchema(t);
    expect(schema.safeParse({ routineName: '' }).success).toBe(false);
    expect(schema.safeParse({ routineName: 'Leg day' }).success).toBe(true);
  });

  it('space name: required', () => {
    const schema = createSpaceNameSchema(t);
    expect(schema.safeParse({ name: '' }).success).toBe(false);
    expect(schema.safeParse({ name: 'Girls running club' }).success).toBe(true);
  });
});
