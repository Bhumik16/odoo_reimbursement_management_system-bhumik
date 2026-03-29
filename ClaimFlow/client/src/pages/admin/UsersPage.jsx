import React, { useState } from 'react';
import { Table, TableHeader, TableRow, TableCell, TableHead } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Dropdown } from '../../components/ui/Dropdown';
import { Plus, Search, Mail, Filter } from 'lucide-react';

const DUMMY_USERS = [
  { id: 1, name: 'Alice Johnson', email: 'alice@com.py', role: 'Employee', manager: 'David Smith', avatar: 'Alice Johnson' },
  { id: 2, name: 'Bob Williams', email: 'bob@com.py', role: 'Manager', manager: 'Eve Carter', avatar: 'Bob Williams' },
  { id: 3, name: 'Charlie Brown', email: 'charlie@com.py', role: 'Employee', manager: 'Bob Williams', avatar: 'Charlie Brown' },
  { id: 4, name: 'David Smith', email: 'david@com.py', role: 'Manager', manager: 'Eve Carter', avatar: 'David Smith' },
  { id: 5, name: 'Eve Carter', email: 'eve@com.py', role: 'Admin', manager: '-', avatar: 'Eve Carter' },
];

export const UsersPage = () => {
  const [isPanelOpen, setPanelOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex gap-3 max-w-md w-full">
          <Input icon={Search} placeholder="Search users by name or email..." className="w-[300px]" />
          <Button variant="secondary" className="px-3">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={() => setPanelOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New User
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Manager</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <tbody>
          {DUMMY_USERS.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar name={user.avatar} size="md" />
                  <div>
                    <div className="font-medium text-text-primary">{user.name}</div>
                    <div className="text-xs text-text-secondary">{user.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Dropdown 
                  trigger={<Button variant="ghost" size="sm" className="font-medium h-8">{user.role}</Button>}
                  items={[
                    { label: 'Admin', active: user.role === 'Admin' },
                    { label: 'Manager', active: user.role === 'Manager' },
                    { label: 'Employee', active: user.role === 'Employee' }
                  ]}
                />
              </TableCell>
              <TableCell>
                <div className="text-sm">{user.manager}</div>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary-hover">
                  <Mail className="h-4 w-4 mr-2" />
                  Reset Pass
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      <Modal isOpen={isPanelOpen} onClose={() => setPanelOpen(false)} title="Add New User" type="slide">
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Full Name</label>
              <Input placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Email Address</label>
              <Input placeholder="john@company.com" type="email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Role</label>
              <select className="w-full rounded-xl border border-border bg-surface px-4 py-2 text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary-light">
                <option>Employee</option>
                <option>Manager</option>
                <option>Admin</option>
              </select>
            </div>
          </div>
          <div className="pt-6 border-t border-border flex justify-end gap-3 mt-auto">
            <Button variant="secondary" onClick={() => setPanelOpen(false)}>Cancel</Button>
            <Button onClick={() => setPanelOpen(false)}>Save User</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
