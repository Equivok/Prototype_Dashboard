import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Layout from '../../components/layout/Layout';
import CampaignForm from '../../components/campaigns/CampaignForm';

const NewCampaignPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  if (!user) {
    return null;
  }
  
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create New Campaign</h1>
        <CampaignForm />
      </div>
    </Layout>
  );
};

export default NewCampaignPage;