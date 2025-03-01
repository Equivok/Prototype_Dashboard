import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { BookOpen, LogOut, User } from 'lucide-react';
import Button from '../ui/Button';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="bg-indigo-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8" />
              <span className="text-xl font-bold">RPG Campaign Manager</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard" className="text-white hover:text-indigo-200">
                  Dashboard
                </Link>
                <Link to="/campaigns" className="text-white hover:text-indigo-200">
                  Campaigns
                </Link>
                <div className="relative ml-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-6 w-6" />
                      <span>{user.email?.split('@')[0]}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleSignOut}
                      className="border-indigo-300 text-white hover:bg-indigo-600"
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      Sign out
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-white hover:text-indigo-200">
                  Login
                </Link>
                <Link to="/register">
                  <Button variant="outline" className="border-indigo-300 text-white hover:bg-indigo-600">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;