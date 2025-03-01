import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCampaignStore } from '../../store/campaignStore';
import Layout from '../../components/layout/Layout';
import CampaignForm from '../../components/campaigns/CampaignForm';

const EditCampaignPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { campaigns, fetchCampaigns } = useCampaignStore();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    const loadCampaign = async () => {
      if (campaigns.length === 0) {
        await fetchCampaigns();
      }
      setLoading(false);
    };
    
    loadCampaign();
  }, [user, navigate, campaigns.length, fetchCampaigns]);
  
  if (!user || !id) {
    return null;
  }
  
  if (loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <p className="text-center py-8">Loading campaign...</p>
        </div>
      </Layout>
    );
  }
  
  const campaign = campaigns.find(c => c.id === id);
  
  if (!campaign) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <p className="text-center py-8">Campaign not found.</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Edit Campaign</h1>
        <CampaignForm
          isEditing
          campaignId={id}
          initialData={{
            title: campaign.title,
            description: campaign.description,
            image_url: campaign.image_url,
          }}
        />
      </div>
    </Layout>
  );
};

export default EditCampaignPage;