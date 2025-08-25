// Real-time updates hook using polling mechanism
import { useState, useEffect, useCallback, useRef } from 'react';
import { api, type SystemUpdate } from '../lib/api';

interface UseRealTimeUpdatesOptions {
  enabled?: boolean;
  pollInterval?: number; // milliseconds
  onUpdate?: (update: SystemUpdate) => void;
}

interface UseRealTimeUpdatesReturn {
  isConnected: boolean;
  updates: SystemUpdate[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastUpdateTime: string | null;
  manualRefresh: () => void;
  clearUpdates: () => void;
}

export const useRealTimeUpdates = (
  options: UseRealTimeUpdatesOptions = {}
): UseRealTimeUpdatesReturn => {
  const {
    enabled = true,
    pollInterval = 3000, // 3 seconds default
    onUpdate
  } = options;

  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastPollTimeRef = useRef<string>(new Date().toISOString());
  const isPollingRef = useRef(false);
  const processedUpdateIds = useRef<Set<string>>(new Set());

  const pollForUpdates = useCallback(async () => {
    if (isPollingRef.current) return; // Prevent concurrent polls
    
    isPollingRef.current = true;
    
    try {
      setConnectionStatus('connecting');
      
      const response = await api.getUpdates(lastPollTimeRef.current);
      
      if (response.success && response.data) {
        const allUpdates = response.data;
        
        // Filter out already processed updates
        const newUpdates = allUpdates.filter(update => !processedUpdateIds.current.has(update.id));
        
        if (newUpdates.length > 0) {
          // Mark these updates as processed
          newUpdates.forEach(update => processedUpdateIds.current.add(update.id));
          
          // Clean up old processed IDs if they get too many (keep last 500)
          if (processedUpdateIds.current.size > 500) {
            const idsArray = Array.from(processedUpdateIds.current);
            processedUpdateIds.current = new Set(idsArray.slice(-300)); // Keep last 300
          }
          
          setUpdates(prev => {
            const combined = [...newUpdates, ...prev];
            // Keep only the last 100 updates to prevent memory issues
            return combined.slice(0, 100);
          });
          
          // Update last poll time to the most recent update from all updates (not just new)
          if (allUpdates.length > 0) {
            const mostRecent = allUpdates[0];
            lastPollTimeRef.current = mostRecent.createdAt;
            setLastUpdateTime(mostRecent.createdAt);
          }
          
          // Call onUpdate callback for each new update only
          if (onUpdate) {
            newUpdates.forEach(onUpdate);
          }
        } else if (allUpdates.length > 0) {
          // Even if no new updates, update the poll time to prevent re-fetching
          const mostRecent = allUpdates[0];
          lastPollTimeRef.current = mostRecent.createdAt;
          setLastUpdateTime(mostRecent.createdAt);
        }
        
        setConnectionStatus('connected');
      } else {
        console.warn('Failed to fetch updates:', response.error);
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('Error polling for updates:', error);
      setConnectionStatus('error');
    } finally {
      isPollingRef.current = false;
    }
  }, [onUpdate]);

  const manualRefresh = useCallback(() => {
    if (enabled) {
      pollForUpdates();
    }
  }, [enabled, pollForUpdates]);

  const clearUpdates = useCallback(() => {
    setUpdates([]);
    // Reset last poll time to now
    lastPollTimeRef.current = new Date().toISOString();
    // Clear processed IDs to allow re-processing if needed
    processedUpdateIds.current.clear();
  }, []);

  // Start/stop polling based on enabled state
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      setConnectionStatus('disconnected');
      return;
    }

    // Initial poll
    pollForUpdates();

    // Set up recurring poll
    intervalRef.current = setInterval(pollForUpdates, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [enabled, pollInterval, pollForUpdates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isConnected: connectionStatus === 'connected',
    updates,
    connectionStatus,
    lastUpdateTime,
    manualRefresh,
    clearUpdates
  };
};

// Hook for managing notifications from real-time updates
export const useRealTimeNotifications = () => {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: string;
    entityType?: string;
    entityId?: string;
  }>>([]);

  const addNotification = useCallback((notification: {
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    entityType?: string;
    entityId?: string;
  }) => {
    const newNotification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep last 10

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convert system updates to user-friendly notifications
  const handleSystemUpdate = useCallback((update: SystemUpdate) => {
    let message = '';
    let type: 'info' | 'success' | 'warning' | 'error' = 'info';

    switch (update.entityType) {
      case 'job':
        if (update.type === 'created') {
          message = `New job created: ${update.data.title}`;
          type = 'success';
        } else if (update.type === 'updated') {
          message = `Job updated: ${update.data.title}`;
          type = 'info';
        }
        break;
      case 'step':
        if (update.type === 'updated' && update.data.status === 'completed') {
          message = `Production step completed: ${update.data.stepName}`;
          type = 'success';
        } else if (update.type === 'updated') {
          message = `Production step updated: ${update.data.stepName}`;
          type = 'info';
        }
        break;
      case 'notification':
        if (update.type === 'created') {
          message = `New quality notification: ${update.data.title}`;
          type = update.data.severity === 'high' || update.data.severity === 'critical' ? 'error' : 'warning';
        }
        break;
      case 'pdf':
        if (update.type === 'created') {
          message = `PDF report generated`;
          type = 'success';
        }
        break;
      default:
        message = `System update: ${update.type} ${update.entityType}`;
        type = 'info';
    }

    if (message) {
      addNotification({
        message,
        type,
        entityType: update.entityType,
        entityId: update.entityId
      });
    }
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    handleSystemUpdate
  };
};