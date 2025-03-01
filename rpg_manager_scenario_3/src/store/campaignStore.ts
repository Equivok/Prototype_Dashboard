import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Campaign = Database['public']['Tables']['campaigns']['Row'];
type Scenario = Database['public']['Tables']['scenarios']['Row'];
type NPC = Database['public']['Tables']['npcs']['Row'];
type Session = Database['public']['Tables']['sessions']['Row'];

interface CampaignState {
  campaigns: Campaign[];
  currentCampaign: Campaign | null;
  scenarios: Scenario[];
  allScenarios: Scenario[];
  currentScenario: Scenario | null;
  npcs: NPC[];
  currentNpc: NPC | null;
  sessions: Session[];
  currentSession: Session | null;
  loading: boolean;
  error: string | null;
  
  fetchCampaigns: () => Promise<void>;
  createCampaign: (campaign: Omit<Campaign, 'id' | 'created_at'>) => Promise<Campaign | null>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<Campaign | null>;
  deleteCampaign: (id: string) => Promise<void>;
  setCurrentCampaign: (campaign: Campaign | null) => void;
  
  fetchScenarios: (campaignId: string) => Promise<void>;
  fetchAllScenarios: () => Promise<void>;
  createScenario: (scenario: Omit<Scenario, 'id' | 'created_at'>) => Promise<void>;
  updateScenario: (id: string, updates: Partial<Scenario>) => Promise<void>;
  deleteScenario: (id: string) => Promise<void>;
  setCurrentScenario: (scenario: Scenario | null) => void;
  
  fetchNpcs: (campaignId: string) => Promise<void>;
  createNpc: (npc: Omit<NPC, 'id' | 'created_at'>) => Promise<void>;
  updateNpc: (id: string, updates: Partial<NPC>) => Promise<void>;
  deleteNpc: (id: string) => Promise<void>;
  setCurrentNpc: (npc: NPC | null) => void;
  
  fetchSessions: (campaignId: string) => Promise<void>;
  createSession: (session: Omit<Session, 'id' | 'created_at'>) => Promise<void>;
  updateSession: (id: string, updates: Partial<Session>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  setCurrentSession: (session: Session | null) => void;
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  currentCampaign: null,
  scenarios: [],
  allScenarios: [],
  currentScenario: null,
  npcs: [],
  currentNpc: null,
  sessions: [],
  currentSession: null,
  loading: false,
  error: null,
  
  // Campaign actions
  fetchCampaigns: async () => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ campaigns: data as Campaign[], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  createCampaign: async (campaign) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('campaigns')
        .insert(campaign)
        .select()
        .single();
      
      if (error) throw error;
      
      set((state) => ({ 
        campaigns: [data as Campaign, ...state.campaigns],
        loading: false 
      }));
      
      return data as Campaign;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },
  
  updateCampaign: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      set((state) => ({ 
        campaigns: state.campaigns.map(c => c.id === id ? (data as Campaign) : c),
        currentCampaign: state.currentCampaign?.id === id ? (data as Campaign) : state.currentCampaign,
        loading: false 
      }));
      
      return data as Campaign;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },
  
  deleteCampaign: async (id) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set((state) => ({ 
        campaigns: state.campaigns.filter(c => c.id !== id),
        currentCampaign: state.currentCampaign?.id === id ? null : state.currentCampaign,
        loading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  setCurrentCampaign: (campaign) => {
    set({ currentCampaign: campaign });
  },
  
  // Scenario actions
  fetchScenarios: async (campaignId) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ scenarios: data as Scenario[], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  fetchAllScenarios: async () => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('scenarios')
        .select('*, campaigns(title)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ allScenarios: data as Scenario[], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  createScenario: async (scenario) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('scenarios')
        .insert(scenario)
        .select()
        .single();
      
      if (error) throw error;
      
      set((state) => ({ 
        scenarios: [data as Scenario, ...state.scenarios],
        loading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  updateScenario: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('scenarios')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      set((state) => ({ 
        scenarios: state.scenarios.map(s => s.id === id ? (data as Scenario) : s),
        currentScenario: state.currentScenario?.id === id ? (data as Scenario) : state.currentScenario,
        loading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  deleteScenario: async (id) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('scenarios')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set((state) => ({ 
        scenarios: state.scenarios.filter(s => s.id !== id),
        currentScenario: state.currentScenario?.id === id ? null : state.currentScenario,
        loading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  setCurrentScenario: (scenario) => {
    set({ currentScenario: scenario });
  },
  
  // NPC actions
  fetchNpcs: async (campaignId) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('npcs')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ npcs: data as NPC[], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  createNpc: async (npc) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('npcs')
        .insert(npc)
        .select()
        .single();
      
      if (error) throw error;
      
      set((state) => ({ 
        npcs: [data as NPC, ...state.npcs],
        loading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  updateNpc: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('npcs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      set((state) => ({ 
        npcs: state.npcs.map(n => n.id === id ? (data as NPC) : n),
        currentNpc: state.currentNpc?.id === id ? (data as NPC) : state.currentNpc,
        loading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  deleteNpc: async (id) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('npcs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set((state) => ({ 
        npcs: state.npcs.filter(n => n.id !== id),
        currentNpc: state.currentNpc?.id === id ? null : state.currentNpc,
        loading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  setCurrentNpc: (npc) => {
    set({ currentNpc: npc });
  },
  
  // Session actions
  fetchSessions: async (campaignId) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      set({ sessions: data as Session[], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  createSession: async (session) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('sessions')
        .insert(session)
        .select()
        .single();
      
      if (error) throw error;
      
      set((state) => ({ 
        sessions: [data as Session, ...state.sessions],
        loading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  updateSession: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      set((state) => ({ 
        sessions: state.sessions.map(s => s.id === id ? (data as Session) : s),
        currentSession: state.currentSession?.id === id ? (data as Session) : state.currentSession,
        loading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  deleteSession: async (id) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set((state) => ({ 
        sessions: state.sessions.filter(s => s.id !== id),
        currentSession: state.currentSession?.id === id ? null : state.currentSession,
        loading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  setCurrentSession: (session) => {
    set({ currentSession: session });
  }
}));