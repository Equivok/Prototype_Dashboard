import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCampaignStore } from '../../store/campaignStore';
import Layout from '../../components/layout/Layout';
import ScenarioEditor from '../../components/scenarios/ScenarioEditor';

const EditScenarioPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { scenarios, fetchScenarios, campaigns, fetchCampaigns } = useCampaignStore();
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
      
      if (scenarios.length === 0 && id) {
        // We need to find the campaign ID for this scenario
        // This is a bit inefficient but works for our demo
        for (const campaign of campaigns) {
          await fetchScenarios(campaign.id);
          const scenario = scenarios.find(s => s.id === id);
          if (scenario) {
            break;
          }
        }
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [user, navigate, id, campaigns, scenarios, fetchCampaigns, fetchScenarios]);
  
  if (!user || !id) {
    return null;
  }
  
  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <p className="text-center py-8">Loading scenario...</p>
        </div>
      </Layout>
    );
  }
  
  const scenario = scenarios.find(s => s.id === id);
  
  if (!scenario) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <p className="text-center py-8">Scenario not found.</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Edit Scenario</h1>
        <ScenarioEditor
          isEditing
          scenarioId={id}
          campaignId={scenario.campaign_id}
          initialData={{
            title: scenario.title,
            description: scenario.description,
            content: scenario.content,
          }}
        />
      </div>
    </Layout>
  );
};

export default EditScenarioPage;