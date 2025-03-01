import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCampaignStore } from '../../store/campaignStore';
import Button from '../ui/Button';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Card from '../ui/Card';
import { Plus, Trash2, UserPlus, Mail, X, BookOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendCampaignInvitation } from '../../lib/emailService';

interface CampaignFormProps {
  isEditing?: boolean;
  campaignId?: string;
  initialData?: {
    title: string;
    description: string;
    image_url?: string | null;
    members?: CampaignMember[] | null;
    imported_scenarios?: string[] | null;
  };
}

interface CampaignMember {
  email: string;
  role: 'player' | 'game_master' | 'spectator';
  status: 'invited' | 'active';
}

const CampaignForm: React.FC<CampaignFormProps> = ({
  isEditing = false,
  campaignId,
  initialData = { title: '', description: '', image_url: '', members: [], imported_scenarios: [] },
}) => {
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description);
  const [imageUrl, setImageUrl] = useState(initialData.image_url || '');
  const [members, setMembers] = useState<CampaignMember[]>(initialData.members || []);
  const [importedScenarios, setImportedScenarios] = useState<string[]>(initialData.imported_scenarios || []);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'player' | 'game_master' | 'spectator'>('player');
  const [formError, setFormError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'members' | 'scenarios'>('details');
  const [isSendingInvites, setIsSendingInvites] = useState(false);
  
  const { user } = useAuthStore();
  const { 
    createCampaign, 
    updateCampaign, 
    loading, 
    error,
    fetchAllScenarios,
    allScenarios
  } = useCampaignStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) {
      fetchAllScenarios();
    }
  }, [user, fetchAllScenarios]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    if (!title || !description) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    if (!user) {
      setFormError('You must be logged in to create a campaign');
      return;
    }
    
    try {
      let campaignResult;
      
      if (isEditing && campaignId) {
        campaignResult = await updateCampaign(campaignId, {
          title,
          description,
          image_url: imageUrl || null,
          members: members.length > 0 ? members : null,
          imported_scenarios: importedScenarios.length > 0 ? importedScenarios : null,
        });
      } else {
        campaignResult = await createCampaign({
          title,
          description,
          user_id: user.id,
          image_url: imageUrl || null,
          members: members.length > 0 ? members : null,
          imported_scenarios: importedScenarios.length > 0 ? importedScenarios : null,
        });
      }
      
      // If we have new members to invite and we have a campaign ID
      const newCampaignId = campaignId || campaignResult?.id;
      if (newCampaignId && members.length > 0) {
        setIsSendingInvites(true);
        
        // Send invitations to all members with 'invited' status
        const invitedMembers = members.filter(member => member.status === 'invited');
        
        for (const member of invitedMembers) {
          try {
            await sendCampaignInvitation(
              member.email,
              newCampaignId,
              title,
              user.email || 'Campaign Owner'
            );
          } catch (error) {
            console.error(`Failed to send invitation to ${member.email}:`, error);
          }
        }
        
        setIsSendingInvites(false);
      }
      
      // If we have imported scenarios and a new campaign ID, clone the scenarios
      if (newCampaignId && importedScenarios.length > 0) {
        await cloneScenarios(importedScenarios, newCampaignId);
      }
      
      navigate('/campaigns');
    } catch (err) {
      console.error('Error saving campaign:', err);
    }
  };
  
  const cloneScenarios = async (scenarioIds: string[], targetCampaignId: string) => {
    try {
      // For each selected scenario, create a copy in the new campaign
      for (const scenarioId of scenarioIds) {
        // Get the original scenario
        const { data: originalScenario, error: fetchError } = await supabase
          .from('scenarios')
          .select('*')
          .eq('id', scenarioId)
          .single();
        
        if (fetchError) {
          console.error(`Error fetching scenario ${scenarioId}:`, fetchError);
          continue;
        }
        
        if (!originalScenario) continue;
        
        // Create a new scenario with the same content but for the new campaign
        const { error: insertError } = await supabase
          .from('scenarios')
          .insert({
            title: originalScenario.title,
            description: originalScenario.description,
            content: originalScenario.content,
            campaign_id: targetCampaignId,
            user_id: user?.id
          });
        
        if (insertError) {
          console.error(`Error cloning scenario ${scenarioId}:`, insertError);
        }
      }
    } catch (error) {
      console.error('Error in cloneScenarios:', error);
    }
  };
  
  const addMember = () => {
    if (!newMemberEmail) {
      setFormError('Please enter an email address');
      return;
    }
    
    // Check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMemberEmail)) {
      setFormError('Please enter a valid email address');
      return;
    }
    
    // Check if member already exists
    if (members.some(member => member.email === newMemberEmail)) {
      setFormError('This email is already added to the campaign');
      return;
    }
    
    // Add new member
    setMembers([
      ...members,
      {
        email: newMemberEmail,
        role: newMemberRole,
        status: 'invited'
      }
    ]);
    
    // Clear form
    setNewMemberEmail('');
    setFormError('');
    setInviteSuccess(`${newMemberEmail} added. They will receive an invitation when you save the campaign.`);
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      setInviteSuccess(null);
    }, 5000);
  };
  
  const removeMember = (email: string) => {
    setMembers(members.filter(member => member.email !== email));
  };
  
  const updateMemberRole = (email: string, role: 'player' | 'game_master' | 'spectator') => {
    setMembers(members.map(member => 
      member.email === email ? { ...member, role } : member
    ));
  };
  
  const toggleScenarioSelection = (scenarioId: string) => {
    if (importedScenarios.includes(scenarioId)) {
      setImportedScenarios(importedScenarios.filter(id => id !== scenarioId));
    } else {
      setImportedScenarios([...importedScenarios, scenarioId]);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('details')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Campaign Details
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'members'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Campaign Members
            </button>
            <button
              onClick={() => setActiveTab('scenarios')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'scenarios'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Import Scenarios
            </button>
          </nav>
        </div>
        
        {activeTab === 'details' && (
          <div className="p-6">
            <form className="space-y-4">
              {(error || formError) && activeTab === 'details' && (
                <div className="bg-red-50 p-4 rounded-md">
                  <p className="text-sm text-red-700">{error || formError}</p>
                </div>
              )}
              
              <Input
                label="Campaign Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter campaign title"
                required
              />
              
              <TextArea
                label="Description *"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your campaign"
                rows={4}
                required
              />
              
              <Input
                label="Cover Image URL (optional)"
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
                    className="h-40 w-full object-cover rounded-md"
                    onError={() => setImageUrl('')}
                  />
                </div>
              )}
            </form>
          </div>
        )}
        
        {activeTab === 'members' && (
          <div className="p-6">
            <div className="space-y-6">
              {(error || formError) && activeTab === 'members' && (
                <div className="bg-red-50 p-4 rounded-md">
                  <p className="text-sm text-red-700">{error || formError}</p>
                </div>
              )}
              
              {inviteSuccess && (
                <div className="bg-green-50 p-4 rounded-md">
                  <p className="text-sm text-green-700">{inviteSuccess}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Members</h3>
                
                {members.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-md">
                    <UserPlus className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No members added yet</p>
                    <p className="text-xs text-gray-400">Add members below to invite them to your campaign</p>
                  </div>
                ) : (
                  <div className="border rounded-md divide-y">
                    {members.map((member) => (
                      <div key={member.email} className="p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-500 font-medium">{member.email.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{member.email}</p>
                            <div className="flex items-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                member.status === 'invited' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {member.status === 'invited' ? 'Will be invited' : 'Active'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <select
                            value={member.role}
                            onChange={(e) => updateMemberRole(member.email, e.target.value as any)}
                            className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          >
                            <option value="player">Player</option>
                            <option value="game_master">Game Master</option>
                            <option value="spectator">Spectator</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => removeMember(member.email)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Add New Member</h4>
                <div className="flex space-x-2">
                  <div className="flex-grow">
                    <Input
                      placeholder="Email address"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value as any)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="player">Player</option>
                      <option value="game_master">Game Master</option>
                      <option value="spectator">Spectator</option>
                    </select>
                  </div>
                  <Button 
                    type="button" 
                    onClick={addMember}
                  >
                    <UserPlus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Members will receive an invitation email when you save the campaign
                </p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'scenarios' && (
          <div className="p-6">
            <div className="space-y-6">
              {(error || formError) && activeTab === 'scenarios' && (
                <div className="bg-red-50 p-4 rounded-md">
                  <p className="text-sm text-red-700">{error || formError}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Import Existing Scenarios</h3>
                
                {allScenarios.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-md">
                    <BookOpen className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No scenarios available to import</p>
                    <p className="text-xs text-gray-400">Create scenarios in other campaigns first</p>
                  </div>
                ) : (
                  <div className="border rounded-md divide-y">
                    {allScenarios.map((scenario) => (
                      <div key={scenario.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-indigo-500" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{scenario.title}</p>
                            <p className="text-xs text-gray-500 truncate max-w-md">{scenario.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                              checked={importedScenarios.includes(scenario.id)}
                              onChange={() => toggleScenarioSelection(scenario.id)}
                            />
                            <span className="ml-2 text-sm text-gray-600">
                              {importedScenarios.includes(scenario.id) ? 'Selected' : 'Select'}
                            </span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {importedScenarios.length > 0 && (
                  <div className="mt-4 bg-indigo-50 p-4 rounded-md">
                    <p className="text-sm text-indigo-700">
                      <strong>{importedScenarios.length}</strong> scenario{importedScenarios.length !== 1 ? 's' : ''} selected for import. 
                      These will be copied to your new campaign when you save.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/campaigns')}
        >
          Cancel
        </Button>
        <Button 
          type="button" 
          onClick={handleSubmit} 
          isLoading={loading || isSendingInvites}
        >
          {isEditing ? 'Update Campaign' : 'Create Campaign'}
        </Button>
      </div>
    </div>
  );
};

export default CampaignForm;