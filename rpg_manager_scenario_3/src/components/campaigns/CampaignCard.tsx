import React from 'react';
import { Link } from 'react-router-dom';
import { Database } from '../../types/supabase';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Edit, Trash2 } from 'lucide-react';

type Campaign = Database['public']['Tables']['campaigns']['Row'];

interface CampaignCardProps {
  campaign: Campaign;
  onDelete: (id: string) => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onDelete }) => {
  return (
    <Card className="h-full flex flex-col">
      <div className="flex-grow">
        <div className="relative pb-2/3 mb-4">
          {campaign.image_url ? (
            <img
              src={campaign.image_url}
              alt={campaign.title}
              className="absolute h-48 w-full object-cover rounded-md"
            />
          ) : (
            <div className="h-48 w-full bg-indigo-100 flex items-center justify-center rounded-md">
              <span className="text-indigo-500 text-lg font-medium">{campaign.title.charAt(0)}</span>
            </div>
          )}
        </div>
        <h3 className="text-xl font-semibold mb-2">{campaign.title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-3">{campaign.description}</p>
      </div>
      
      <div className="flex justify-between mt-4">
        <Link to={`/campaigns/${campaign.id}`}>
          <Button variant="primary">View Campaign</Button>
        </Link>
        <div className="flex space-x-2">
          <Link to={`/campaigns/${campaign.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onDelete(campaign.id)}
            className="text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CampaignCard;