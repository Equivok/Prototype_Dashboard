import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCampaignStore } from '../../store/campaignStore';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ScenarioCard from '../../components/scenarios/ScenarioCard';
import NpcCard from '../../components/npcs/NpcCard';
import SessionCard from '../../components/sessions/SessionCard';
import { Plus, BookOpen, Users, Calendar, UserPlus, X, Mail } from 'lucide-react';
import Input from '../../components/ui/Input';
import { sendCampaignInvitation } from '../../lib/emailService';
import { supabase } from '../../lib/supabase';

interface CampaignMember {
  email: string;
  role: 'player' | 'game_master' | 'spectator';
  status: 'invited' | 'active';
}

interface DatabaseUser {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
}

const CampaignDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { 
    campaigns, 
    fetchCampaigns, 
    updateCampaign,
    setCurrentCampaign,
    scenarios,
    fetchScenarios,
    deleteScenario,
    npcs,
    fetchNpcs,
    deleteNpc,
    sessions,
    fetchSessions,
    deleteSession,
    fetchAllScenarios,
    allScenarios
  } = useCampaignStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'scenarios' | 'npcs' | 'sessions' | 'members'>('scenarios');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'player' | 'game_master' | 'spectator'>('player');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [databaseUsers, setDatabaseUsers] = useState<DatabaseUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    const loadCampaign = async () => {
      if (campaigns.length === 0) {
        await fetchCampaigns();
      }
      
      const campaign = campaigns.find(c => c.id === id);
      if (campaign) {
        setCurrentCampaign(campaign);
        await Promise.all([
          fetchScenarios(campaign.id),
          fetchNpcs(campaign.id),
          fetchSessions(campaign.id)
        ]);
      }
      
      setLoading(false);
    };
    
    loadCampaign();
  }, [
    user, 
    navigate, 
    id, 
    campaigns, 
    fetchCampaigns, 
    setCurrentCampaign, 
    fetchScenarios, 
    fetchNpcs, 
    fetchSessions
  ]);

  useEffect(() => {
    const fetchDatabaseUsers = async () => {
      if (!user || !id) return;
      
      setIsLoadingUsers(true);
      try {
        // Fetch users directly from auth.users using a function
        const { data, error } = await supabase.rpc('get_all_users');
        
        if (error) {
          console.error('Error fetching users:', error);
          
          // Fallback to profiles table if RPC fails
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, email');
            
          if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
            return;
          }
          
          if (profilesData && profilesData.length > 0) {
            const usersWithEmail = profilesData
              .filter(profile => profile.email)
              .map(profile => ({
                id: profile.id,
                email: profile.email || '',
                username: profile.username,
                avatar_url: profile.avatar_url
              }));
            
            setDatabaseUsers(usersWithEmail);
          }
          return;
        }
        
        if (data && data.length > 0) {
          setDatabaseUsers(data);
        }
      } catch (error) {
        console.error('Error in fetchDatabaseUsers:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    
    // Only fetch users when the members tab is active
    if (activeTab === 'members') {
      fetchDatabaseUsers();
    }
  }, [activeTab, user, id]);

  // Fetch all scenarios when import modal is opened
  useEffect(() => {
    if (showImportModal && user) {
      fetchAllScenarios();
    }
  }, [showImportModal, user, fetchAllScenarios]);
  
  if (!user || !id) {
    return null;
  }
  
  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <p className="text-center py-8">Loading campaign...</p>
        </div>
      </Layout>
    );
  }
  
  const campaign = campaigns.find(c => c.id === id);
  
  if (!campaign) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <p className="text-center py-8">Campaign not found.</p>
        </div>
      </Layout>
    );
  }
  
  const members = campaign.members as CampaignMember[] || [];
  const isOwner = campaign.user_id === user.id;
  
  const handleDeleteScenario = async (scenarioId: string) => {
    if (window.confirm('Are you sure you want to delete this scenario? This action cannot be undone.')) {
      await deleteScenario(scenarioId);
    }
  };
  
  const handleDeleteNpc = async (npcId: string) => {
    if (window.confirm('Are you sure you want to delete this NPC? This action cannot be undone.')) {
      await deleteNpc(npcId);
    }
  };
  
  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      await deleteSession(sessionId);
    }
  };

  const addMember = async () => {
    if (!isOwner) return;
    
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
    
    try {
      setIsSaving(true);
      setFormError('');
      setInviteSuccess(null);
      
      // Add new member
      const updatedMembers = [
        ...members,
        {
          email: newMemberEmail,
          role: newMemberRole,
          status: 'invited'
        }
      ];
      
      await updateCampaign(campaign.id, {
        members: updatedMembers
      });
      
      // Send magic link invitation
      const inviteResult = await sendCampaignInvitation(
        newMemberEmail,
        campaign.id,
        campaign.title,
        user.email || 'Campaign Owner'
      );
      
      if (!inviteResult.success) {
        setFormError(`Member added but invitation email failed: ${inviteResult.error}`);
      } else {
        setInviteSuccess(`Invitation sent to ${newMemberEmail}`);
      }
      
      // Clear form
      setNewMemberEmail('');
    } catch (error) {
      console.error('Error adding member:', error);
      setFormError('Failed to add member. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const removeMember = async (email: string) => {
    if (!isOwner) return;
    
    try {
      setIsSaving(true);
      
      const updatedMembers = members.filter(member => member.email !== email);
      
      await updateCampaign(campaign.id, {
        members: updatedMembers.length > 0 ? updatedMembers : null
      });
      
      setFormError('');
    } catch (error) {
      console.error('Error removing member:', error);
      setFormError('Failed to remove member. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const updateMemberRole = async (email: string, role: 'player' | 'game_master' | 'spectator') => {
    if (!isOwner) return;
    
    try {
      setIsSaving(true);
      
      const updatedMembers = members.map(member => 
        member.email === email ? { ...member, role } : member
      );
      
      await updateCampaign(campaign.id, {
        members: updatedMembers
      });
      
      setFormError('');
    } catch (error) {
      console.error('Error updating member role:', error);
      setFormError('Failed to update member role. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const resendInvitation = async (email: string) => {
    if (!isOwner) return;
    
    try {
      setIsSaving(true);
      setFormError('');
      setInviteSuccess(null);
      
      // Send magic link invitation
      const inviteResult = await sendCampaignInvitation(
        email,
        campaign.id,
        campaign.title,
        user.email || 'Campaign Owner'
      );
      
      if (!inviteResult.success) {
        setFormError(`Failed to resend invitation: ${inviteResult.error}`);
      } else {
        setInviteSuccess(`Invitation resent to ${email}`);
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      setFormError('Failed to resend invitation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const addExistingUser = async (email: string) => {
    if (!isOwner) return;
    
    // Check if member already exists
    if (members.some(member => member.email === email)) {
      setFormError('This user is already added to the campaign');
      return;
    }
    
    try {
      setIsSaving(true);
      setFormError('');
      setInviteSuccess(null);
      
      // Add new member
      const updatedMembers = [
        ...members,
        {
          email: email,
          role: 'player', // Default role
          status: 'invited'
        }
      ];
      
      await updateCampaign(campaign.id, {
        members: updatedMembers
      });
      
      // Send magic link invitation
      const inviteResult = await sendCampaignInvitation(
        email,
        campaign.id,
        campaign.title,
        user.email || 'Campaign Owner'
      );
      
      if (!inviteResult.success) {
        setFormError(`Member added but invitation email failed: ${inviteResult.error}`);
      } else {
        setInviteSuccess(`Invitation sent to ${email}`);
      }
    } catch (error) {
      console.error('Error adding existing user:', error);
      setFormError('Failed to add user. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleScenarioSelection = (scenarioId: string) => {
    if (selectedScenarios.includes(scenarioId)) {
      setSelectedScenarios(selectedScenarios.filter(id => id !== scenarioId));
    } else {
      setSelectedScenarios([...selectedScenarios, scenarioId]);
    }
  };

  const importSelectedScenarios = async () => {
    if (selectedScenarios.length === 0) {
      return;
    }

    setIsSaving(true);
    setFormError('');
    setImportSuccess(null);

    try {
      // Clone each selected scenario
      for (const scenarioId of selectedScenarios) {
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
        
        // Create a new scenario with the same content but for this campaign
        const { error: insertError } = await supabase
          .from('scenarios')
          .insert({
            title: originalScenario.title,
            description: originalScenario.description,
            content: originalScenario.content,
            campaign_id: campaign.id,
            user_id: user.id
          });
        
        if (insertError) {
          console.error(`Error cloning scenario ${scenarioId}:`, insertError);
          setFormError('Error importing some scenarios. Please try again.');
        }
      }

      // Refresh scenarios
      await fetchScenarios(campaign.id);
      
      setImportSuccess(`Successfully imported ${selectedScenarios.length} scenario${selectedScenarios.length !== 1 ? 's' : ''}`);
      setSelectedScenarios([]);
      
      // Close modal after a delay
      setTimeout(() => {
        setShowImportModal(false);
        setImportSuccess(null);
      }, 2000);
    } catch (error) {
      console.error('Error importing scenarios:', error);
      setFormError('Failed to import scenarios. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Campaign Header */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="md:flex">
            <div className="md:flex-shrink-0">
              {campaign.image_url ? (
                <img
                  className="h-48 w-full object-cover md:w-48"
                  src={campaign.image_url}
                  alt={campaign.title}
                />
              ) : (
                <div className="h-48 w-full bg-indigo-100 flex items-center justify-center md:w-48">
                  <BookOpen className="h-12 w-12 text-indigo-500" />
                </div>
              )}
            </div>
            <div className="p-8">
              <div className="flex justify-between">
                <h1 className="text-2xl font-bold text-gray-900">{campaign.title}</h1>
                {isOwner && (
                  <Link to={`/campaigns/${campaign.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit Campaign
                    </Button>
                  </Link>
                )}
              </div>
              <p className="mt-2 text-gray-600">{campaign.description}</p>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('scenarios')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'scenarios'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookOpen className="h-5 w-5 inline-block mr-1" />
              Scenarios
            </button>
            <button
              onClick={() => setActiveTab('npcs')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'npcs'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="h-5 w-5 inline-block mr-1" />
              NPCs
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sessions'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="h-5 w-5 inline-block mr-1" />
              Sessions
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'members'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserPlus className="h-5 w-5 inline-block mr-1" />
              Members
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="mb-6">
          {activeTab === 'scenarios' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Scenarios</h2>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowImportModal(true)}
                  >
                    <BookOpen className="h-4 w-4 mr-1" /> Import Scenarios
                  </Button>
                  <Link to={`/campaigns/${campaign.id}/scenarios/new`}>
                    <Button>
                      <Plus className="h-4 w-4 mr-1" /> New Scenario
                    </Button>
                  </Link>
                </div>
              </div>
              
              {scenarios.length === 0 ? (
                <Card>
                  <div className="py-8 text-center">
                    <BookOpen className="h-12 w-12 mx-auto text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No scenarios</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating a new scenario or importing existing ones.
                    </p>
                    <div className="mt-6 flex justify-center space-x-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowImportModal(true)}
                      >
                        <BookOpen className="h-4 w-4 mr-1" /> Import Scenarios
                      </Button>
                      <Link to={`/campaigns/${campaign.id}/scenarios/new`}>
                        <Button>
                          <Plus className="h-4 w-4 mr-1" /> New Scenario
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {scenarios.map((scenario) => (
                    <ScenarioCard
                      key={scenario.id}
                      scenario={scenario}
                      onDelete={handleDeleteScenario}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'npcs' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">NPCs</h2>
                <Link to={`/campaigns/${campaign.id}/npcs/new`}>
                  <Button>
                    <Plus className="h-4 w-4 mr-1" /> New NPC
                  </Button>
                </Link>
              </div>
              
              {npcs.length === 0 ? (
                <Card>
                  <div className="py-8 text-center">
                    <Users className="h-12 w-12 mx-auto text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No NPCs</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating a new NPC.
                    </p>
                    <div className="mt-6">
                      <Link to={`/campaigns/${campaign.id}/npcs/new`}>
                        <Button>
                          <Plus className="h-4 w-4 mr-1" /> New NPC
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {npcs.map((npc) => (
                    <NpcCard
                      key={npc.id}
                      npc={npc}
                      onDelete={handleDeleteNpc}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'sessions' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Sessions</h2>
                <Link to={`/campaigns/${campaign.id}/sessions/new`}>
                  <Button>
                    <Plus className="h-4 w-4 mr-1" /> New Session
                  </Button>
                </Link>
              </div>
              
              {sessions.length === 0 ? (
                <Card>
                  <div className="py-8 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating a new session.
                    </p>
                    <div className="mt-6">
                      <Link to={`/campaigns/${campaign.id}/sessions/new`}>
                        <Button>
                          <Plus className="h-4 w-4 mr-1" /> New Session
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onDelete={handleDeleteSession}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'members' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Campaign Members</h2>
              </div>
              
              <Card>
                <div className="divide-y">
                  <div className="px-4 py-3 bg-gray-50">
                    <div className="grid grid-cols-12 text-sm font-medium text-gray-500">
                      <div className="col-span-5">Member</div>
                      <div className="col-span-3">Role</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Actions</div>
                    </div>
                  </div>
                  
                  {/* Campaign Owner */}
                  <div className="px-4 py-3">
                    <div className="grid grid-cols-12 items-center">
                      <div className="col-span-5 flex items-center">
                        <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-indigo-500 font-medium">
                            {user.email?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.email}</p>
                          <p className="text-xs text-gray-500">Campaign Owner</p>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          Game Master
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                      <div className="col-span-2">
                        {/* No actions for owner */}
                      </div>
                    </div>
                  </div>
                  
                  {/* Other Members */}
                  {members.map((member) => (
                    <div key={member.email} className="px-4 py-3">
                      <div className="grid grid-cols-12 items-center">
                        <div className="col-span-5 flex items-center">
                          <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-indigo-500 font-medium">
                              {member.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{member.email}</p>
                          </div>
                        </div>
                        <div className="col-span-3">
                          {isOwner ? (
                            <select
                              value={member.role}
                              onChange={(e) => updateMemberRole(member.email, e.target.value as any)}
                              className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              disabled={isSaving}
                            >
                              <option value="player">Player</option>
                              <option value="game_master">Game Master</option>
                              <option value="spectator">Spectator</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              member.role === 'game_master' 
                                ? 'bg-indigo-100 text-indigo-800'
                                : member.role === 'player'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {member.role === 'game_master' 
                                ? 'Game Master' 
                                : member.role === 'player' 
                                ? 'Player' 
                                : 'Spectator'}
                            </span>
                          )}
                        </div>
                        <div className="col-span-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            member.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {member.status === 'active' ? 'Active' : 'Invited'}
                          </span>
                        </div>
                        <div className="col-span-2 flex space-x-2">
                          {isOwner && member.status === 'invited' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => resendInvitation(member.email)}
                              className="text-indigo-500 hover:bg-indigo-50"
                              disabled={isSaving}
                            >
                              <Mail className="h-4 w-4 mr-1" /> Resend
                            </Button>
                          )}
                          {isOwner && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => removeMember(member.email)}
                              className="text-red-500 hover:bg-red-50"
                              disabled={isSaving}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Member Form (only for owner) */}
                  {isOwner && (
                    <div className="px-4 py-4 bg-gray-50">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Add New Member</h3>
                      
                      {inviteSuccess && (
                        <div className="mb-3 bg-green-50 p-3 rounded-md">
                          <p className="text-sm text-green-700">{inviteSuccess}</p>
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                        <div className="flex-grow">
                          <Input
                            placeholder="Email address"
                            value={newMemberEmail}
                            onChange={(e) => setNewMemberEmail(e.target.value)}
                            className="w-full"
                            disabled={isSaving}
                          />
                        </div>
                        <div>
                          <select
                            value={newMemberRole}
                            onChange={(e) => setNewMemberRole(e.target.value as any)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            disabled={isSaving}
                          >
                            <option value="player">Player</option>
                            <option value="game_master">Game Master</option>
                            <option value="spectator">Spectator</option>
                          </select>
                        </div>
                        <Button 
                          type="button" 
                          onClick={addMember}
                          isLoading={isSaving}
                        >
                          <UserPlus className="h-4 w-4 mr-1" /> Add & Invite
                        </Button>
                      </div>
                      {formError && (
                        <p className="mt-2 text-sm text-red-600">{formError}</p>
                      )}
                      <p className="mt-2 text-xs text-gray-500">
                        A magic link invitation will be sent to the email address
                      </p>
                    </div>
                  )}

                  {/* Database Users Section */}
                  {isOwner && (
                    <div className="px-4 py-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Add Existing Users</h3>
                      
                      {isLoadingUsers ? (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500">Loading users...</p>
                        </div>
                      ) : databaseUsers.length > 0 ? (
                        <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
                          {databaseUsers
                            .filter(dbUser => 
                              // Filter out users who are already members or the campaign owner
                              dbUser.email !== user.email && 
                              !members.some(member => member.email === dbUser.email)
                            )
                            .map((dbUser) => (
                              <div key={dbUser.id} className="p-3 flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-indigo-500 font-medium">
                                      {dbUser.email.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{dbUser.email}</p>
                                    {dbUser.username && (
                                      <p className="text-xs text-gray-500">{dbUser.username}</p>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addExistingUser(dbUser.email)}
                                  disabled={isSaving}
                                >
                                  <UserPlus className="h-4 w-4 mr-1" /> Add
                                </Button>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-500">No other users found in the database.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Import Scenarios Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Import Scenarios</h3>
              <button 
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="px-6 py-4 flex-grow overflow-y-auto">
              {formError && (
                <div className="mb-4 bg-red-50 p-3 rounded-md">
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}
              
              {importSuccess && (
                <div className="mb-4 bg-green-50 p-3 rounded-md">
                  <p className="text-sm text-green-700">{importSuccess}</p>
                </div>
              )}
              
              <p className="text-sm text-gray-600 mb-4">
                Select scenarios from your other campaigns to import into this campaign.
                Each scenario will be copied with all its content.
              </p>
              
              {allScenarios.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No scenarios available to import</p>
                  <p className="text-xs text-gray-400">Create scenarios in other campaigns first</p>
                </div>
              ) : (
                <div className="border rounded-md divide-y">
                  {allScenarios
                    // Filter out scenarios that are already in this campaign
                    .filter(scenario => scenario.campaign_id !== campaign.id)
                    .map((scenario) => (
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
                              checked={selectedScenarios.includes(scenario.id)}
                              onChange={() => toggleScenarioSelection(scenario.id)}
                            />
                            <span className="ml-2 text-sm text-gray-600">
                              {selectedScenarios.includes(scenario.id) ? 'Selected' : 'Select'}
                            </span>
                          </label>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowImportModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={importSelectedScenarios}
                disabled={selectedScenarios.length === 0 || isSaving}
                isLoading={isSaving}
              >
                Import {selectedScenarios.length > 0 ? `(${selectedScenarios.length})` : ''}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CampaignDetailsPage;