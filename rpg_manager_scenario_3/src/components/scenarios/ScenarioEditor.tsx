import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCampaignStore } from '../../store/campaignStore';
import Button from '../ui/Button';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Card from '../ui/Card';
import { Database } from '../../types/supabase';
import { Plus, Trash2, GitBranch, FileText, List, CheckSquare, BookOpen, Briefcase, FileBox, GitMerge, ArrowRight, Search, X } from 'lucide-react';

type Scenario = Database['public']['Tables']['scenarios']['Row'];
type NPC = Database['public']['Tables']['npcs']['Row'];

interface ScenarioEditorProps {
  isEditing?: boolean;
  scenarioId?: string;
  campaignId: string;
  initialData?: {
    title: string;
    description: string;
    content: any;
  };
}

// Define the structure for scenario content
interface ScenarioContent {
  sections: ScenarioSection[];
  consequences: ScenarioConsequence[];
  deliverables: ScenarioDeliverable[];
  choices: ScenarioChoice[];
}

interface ScenarioSection {
  id: string;
  title: string;
  content: string;
  type: 'mission' | 'character' | 'note' | 'resource';
  npcId?: string | null;
}

interface ScenarioConsequence {
  id: string;
  title: string;
  description: string;
  condition: string;
  outcome: string;
}

interface ScenarioDeliverable {
  id: string;
  title: string;
  objective: string;
  instructions: { id: string; text: string }[];
  criteria: { id: string; text: string }[];
  status: 'pending' | 'completed';
}

interface ScenarioChoice {
  id: string;
  title: string;
  description: string;
  options: ScenarioOption[];
}

interface ScenarioOption {
  id: string;
  text: string;
  outcome: string;
  consequences: OptionConsequence[];
}

interface OptionConsequence {
  id: string;
  description: string;
  impact: string;
}

