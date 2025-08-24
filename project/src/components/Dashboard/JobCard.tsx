import React from 'react';
import { Clock, User, Package, MoreHorizontal, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface JobCardProps {
  job: {
    id: string;
    job_number: string;
    product_type: string;
    status: string;
    current_stage: string;
    total_stages: number;
    started_at: string;
    assigned_to?: {
      full_name: string;
    };
    hold_reason?: string;
  };
  onClick: () => void;
  onDelete?: (jobId: string, jobNumber: string) => void;
  showDelete?: boolean;
}

export function JobCard({ job, onClick, onDelete, showDelete }: JobCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'on_hold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-blue-100 text-blue-800';
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

  const progressPercentage = Math.round((parseInt(job.current_stage.split(' ')[1] || '1') / job.total_stages) * 100);

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-blue-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{job.job_number}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProductTypeColor(job.product_type)}`}>
              {job.product_type}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
              {job.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showDelete && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(job.id, job.job_number);
              }}
              className="p-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"
              title="Delete Job (Admin Only)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">{job.current_stage}</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatDistanceToNow(new Date(job.started_at), { addSuffix: true })}</span>
          </div>
          {job.assigned_to && (
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{job.assigned_to.full_name}</span>
            </div>
          )}
        </div>

        {job.status === 'on_hold' && job.hold_reason && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-800 font-medium">Job on hold:</p>
            <p className="text-xs text-yellow-700">{job.hold_reason}</p>
          </div>
        )}
      </div>
    </div>
  );
}