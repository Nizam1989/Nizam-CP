import React, { useState } from 'react';
import { Clock, User, Calendar, Package, MessageSquare, CheckCircle, AlertTriangle, Edit, Send, Trash2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

interface QNCardProps {
  notification: any;
  onUpdate: () => void;
  onDelete?: (qnId: string, qnNumber: string) => void;
}

export function QNCard({ notification, onUpdate, onDelete }: QNCardProps) {
  const { user } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [resolutionComment, setResolutionComment] = useState('');
  const [updating, setUpdating] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'material':
        return '🧱';
      case 'process':
        return '⚙️';
      case 'equipment':
        return '🔧';
      case 'documentation':
        return '📋';
      case 'safety':
        return '⚠️';
      default:
        return '❓';
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    try {
      // Update using dataService
      const { dataService } = await import('../../lib/dataService');
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      if (newStatus === 'resolved') {
        updates.resolved_at = new Date().toISOString();
        updates.resolved_by = user?.id;
      }
      
      await dataService.updateQualityNotification(notification.id, updates);
      
      // Log successful update to backend
      console.log('✅ QN status updated in backend:', {
        qnId: notification.id,
        newStatus: newStatus,
        updatedBy: user?.full_name
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error updating QN status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleResolveWithComment = async () => {
    if (!resolutionComment.trim()) {
      alert('Please add a resolution comment before closing the QN.');
      return;
    }

    setUpdating(true);
    try {
      // Update QN with resolution comment using dataService
      const { dataService } = await import('../../lib/dataService');
      const updates = {
        status: 'resolved',
        resolution_notes: resolutionComment,
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id,
        updated_at: new Date().toISOString()
      };
      
      await dataService.updateQualityNotification(notification.id, updates);
      
      // If QN was related to a job, remove the hold status
      if (notification.job_id) {
        const updatedJob = await dataService.updateJob(notification.job_id, {
          status: 'active',
          hold_reason: null,
          updated_at: new Date().toISOString()
        });
        
        if (updatedJob) {
          console.log(`✅ Job ${updatedJob.job_number} resumed from hold after QN ${notification.qn_number} resolution`);
        }
      }

      // Log successful resolution to backend
      console.log('✅ QN resolved with comment in backend:', {
        qnId: notification.id,
        resolvedBy: user?.full_name,
        commentLength: resolutionComment.length
      });
      
      setShowResolutionForm(false);
      setResolutionComment('');
      onUpdate();
    } catch (error) {
      console.error('Error resolving QN:', error);
      alert('Error resolving QN. Please try again.');
    } finally {
      setUpdating(false);
    }
  };
  
  const canUpdateStatus = () => {
    // Allow creator, assigned person, or admin to update status
    return user?.id === notification.raised_by || 
           user?.id === notification.assigned_to || 
           user?.role === 'admin';
  };

  const handleDeleteQN = () => {
    if (onDelete) {
      onDelete(notification.id, notification.qn_number);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all duration-200">
      {/* Header Section - Stack on mobile, side by side on desktop */}
      <div className="space-y-4 mb-4">
        {/* Title and Badges Row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{notification.qn_number}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(notification.priority)} whitespace-nowrap`}>
                {notification.priority.toUpperCase()}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(notification.status)} whitespace-nowrap`}>
                {notification.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <h4 className="text-md font-medium text-gray-900 mb-2 leading-tight">{notification.title}</h4>
          </div>
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getCategoryIcon(notification.category)}</span>
            <span className="capitalize">{notification.category}</span>
          </div>
          {notification.job_number && (
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Job: {notification.job_number}</span>
            </div>
          )}
          {notification.serial_number && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded truncate">
                SN: {notification.serial_number}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Action Buttons - Stack on mobile, inline on desktop */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end pt-2 border-t border-gray-100">
          {/* Status Update Buttons */}
          {canUpdateStatus() && notification.status !== 'closed' && (
            <div className="flex flex-wrap gap-2">
              {notification.status === 'open' && (
                <button
                  onClick={() => handleStatusUpdate('in_progress')}
                  disabled={updating}
                  className="px-3 py-2 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  Start Work
                </button>
              )}
              {notification.status === 'in_progress' && (
                <button
                  onClick={() => setShowResolutionForm(true)}
                  disabled={updating}
                  className="px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  Resolve
                </button>
              )}
              {notification.status === 'resolved' && (
                <button
                  onClick={() => handleStatusUpdate('closed')}
                  disabled={updating}
                  className="px-3 py-2 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  Close
                </button>
              )}
            </div>
          )}
          
          {/* Secondary Actions */}
          <div className="flex gap-2">
            {user?.role === 'admin' && (
              <button
                onClick={handleDeleteQN}
                className="p-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                title="Delete QN (Admin Only)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-3 py-2 text-blue-600 bg-blue-50 text-xs rounded hover:bg-blue-100 transition-colors whitespace-nowrap"
            >
              {showDetails ? 'Hide Details' : 'View Details'}
            </button>
          </div>
        </div>
      </div>

      {/* Resolution Form */}
      {showResolutionForm && (
        <div className="border-t border-gray-200 pt-4 mt-4 bg-green-50 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Edit className="w-4 h-4 text-green-600" />
            Add Resolution Comment
          </h5>
          <textarea
            value={resolutionComment}
            onChange={(e) => setResolutionComment(e.target.value)}
            placeholder="Describe how this quality issue was resolved, what actions were taken, and any preventive measures implemented..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
          />
          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-3">
            <button
              onClick={() => {
                setShowResolutionForm(false);
                setResolutionComment('');
              }}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              onClick={handleResolveWithComment}
              disabled={updating || !resolutionComment.trim()}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm order-1 sm:order-2"
            >
              <Send className="w-4 h-4" />
              {updating ? 'Resolving...' : 'Resolve QN'}
            </button>
          </div>
        </div>
      )}

      {/* Details Section */}
      {showDetails && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          <div>
            <h5 className="text-sm font-medium text-gray-900 mb-2">Description</h5>
            <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">{notification.description}</p>
          </div>
          
          {/* Manufacturing Information */}
          <div>
            <h5 className="text-sm font-medium text-gray-900 mb-3">Manufacturing Information</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {notification.serial_number && (
                <div className="bg-gray-50 p-3 rounded">
                  <span className="font-medium text-gray-700 block">Serial Number:</span>
                  <div className="font-mono text-gray-900 break-all">{notification.serial_number}</div>
                </div>
              )}
              {notification.batch_number && (
                <div className="bg-gray-50 p-3 rounded">
                  <span className="font-medium text-gray-700 block">Batch/Lot:</span>
                  <div className="font-mono text-gray-900 break-all">{notification.batch_number}</div>
                </div>
              )}
              {notification.part_number && (
                <div className="bg-gray-50 p-3 rounded">
                  <span className="font-medium text-gray-700 block">Part Number:</span>
                  <div className="font-mono text-gray-900 break-all">{notification.part_number}</div>
                </div>
              )}
              {notification.customer_po && (
                <div className="bg-gray-50 p-3 rounded">
                  <span className="font-medium text-gray-700 block">Customer PO:</span>
                  <div className="font-mono text-gray-900 break-all">{notification.customer_po}</div>
                </div>
              )}
              {notification.work_order && (
                <div className="bg-gray-50 p-3 rounded">
                  <span className="font-medium text-gray-700 block">Work Order:</span>
                  <div className="font-mono text-gray-900 break-all">{notification.work_order}</div>
                </div>
              )}
              {notification.machine_id && (
                <div className="bg-gray-50 p-3 rounded">
                  <span className="font-medium text-gray-700 block">Machine ID:</span>
                  <div className="font-mono text-gray-900 break-all">{notification.machine_id}</div>
                </div>
              )}
              {notification.operator_id && (
                <div className="bg-gray-50 p-3 rounded">
                  <span className="font-medium text-gray-700 block">Operator ID:</span>
                  <div className="font-mono text-gray-900 break-all">{notification.operator_id}</div>
                </div>
              )}
              {notification.shift && (
                <div className="bg-gray-50 p-3 rounded">
                  <span className="font-medium text-gray-700 block">Shift:</span>
                  <div className="text-gray-900 capitalize">{notification.shift.replace('_', ' ')}</div>
                </div>
              )}
              {notification.production_line && (
                <div className="bg-gray-50 p-3 rounded">
                  <span className="font-medium text-gray-700 block">Production Line:</span>
                  <div className="text-gray-900">{notification.production_line.replace('_', ' ').toUpperCase()}</div>
                </div>
              )}
              {notification.material_lot && (
                <div className="bg-gray-50 p-3 rounded">
                  <span className="font-medium text-gray-700 block">Material Lot:</span>
                  <div className="font-mono text-gray-900 break-all">{notification.material_lot}</div>
                </div>
              )}
              {notification.inspection_stage && (
                <div className="bg-gray-50 p-3 rounded">
                  <span className="font-medium text-gray-700 block">Inspection Stage:</span>
                  <div className="text-gray-900 capitalize">{notification.inspection_stage.replace('_', ' ')}</div>
                </div>
              )}
              {notification.defect_location && (
                <div className="bg-gray-50 p-3 rounded">
                  <span className="font-medium text-gray-700 block">Defect Location:</span>
                  <div className="text-gray-900 break-words">{notification.defect_location}</div>
                </div>
              )}
              {notification.quantity_affected && (
                <div className="bg-gray-50 p-3 rounded">
                  <span className="font-medium text-gray-700 block">Quantity Affected:</span>
                  <div className="text-gray-900">{notification.quantity_affected} units</div>
                </div>
              )}
              {notification.root_cause_category && (
                <div className="bg-gray-50 p-3 rounded">
                  <span className="font-medium text-gray-700 block">Root Cause:</span>
                  <div className="text-gray-900 capitalize">{notification.root_cause_category.replace('_', ' ')}</div>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Raised by:</span>
              <div className="flex items-center gap-2 mt-1">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
               <span className="truncate">{notification.raised_by_user?.full_name || 'Unknown User'}</span>
               <span className="text-gray-500 whitespace-nowrap">({notification.raised_by_user?.role || 'Unknown Role'})</span>
              </div>
            </div>
            
            {notification.assigned_to_user && (
              <div>
                <span className="font-medium text-gray-700">Assigned to:</span>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{notification.assigned_to_user.full_name}</span>
                  <span className="text-gray-500 whitespace-nowrap">({notification.assigned_to_user.role})</span>
                </div>
              </div>
            )}
            
            <div>
              <span className="font-medium text-gray-700">Created:</span>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm">{format(new Date(notification.created_at), 'MMM d, yyyy \'at\' h:mm a')}</span>
              </div>
            </div>
            
            {notification.resolved_at && (
              <div>
                <span className="font-medium text-gray-700">Resolved:</span>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">{format(new Date(notification.resolved_at), 'MMM d, yyyy \'at\' h:mm a')}</span>
                </div>
              </div>
            )}
          </div>
          
          {notification.resolution_notes && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">Resolution Notes</h5>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{notification.resolution_notes}</p>
                {notification.resolved_by && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-green-200">
                    <User className="w-3 h-3 text-green-600 flex-shrink-0" />
                    <span className="text-xs text-green-700 truncate">
                      Resolved by: {notification.resolved_by_user?.full_name || 'Unknown'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}