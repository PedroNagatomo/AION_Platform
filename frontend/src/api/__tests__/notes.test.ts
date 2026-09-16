import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNotes, createNote, deleteNote } from '../notes';
import api from '../../utils/api';

vi.mock('../../utils/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Notes API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getNotes fetches all notes', async () => {
    const mockNotes = [
      { id: '1', title: 'Note 1', content: 'Content', isFolder: false },
    ];
    (api.get as any).mockResolvedValue({ data: mockNotes });

    const result = await getNotes();
    
    expect(api.get).toHaveBeenCalledWith('/notes');
    expect(result).toEqual(mockNotes);
  });

  it('createNote sends POST request', async () => {
    const newNote = { title: 'New Note', content: '' };
    const createdNote = { id: '1', ...newNote };
    (api.post as any).mockResolvedValue({ data: createdNote });

    const result = await createNote(newNote);
    
    expect(api.post).toHaveBeenCalledWith('/notes', newNote);
    expect(result).toEqual(createdNote);
  });

  it('deleteNote sends DELETE request', async () => {
    (api.delete as any).mockResolvedValue({});

    await deleteNote('note-id');
    
    expect(api.delete).toHaveBeenCalledWith('/notes/note-id');
  });
});