import { supabase } from './supabase';

/**
 * Sends a magic link invitation to join a campaign
 * @param email The email address to send the invitation to
 * @param campaignId The ID of the campaign
 * @param campaignTitle The title of the campaign
 * @param inviterEmail The email of the person inviting
 * @returns Promise with the result of the operation
 */
export const sendCampaignInvitation = async (
  email: string,
  campaignId: string,
  campaignTitle: string,
  inviterEmail: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Create a magic link with redirect to the campaign page
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/campaigns/${campaignId}`,
        data: {
          campaign_invitation: true,
          campaign_id: campaignId,
          campaign_title: campaignTitle,
          inviter_email: inviterEmail
        }
      }
    });

    if (error) {
      console.error('Error sending magic link:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in sendCampaignInvitation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
};