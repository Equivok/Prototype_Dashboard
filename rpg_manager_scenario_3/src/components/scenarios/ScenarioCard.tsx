import React from 'react';
import { Link } from 'react-router-dom';
import { Database } from '../../types/supabase';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Edit, Trash2 } from 'lucide-react';

type Scenario = Database['public']['Tables']['scenarios']['Row'];

interface ScenarioCardProps {
  scenario: Scenario;
  onDelete: (id: string) => void;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, onDelete }) => {
  return (
    <Card className="h-full flex flex-col">
      <div className="flex-grow">
        <h3 className="text-xl font-semibold mb-2">{scenario.title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-3">{scenario.description}</p>
      </div>
      
      <div className="flex justify-between mt-4">
        <Link to={`/scenarios/${scenario.id}`}>
          <Button variant="primary">View Scenario</Button>
        </Link>
        <div className="flex space-x-2">
          <Link to={`/scenarios/${scenario.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onDelete(scenario.id)}
            className="text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ScenarioCard;