const ScenarioEditor: React.FC<ScenarioEditorProps> = ({
  isEditing = false,
  scenarioId,
  campaignId,
  initialData = { title: '', description: '', content: { sections: [], consequences: [], deliverables: [], choices: [] } },
}) => {
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description);
  const [content, setContent] = useState<ScenarioContent>(() => {
    // Initialize content with proper structure, ensuring options have consequences array
    const initialContent = initialData.content as ScenarioContent || { 
      sections: [], 
      consequences: [], 
      deliverables: [], 
      choices: [] 
    };
    
    // Make sure all options have a consequences array
    if (initialContent.choices) {
      initialContent.choices = initialContent.choices.map(choice => ({
        ...choice,
        options: choice.options.map(option => ({
          ...option,
          consequences: option.consequences || []
        }))
      }));
    }
    
    return initialContent;
  });
  const [formError, setFormError] = useState('');
  const [showNpcSelector, setShowNpcSelector] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user } = useAuthStore();
  const { 
    createScenario, 
    updateScenario, 
    loading, 
    error,
    npcs,
    fetchNpcs
  } = useCampaignStore();
  const navigate = useNavigate();
  
  // Fetch NPCs when component mounts
  useEffect(() => {
    if (campaignId) {
      fetchNpcs(campaignId);
    }
  }, [campaignId, fetchNpcs]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    if (!title || !description) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    if (!user) {
      setFormError('You must be logged in to create a scenario');
      return;
    }
    
    try {
      if (isEditing && scenarioId) {
        await updateScenario(scenarioId, {
          title,
          description,
          content,
        });
      } else {
        await createScenario({
          title,
          description,
          content,
          campaign_id: campaignId,
          user_id: user.id,
        });
      }
      
      navigate(`/campaigns/${campaignId}`);
    } catch (err) {
      console.error('Error saving scenario:', err);
    }
  };
  
  // Section management
  const addSection = (type: 'mission' | 'character' | 'note' | 'resource') => {
    const newSection: ScenarioSection = {
      id: Date.now().toString(),
      title: type === 'mission' ? 'New Mission' : 
             type === 'character' ? 'New Character' : 
             type === 'resource' ? 'New Resource' : 'New Note',
      content: '',
      type,
      npcId: null
    };
    
    setContent({
      ...content,
      sections: [...content.sections, newSection],
    });
    
    // If it's a character section, open the NPC selector
    if (type === 'character') {
      setCurrentSectionId(newSection.id);
      setShowNpcSelector(true);
    }
  };
  
  const updateSection = (id: string, field: keyof ScenarioSection, value: string) => {
    setContent({
      ...content,
      sections: content.sections.map(section => 
        section.id === id ? { ...section, [field]: value } : section
      ),
    });
  };
  
  const removeSection = (id: string) => {
    setContent({
      ...content,
      sections: content.sections.filter(section => section.id !== id),
    });
  };
  
  const moveSection = (id: string, direction: 'up' | 'down') => {
    const index = content.sections.findIndex(section => section.id === id);
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === content.sections.length - 1)
    ) {
      return;
    }
    
    const newSections = [...content.sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    
    setContent({
      ...content,
      sections: newSections,
    });
  };
  
  // NPC selection
  const openNpcSelector = (sectionId: string) => {
    setCurrentSectionId(sectionId);
    setShowNpcSelector(true);
  };
  
  const selectNpc = (npcId: string) => {
    if (!currentSectionId) return;
    
    // Find the NPC
    const selectedNpc = npcs.find(npc => npc.id === npcId);
    if (!selectedNpc) return;
    
    // Update the section with NPC data
    setContent({
      ...content,
      sections: content.sections.map(section => 
        section.id === currentSectionId 
          ? { 
              ...section, 
              npcId: npcId,
              title: selectedNpc.name,
              content: selectedNpc.description
            } 
          : section
      ),
    });
    
    setShowNpcSelector(false);
    setCurrentSectionId(null);
    setSearchQuery('');
  };
  
  const clearNpc = (sectionId: string) => {
    setContent({
      ...content,
      sections: content.sections.map(section => 
        section.id === sectionId 
          ? { 
              ...section, 
              npcId: null
            } 
          : section
      ),
    });
  };
  
  // Consequence management
  const addConsequence = () => {
    const newConsequence: ScenarioConsequence = {
      id: Date.now().toString(),
      title: 'New Consequence',
      description: '',
      condition: '',
      outcome: '',
    };
    
    setContent({
      ...content,
      consequences: [...(content.consequences || []), newConsequence],
    });
  };
  
  const updateConsequence = (id: string, field: keyof ScenarioConsequence, value: string) => {
    setContent({
      ...content,
      consequences: (content.consequences || []).map(consequence => 
        consequence.id === id ? { ...consequence, [field]: value } : consequence
      ),
    });
  };
  
  const removeConsequence = (id: string) => {
    setContent({
      ...content,
      consequences: (content.consequences || []).filter(consequence => consequence.id !== id),
    });
  };

  // Deliverable management
  const addDeliverable = () => {
    const newDeliverable: ScenarioDeliverable = {
      id: Date.now().toString(),
      title: 'New Deliverable',
      objective: '',
      instructions: [{ id: Date.now().toString() + '-1', text: '' }],
      criteria: [{ id: Date.now().toString() + '-2', text: '' }],
      status: 'pending',
    };
    
    setContent({
      ...content,
      deliverables: [...(content.deliverables || []), newDeliverable],
    });
  };
  
  const updateDeliverable = (id: string, field: 'title' | 'objective' | 'status', value: string | 'pending' | 'completed') => {
    setContent({
      ...content,
      deliverables: (content.deliverables || []).map(deliverable => 
        deliverable.id === id ? { ...deliverable, [field]: value } : deliverable
      ),
    });
  };
  
  const removeDeliverable = (id: string) => {
    setContent({
      ...content,
      deliverables: (content.deliverables || []).filter(deliverable => deliverable.id !== id),
    });
  };
  
  const addInstruction = (deliverableId: string) => {
    setContent({
      ...content,
      deliverables: (content.deliverables || []).map(deliverable => 
        deliverable.id === deliverableId 
          ? { 
              ...deliverable, 
              instructions: [
                ...deliverable.instructions, 
                { id: Date.now().toString(), text: '' }
              ] 
            } 
          : deliverable
      ),
    });
  };
  
  const updateInstruction = (deliverableId: string, instructionId: string, text: string) => {
    setContent({
      ...content,
      deliverables: (content.deliverables || []).map(deliverable => 
        deliverable.id === deliverableId 
          ? { 
              ...deliverable, 
              instructions: deliverable.instructions.map(instruction => 
                instruction.id === instructionId 
                  ? { ...instruction, text } 
                  : instruction
              ) 
            } 
          : deliverable
      ),
    });
  };
  
  const removeInstruction = (deliverableId: string, instructionId: string) => {
    setContent({
      ...content,
      deliverables: (content.deliverables || []).map(deliverable => 
        deliverable.id === deliverableId 
          ? { 
              ...deliverable, 
              instructions: deliverable.instructions.filter(instruction => 
                instruction.id !== instructionId
              ) 
            } 
          : deliverable
      ),
    });
  };
  
  const addCriterion = (deliverableId: string) => {
    setContent({
      ...content,
      deliverables: (content.deliverables || []).map(deliverable => 
        deliverable.id === deliverableId 
          ? { 
              ...deliverable, 
              criteria: [
                ...deliverable.criteria, 
                { id: Date.now().toString(), text: '' }
              ] 
            } 
          : deliverable
      ),
    });
  };
  
  const updateCriterion = (deliverableId: string, criterionId: string, text: string) => {
    setContent({
      ...content,
      deliverables: (content.deliverables || []).map(deliverable => 
        deliverable.id === deliverableId 
          ? { 
              ...deliverable, 
              criteria: deliverable.criteria.map(criterion => 
                criterion.id === criterionId 
                  ? { ...criterion, text } 
                  : criterion
              ) 
            } 
          : deliverable
      ),
    });
  };
  
  const removeCriterion = (deliverableId: string, criterionId: string) => {
    setContent({
      ...content,
      deliverables: (content.deliverables || []).map(deliverable => 
        deliverable.id === deliverableId 
          ? { 
              ...deliverable, 
              criteria: deliverable.criteria.filter(criterion => 
                criterion.id !== criterionId
              ) 
            } 
          : deliverable
      ),
    });
  };
  
  // Choice management
  const addChoice = () => {
    const newChoice: ScenarioChoice = {
      id: Date.now().toString(),
      title: 'New Choice Point',
      description: '',
      options: [
        { 
          id: Date.now().toString() + '-1', 
          text: 'Option 1', 
          outcome: '',
          consequences: []
        },
        { 
          id: Date.now().toString() + '-2', 
          text: 'Option 2', 
          outcome: '',
          consequences: []
        }
      ]
    };
    
    setContent({
      ...content,
      choices: [...(content.choices || []), newChoice],
    });
  };
  
  const updateChoice = (id: string, field: 'title' | 'description', value: string) => {
    setContent({
      ...content,
      choices: (content.choices || []).map(choice => 
        choice.id === id ? { ...choice, [field]: value } : choice
      ),
    });
  };
  
  const removeChoice = (id: string) => {
    setContent({
      ...content,
      choices: (content.choices || []).filter(choice => choice.id !== id),
    });
  };
  
  const addOption = (choiceId: string) => {
    const choiceIndex = (content.choices || []).findIndex(choice => choice.id === choiceId);
    if (choiceIndex === -1) return;
    
    const newOptions = [...(content.choices[choiceIndex].options || [])];
    newOptions.push({
      id: Date.now().toString(),
      text: `Option ${newOptions.length + 1}`,
      outcome: '',
      consequences: []
    });
    
    const newChoices = [...(content.choices || [])];
    newChoices[choiceIndex] = {
      ...newChoices[choiceIndex],
      options: newOptions
    };
    
    setContent({
      ...content,
      choices: newChoices
    });
  };
  
  const updateOption = (choiceId: string, optionId: string, field: 'text' | 'outcome', value: string) => {
    setContent({
      ...content,
      choices: (content.choices || []).map(choice => 
        choice.id === choiceId 
          ? { 
              ...choice, 
              options: choice.options.map(option => 
                option.id === optionId 
                  ? { ...option, [field]: value } 
                  : option
              ) 
            } 
          : choice
      ),
    });
  };
  
  const removeOption = (choiceId: string, optionId: string) => {
    setContent({
      ...content,
      choices: (content.choices || []).map(choice => 
        choice.id === choiceId 
          ? { 
              ...choice, 
              options: choice.options.filter(option => option.id !== optionId) 
            } 
          : choice
      ),
    });
  };
  
  // Option Consequence management
  const addOptionConsequence = (choiceId: string, optionId: string) => {
    const newConsequence: OptionConsequence = {
      id: Date.now().toString(),
      description: '',
      impact: ''
    };
    
    setContent({
      ...content,
      choices: (content.choices || []).map(choice => 
        choice.id === choiceId 
          ? { 
              ...choice, 
              options: choice.options.map(option => 
                option.id === optionId 
                  ? { 
                      ...option, 
                      consequences: [...(option.consequences || []), newConsequence] 
                    } 
                  : option
              ) 
            } 
          : choice
      ),
    });
  };
  
  const updateOptionConsequence = (
    choiceId: string, 
    optionId: string, 
    consequenceId: string, 
    field: 'description' | 'impact', 
    value: string
  ) => {
    setContent({
      ...content,
      choices: (content.choices || []).map(choice => 
        choice.id === choiceId 
          ? { 
              ...choice, 
              options: choice.options.map(option => 
                option.id === optionId 
                  ? { 
                      ...option, 
                      consequences: (option.consequences || []).map(consequence =>
                        consequence.id === consequenceId
                          ? { ...consequence, [field]: value }
                          : consequence
                      )
                    } 
                  : option
              ) 
            } 
          : choice
      ),
    });
  };
  
  const removeOptionConsequence = (choiceId: string, optionId: string, consequenceId: string) => {
    setContent({
      ...content,
      choices: (content.choices || []).map(choice => 
        choice.id === choiceId 
          ? { 
              ...choice, 
              options: choice.options.map(option => 
                option.id === optionId 
                  ? { 
                      ...option, 
                      consequences: (option.consequences || []).filter(
                        consequence => consequence.id !== consequenceId
                      )
                    } 
                  : option
              ) 
            } 
          : choice
      ),
    });
  };
  
  // Filter NPCs based on search query
  const filteredNpcs = searchQuery 
    ? npcs.filter(npc => 
        npc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        npc.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : npcs;
  
  return (
    <div className="space-y-6">
      <Card title={isEditing ? 'Edit Scenario' : 'Create New Scenario'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {(error || formError) && (
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-sm text-red-700">{error || formError}</p>
            </div>
          )}
          
          <Input
            label="Scenario Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter scenario title"
            required
          />
          
          <TextArea
            label="Description *"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your scenario"
            rows={3}
            required
          />
        </form>
      </Card>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap gap-2 items-center">
          <h3 className="text-lg font-medium text-gray-900 mr-4">Détails</h3>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => addSection('mission')}
            className="text-indigo-600"
          >
            <Plus className="h-4 w-4 mr-1" /> Mission
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => addSection('character')}
            className="text-green-600"
          >
            <Plus className="h-4 w-4 mr-1" /> Character
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => addSection('resource')}
            className="text-orange-600"
          >
            <Plus className="h-4 w-4 mr-1" /> Resource
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => addSection('note')}
            className="text-amber-600"
          >
            <Plus className="h-4 w-4 mr-1" /> Note
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addConsequence}
            className="text-purple-600"
          >
            <GitBranch className="h-4 w-4 mr-1" /> Consequence
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addChoice}
            className="text-indigo-600"
          >
            <GitMerge className="h-4 w-4 mr-1" /> Choice Point
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addDeliverable}
            className="text-blue-600"
          >
            <FileText className="h-4 w-4 mr-1" /> Deliverable
          </Button>
        </div>
        
        <div className="px-6 py-4 space-y-6">
          {/* Sections */}
          <div className="space-y-4">
            {content.sections.length === 0 && 
             content.consequences.length === 0 && 
             content.choices.length === 0 && 
             content.deliverables.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Votre scénario est vide. Ajoutez des actions en utilisant les boutons ci-dessus.</p>
              </div>
            ) : (
              <>
                {content.sections.map((section, index) => (
                  <div 
                    key={section.id} 
                    className={`border rounded-md p-4 ${
                      section.type === 'mission' 
                        ? 'border-indigo-200 bg-indigo-50' 
                        : section.type === 'character' 
                        ? 'border-green-200 bg-green-50' 
                        : section.type === 'resource'
                        ? 'border-orange-200 bg-orange-50'
                        : 'border-amber-200 bg-amber-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <span className={`inline-block px-2 py-1 text-xs rounded-md mr-2 ${
                          section.type === 'mission' 
                            ? 'bg-indigo-100 text-indigo-800' 
                            : section.type === 'character' 
                            ? 'bg-green-100 text-green-800' 
                            : section.type === 'resource'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {section.type === 'mission' && <Briefcase className="h-3 w-3 inline-block mr-1" />}
                          {section.type === 'character' && <BookOpen className="h-3 w-3 inline-block mr-1" />}
                          {section.type === 'resource' && <FileBox className="h-3 w-3 inline-block mr-1" />}
                          {section.type === 'note' && <FileText className="h-3 w-3 inline-block mr-1" />}
                          {section.type.charAt(0).toUpperCase() + section.type.slice(1)}
                        </span>
                        <Input
                          value={section.title}
                          onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                          className="border-0 bg-transparent font-medium focus:ring-0 p-0"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        {section.type === 'character' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openNpcSelector(section.id)}
                            className="text-green-600"
                          >
                            {section.npcId ? 'Change NPC' : 'Select NPC'}
                          </Button>
                        )}
                        {section.npcId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => clearNpc(section.id)}
                            className="text-red-500"
                          >
                            <X className="h-3 w-3 mr-1" /> Clear NPC
                          </Button>
                        )}
                        <button 
                          type="button" 
                          onClick={() => moveSection(section.id, 'up')}
                          disabled={index === 0}
                          className="text-gray-500 hover:text-gray-700 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button 
                          type="button" 
                          onClick={() => moveSection(section.id, 'down')}
                          disabled={index === content.sections.length - 1}
                          className="text-gray-500 hover:text-gray-700 disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button 
                          type="button" 
                          onClick={() => removeSection(section.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <TextArea
                      value={section.content}
                      onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                      placeholder={`Enter ${section.type} content here...`}
                      rows={4}
                      className="w-full mt-2"
                    />
                    {section.npcId && (
                      <div className="mt-2 text-xs text-green-600">
                        This character is linked to an NPC. Changes made here won't affect the original NPC.
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
          
          {/* Choices */}
          {content.choices && content.choices.length > 0 && (
            <div className="space-y-4">
              {content.choices.map((choice) => (
                <div 
                  key={choice.id} 
                  className="border border-indigo-200 bg-indigo-50 rounded-md p-4"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <span className="inline-block px-2 py-1 text-xs rounded-md mr-2 bg-indigo-100 text-indigo-800">
                        <GitMerge className="h-3 w-3 inline-block mr-1" /> Choice Point
                      </span>
                      <Input
                        value={choice.title}
                        onChange={(e) => updateChoice(choice.id, 'title', e.target.value)}
                        className="border-0 bg-transparent font-medium focus:ring-0 p-0"
                        placeholder="Choice Point Title"
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeChoice(choice.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <TextArea
                      label="Description"
                      value={choice.description}
                      onChange={(e) => updateChoice(choice.id, 'description', e.target.value)}
                      placeholder="Describe the situation where players need to make a choice"
                      rows={2}
                    />
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-gray-700">Options</h4>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => addOption(choice.id)}
                          className="text-indigo-600"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Option
                        </Button>
                      </div>
                      
                      {choice.options.map((option, index) => (
                        <div key={option.id} className="border border-indigo-100 bg-white rounded-md p-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <span className="inline-block px-2 py-1 text-xs rounded-md mr-2 bg-indigo-100 text-indigo-800">
                                Option {index + 1}
                              </span>
                              <Input
                                value={option.text}
                                onChange={(e) => updateOption(choice.id, option.id, 'text', e.target.value)}
                                className="border-0 bg-transparent font-medium focus:ring-0 p-0"
                                placeholder="Option text"
                              />
                            </div>
                            <button 
                              type="button" 
                              onClick={() => removeOption(choice.id, option.id)}
                              className="text-red-500 hover:text-red-700"
                              disabled={choice.options.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="pl-8">
                            <TextArea
                              label={<span className="flex items-center"><ArrowRight className="h-3 w-3 mr-1" /> Outcome</span>}
                              value={option.outcome}
                              onChange={(e) => updateOption(choice.id, option.id, 'outcome', e.target.value)}
                              placeholder="What happens when this option is chosen?"
                              rows={2}
                            />
                          </div>
                          
                          {/* Option Consequences */}
                          <div className="pl-8 pt-2">
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="text-sm font-medium text-gray-700 flex items-center">
                                <GitBranch className="h-3 w-3 mr-1" /> Consequences
                              </h5>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => addOptionConsequence(choice.id, option.id)}
                                className="text-purple-600"
                              >
                                <Plus className="h-3 w-3 mr-1" /> Add Consequence
                              </Button>
                            </div>
                            
                            {option.consequences && option.consequences.length > 0 ? (
                              <div className="space-y-3">
                                {option.consequences.map((consequence) => (
                                  <div key={consequence.id} className="border border-purple-100 bg-purple-50 rounded-md p-3 space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="inline-block px-2 py-1 text-xs rounded-md bg-purple-100 text-purple-800">
                                        <GitBranch className="h-3 w-3 inline-block mr-1" /> Consequence
                                      </span>
                                      <button 
                                        type="button" 
                                        onClick={() => removeOptionConsequence(choice.id, option.id, consequence.id)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                    
                                    <TextArea
                                      label="Description"
                                      value={consequence.description}
                                      onChange={(e) => updateOptionConsequence(choice.id, option.id, consequence.id, 'description', e.target.value)}
                                      placeholder="Describe this consequence"
                                      rows={2}
                                    />
                                    
                                    <TextArea
                                      label="Impact"
                                      value={consequence.impact}
                                      onChange={(e) => updateOptionConsequence(choice.id, option.id, consequence.id, 'impact', e.target.value)}
                                      placeholder="What is the impact of this consequence?"
                                      rows={2}
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 italic">
                                No consequences added yet. Add consequences to track the effects of this option.
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Consequences */}
          {content.consequences && content.consequences.length > 0 && (
            <div className="space-y-4">
              {content.consequences.map((consequence) => (
                <div 
                  key={consequence.id} 
                  className="border border-purple-200 bg-purple-50 rounded-md p-4"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <span className="inline-block px-2 py-1 text-xs rounded-md mr-2 bg-purple-100 text-purple-800">
                        <GitBranch className="h-3 w-3 inline-block mr-1" /> Consequence
                      </span>
                      <Input
                        value={consequence.title}
                        onChange={(e) => updateConsequence(consequence.id, 'title', e.target.value)}
                        className="border-0 bg-transparent font-medium focus:ring-0 p-0"
                        placeholder="Consequence Title"
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeConsequence(consequence.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <TextArea
                      label="Description"
                      value={consequence.description}
                      onChange={(e) => updateConsequence(consequence.id, 'description', e.target.value)}
                      placeholder="Describe this consequence or choice point"
                      rows={2}
                    />
                    
                    <TextArea
                      label="Condition"
                      value={consequence.condition}
                      onChange={(e) => updateConsequence(consequence.id, 'condition', e.target.value)}
                      placeholder="When does this consequence trigger? (e.g., 'If players choose to help the villagers')"
                      rows={2}
                    />
                    
                    <TextArea
                      label="Outcome"
                      value={consequence.outcome}
                      onChange={(e) => updateConsequence(consequence.id, 'outcome', e.target.value)}
                      placeholder="What happens as a result? (e.g., 'The village elder reveals the location of the hidden temple')"
                      rows={3}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Deliverables */}
          {content.deliverables && content.deliverables.length > 0 && (
            <div className="space-y-4">
              {content.deliverables.map((deliverable) => (
                <div 
                  key={deliverable.id} 
                  className="border border-blue-200 bg-blue-50 rounded-md p-4"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <span className="inline-block px-2 py-1 text-xs rounded-md mr-2 bg-blue-100 text-blue-800">
                        <FileText className="h-3 w-3 inline-block mr-1" /> Deliverable
                      </span>
                      <Input
                        value={deliverable.title}
                        onChange={(e) => updateDeliverable(deliverable.id, 'title', e.target.value)}
                        className="border-0 bg-transparent font-medium focus:ring-0 p-0"
                        placeholder="Deliverable Title"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        value={deliverable.status}
                        onChange={(e) => updateDeliverable(deliverable.id, 'status', e.target.value as 'pending' | 'completed')}
                        className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button 
                        type="button" 
                        onClick={() => removeDeliverable(deliverable.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <TextArea
                      label="Objective"
                      value={deliverable.objective}
                      onChange={(e) => updateDeliverable(deliverable.id, 'objective', e.target.value)}
                      placeholder="What is the main objective of this deliverable?"
                      rows={2}
                    />
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">
                          <List className="h-4 w-4 inline-block mr-1" /> Instructions
                        </label>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => addInstruction(deliverable.id)}
                          className="text-blue-600"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Instruction
                        </Button>
                      </div>
                      
                      {deliverable.instructions.map((instruction) => (
                        <div key={instruction.id} className="flex items-start space-x-2">
                          <TextArea
                            value={instruction.text}
                            onChange={(e) => updateInstruction(deliverable.id, instruction.id, e.target.value)}
                            placeholder="Enter instruction"
                            rows={2}
                            className="flex-grow"
                          />
                          <button 
                            type="button" 
                            onClick={() => removeInstruction(deliverable.id, instruction.id)}
                            className="text-red-500 hover:text-red-700 mt-2"
                            disabled={deliverable.instructions.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">
                          <CheckSquare className="h-4 w-4 inline-block mr-1" /> Success Criteria
                        </label>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => addCriterion(deliverable.id)}
                          className="text-blue-600"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Criterion
                        </Button>
                      </div>
                      
                      {deliverable.criteria.map((criterion) => (
                        <div key={criterion.id} className="flex items-start space-x-2">
                          <TextArea
                            value={criterion.text}
                            onChange={(e) => updateCriterion(deliverable.id, criterion.id, e.target.value)}
                            placeholder="Enter success criterion"
                            rows={2}
                            className="flex-grow"
                          />
                          <button 
                            type="button" 
                            onClick={() => removeCriterion(deliverable.id, criterion.id)}
                            className="text-red-500 hover:text-red-700 mt-2"
                            disabled={deliverable.criteria.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(`/campaigns/${campaignId}`)}
        >
          Cancel
        </Button>
        <Button 
          type="button" 
          onClick={handleSubmit} 
          isLoading={loading}
        >
          {isEditing ? 'Update Scenario' : 'Create Scenario'}
        </Button>
      </div>
      
      {/* NPC Selector Modal */}
      {showNpcSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Select an NPC</h3>
              <button 
                onClick={() => {
                  setShowNpcSelector(false);
                  setCurrentSectionId(null);
                  setSearchQuery('');
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="px-6 py-4">
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Search NPCs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex-grow overflow-y-auto px-6 py-2">
              {npcs.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No NPCs available</p>
                  <p className="text-xs text-gray-400">Create NPCs in this campaign first</p>
                </div>
              ) : filteredNpcs.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-500">No NPCs match your search</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredNpcs.map((npc) => (
                    <div 
                      key={npc.id} 
                      className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => selectNpc(npc.id)}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-4">
                          {npc.image_url ? (
                            <img
                              src={npc.image_url}
                              alt={npc.name}
                              className="h-12 w-12 rounded-full"/>
                          ) : (
                            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-500 text-lg font-medium">{npc.name.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{npc.name}</h4>
                          <p className="text-sm text-gray-500 line-clamp-2">{npc.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowNpcSelector(false);
                  setCurrentSectionId(null);
                  setSearchQuery('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenarioEditor;