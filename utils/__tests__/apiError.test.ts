import {
  describeError,
  getApiErrorMessage,
  knownApiMessageKey,
  logError,
  wasErrorToastShown,
} from '../apiError';

const t = (key: string) => `t(${key})`;

const axiosError = (status: number, data: unknown = {}, config: Record<string, unknown> = {}) => ({
  response: { status, data },
  config: { method: 'post', url: '/challenges/1/join?x=secret', headers: { Authorization: 'Bearer abc.def' }, ...config },
});

describe('getApiErrorMessage', () => {
  it('translates a known backend message instead of showing the API’s English text', () => {
    expect(getApiErrorMessage(axiosError(409, { message: 'You already logged progress today' }), t, 'fallback')).toBe(
      't(common.errors.known.alreadyLoggedToday)',
    );
  });

  it('never shows raw validator output; the caller’s translated fallback wins', () => {
    expect(getApiErrorMessage(axiosError(400, { message: ['title must be a string'] }), t, 'fallback')).toBe('fallback');
    expect(getApiErrorMessage(axiosError(400, { message: 'property foo should not exist' }), t, 'fallback')).toBe('fallback');
  });

  it('says what happened when there was no answer at all', () => {
    expect(getApiErrorMessage({ message: 'Network Error' }, t, 'fallback')).toBe('t(common.errors.networkErrorMessage)');
    expect(getApiErrorMessage({ code: 'ECONNABORTED', message: 'timeout' }, t, 'fallback')).toBe('t(common.errors.timeoutMessage)');
  });
});

describe('wasErrorToastShown', () => {
  it('is true for a request the global interceptor answered with a toast', () => {
    expect(wasErrorToastShown(axiosError(500))).toBe(true);
    expect(wasErrorToastShown({ message: 'Network Error' })).toBe(true);
  });

  it('is false for a request that opted out, or an error that never was a request', () => {
    expect(wasErrorToastShown(axiosError(500, {}, { suppressErrorToast: true }))).toBe(false);
    expect(wasErrorToastShown(new Error('bad shape'))).toBe(false);
  });
});

describe('describeError (dev logs)', () => {
  it('keeps the status and path but never the token, the query string or the body', () => {
    const text = describeError(axiosError(403, { message: 'secret detail', code: 'ACCOUNT_SUSPENDED' }));
    expect(text).toBe('POST /challenges/1/join -> 403 ACCOUNT_SUSPENDED');
    expect(text).not.toMatch(/Bearer|secret|abc\.def/);
  });
});

describe('register conflicts', () => {
  it('translates a taken username (409 from the backend’s unique-index guard)', () => {
    expect(getApiErrorMessage(axiosError(409, { message: 'Username already in use' }), t, 'fallback')).toBe(
      't(common.errors.known.usernameInUse)',
    );
  });

  it('B4: translates the single answer for a taken email or username', () => {
    expect(
      getApiErrorMessage(axiosError(409, { message: 'Email or username already in use' }), t, 'fallback'),
    ).toBe('t(common.errors.known.accountTaken)');
  });
});

describe('B4 password policy messages', () => {
  it.each([
    ['Password must be at least 10 characters', 'passwordTooShort'],
    ['Password must be at most 72 bytes', 'passwordTooLong'],
    ['Password must not contain your username or email', 'passwordContainsIdentity'],
    ['Password is too common', 'passwordTooCommon'],
  ])('maps the ValidationPipe list entry "%s"', (message, key) => {
    const error = axiosError(400, { message: [message] });
    expect(knownApiMessageKey(error)).toBe(key);
    expect(getApiErrorMessage(error, t, 'fallback')).toBe(`t(common.errors.known.${key})`);
  });

  it('picks the first known entry of a list and ignores the rest', () => {
    expect(
      knownApiMessageKey(axiosError(400, { message: ['email must be an email', 'Password is too common'] })),
    ).toBe('passwordTooCommon');
  });
});

describe('logError', () => {
  afterEach(() => jest.restoreAllMocks());

  it('stays quiet for a handled 4xx (a wrong password is not a bug to flag in LogBox)', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logError('auth.login', axiosError(401));
    expect(spy).not.toHaveBeenCalled();
  });

  it('still reports server and network failures in development', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logError('feed', axiosError(500));
    logError('feed', { message: 'Network Error' });
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
