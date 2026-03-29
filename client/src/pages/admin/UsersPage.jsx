import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableHeader, TableRow, TableCell, TableHead } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Search, Copy, Check, Info } from 'lucide-react';
import api from '../../lib/axios';

const AdminBadge = () => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#92400E]">
    Admin
  </span>
);

export const UsersPage = () => {
  const [form, setForm] = useState({ name: '', email: '', role: 'employee', manager_id: '' });
  const [error, setError] = useState('');
  
  const [isToastOpen, setToastOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    }
  });

  const managers = users.filter(u => u.role === 'manager' || u.role === 'admin');

  const createMutation = useMutation({
    mutationFn: async (userData) => {
      const payload = { ...userData };
      if (!payload.manager_id) delete payload.manager_id;
      const { data } = await api.post('/users', payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['users']);
      setToastOpen(true);
      setForm({ name: '', email: '', role: 'employee', manager_id: '' });
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to create user');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await api.put(`/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-primary">Users & Roles</h2>
        
        <div className="flex gap-3 w-full max-w-sm">
          <Input icon={Search} placeholder="Search users by name or email..." className="w-full bg-white border border-border focus:ring-primary rounded-xl" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <Table className="bg-white">
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {users.map((user) => (
              <TableRow key={user.id} className="hover:bg-[#F9FAFB] transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar name={user.name} className="bg-[#DBEAFE] text-primary" size="md" />
                    <span className="font-bold text-text-primary">{user.name}</span>
                  </div>
                </TableCell>
                
                <TableCell>
                  {user.role === 'admin' ? (
                    <AdminBadge />
                  ) : (
                    <select
                      className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-text-primary hover:bg-[#EFF6FF] focus:bg-[#DBEAFE]"
                      value={user.role}
                      onChange={(e) => updateMutation.mutate({ id: user.id, data: { role: e.target.value } })}
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                    </select>
                  )}
                </TableCell>
                
                <TableCell>
                  {user.role === 'admin' ? (
                    <span className="text-text-secondary">-</span>
                  ) : (
                    <select
                      className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all max-w-[150px] text-text-primary hover:bg-[#EFF6FF] focus:bg-[#DBEAFE]"
                      value={user.manager_id || ''}
                      onChange={(e) => updateMutation.mutate({ id: user.id, data: { manager_id: e.target.value || null } })}
                    >
                      <option value="">Unassigned</option>
                      {managers.filter(m => m.id !== user.id).map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  )}
                </TableCell>

                <TableCell>
                  <span className="text-sm text-[#374151]">{user.email}</span>
                </TableCell>
                
                <TableCell className="text-right">
                  <Button variant="secondary" size="sm" className="text-primary border-border hover:bg-[#EFF6FF]">
                    Reset Pass
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-text-secondary">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </tbody>
        </Table>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Add new user</h3>
        
        {error && <p className="text-sm text-error bg-red-50 p-3 rounded-lg mb-4">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Username</label>
              <Input placeholder="John Doe" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Email</label>
              <Input type="email" placeholder="john@company.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className="bg-white" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Role</label>
              <select 
                className="w-full rounded-xl border border-border bg-white px-4 py-2 text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary-light h-10 transition-all focus:bg-[#DBEAFE]"
                value={form.role} onChange={e => setForm({...form, role: e.target.value})}
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Manager</label>
              <select 
                className="w-full rounded-xl border border-border bg-white px-4 py-2 text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary-light h-10 transition-all focus:bg-[#DBEAFE]"
                value={form.manager_id} onChange={e => setForm({...form, manager_id: e.target.value})}
              >
                <option value="">Select a manager (optional)</option>
                {managers.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-text-secondary mt-2 bg-gray-50 p-2 rounded inline-block">
            <Info className="h-4 w-4 text-primary" />
            Login credentials will be automatically sent to the user's email.
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" isLoading={createMutation.isPending} className="bg-primary hover:bg-primary-hover text-white">Save user</Button>
            <Button type="button" variant="secondary" onClick={() => setForm({ name: '', email: '', role: 'employee', manager_id: '' })}>Cancel</Button>
          </div>
        </form>
      </div>

      <Modal isOpen={isToastOpen} onClose={() => setToastOpen(false)} title="User created successfully" type="modal">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            User created successfully. Login credentials have been sent to the user's email.
          </p>
          
          <div className="pt-4 flex justify-end">
            <Button onClick={() => setToastOpen(false)}>Done</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
