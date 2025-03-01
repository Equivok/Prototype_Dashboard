import React from 'react';
import { Link } from 'react-router-dom';
import { Database } from '../../types/supabase';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Edit, Trash2, Calendar } from 'lucide-react';

type Session = Database['public']['Tables']['sessions']['Row'];

interface SessionCardProps {
  session: Session;
  onDelete: (id: string) => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, onDelete }) => {
  // Format date
  const formattedDate = new Date(session.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  return (
    <Card className="h-full flex flex-col">
      <div className="flex-grow">
        <div className="flex items-center mb-4">
          <Calendar className="h-5 w-5 text-indigo-500 mr-2" />
          <span className="text-sm text-gray-600">{formattedDate}</span>
        </div>
        <h3 className="text-xl font-semibold mb-2">{session.title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-3">{session.notes}</p>
      </div>
      
      <div className="flex justify-between mt-4">
        <Link to={`/sessions/${session.id}`}>
          <Button variant="primary">View Session</Button>
        </Link>
        <div className="flex space-x-2">
          <Link to={`/sessions/${session.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onDelete(session.id)}
            className="text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SessionCard;