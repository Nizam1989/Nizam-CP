import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit, Trash2, Key, Shield, UserCheck, UserX, AlertTriangle, User } from 'lucide-react';
import { dataService, type User as LocalUser } from '../../lib/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

export function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [pendingUsers, setPendingUsers] = useState<LocalUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<LocalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<LocalUser | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    role: 'operator' as const,
    password: ''
  });

  // Only allow admin access
  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">Only administrators can access user management.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      const allUsers = await dataService.getUsers();
      setUsers(allUsers);
      setPendingUsers(allUsers.filter(user => user.status === 'pending'));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setFilteredUsers(filtered);
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const approvedUser = await dataService.approveUser(userId, currentUser?.id || '');
      if (approvedUser) {
        console.log('✅ User approved:', approvedUser.full_name);
        fetchUsers(); // Refresh the users list
      }
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Error approving user. Please try again.');
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to reject this user? They will not be able to access the system.')) {
      try {
        const rejectedUser = await dataService.rejectUser(userId, currentUser?.id || '');
        if (rejectedUser) {
          console.log('✅ User rejected:', rejectedUser.full_name);
          fetchUsers(); // Refresh the users list
        }
      } catch (error) {
        console.error('Error rejecting user:', error);
        alert('Error rejecting user. Please try again.');
      }
    }
  };

  const handleAddUser = async () => {
    try {
      const createdUser = await dataService.createUser({
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role
      });

      // In a real app, you would also create the auth user with password
      console.log('User created with password:', newUser.password);

      setUsers(prev => [createdUser, ...prev]);
      setShowAddModal(false);
      setNewUser({ email: '', full_name: '', role: 'operator', password: '' });
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      const updatedUser = await dataService.updateUser(selectedUser.id, selectedUser);
      if (updatedUser) {
        fetchUsers(); // Refresh the users list
        setShowEditModal(false);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user. Please try again.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      alert('You cannot delete your own account.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const success = await dataService.deleteUser(userId);
        if (success) {
          fetchUsers(); // Refresh the users list
        } else {
          alert('Failed to delete user. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user. Please try again.');
      }
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    try {
      // In a real app, this would trigger a password reset email or generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      alert(`Password reset for ${selectedUser.full_name}. Temporary password: ${tempPassword}`);
      
      setShowResetPasswordModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-purple-100 text-purple-800',
      engineer: 'bg-blue-100 text-blue-800',
      inspector: 'bg-green-100 text-green-800',
      operator: 'bg-gray-100 text-gray-800',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRoleStats = () => {
    return {
      total: users.length,
      pending: users.filter(u => u.status === 'pending').length,
      approved: users.filter(u => u.status === 'approved').length,
      rejected: users.filter(u => u.status === 'rejected').length,
      admin: users.filter(u => u.role === 'admin').length,
      manager: users.filter(u => u.role === 'manager').length,
      engineer: users.filter(u => u.role === 'engineer').length,
      inspector: users.filter(u => u.role === 'inspector').length,
      operator: users.filter(u => u.role === 'operator').length,
    };
  };

  const stats = getRoleStats();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2">Manage system users and their permissions</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.admin}</p>
              <p className="text-sm text-gray-600">Admins</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.manager}</p>
              <p className="text-sm text-gray-600">Managers</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.engineer}</p>
              <p className="text-sm text-gray-600">Engineers</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.inspector}</p>
              <p className="text-sm text-gray-600">Inspectors</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{stats.operator}</p>
              <p className="text-sm text-gray-600">Operators</p>
            </div>
          </div>
        </div>

        {/* Pending Approvals Section */}
        {pendingUsers.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <div>
                <h2 className="text-xl font-semibold text-yellow-900">Pending User Approvals</h2>
                <p className="text-yellow-700 text-sm">
                  {pendingUsers.length} user{pendingUsers.length !== 1 ? 's' : ''} waiting for approval
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              {pendingUsers.map((user) => (
                <div key={user.id} className="bg-white border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{user?.full_name ?? 'N/A'}</h3>
                          <p className="text-sm text-gray-600">{user?.email ?? 'N/A'}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user?.role ?? 'operator')}`}>
                          {user?.role ?? 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Registered: {user?.created_at ? format(new Date(user.created_at), 'MMM dd, yyyy \'at\' h:mm a') : 'N/A'}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => user?.id && handleApproveUser(user.id)}
                        className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <UserCheck className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => user?.id && handleRejectUser(user.id)}
                        className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <UserX className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Users
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="engineer">Engineer</option>
                <option value="inspector">Inspector</option>
                <option value="operator">Operator</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user?.full_name ?? 'N/A'}
                            {user?.id === currentUser?.id && (
                              <span className="ml-2 text-xs text-blue-600">(You)</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{user?.email ?? 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user?.role ?? 'operator')}`}>
                        {user?.role ?? 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user?.status ?? 'pending')}`}>
                        {user?.status ?? 'N/A'}
                      </span>
                      {user?.approved_by && user?.approved_at && (
                        <div className="text-xs text-gray-500 mt-1">
                          by {dataService.getUserById(user.approved_by)?.full_name ?? 'Unknown'} on {format(new Date(user.approved_at), 'MMM dd')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user?.created_at ? format(new Date(user.created_at), 'MMM dd, yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {user?.status === 'pending' && (
                          <>
                            <button
                              onClick={() => user?.id && handleApproveUser(user.id)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                              title="Approve User"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => user?.id && handleRejectUser(user.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                              title="Reject User"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            if (user) {
                              setSelectedUser(user);
                              setShowEditModal(true);
                            }
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (user) {
                              setSelectedUser(user);
                              setShowResetPasswordModal(true);
                            }
                          }}
                          className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        {user?.id && user.id !== currentUser?.id && (
                          <button
                            onClick={() => user?.id && handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">
                {searchTerm || roleFilter !== 'all'
                  ? 'Try adjusting your search criteria.'
                  : 'No users have been created yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New User</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="operator">Operator</option>
                  <option value="inspector">Inspector</option>
                  <option value="engineer">Engineer</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                disabled={!newUser.email || !newUser.full_name || !newUser.password}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit User</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={selectedUser?.full_name ?? ''}
                  onChange={(e) => setSelectedUser(prev => prev ? ({ ...prev, full_name: e.target.value }) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={selectedUser?.email ?? ''}
                  onChange={(e) => setSelectedUser(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={selectedUser?.role ?? 'operator'}
                  onChange={(e) => setSelectedUser(prev => prev ? ({ ...prev, role: e.target.value as any }) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="operator">Operator</option>
                  <option value="inspector">Inspector</option>
                  <option value="engineer">Engineer</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Reset Password</h2>
              <button
                onClick={() => setShowResetPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to reset the password for <strong>{selectedUser?.full_name ?? 'this user'}</strong>?
              </p>
              <p className="text-sm text-gray-500">
                A temporary password will be generated and displayed. The user will need to change it on their next login.
              </p>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowResetPasswordModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}