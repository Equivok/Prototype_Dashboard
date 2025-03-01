import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCampaignStore } from '../../store/campaignStore';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Edit, ArrowLeft } from 'lucide-react';

const NpcDetailsPage: React.FC = () => {
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
  
  const campaign = campaigns.find(c => c.id === npc.campaign_id);
  
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/campaigns/${npc.campaign_id}`)}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Campaign
            </Button>
            <h1 className="text-2xl font-bold">{npc.name}</h1>
          </div>
          <Link to={`/npcs/${npc.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-1" /> Edit NPC
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-1">
            {npc.image_url ? (
              <img
                src={npc.image_url}
                alt={npc.name}
                className="w-full h-auto rounded-lg shadow-sm"
              />
            ) : (
              <div className="w-full aspect-square bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-indigo-500 text-4xl font-medium">{npc.name.charAt(0)}</span>
              </div>
            )}
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{npc.description}</p>
              {campaign && (
                <p className="mt-4 text-sm text-gray-500">
                  Part of campaign: <Link to={`/campaigns/${campaign.id}`} className="text-indigo-600 hover:text-indigo-800">{campaign.title}</Link>
                </p>
              )}
            </Card>
          </div>
        </div>
        
        <Card>
          <h2 className="text-xl font-semibold mb-4">Traits</h2>
          <div className="space-y-4">
            {npc.traits && Array.isArray(npc.traits) && (npc.traits as any).map((trait: any, index: number) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                <h3 className="font-medium text-gray-900">{trait.key}</h3>
                <p className="mt-1 text-gray-600 whitespace-pre-wrap">{trait.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default NpcDetailsPage;