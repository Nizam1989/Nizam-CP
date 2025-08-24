import React, { useState, useEffect } from 'react';
import { Plus, Search, TrendingUp, AlertCircle, CheckCircle, Clock, Trash2, BarChart3, Activity, Target, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../lib/dataService';
import { JobCard } from './JobCard';
import { useAuth } from '../../contexts/AuthContext';
import { format, subDays, startOfDay, endOfDay, differenceInHours } from 'date-fns';

export function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    onHold: 0,
    total: 0,
  });
  const [analytics, setAnalytics] = useState({
    dailyCompletions: [],
    stepProgress: [],
    productionRate: 0,
    averageCompletionTime: 0,
    currentJobsProgress: [],
    todayStats: {
      screensCompleted: 0,
      jointsCompleted: 0,
      stepsCompleted: 0,
      jobsStarted: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchJobs();
      fetchStats();
      fetchAnalytics();
    }
  }, [user]);

  const fetchJobs = async () => {
    try {
      const allJobs = await dataService.getJobs();
      const users = await dataService.getUsers();
      
      // Only show active jobs in dashboard
      const activeJobs = allJobs
        .filter(job => job.status === 'active')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 8)
        .map(job => ({
          ...job,
          assigned_to: job.assigned_to ? users.find(u => u.id === job.assigned_to) : null
        }));
      
      setJobs(activeJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const allJobs = await dataService.getJobs();

      const statsCount = allJobs.reduce((acc: any, job: any) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        acc.total = (acc.total || 0) + 1;
        return acc;
      }, {});

      setStats({
        active: statsCount.active || 0,
        completed: statsCount.completed || 0,
        onHold: statsCount.on_hold || 0,
        total: statsCount.total || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const allJobs = await dataService.getJobs();
      const users = await dataService.getUsers();
      
      // Get all job steps for analysis
      const allSteps = [];
      for (const job of allJobs) {
        const steps = await dataService.getJobSteps(job.id);
        allSteps.push(...steps.map(step => ({ ...step, job })));
      }

      // Calculate daily completions for last 7 days
      const dailyCompletions = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        
        const dayCompletions = allSteps.filter(step => {
          if (!step.completed_at) return false;
          const completedDate = new Date(step.completed_at);
          return completedDate >= dayStart && completedDate <= dayEnd;
        });

        dailyCompletions.push({
          date: format(date, 'MMM dd'),
          count: dayCompletions.length,
          screens: dayCompletions.filter(s => s.step_name.toLowerCase().includes('screen')).length,
          joints: dayCompletions.filter(s => s.step_name.toLowerCase().includes('pipe') || s.step_name.toLowerCase().includes('joint')).length
        });
      }

      // Calculate step progress across all active jobs
      const stepProgressMap = new Map();
      allSteps.forEach(step => {
        if (!stepProgressMap.has(step.step_name)) {
          stepProgressMap.set(step.step_name, { total: 0, completed: 0 });
        }
        const progress = stepProgressMap.get(step.step_name);
        progress.total++;
        if (step.completed_at) progress.completed++;
      });

      const stepProgress = Array.from(stepProgressMap.entries()).map(([stepName, data]) => ({
        stepName,
        total: data.total,
        completed: data.completed,
        percentage: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
      })).sort((a, b) => b.total - a.total).slice(0, 6);

      // Calculate production rate (jobs completed per day)
      const completedJobs = allJobs.filter(job => job.completed_at);
      const productionRate = completedJobs.length > 0 ? (completedJobs.length / 30) : 0; // Last 30 days average

      // Calculate average completion time
      const jobsWithCompletionTime = completedJobs.filter(job => job.started_at && job.completed_at);
      const totalCompletionTime = jobsWithCompletionTime.reduce((sum, job) => {
        const startTime = new Date(job.started_at);
        const endTime = new Date(job.completed_at);
        return sum + differenceInHours(endTime, startTime);
      }, 0);
      const averageCompletionTime = jobsWithCompletionTime.length > 0 ? 
        totalCompletionTime / jobsWithCompletionTime.length : 0;

      // Current jobs progress
      const activeJobs = allJobs.filter(job => job.status === 'active');
      const currentJobsProgress = [];
      for (const job of activeJobs.slice(0, 5)) {
        const jobSteps = await dataService.getJobSteps(job.id);
        const completedSteps = jobSteps.filter(step => step.completed_at).length;
        const assignedUser = users.find(u => u.id === job.assigned_to);
        
        currentJobsProgress.push({
          jobNumber: job.job_number,
          productType: job.product_type,
          progress: Math.round((completedSteps / jobSteps.length) * 100),
          currentStep: job.current_stage,
          assignedTo: assignedUser?.full_name || 'Unassigned',
          completedSteps,
          totalSteps: jobSteps.length
        });
      }

      // Today's statistics
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);
      
      const todaySteps = allSteps.filter(step => {
        if (!step.completed_at) return false;
        const completedDate = new Date(step.completed_at);
        return completedDate >= todayStart && completedDate <= todayEnd;
      });

      const todayJobs = allJobs.filter(job => {
        const startedDate = new Date(job.started_at);
        return startedDate >= todayStart && startedDate <= todayEnd;
      });

      const todayStats = {
        screensCompleted: todaySteps.filter(s => s.step_name.toLowerCase().includes('screen')).length,
        jointsCompleted: todaySteps.filter(s => s.step_name.toLowerCase().includes('pipe') || s.step_name.toLowerCase().includes('joint')).length,
        stepsCompleted: todaySteps.length,
        jobsStarted: todayJobs.length
      };

      setAnalytics({
        dailyCompletions,
        stepProgress,
        productionRate,
        averageCompletionTime,
        currentJobsProgress,
        todayStats
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
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
          // Refresh the jobs and stats
          fetchJobs();
          fetchStats();
        } else {
          alert('Failed to delete job. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting job:', error);
        alert('An error occurred while deleting the job.');
      }
    }
  };

  // Calculate productivity (Standard Time / Avg Completion Time) x 100
  // Assuming standard time is 24 hours for demonstration - you can adjust this
  const standardTime = 24; // hours
  const productivity = analytics.averageCompletionTime > 0 ? 
    (standardTime / analytics.averageCompletionTime) * 100 : 0;

  const statCards = [
    {
      title: 'Active Jobs',
      value: stats.active,
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'On Hold',
      value: stats.onHold,
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Production Rate',
      value: `${analytics.productionRate.toFixed(1)}/day`,
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Avg Completion',
      value: `${analytics.averageCompletionTime.toFixed(1)}h`,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Productivity',
      value: `${productivity.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Welcome back, {user?.full_name}</p>
          </div>
          
          {/* Desktop Buttons */}
          <div className="hidden sm:flex gap-3">
            <button
              onClick={() => navigate('/jobs/search')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <Search className="w-4 h-4" />
              Search Jobs
            </button>
            <button
              onClick={() => navigate('/jobs/new')}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              New Job
            </button>
          </div>
        </div>

        {/* Mobile Buttons */}
        <div className="grid grid-cols-2 gap-3 sm:hidden">
          <button
            onClick={() => navigate('/jobs/search')}
            className="flex items-center justify-center gap-2 px-4 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            <Search className="w-4 h-4" />
            Search Jobs
          </button>
          <button
            onClick={() => navigate('/jobs/new')}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Job
          </button>
        </div>
      </div>

      {/* Today's Performance */}
      <div className="bg-blue-500 rounded-xl border border-blue-600 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Today's Performance</h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-300">Live</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-700 rounded-lg">
            <div className="text-2xl font-bold text-white">{analytics.todayStats.screensCompleted}</div>
            <div className="text-sm text-blue-100">Screens Completed</div>
          </div>
          <div className="text-center p-4 bg-blue-700 rounded-lg">
            <div className="text-2xl font-bold text-white">{analytics.todayStats.jointsCompleted}</div>
            <div className="text-sm text-blue-100">Pipe Joints Completed</div>
          </div>
          <div className="text-center p-4 bg-blue-700 rounded-lg">
            <div className="text-2xl font-bold text-white">{analytics.todayStats.stepsCompleted}</div>
            <div className="text-sm text-blue-100">Total Steps Completed</div>
          </div>
          <div className="text-center p-4 bg-blue-700 rounded-lg">
            <div className="text-2xl font-bold text-white">{analytics.todayStats.jobsStarted}</div>
            <div className="text-sm text-blue-100">Jobs Started</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Performance Overview</h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600">Live</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((stat) => (
            <div key={stat.title} className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <div className="p-2 rounded-lg bg-blue-100">
                  <stat.icon className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="text-xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-600">{stat.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Jobs Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Current Jobs Progress</h3>
          <Zap className="w-5 h-5 text-gray-400" />
        </div>
        {analytics.currentJobsProgress.length > 0 ? (
          <div className="space-y-4">
            {analytics.currentJobsProgress.map((job, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-gray-900">{job.jobNumber}</h4>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {job.productType}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">{job.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Current: {job.currentStep}</span>
                  <span>{job.completedSteps}/{job.totalSteps} steps</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Assigned to: {job.assignedTo}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No active jobs to track</p>
          </div>
        )}
      </div>

      {/* Active Jobs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Active Jobs</h2>
          <button
            onClick={() => navigate('/jobs/history')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View All
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-2 bg-gray-200 rounded mb-3"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {jobs.map((job: any) => (
              <JobCard
                key={job.id}
                job={job}
                onClick={() => navigate(`/jobs/${job.id}`)}
                onDelete={handleDeleteJob}
                showDelete={user?.role === 'admin'}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-12 h-12 text-gray-400 mx-auto mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No active jobs</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first manufacturing job.</p>
            <button
              onClick={() => navigate('/jobs/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create New Job
            </button>
          </div>
        )}
      </div>
    </div>
  );
}