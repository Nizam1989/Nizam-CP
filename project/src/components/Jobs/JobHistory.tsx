import React, { useState, useEffect } from 'react';
import { Calendar, Download, Filter, Package, Trash2 } from 'lucide-react';
import { dataService } from '../../lib/dataService';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

export function JobHistory() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, [filter]);

  const fetchJobs = async () => {
    try {
      let allJobs = await dataService.getJobs();
      const users = await dataService.getUsers();

      // Only show completed jobs in history
      allJobs = allJobs.filter(job => job.status === 'completed');
      
      // Apply additional filter if not 'all'
      if (filter !== 'all' && filter !== 'completed') {
        allJobs = allJobs.filter(job => job.status === filter);
      }

      // Sort by creation date (newest first) and add user data
      const jobsWithUsers = allJobs
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map(job => ({
          ...job,
          created_by: users.find(u => u.id === job.created_by),
          assigned_to: job.assigned_to ? users.find(u => u.id === job.assigned_to) : null
        }));

      setJobs(jobsWithUsers);
    } catch (error) {
      console.error('Error fetching job history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProductTypeColor = (type: string) => {
    const colors = {
      Capture: 'bg-purple-100 text-purple-800',
      Endure: 'bg-orange-100 text-orange-800',
      Assure: 'bg-green-100 text-green-800',
      Secure: 'bg-red-100 text-red-800',
      Prepack: 'bg-blue-100 text-blue-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleDeleteJob = async (jobId: string, jobNumber: string) => {
    if (user?.role !== 'admin') {
      alert('Only administrators can delete jobs.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete job ${jobNumber}? This action cannot be undone and will remove all associated data including steps and reports.`)) {
      try {
        const success = await dataService.deleteJob(jobId);
        if (success) {
          // Refresh the jobs list
          fetchJobs();
        } else {
          alert('Failed to delete job. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting job:', error);
        alert('An error occurred while deleting the job.');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job History</h1>
          <p className="text-gray-600 mt-2">View and manage all manufacturing jobs</p>
        </div>
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Jobs</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length > 0 ? (
        <div className="space-y-4">
          {jobs.map((job: any) => (
            <div
              key={job.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{job.job_number}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProductTypeColor(job.product_type)}`}>
                      {job.product_type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Started: {format(new Date(job.started_at), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <span>Stage: {job.current_stage}</span>
                    </div>
                    <div>
                      <span>Created by: {job.created_by?.full_name}</span>
                    </div>
                  </div>
                  {job.completed_at && (
                    <div className="mt-2 text-sm text-gray-600">
                      Completed: {format(new Date(job.completed_at), 'MMM d, yyyy \'at\' h:mm a')}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-6">
                  <button
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    View Details
                  </button>
                  {job.status === 'completed' && (
                    <button className="p-2 text-gray-600 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => handleDeleteJob(job.id, job.job_number)}
                      className="p-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete Job (Admin Only)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600">No jobs match the current filter criteria.</p>
        </div>
      )}
    </div>
  );
}