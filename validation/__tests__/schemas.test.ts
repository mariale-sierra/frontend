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
  });

  it('register: requires email/username/password', () => {
    const schema = createRegisterSchema(t);
    expect(schema.safeParse({ email: 'a@b.com', username: '', password: 'x' }).success).toBe(false);
    expect(schema.safeParse({ email: 'a@b.com', username: 'esteban', password: 'x' }).success).toBe(true);
  });

  it('profile edit: display name required, bio optional/empty allowed', () => {
    const schema = createProfileEditSchema(t);
    expect(schema.safeParse({ displayName: '', bio: '' }).success).toBe(false);
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
