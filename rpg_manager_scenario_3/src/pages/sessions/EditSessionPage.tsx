import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCampaignStore } from '../../store/campaignStore';
import Layout from '../../components/layout/Layout';
import SessionForm from '../../components/sessions/SessionForm';

const EditSessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { sessions, fetchSessions, campaigns, fetchCampaigns } = useCampaignStore();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    const loadData = async () => {
      if (campaigns.length === 0) {
        await fetchCampaigns();
      }
      
      if (sessions.length === 0 && id) {
        // We need to find the campaign ID for this session
        for (const campaign of campaigns) {
          await fetchSessions(campaign.id);
          const session = sessions.find(s => s.id === id);
          if (session) {
            break;
          }
        }
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [user, navigate, id, campaigns, sessions, fetchCampaigns, fetchSessions]);
  
  if (!user || !id) {
    return null;
  }
  
  if (loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <p className="text-center py-8">Loading session...</p>
        </div>
      </Layout>
    );
  }
  
  const session = sessions.find(s => s.id === id);
  
  if (!session) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <p className="text-center py-8">Session not found.</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Edit Session</h1>
        <SessionForm
          isEditing
          sessionId={id}
          campaignId={session.campaign_id}
          initialData={{
            title: session.title,
            date: session.date,
            notes: session.notes,
            scenario_id: session.scenario_id,
          }}
        />
      </div>
    </Layout>
  );
};

export default EditSessionPage;