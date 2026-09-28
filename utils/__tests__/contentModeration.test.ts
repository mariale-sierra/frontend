import { isContentRejectedError } from '../contentModeration';

describe('isContentRejectedError (B3)', () => {
  it('matches the backend moderation rejection (400 + CONTENT_REJECTED)', () => {
    expect(
      isContentRejectedError({
        response: {
          status: 400,
          data: {
            statusCode: 400,
            message: 'Tu contenido no cumple con las normas de la comunidad',
            code: 'CONTENT_REJECTED',
          },
        },
      }),
    ).toBe(true);
  });

  it('does not match other 400s, other statuses or non-axios errors', () => {
    expect(
      isContentRejectedError({ response: { status: 400, data: { code: 'VALIDATION_ERROR' } } }),
    ).toBe(false);
    expect(
      isContentRejectedError({ response: { status: 503, data: { code: 'CONTENT_REJECTED' } } }),
    ).toBe(false);
    expect(isContentRejectedError(new Error('Network Error'))).toBe(false);
    expect(isContentRejectedError(undefined)).toBe(false);
  });
});
