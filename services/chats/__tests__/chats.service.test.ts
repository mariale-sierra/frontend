import api from '../../api';
import {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  markConversationRead,
  acceptConversationRequest,
  declineConversationRequest,
} from '../chats.service';

jest.mock('../../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('chats.service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getOrCreateConversation posts to /chats/conversations with the recipient id', async () => {
    const conversation = { id: 'conv-1' };
    mockedApi.post.mockResolvedValue({ data: conversation });

    const result = await getOrCreateConversation('user-2');

    expect(mockedApi.post).toHaveBeenCalledWith('/chats/conversations', {
      recipientUserId: 'user-2',
    });
    expect(result).toEqual(conversation);
  });

  it('getConversations hits GET /chats/conversations and returns the array as-is', async () => {
    const conversations = [{ id: 'conv-1' }];
    mockedApi.get.mockResolvedValue({ data: conversations });

    const result = await getConversations();

    expect(mockedApi.get).toHaveBeenCalledWith('/chats/conversations');
    expect(result).toEqual(conversations);
  });

  it('getConversations tolerates a non-array payload', async () => {
    mockedApi.get.mockResolvedValue({ data: { unexpected: true } });

    const result = await getConversations();

    expect(result).toEqual([]);
  });

  it('getMessages hits the conversation messages endpoint with pagination params', async () => {
    const page = { messages: [], nextBefore: null };
    mockedApi.get.mockResolvedValue({ data: page });

    const result = await getMessages('conv-1', { before: 42, limit: 10 });

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/chats/conversations/conv-1/messages',
      { params: { before: 42, limit: 10 } },
    );
    expect(result).toEqual(page);
  });

  it('sendMessage posts the content to the conversation messages endpoint', async () => {
    const message = { id: 1, content: 'hola' };
    mockedApi.post.mockResolvedValue({ data: message });

    const result = await sendMessage('conv-1', 'hola');

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/chats/conversations/conv-1/messages',
      { content: 'hola' },
    );
    expect(result).toEqual(message);
  });

  it('markConversationRead patches the read endpoint', async () => {
    mockedApi.patch.mockResolvedValue({ data: { updated: 2 } });

    await markConversationRead('conv-1');

    expect(mockedApi.patch).toHaveBeenCalledWith('/chats/conversations/conv-1/read');
  });

  it('acceptConversationRequest patches the accept endpoint', async () => {
    const conversation = { id: 'conv-1', isPending: false };
    mockedApi.patch.mockResolvedValue({ data: conversation });

    const result = await acceptConversationRequest('conv-1');

    expect(mockedApi.patch).toHaveBeenCalledWith('/chats/conversations/conv-1/accept');
    expect(result).toEqual(conversation);
  });

  it('declineConversationRequest deletes via the decline endpoint', async () => {
    mockedApi.delete.mockResolvedValue({ data: undefined });

    await declineConversationRequest('conv-1');

    expect(mockedApi.delete).toHaveBeenCalledWith('/chats/conversations/conv-1/decline');
  });

  it('propagates API errors to the caller', async () => {
    mockedApi.post.mockRejectedValue(new Error('Network down'));

    await expect(sendMessage('conv-1', 'hola')).rejects.toThrow('Network down');
  });
});
