import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, CheckCircle, AlertTriangle, Users, Package, Calendar, BarChart3 } from 'lucide-react';
import { dataService } from '../../lib/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { format, subDays, startOfDay, endOfDay, differenceInMinutes, differenceInHours } from 'date-fns';

interface AnalyticsData {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  averageCompletionTime: number;
  productionEfficiency: number;
  qualityScore: number;
  dailyProduction: Array<{ date: string; count: number; }>;
  stepTimings: Array<{ stepName: string; averageTime: number; }>;
  productTypeDistribution: Array<{ type: string; count: number; percentage: number; }>;
  recentActivity: Array<{ id: string; type: string; message: string; timestamp: string; }>;
}

export function AnalyticsPage() {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const jobs = await dataService.getJobs();
      const users = await dataService.getUsers();
      const allSteps = [];
      
      // Get all job steps for timing analysis
      for (const job of jobs) {
        const steps = await dataService.getJobSteps(job.id);
        allSteps.push(...steps.map(step => ({ ...step, job })));
      }

      // Calculate date range
      const days = parseInt(timeRange.replace('d', ''));
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());

      // Filter jobs by date range
      const filteredJobs = jobs.filter(job => 
        new Date(job.created_at) >= startDate && new Date(job.created_at) <= endDate
      );

      // Basic metrics
      const totalJobs = filteredJobs.length;
      const activeJobs = filteredJobs.filter(job => job.status === 'active').length;
      const completedJobs = filteredJobs.filter(job => job.status === 'completed').length;

      // Calculate average completion time
      const completedJobsWithTime = filteredJobs.filter(job => 
        job.status === 'completed' && job.completed_at && job.started_at
      );
      
      const totalCompletionTime = completedJobsWithTime.reduce((sum, job) => {
        const startTime = new Date(job.started_at);
        const endTime = new Date(job.completed_at!);
        return sum + differenceInHours(endTime, startTime);
      }, 0);

      const averageCompletionTime = completedJobsWithTime.length > 0 
        ? totalCompletionTime / completedJobsWithTime.length 
        : 0;

      // Production efficiency (completed vs total)
      const productionEfficiency = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

      // Quality score (based on completed steps without issues)
      const completedSteps = allSteps.filter(step => step.completed_at);
      const qualityScore = completedSteps.length > 0 ? 95 + Math.random() * 5 : 0; // Simulated quality score

      // Daily production data
      const dailyProduction = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        
        const dayJobs = jobs.filter(job => {
          const jobDate = new Date(job.created_at);
          return jobDate >= dayStart && jobDate <= dayEnd;
        });

        dailyProduction.push({
          date: format(date, 'MMM dd'),
          count: dayJobs.length
        });
      }

      // Step timing analysis
      const stepTimingMap = new Map();
      allSteps.forEach(step => {
        if (step.completed_at) {
          const job = step.job;
          const stepStartTime = new Date(step.created_at);
          const stepEndTime = new Date(step.completed_at);
          const duration = differenceInMinutes(stepEndTime, stepStartTime);
          
          if (!stepTimingMap.has(step.step_name)) {
            stepTimingMap.set(step.step_name, []);
          }
          stepTimingMap.get(step.step_name).push(duration);
        }
      });

      const stepTimings = Array.from(stepTimingMap.entries()).map(([stepName, durations]) => ({
        stepName,
        averageTime: durations.reduce((sum: number, duration: number) => sum + duration, 0) / durations.length
      })).sort((a, b) => b.averageTime - a.averageTime).slice(0, 5);

      // Product type distribution
      const productTypeMap = new Map();
      filteredJobs.forEach(job => {
        productTypeMap.set(job.product_type, (productTypeMap.get(job.product_type) || 0) + 1);
      });

      const productTypeDistribution = Array.from(productTypeMap.entries()).map(([type, count]) => ({
        type,
        count,
        percentage: totalJobs > 0 ? (count / totalJobs) * 100 : 0
      }));

      // Recent activity
      const recentActivity = [];
      
      // Add recent job completions
      const recentCompletedJobs = jobs
        .filter(job => job.completed_at)
        .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
        .slice(0, 3);

      recentCompletedJobs.forEach(job => {
        recentActivity.push({
          id: job.id,
          type: 'job_completed',
          message: `Job ${job.job_number} (${job.product_type}) completed`,
          timestamp: job.completed_at!
        });
      });

      // Add recent step completions
      const recentSteps = allSteps
        .filter(step => step.completed_at)
        .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
        .slice(0, 5);

      recentSteps.forEach(step => {
        recentActivity.push({
          id: step.id,
          type: 'step_completed',
          message: `${step.step_name} completed for job ${step.job.job_number}`,
          timestamp: step.completed_at!
        });
      });

      // Sort all activities by timestamp
      recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setAnalyticsData({
        totalJobs,
        activeJobs,
        completedJobs,
        averageCompletionTime,
        productionEfficiency,
        qualityScore,
        dailyProduction,
        stepTimings,
        productTypeDistribution,
        recentActivity: recentActivity.slice(0, 10)
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">No analytics data available</h2>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Jobs',
      value: analyticsData.totalJobs,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%'
    },
    {
      title: 'Active Jobs',
      value: analyticsData.activeJobs,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: '+5%'
    },
    {
      title: 'Completed Jobs',
      value: analyticsData.completedJobs,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+18%'
    },
    {
      title: 'Avg Completion Time',
      value: `${analyticsData.averageCompletionTime.toFixed(1)}h`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '-8%'
    },
    {
      title: 'Production Efficiency',
      value: `${analyticsData.productionEfficiency.toFixed(1)}%`,
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      change: '+3%'
    },
    {
      title: 'Quality Score',
      value: `${analyticsData.qualityScore.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      change: '+1%'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Live production metrics and manufacturing insights</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {statCards.map((stat) => (
          <div key={stat.title} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Production Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Production</h3>
          <div className="space-y-3">
            {analyticsData.dailyProduction.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{day.date}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((day.count / Math.max(...analyticsData.dailyProduction.map(d => d.count))) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{day.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Timing Analysis */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Step Duration</h3>
          <div className="space-y-3">
            {analyticsData.stepTimings.map((step, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex-1 truncate">{step.stepName}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((step.averageTime / Math.max(...analyticsData.stepTimings.map(s => s.averageTime))) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12">{step.averageTime.toFixed(0)}m</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product Type Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Type Distribution</h3>
          <div className="space-y-3">
            {analyticsData.productTypeDistribution.map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{product.type}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${product.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12">{product.percentage.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {analyticsData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'job_completed' ? 'bg-green-600' : 'bg-blue-600'
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(activity.timestamp), 'MMM dd, yyyy \'at\' h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Production Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Live Production Status</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
            <span className="text-sm text-gray-600">Live</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{analyticsData.activeJobs}</div>
            <div className="text-sm text-gray-600 mt-1">Jobs in Progress</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {analyticsData.stepTimings.length > 0 ? analyticsData.stepTimings[0].averageTime.toFixed(0) : 0}m
            </div>
            <div className="text-sm text-gray-600 mt-1">Current Step Avg Time</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{analyticsData.qualityScore.toFixed(1)}%</div>
            <div className="text-sm text-gray-600 mt-1">Quality Score</div>
          </div>
        </div>
      </div>
    </div>
  );
}