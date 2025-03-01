import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCampaignStore } from '../../store/campaignStore';
import Layout from '../../components/layout/Layout';
import NpcForm from '../../components/npcs/NpcForm';

const EditNpcPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { npcs, fetchNpcs, campaigns, fetchCampaigns } = useCampaignStore();
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
      
      if (npcs.length === 0 && id) {
        // We need to find the campaign ID for this NPC
        for (const campaign of campaigns) {
          await fetchNpcs(campaign.id);
          const npc = npcs.find(n => n.id === id);
          if (npc) {
            break;
          }
        }
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [user, navigate, id, campaigns, npcs, fetchCampaigns, fetchNpcs]);
  
  if (!user || !id) {
    return null;
  }
  
  if (loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <p className="text-center py-8">Loading NPC...</p>
        </div>
      </Layout>
    );
  }
  
  const npc = npcs.find(n => n.id === id);
  
  if (!npc) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <p className="text-center py-8">NPC not found.</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Edit NPC</h1>
        <NpcForm
          isEditing
          npcId={id}
          campaignId={npc.campaign_id}
          initialData={{
            name: npc.name,
            description: npc.description,
            image_url: npc.image_url,
            traits: npc.traits as any,
          }}
        />
      </div>
    </Layout>
  );
};

export default EditNpcPage;