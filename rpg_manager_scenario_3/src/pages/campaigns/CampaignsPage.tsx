import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCampaignStore } from '../../store/campaignStore';
import Layout from '../../components/layout/Layout';
import CampaignCard from '../../components/campaigns/CampaignCard';
import Button from '../../components/ui/Button';
import { Plus, BookOpen } from 'lucide-react';

const CampaignsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { campaigns, fetchCampaigns, deleteCampaign, loading } = useCampaignStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchCampaigns();
  }, [user, navigate, fetchCampaigns]);
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      await deleteCampaign(id);
    }
  };
  
  if (!user) {
    return null;
  }
  
  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Campaigns</h1>
          <Link to="/campaigns/new">
            <Button>
              <Plus className="h-4 w-4 mr-1" /> New Campaign
            </Button>
          </Link>
        </div>
        
        {loading ? (
          <div className="py-8 text-center">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new campaign.
            </p>
            <div className="mt-6">
              <Link to="/campaigns/new">
                <Button>
                  <Plus className="h-4 w-4 mr-1" /> New Campaign
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CampaignsPage;