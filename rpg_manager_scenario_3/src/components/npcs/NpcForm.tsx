import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCampaignStore } from '../../store/campaignStore';
import Button from '../ui/Button';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Card from '../ui/Card';
import { Plus, Trash2 } from 'lucide-react';

interface NpcFormProps {
  isEditing?: boolean;
  npcId?: string;
  campaignId: string;
  initialData?: {
    name: string;
    description: string;
    image_url?: string | null;
    traits: {
      key: string;
      value: string;
    }[];
  };
}

const NpcForm: React.FC<NpcFormProps> = ({
  isEditing = false,
  npcId,
  campaignId,
  initialData = { 
    name: '', 
    description: '', 
    image_url: '', 
    traits: [
      { key: 'Appearance', value: '' },
      { key: 'Personality', value: '' },
      { key: 'Motivation', value: '' },
    ] 
  },
}) => {
  const [name, setName] = useState(initialData.name);
  const [description, setDescription] = useState(initialData.description);
  const [imageUrl, setImageUrl] = useState(initialData.image_url || '');
  const [traits, setTraits] = useState<{key: string, value: string}[]>(
    initialData.traits || [
      { key: 'Appearance', value: '' },
      { key: 'Personality', value: '' },
      { key: 'Motivation', value: '' },
    ]
  );
  const [formError, setFormError] = useState('');
  
  const { user } = useAuthStore();
  const { createNpc, updateNpc, loading, error } = useCampaignStore();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    if (!name || !description) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    if (!user) {
      setFormError('You must be logged in to create an NPC');
      return;
    }
    
    try {
      if (isEditing && npcId) {
        await updateNpc(npcId, {
          name,
          description,
          image_url: imageUrl || null,
          traits,
        });
      } else {
        await createNpc({
          name,
          description,
          image_url: imageUrl || null,
          traits,
          campaign_id: campaignId,
          user_id: user.id,
        });
      }
      
      navigate(`/campaigns/${campaignId}`);
    } catch (err) {
      console.error('Error saving NPC:', err);
    }
  };
  
  const addTrait = () => {
    setTraits([...traits, { key: '', value: '' }]);
  };
  
  const updateTrait = (index: number, field: 'key' | 'value', value: string) => {
    const newTraits = [...traits];
    newTraits[index][field] = value;
    setTraits(newTraits);
  };
  
  const removeTrait = (index: number) => {
    setTraits(traits.filter((_, i) => i !== index));
  };
  
  return (
    <Card title={isEditing ? 'Edit NPC' : 'Create New NPC'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {(error || formError) && (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-700">{error || formError}</p>
          </div>
        )}
        
        <Input
          label="NPC Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter NPC name"
          required
        />
        
        <TextArea
          label="Description *"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this NPC"
          rows={3}
          required
        />
        
        <Input
          label="Image URL (optional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
        
        {imageUrl && (
          <div className="mt-2">
            <p className="text-sm text-gray-500 mb-2">Preview:</p>
            <img
              src={imageUrl}
              alt="Preview"
              className="h-40 w-40 object-cover rounded-full"
              onError={() => setImageUrl('')}
            />
          </div>
        )}
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-md font-medium">NPC Traits</h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addTrait}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Trait
            </Button>
          </div>
          
          {traits.map((trait, index) => (
            <div key={index} className="flex space-x-2">
              <Input
                placeholder="Trait name"
                value={trait.key}
                onChange={(e) => updateTrait(index, 'key', e.target.value)}
                className="w-1/3"
              />
              <TextArea
                placeholder="Trait description"
                value={trait.value}
                onChange={(e) => updateTrait(index, 'value', e.target.value)}
                className="flex-1"
                rows={2}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => removeTrait(index)}
                className="self-start mt-2 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/campaigns/${campaignId}`)}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            {isEditing ? 'Update NPC' : 'Create NPC'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default NpcForm;