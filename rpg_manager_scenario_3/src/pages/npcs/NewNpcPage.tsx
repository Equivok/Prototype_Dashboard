import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Layout from '../../components/layout/Layout';
import NpcForm from '../../components/npcs/NpcForm';

const NewNpcPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  if (!user || !campaignId) {
    return null;
  }
  
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create New NPC</h1>
        <NpcForm campaignId={campaignId} />
      </div>
    </Layout>
  );
};

export default NewNpcPage;