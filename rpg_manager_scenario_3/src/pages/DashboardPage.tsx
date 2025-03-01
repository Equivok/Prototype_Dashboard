import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCampaignStore } from '../store/campaignStore';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { BookOpen, Plus } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { campaigns, fetchCampaigns, loading } = useCampaignStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchCampaigns();
  }, [user, navigate, fetchCampaigns]);
  
  if (!user) {
    return null;
  }
  
  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Link to="/campaigns/new">
            <Button>
              <Plus className="h-4 w-4 mr-1" /> New Campaign
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Recent Campaigns */}
          <Card title="Recent Campaigns" className="md:col-span-2">
            {loading ? (
              <div className="py-4 text-center">Loading campaigns...</div>
            ) : campaigns.length === 0 ? (
              <div className="py-8 text-center">
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
              <div className="divide-y divide-gray-200">
                {campaigns.slice(0, 5).map((campaign) => (
                  <div key={campaign.id} className="py-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium">{campaign.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-1">{campaign.description}</p>
                    </div>
                    <Link to={`/campaigns/${campaign.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
            
            {campaigns.length > 0 && (
              <div className="mt-4 text-center">
                <Link to="/campaigns" className="text-indigo-600 hover:text-indigo-800">
                  View all campaigns
                </Link>
              </div>
            )}
          </Card>
          
          {/* Quick Links */}
          <Card title="Quick Links">
            <div className="space-y-4">
              <Link to="/campaigns/new" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" /> New Campaign
                </Button>
              </Link>
              <Link to="/campaigns" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="h-4 w-4 mr-2" /> All Campaigns
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;