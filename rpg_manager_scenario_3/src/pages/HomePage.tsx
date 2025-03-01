import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import { BookOpen, Users, Map, Calendar } from 'lucide-react';

const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  
  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center py-16 px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Manage Your</span>
            <span className="block text-indigo-600">RPG Campaigns</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Create immersive role-playing game campaigns, craft engaging scenarios, manage NPCs, and track your gaming sessions all in one place.
          </p>
          <div className="mt-10 flex justify-center">
            {user ? (
              <Link to="/dashboard">
                <Button size="lg">Go to Dashboard</Button>
              </Link>
            ) : (
              <div className="space-x-4">
                <Link to="/login">
                  <Button variant="outline" size="lg">Log In</Button>
                </Link>
                <Link to="/register">
                  <Button size="lg">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Features Section */}
        <div className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Everything you need for your campaigns
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                Our platform provides all the tools you need to create and manage your tabletop RPG campaigns.
              </p>
            </div>
            
            <div className="mt-10">
              <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                      <BookOpen className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Campaign Management</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Create and organize multiple campaigns, each with their own scenarios, NPCs, and sessions.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                      <Map className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Scenario Builder</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Craft detailed scenarios with our intuitive editor, inspired by campfirewriting.com.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">NPC Directory</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Create and manage NPCs with detailed traits, motivations, and connections to your world.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                      <Calendar className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Session Tracking</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Log your gaming sessions, keep notes, and track the progress of your campaign.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="bg-indigo-700">
          <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              <span className="block">Ready to start your adventure?</span>
            </h2>
            <p className="mt-4 text-lg leading-6 text-indigo-200">
              Join now and bring your campaigns to life with our comprehensive RPG management tools.
            </p>
            <div className="mt-8 flex justify-center">
              {user ? (
                <Link to="/campaigns/new">
                  <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50">
                    Create Your First Campaign
                  </Button>
                </Link>
              ) : (
                <Link to="/register">
                  <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50">
                    Sign Up for Free
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;