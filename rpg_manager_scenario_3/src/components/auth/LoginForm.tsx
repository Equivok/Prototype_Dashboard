import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  
  const { signIn, loading, error } = useAuthStore();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    if (!email || !password) {
      setFormError('Please fill in all fields');
      return;
    }
    
    await signIn(email, password);
    
    if (!error) {
      navigate('/dashboard');
    }
  };
  
  return (
    <div className="max-w-md mx-auto">
      <Card title="Login to your account">
        <form onSubmit={handleSubmit} className="space-y-4">
          {(error || formError) && (
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-sm text-red-700">{error || formError}</p>
            </div>
          )}
          
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />
          
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          
          <Button type="submit" isLoading={loading} className="w-full">
            Sign in
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default LoginForm;