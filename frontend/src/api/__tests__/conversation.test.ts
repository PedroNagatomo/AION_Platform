import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getConversations, 
  createConversation, 
  sendMessage,
  deleteConversation,
  togglePin,
} from '../conversation';
import api from '../../utils/api';

vi.mock('../../utils/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Conversation API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getConversations fetches list', async () => {
    const mockData = [{ id: '1', title: 'Test' }];
    (api.get as any).mockResolvedValue({ data: mockData });

    const result = await getConversations();
    
    expect(api.get).toHaveBeenCalledWith('/conversations');
    expect(result).toEqual(mockData);
  });

  it('createConversation sends POST', async () => {
    (api.post as any).mockResolvedValue({ data: { id: '1', title: 'Nova Conversa' } });

    const result = await createConversation();
    
    expect(api.post).toHaveBeenCalledWith('/conversations', null, { params: undefined });
    expect(result.id).toBe('1');
  });

  it('sendMessage sends text without files', async () => {
    (api.post as any).mockResolvedValue({ data: { id: '1', content: 'Response' } });

    await sendMessage('conv-id', 'Hello');
    
    expect(api.post).toHaveBeenCalled();
    const callArgs = (api.post as any).mock.calls[0];
    expect(callArgs[0]).toBe('/conversations/conv-id/messages');
    expect(callArgs[1]).toBeInstanceOf(FormData);
  });

  it('sendMessage sends files with FormData', async () => {
    (api.post as any).mockResolvedValue({ data: { id: '1' } });
    
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    await sendMessage('conv-id', 'Check this file', [file]);
    
    expect(api.post).toHaveBeenCalled();
    const formData = (api.post as any).mock.calls[0][1] as FormData;
    expect(formData.get('content')).toBe('Check this file');
    expect(formData.get('files')).toBeTruthy();
  });

  it('deleteConversation sends DELETE', async () => {
    (api.delete as any).mockResolvedValue({});

    await deleteConversation('conv-id');
    
    expect(api.delete).toHaveBeenCalledWith('/conversations/conv-id');
  });

  it('togglePin sends POST', async () => {
    (api.post as any).mockResolvedValue({ data: { id: '1', pinned: true } });

    const result = await togglePin('conv-id');
    
    expect(api.post).toHaveBeenCalledWith('/conversations/conv-id/pin');
    expect(result.pinned).toBe(true);
  });
});