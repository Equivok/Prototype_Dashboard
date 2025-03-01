import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getUser: () => Promise<void>;
  processMagicLink: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: false,
  error: null,
  
  signUp: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      set({ 
        user: data.user,
        session: data.session,
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  signIn: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      set({ 
        user: data.user,
        session: data.session,
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  signOut: async () => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      set({ 
        user: null,
        session: null,
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  getUser: async () => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (data && data.session) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        set({ 
          user: userData.user,
          session: data.session,
          loading: false 
        });
      } else {
        set({ loading: false });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  processMagicLink: async () => {
    try {
      set({ loading: true, error: null });
      
      // Check if we have a hash in the URL (magic link authentication)
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        // Process the magic link
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (data && data.session) {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError) throw userError;
          
          // Check if this was a campaign invitation
          const invitationData = userData.user?.user_metadata?.campaign_invitation;
          if (invitationData) {
            // Update the member status to active in the campaign
            const campaignId = userData.user?.user_metadata?.campaign_id;
            if (campaignId) {
              const { data: campaignData, error: campaignError } = await supabase
                .from('campaigns')
                .select('members')
                .eq('id', campaignId)
                .single();
              
              if (campaignError) {
                console.error('Error fetching campaign:', campaignError);
              } else if (campaignData && campaignData.members) {
                const members = campaignData.members as any[];
                const updatedMembers = members.map(member => 
                  member.email === userData.user?.email 
                    ? { ...member, status: 'active' } 
                    : member
                );
                
                const { error: updateError } = await supabase
                  .from('campaigns')
                  .update({ members: updatedMembers })
                  .eq('id', campaignId);
                
                if (updateError) {
                  console.error('Error updating member status:', updateError);
                }
              }
            }
          }
          
          set({ 
            user: userData.user,
            session: data.session,
            loading: false 
          });
        } else {
          set({ loading: false });
        }
      } else {
        set({ loading: false });
      }
    } catch (error: any) {
      console.error('Error processing magic link:', error);
      set({ error: error.message, loading: false });
    }
  }
}));