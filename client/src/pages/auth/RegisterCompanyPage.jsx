import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { BuildingIcon, User, Mail, Lock, Globe } from 'lucide-react';

const currencyMap = {
  'US': 'USD ($)',
  'GB': 'GBP (£)',
  'IN': 'INR (₹)',
  'EU': 'EUR (€)'
};

export const RegisterCompanyPage = () => {
  const [form, setForm] = useState({ companyName: '', country: '', adminName: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match');
    }

    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/register-company', {
        companyName: form.companyName,
        country: form.country,
        adminName: form.adminName,
        email: form.email,
        password: form.password
      });

      setAuth(data.user, data.accessToken);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">
          Register your company
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-4 shadow-soft sm:rounded-2xl sm:px-10 border border-border">
          
          <div className="bg-primary-light/50 text-primary p-3 rounded-lg mb-6 flex rounded-xl text-sm font-medium">
            First signup auto-creates a company and makes you the root Administrator.
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input 
              icon={BuildingIcon} 
              placeholder="Company Name" 
              value={form.companyName} 
              onChange={e => setForm({...form, companyName: e.target.value})}
              required
            />
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                <Globe className="h-5 w-5" />
              </div>
              <select
                className="w-full rounded-xl border border-border bg-surface pl-10 px-4 py-2 text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-all"
                value={form.country}
                onChange={e => setForm({...form, country: e.target.value})}
                required
              >
                <option value="" disabled>Select Country</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="IN">India</option>
                <option value="EU">European Union</option>
              </select>
            </div>

            {form.country && (
              <p className="text-sm text-text-secondary pl-1">
                Company base currency set to: <span className="font-semibold text-text-primary">{currencyMap[form.country]}</span>
              </p>
            )}

            <Input 
              icon={User} 
              placeholder="Admin Full Name" 
              value={form.adminName} 
              onChange={e => setForm({...form, adminName: e.target.value})}
              required
            />

            <Input 
              icon={Mail} 
              type="email" 
              placeholder="Admin Email" 
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})}
              required
            />

            <Input 
              icon={Lock} 
              type="password" 
              placeholder="Password (min 8 chars)" 
              value={form.password} 
              onChange={e => setForm({...form, password: e.target.value})}
              required
            />

            <Input 
              icon={Lock} 
              type="password" 
              placeholder="Confirm Password" 
              value={form.confirmPassword} 
              onChange={e => setForm({...form, confirmPassword: e.target.value})}
              required
            />

            {error && <p className="text-sm text-error bg-red-50 p-2 rounded">{error}</p>}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Sign up & create company
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="font-medium text-primary hover:text-primary-hover text-sm">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
