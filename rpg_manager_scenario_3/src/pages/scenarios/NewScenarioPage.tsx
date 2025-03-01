import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Layout from '../../components/layout/Layout';
import ScenarioEditor from '../../components/scenarios/ScenarioEditor';

const NewScenarioPage: React.FC = () => {
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create New Scenario</h1>
        <ScenarioEditor campaignId={campaignId} />
      </div>
    </Layout>
  );
};

export default NewScenarioPage;