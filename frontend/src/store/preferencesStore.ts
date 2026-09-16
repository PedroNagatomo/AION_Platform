import { create } from 'zustand';
import api from '../utils/api';

interface Preferences {
  jarvisEnabled: boolean;
  jarvisVoice: string;
  jarvisLanguage: 'pt-BR' | 'en-US';
  jarvisWakeWord: string; // Palavra de ativação
}

interface PreferencesState {
  preferences: Preferences | null;
  isLoading: boolean;
  loadPreferences: () => Promise<void>;
  savePreferences: (prefs: Preferences) => Promise<void>;
  toggleJarvis: () => Promise<void>;
}

const defaultPreferences: Preferences = {
  jarvisEnabled: false,
  jarvisVoice: 'EXAVITQu4vr4xnSDxMaL', // Sarah (free)
  jarvisLanguage: 'pt-BR',
  jarvisWakeWord: 'jarvis',
};

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  preferences: null,
  isLoading: false,
  
  loadPreferences: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/preferences');
      set({ preferences: { ...defaultPreferences, ...response.data }, isLoading: false });
    } catch (error) {
      console.error('Error loading preferences:', error);
      set({ preferences: defaultPreferences, isLoading: false });
    }
  },
  
  savePreferences: async (prefs) => {
    set({ isLoading: true });
    try {
      await api.put('/preferences', prefs as any);
      set({ preferences: prefs, isLoading: false });
    } catch (error) {
      console.error('Error saving preferences:', error);
      set({ isLoading: false });
    }
  },
  
  toggleJarvis: async () => {
    const current = get().preferences;
    if (!current) return;
    
    const updated = { ...current, jarvisEnabled: !current.jarvisEnabled };
    await get().savePreferences(updated);
  },
}));