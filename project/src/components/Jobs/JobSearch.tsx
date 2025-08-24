import React, { useState } from 'react';
import { Search, Filter, Calendar, Package, User } from 'lucide-react';
import { dataService } from '../../lib/dataService';
import { JobCard } from '../Dashboard/JobCard';
import { useNavigate } from 'react-router-dom';

export function JobSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    product_type: '',
    date_range: '',
  });
  const navigate = useNavigate();

  const handleSearch = async () => {
    setLoading(true);
    try {
      let allJobs = await dataService.getJobs();
      const users = await dataService.getUsers();

      // Apply filters
      let filteredJobs = allJobs;

      if (searchTerm) {
        filteredJobs = filteredJobs.filter(job => 
          job.job_number.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (filters.status) {
        filteredJobs = filteredJobs.filter(job => job.status === filters.status);
      }

      if (filters.product_type) {
        filteredJobs = filteredJobs.filter(job => job.product_type === filters.product_type);
      }

      if (filters.date_range) {
        const days = parseInt(filters.date_range);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        filteredJobs = filteredJobs.filter(job => 
          new Date(job.created_at) >= cutoffDate
        );
      }

      // Sort by creation date (newest first) and add user data
      const jobsWithUsers = filteredJobs
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map(job => ({
          ...job,
          assigned_to: job.assigned_to ? users.find(u => u.id === job.assigned_to) : null
        }));

      setJobs(jobsWithUsers);
    } catch (error) {
      console.error('Error searching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({
      status: '',
      product_type: '',
      date_range: '',
    });
    setJobs([]);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Search Jobs</h1>
        <p className="text-gray-600 mt-2">Find and track manufacturing jobs across all product types</p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Number
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter job number..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Type
            </label>
            <select
              value={filters.product_type}
              onChange={(e) => setFilters(prev => ({ ...prev, product_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Products</option>
              <option value="Capture">Capture</option>
              <option value="Endure">Endure</option>
              <option value="Assure">Assure</option>
              <option value="Secure">Secure</option>
              <option value="Prepack">Prepack</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select
              value={filters.date_range}
              onChange={(e) => setFilters(prev => ({ ...prev, date_range: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Time</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Results */}
      {jobs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Search Results ({jobs.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job: any) => (
              <JobCard
                key={job.id}
                job={job}
                onClick={() => navigate(`/jobs/${job.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {jobs.length === 0 && !loading && searchTerm && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or create a new job.</p>
        </div>
      )}
    </div>
  );
}