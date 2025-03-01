import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCampaignStore } from '../../store/campaignStore';
import Button from '../ui/Button';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Card from '../ui/Card';

interface SessionFormProps {
  isEditing?: boolean;
  sessionId?: string;
  campaignId: string;
  initialData?: {
    title: string;
    date: string;
    notes: string;
    scenario_id: string | null;
  };
}

const SessionForm: React.FC<SessionFormProps> = ({
  isEditing = false,
  sessionId,
  campaignId,
  initialData = { 
    title: '', 
    date: new Date().toISOString().split('T')[0], 
    notes: '',
    scenario_id: null
  },
}) => {
  const [title, setTitle] = useState(initialData.title);
  const [date, setDate] = useState(initialData.date);
  const [notes, setNotes] = useState(initialData.notes);
  const [scenarioId, setScenarioId] = useState<string | null>(initialData.scenario_id);
  const [formError, setFormError] = useState('');
  
  const { user } = useAuthStore();
  const { 
    createSession, 
    updateSession, 
    fetchScenarios,
    scenarios,
    loading, 
    error 
  } = useCampaignStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (campaignId) {
      fetchScenarios(campaignId);
    }
  }, [campaignId, fetchScenarios]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    if (!title || !date) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    if (!user) {
      setFormError('You must be logged in to create a session');
      return;
    }
    
    try {
      if (isEditing && sessionId) {
        await updateSession(sessionId, {
          title,
          date,
          notes,
          scenario_id: scenarioId,
        });
      } else {
        await createSession({
          title,
          date,
          notes,
          scenario_id: scenarioId,
          campaign_id: campaignId,
          user_id: user.id,
        });
      }
      
      navigate(`/campaigns/${campaignId}`);
    } catch (err) {
      console.error('Error saving session:', err);
    }
  };
  
  return (
    <Card title={isEditing ? 'Edit Session' : 'Create New Session'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {(error || formError) && (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-700">{error || formError}</p>
          </div>
        )}
        
        <Input
          label="Session Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter session title"
          required
        />
        
        <Input
          label="Session Date *"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Scenario (optional)
          </label>
          <select
            value={scenarioId || ''}
            onChange={(e) => setScenarioId(e.target.value || null)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">None</option>
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.title}
              </option>
            ))}
          </select>
        </div>
        
        <TextArea
          label="Session Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter session notes, summaries, or important events"
          rows={6}
        />
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/campaigns/${campaignId}`)}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            {isEditing ? 'Update Session' : 'Create Session'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default SessionForm;