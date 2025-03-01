import React from 'react';
import { Link } from 'react-router-dom';
import { Database } from '../../types/supabase';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Edit, Trash2 } from 'lucide-react';

type NPC = Database['public']['Tables']['npcs']['Row'];

interface NpcCardProps {
  npc: NPC;
  onDelete: (id: string) => void;
}

const NpcCard: React.FC<NpcCardProps> = ({ npc, onDelete }) => {
  return (
    <Card className="h-full flex flex-col">
      <div className="flex-grow">
        <div className="flex items-center mb-4">
          <div className="mr-4">
            {npc.image_url ? (
              <img
                src={npc.image_url}
                alt={npc.name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-500 text-lg font-medium">{npc.name.charAt(0)}</span>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold">{npc.name}</h3>
          </div>
        </div>
        <p className="text-gray-600 mb-4 line-clamp-3">{npc.description}</p>
      </div>
      
      <div className="flex justify-between mt-4">
        <Link to={`/npcs/${npc.id}`}>
          <Button variant="primary">View NPC</Button>
        </Link>
        <div className="flex space-x-2">
          <Link to={`/npcs/${npc.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onDelete(npc.id)}
            className="text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default NpcCard;