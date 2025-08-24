import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, AlertTriangle, Clock, CheckCircle, User, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../lib/dataService';
import { CreateQNModal } from './CreateQNModal';
import { QNCard } from './QNCard';
import { format } from 'date-fns';

interface QualityNotification {
  id: string;
  qn_number: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: 'material' | 'process' | 'equipment' | 'documentation' | 'safety' | 'other';
  job_id?: string;
  job_number?: string;
  raised_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolution_notes?: string;
}

export function QualityNotificationPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<QualityNotification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<QualityNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [notifications, searchTerm, statusFilter, priorityFilter]);

  const fetchNotifications = async () => {
    try {
      // Get QNs from dataService (in real app, this would be from database)
      const qns = await dataService.getQualityNotifications();
      const users = await dataService.getUsers();
      const jobs = await dataService.getJobs();

      // Add user and job details
      const qnsWithDetails = qns.map((qn: any) => ({
        ...qn,
        raised_by_user: users.find(u => u.id === qn.raised_by),
        assigned_to_user: qn.assigned_to ? users.find(u => u.id === qn.assigned_to) : null,
        resolved_by_user: qn.resolved_by ? users.find(u => u.id === qn.resolved_by) : null,
        job: qn.job_id ? jobs.find(j => j.id === qn.job_id) : null
      }));

      setNotifications(qnsWithDetails);
    } catch (error) {
      console.error('Error fetching quality notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = [...notifications];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(qn =>
        qn.qn_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        qn.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        qn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        qn.job_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(qn => qn.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(qn => qn.priority === priorityFilter);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setFilteredNotifications(filtered);
  };

  const handleCreateQN = async (qnData: any) => {
    const newQN: QualityNotification = {
      id: `qn_${Date.now()}`,
      qn_number: generateQNNumber(),
      ...qnData,
      raised_by: user?.id || '',
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save using dataService
    await dataService.createQualityNotification(newQN);

    // If QN is related to a job, put the job on hold
    if (qnData.job_id) {
      const updatedJob = await dataService.updateJob(qnData.job_id, {
        status: 'on_hold',
        hold_reason: `Quality Notification: ${newQN.qn_number}`,
        updated_at: new Date().toISOString()
      });
      
      if (updatedJob) {
        console.log(`✅ Job ${updatedJob.job_number} put on hold due to QN ${newQN.qn_number}`);
      }
    }

    // Log successful save
    console.log('✅ Quality Notification saved to backend:', newQN.qn_number);

    // Send email notifications to assigned users
    if (qnData.assigned_to && qnData.assigned_to.length > 0) {
      sendQNEmailNotifications(newQN, qnData.assigned_to, qnData.attachedImages || []);
    }
    fetchNotifications();
    setShowCreateModal(false);
  };

  const handleDeleteQN = async (qnId: string, qnNumber: string) => {
    if (user?.role !== 'admin') {
      alert('Only administrators can delete Quality Notifications.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete Quality Notification ${qnNumber}? This action cannot be undone and will remove all associated data including comments and resolution notes.`)) {
      try {
        // Remove QN using dataService
        const success = await dataService.deleteQualityNotification(qnId);
        if (!success) throw new Error('Failed to delete QN');

        // Log successful deletion
        console.log('✅ Quality Notification deleted from backend:', qnNumber);

        // Refresh the notifications list
        fetchNotifications();
      } catch (error) {
        console.error('Error deleting Quality Notification:', error);
        alert('An error occurred while deleting the Quality Notification.');
      }
    }
  };
  const sendQNEmailNotifications = async (qn: any, assignedUserIds: string[], attachedImages: any[]) => {
    try {
      const users = await dataService.getUsers();
      const assignedUsers = users.filter(user => assignedUserIds.includes(user.id));
      const raisedByUser = users.find(user => user.id === qn.raised_by);
      
      // In a real application, this would call your email service
      console.log('Sending QN email notifications to:', assignedUsers.map(u => u.email));
      console.log('QN Details:', qn);
      console.log('Attached Images:', attachedImages);
      
      // Simulate email sending
      assignedUsers.forEach(user => {
        const emailData = {
          to: user.email,
          subject: `Quality Notification: ${qn.title} [${qn.qn_number}]`,
          qnData: qn,
          assignedUser: user,
          raisedByUser: raisedByUser,
          attachedImages: attachedImages
        };
        
        // This would be replaced with actual email service call
        simulateEmailSend(emailData);
      });
      
    } catch (error) {
      console.error('Error sending QN email notifications:', error);
    }
  };

  const simulateEmailSend = (emailData: any) => {
    // In development, log the email that would be sent
    console.log('📧 Email would be sent:', {
      to: emailData.to,
      subject: emailData.subject,
      hasImages: emailData.attachedImages.length > 0
    });
    
    // Show a notification that email was "sent"
    setTimeout(() => {
      console.log(`✅ Email notification sent to ${emailData.assignedUser.full_name} (${emailData.to})`);
    }, 1000);
  };
  const generateQNNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `QN${year}${month}${day}-${random}`;
  };

  const getStatusStats = () => {
    return {
      open: notifications.filter(qn => qn.status === 'open').length,
      in_progress: notifications.filter(qn => qn.status === 'in_progress').length,
      resolved: notifications.filter(qn => qn.status === 'resolved').length,
      closed: notifications.filter(qn => qn.status === 'closed').length,
      total: notifications.length
    };
  };

  const stats = getStatusStats();

  const statCards = [
    {
      title: 'Open',
      value: stats.open,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'In Progress',
      value: stats.in_progress,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Resolved',
      value: stats.resolved,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total QNs',
      value: stats.total,
      icon: AlertTriangle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ];

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quality Notifications</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Raise and track quality issues for manufacturing processes
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Raise QN</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {statCards.map((stat) => (
            <div key={stat.title} className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-2 md:p-3 rounded-lg ${stat.bgColor} flex-shrink-0`}>
                  <stat.icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search QN number, title, job..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm w-full sm:w-auto"
              >
                <Filter className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quality Notifications List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 md:h-5 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 md:h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-16 md:w-20 h-6 md:h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-4">
            {filteredNotifications.map((qn) => (
              <QNCard
                key={qn.id}
                notification={qn}
                onUpdate={fetchNotifications}
                onDelete={handleDeleteQN}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 md:py-12">
            <AlertTriangle className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'No quality notifications found'
                : 'No quality notifications yet'
              }
            </h3>
            <p className="text-gray-600 mb-4 text-sm md:text-base px-4">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your search criteria.'
                : 'Quality notifications will appear here when raised by operators or QC staff.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Raise First QN
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create QN Modal */}
      <CreateQNModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateQN}
      />
    </>
  );
}