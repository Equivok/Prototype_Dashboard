import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCampaignStore } from '../../store/campaignStore';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Edit, ArrowLeft, GitBranch, FileText, List, CheckSquare, BookOpen, Briefcase, FileBox, GitMerge } from 'lucide-react';

const ScenarioDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { scenarios, fetchScenarios, campaigns, fetchCampaigns } = useCampaignStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sections' | 'consequences' | 'deliverables' | 'choices'>('sections');
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    const loadData = async () => {
      if (campaigns.length === 0) {
        await fetchCampaigns();
      }
      
      if (scenarios.length === 0 && id) {
        // We need to find the campaign ID for this scenario
        for (const campaign of campaigns) {
          await fetchScenarios(campaign.id);
          const scenario = scenarios.find(s => s.id === id);
          if (scenario) {
            break;
          }
        }
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [user, navigate, id, campaigns, scenarios, fetchCampaigns, fetchScenarios]);
  
  if (!user || !id) {
    return null;
  }
  
  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <p className="text-center py-8">Loading scenario...</p>
        </div>
      </Layout>
    );
  }
  
  const scenario = scenarios.find(s => s.id === id);
  
  if (!scenario) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <p className="text-center py-8">Scenario not found.</p>
        </div>
      </Layout>
    );
  }
  
  const campaign = campaigns.find(c => c.id === scenario.campaign_id);
  const scenarioContent = scenario.content as any;
  const hasConsequences = scenarioContent.consequences && scenarioContent.consequences.length > 0;
  const hasDeliverables = scenarioContent.deliverables && scenarioContent.deliverables.length > 0;
  const hasChoices = scenarioContent.choices && scenarioContent.choices.length > 0;
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/campaigns/${scenario.campaign_id}`)}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Campaign
            </Button>
            <h1 className="text-2xl font-bold">{scenario.title}</h1>
          </div>
          <Link to={`/scenarios/${scenario.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-1" /> Edit Scenario
            </Button>
          </Link>
        </div>
        
        <Card className="mb-6">
          <p className="text-gray-700">{scenario.description}</p>
          {campaign && (
            <p className="mt-4 text-sm text-gray-500">
              Part of campaign: <Link to={`/campaigns/${campaign.id}`} className="text-indigo-600 hover:text-indigo-800">{campaign.title}</Link>
            </p>
          )}
        </Card>
        
        {/* Tabs */}
        {(hasConsequences || hasDeliverables || hasChoices) && (
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('sections')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sections'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Détails
              </button>
              {hasChoices && (
                <button
                  onClick={() => setActiveTab('choices')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'choices'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Choix possible
                </button>
              )}
              {hasConsequences && (
                <button
                  onClick={() => setActiveTab('consequences')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'consequences'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Consequences
                </button>
              )}
              {hasDeliverables && (
                <button
                  onClick={() => setActiveTab('deliverables')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'deliverables'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                   }`}
                >
                  Deliverables
                </button>
              )}
            </nav>
          </div>
        )}
        
        {/* Sections */}
        {(activeTab === 'sections' || (!hasConsequences && !hasDeliverables && !hasChoices)) && (
          <div className="space-y-6">
            {scenarioContent.sections && scenarioContent.sections.map((section: any) => (
              <Card key={section.id} className={`
                ${section.type === 'mission' ? 'border-l-4 border-l-indigo-500' : ''}
                ${section.type === 'character' ? 'border-l-4 border-l-green-500' : ''}
                ${section.type === 'resource' ? 'border-l-4 border-l-orange-500' : ''}
                ${section.type === 'note' ? 'border-l-4 border-l-amber-500' : ''}
                ${section.type === 'scene' ? 'border-l-4 border-l-indigo-500' : ''}
              `}>
                <div className="flex items-center mb-2">
                  <span className={`inline-block px-2 py-1 text-xs rounded-md mr-2 ${
                    section.type === 'mission' || section.type === 'scene'
                       ? 'bg-indigo-100 text-indigo-800' 
                       : section.type === 'character' 
                       ? 'bg-green-100 text-green-800' 
                      : section.type === 'resource'
                      ? 'bg-orange-100 text-orange-800'
                       : 'bg-amber-100 text-amber-800'
                  }`}>
                    {(section.type === 'mission' || section.type === 'scene') && <Briefcase className="h-3 w-3 inline-block mr-1" />}
                    {section.type === 'character' && <BookOpen className="h-3 w-3 inline-block mr-1" />}
                    {section.type === 'resource' && <FileBox className="h-3 w-3 inline-block mr-1" />}
                    {section.type === 'note' && <FileText className="h-3 w-3 inline-block mr-1" />}
                    {section.type === 'scene' ? 'Mission' : section.type.charAt(0).toUpperCase() + section.type.slice(1)}
                  </span>
                  <h3 className="text-lg font-medium">{section.title}</h3>
                </div>
                <div className="whitespace-pre-wrap">{section.content}</div>
              </Card>
            ))}
          </div>
        )}
        
        {/* Choices */}
        {activeTab === 'choices' && hasChoices && (
          <div className="space-y-6">
            {scenarioContent.choices.map((choice: any) => (
              <Card key={choice.id} className="border-l-4 border-l-indigo-500">
                <div className="flex items-center mb-2">
                  <span className="inline-block px-2 py-1 text-xs rounded-md mr-2 bg-indigo-100 text-indigo-800">
                    <GitMerge className="h-3 w-3 inline-block mr-1" /> Choice Point
                  </span>
                  <h3 className="text-lg font-medium">{choice.title}</h3>
                </div>
                
                <div className="space-y-4">
                  {choice.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Description</h4>
                      <p className="whitespace-pre-wrap">{choice.description}</p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Options</h4>
                    <div className="mt-2 space-y-4">
                      {choice.options.map((option: any, index: number) => (
                        <div key={option.id} className="border border-indigo-100 rounded-md p-3">
                          <div className="flex items-center mb-2">
                            <span className="inline-block px-2 py-1 text-xs rounded-md mr-2 bg-indigo-100 text-indigo-800">
                              Option {index + 1}
                            </span>
                            <p className="font-medium">{option.text}</p>
                          </div>
                          
                          {option.outcome && (
                            <div className="ml-8 mt-2 border-l-2 border-indigo-200 pl-3">
                              <h5 className="text-xs font-medium text-gray-500">Outcome</h5>
                              <p className="text-gray-700 whitespace-pre-wrap">{option.outcome}</p>
                            </div>
                          )}
                          
                          {/* Display option consequences */}
                          {option.consequences && option.consequences.length > 0 && (
                            <div className="ml-8 mt-4 space-y-3">
                              <h5 className="text-xs font-medium text-gray-500 flex items-center">
                                <GitBranch className="h-3 w-3 mr-1" /> Consequences
                              </h5>
                              
                              {option.consequences.map((consequence: any) => (
                                <div key={consequence.id} className="border-l-2 border-purple-200 pl-3 py-2">
                                  <div className="mb-1">
                                    <span className="text-xs font-medium text-purple-700">Description:</span>
                                    <p className="text-sm text-gray-700">{consequence.description}</p>
                                  </div>
                                  
                                  {consequence.impact && (
                                    <div>
                                      <span className="text-xs font-medium text-purple-700">Impact:</span>
                                      <p className="text-sm text-gray-700">{consequence.impact}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {/* Consequences */}
        {activeTab === 'consequences' && hasConsequences && (
          <div className="space-y-6">
            {scenarioContent.consequences.map((consequence: any) => (
              <Card key={consequence.id} className="border-l-4 border-l-purple-500">
                <div className="flex items-center mb-2">
                  <span className="inline-block px-2 py-1 text-xs rounded-md mr-2 bg-purple-100 text-purple-800">
                    <GitBranch className="h-3 w-3 inline-block mr-1" /> Consequence
                  </span>
                  <h3 className="text-lg font-medium">{consequence.title}</h3>
                </div>
                
                <div className="space-y-4">
                  {consequence.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Description</h4>
                      <p className="whitespace-pre-wrap">{consequence.description}</p>
                    </div>
                  )}
                  
                  {consequence.condition && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Condition</h4>
                      <p className="whitespace-pre-wrap">{consequence.condition}</p>
                    </div>
                  )}
                  
                  {consequence.outcome && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Outcome</h4>
                      <p className="whitespace-pre-wrap">{consequence.outcome}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {/* Deliverables */}
        {activeTab === 'deliverables' && hasDeliverables && (
          <div className="space-y-6">
            {scenarioContent.deliverables.map((deliverable: any) => (
              <Card key={deliverable.id} className="border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="inline-block px-2 py-1 text-xs rounded-md mr-2 bg-blue-100 text-blue-800">
                      Deliverable
                    </span>
                    <h3 className="text-lg font-medium">{deliverable.title}</h3>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    deliverable.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {deliverable.status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {deliverable.objective && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Objective</h4>
                      <p className="whitespace-pre-wrap">{deliverable.objective}</p>
                    </div>
                  )}
                  
                  {deliverable.instructions && deliverable.instructions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 flex items-center">
                        <List className="h-4 w-4 mr-1" /> Instructions
                      </h4>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        {deliverable.instructions.map((instruction: any) => (
                          <li key={instruction.id} className="text-gray-700">
                            {instruction.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {deliverable.criteria && deliverable.criteria.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 flex items-center">
                        <CheckSquare className="h-4 w-4 mr-1" /> Success Criteria
                      </h4>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        {deliverable.criteria.map((criterion: any) => (
                          <li key={criterion.id} className="text-gray-700">
                            {criterion.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ScenarioDetailsPage;