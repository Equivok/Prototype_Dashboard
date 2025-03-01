import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCampaignStore } from '../../store/campaignStore';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Edit, ArrowLeft, Calendar, BookOpen } from 'lucide-react';

const SessionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { 
    sessions, 
    fetchSessions, 
    campaigns, 
    fetchCampaigns,
    scenarios,
    fetchScenarios
  } = useCampaignStore();
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
            // Also fetch scenarios for this campaign to get the linked scenario
            await fetchScenarios(campaign.id);
            break;
          }
        }
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [user, navigate, id, campaigns, sessions, fetchCampaigns, fetchSessions, fetchScenarios]);
  
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
  
  const campaign = campaigns.find(c => c.id === session.campaign_id);
  const scenario = session.scenario_id ? scenarios.find(s => s.id === session.scenario_id) : null;
  
  // Format date
  const formattedDate = new Date(session.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/campaigns/${session.campaign_id}`)}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Campaign
            </Button>
            <h1 className="text-2xl font-bold">{session.title}</h1>
          </div>
          <Link to={`/sessions/${session.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-1" /> Edit Session
            </Button>
          </Link>
        </div>
        
        <Card className="mb-6">
          <div className="flex items-center mb-4">
            <Calendar className="h-5 w-5 text-indigo-500 mr-2" />
            <span className="text-gray-700">{formattedDate}</span>
          </div>
          
          {campaign && (
            <p className="text-sm text-gray-500 mb-2">
              Campaign: <Link to={`/campaigns/${campaign.id}`} className="text-indigo-600 hover:text-indigo-800">{campaign.title}</Link>
            </p>
          )}
          
          {scenario && (
            <div className="flex items-center mt-4 mb-2">
              <BookOpen className="h-5 w-5 text-indigo-500 mr-2" />
              <span className="text-gray-700">
                Scenario: <Link to={`/scenarios/${scenario.id}`} className="text-indigo-600 hover:text-indigo-800">{scenario.title}</Link>
              </span>
            </div>
          )}
        </Card>
        
        <Card>
          <h2 className="text-xl font-semibold mb-4">Session Notes</h2>
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap">{session.notes}</p>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default SessionDetailsPage;