import React, { useState, useEffect } from 'react';
import { useWebPubSub } from '../hooks/useWebPubSub';

const ManufacturingDashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [user] = useState({ 
        id: 'sandscreencp@outlook.com', 
        role: 'super_admin' 
    });
    const [notifications, setNotifications] = useState([]);
    
    // WebPubSub connection
    const { isConnected, messages } = useWebPubSub(user.id, user.role);
    
    // Load initial jobs
    useEffect(() => {
        const loadJobs = async () => {
            try {
                const response = await fetch('/api/getJobs');
                const jobsData = await response.json();
                setJobs(jobsData);
            } catch (error) {
                console.error('Error loading jobs:', error);
            }
        };
        
        loadJobs();
    }, []);
    
    // Handle real-time messages
    useEffect(() => {
        messages.forEach(message => {
            switch (message.type) {
                case 'jobCreated':
                    setJobs(prev => [...prev, message.data]);
                    addNotification(`New job created: ${message.data.title}`, 'success');
                    break;
                    
                case 'stepUpdated':
                    setJobs(prev => prev.map(job => 
                        job.id === message.data.jobId 
                            ? { ...job, lastUpdated: message.data.completedAt }
                            : job
                    ));
                    addNotification(`Production step updated for job ${message.data.jobId}`, 'info');
                    break;
                    
                case 'pdfGenerated':
                    addNotification(`PDF ready for job ${message.data.jobId}`, 'success');
                    break;
                    
                default:
                    break;
            }
        });
    }, [messages]);
    
    const createJob = async () => {
        const jobData = {
            jobNumber: `JOB-${Date.now()}`,
            title: `Manufacturing Job ${Date.now()}`,
            createdBy: user.id
        };
        
        try {
            await fetch('/api/createJob', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jobData)
            });
            
            // Job will be added via WebPubSub message
            
        } catch (error) {
            console.error('Error creating job:', error);
            addNotification('Failed to create job', 'error');
        }
    };
    
    const updateProductionStep = async (stepId, status) => {
        try {
            await fetch('/api/updateProductionStep', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stepId,
                    status,
                    completedBy: user.id
                })
            });
            
            // Update will be reflected via WebPubSub message
            
        } catch (error) {
            console.error('Error updating step:', error);
            addNotification('Failed to update production step', 'error');
        }
    };
    
    const generatePDF = async (jobId) => {
        try {
            const formData = {
                inspector: user.id,
                inspectionDate: new Date().toISOString(),
                qualityScore: '95%',
                notes: 'Quality inspection completed successfully'
            };
            
            await fetch('/api/generatePDF', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobId,
                    formData,
                    templateType: 'quality-inspection'
                })
            });
            
            // PDF ready notification will come via WebPubSub
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            addNotification('Failed to generate PDF', 'error');
        }
    };
    
    const addNotification = (message, type) => {
        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date().toLocaleTimeString()
        };
        
        setNotifications(prev => [notification, ...prev.slice(0, 4)]);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 5000);
    };
    
    return (
        <div className="manufacturing-dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <h1>Manufacturing Dashboard</h1>
                <div className="header-status">
                    <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                        {isConnected ? '🟢 Live' : '🔴 Offline'}
                    </span>
                    <span className="user-info">{user.role} | {user.id}</span>
                </div>
            </header>
            
            {/* Notifications */}
            <div className="notifications">
                {notifications.map(notification => (
                    <div key={notification.id} className={`notification ${notification.type}`}>
                        <span className="notification-time">{notification.timestamp}</span>
                        <span className="notification-message">{notification.message}</span>
                    </div>
                ))}
            </div>
            
            {/* Actions */}
            <div className="dashboard-actions">
                <button onClick={createJob} className="btn btn-primary">
                    Create New Job
                </button>
                <button onClick={() => window.location.reload()} className="btn btn-secondary">
                    Refresh Data
                </button>
            </div>
            
            {/* Jobs Grid */}
            <div className="jobs-grid">
                {jobs.map(job => (
                    <div key={job.id} className="job-card">
                        <div className="job-header">
                            <h3>{job.title}</h3>
                            <span className={`job-status ${job.status}`}>{job.status}</span>
                        </div>
                        <div className="job-details">
                            <p><strong>Job Number:</strong> {job.jobNumber}</p>
                            <p><strong>Created By:</strong> {job.createdBy}</p>
                            <p><strong>Created:</strong> {new Date(job.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="job-actions">
                            <button 
                                onClick={() => updateProductionStep(job.id + '-step1', 'completed')}
                                className="btn btn-sm btn-success"
                            >
                                Complete Step
                            </button>
                            <button 
                                onClick={() => generatePDF(job.id)}
                                className="btn btn-sm btn-info"
                            >
                                Generate PDF
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            
            {jobs.length === 0 && (
                <div className="empty-state">
                    <p>No manufacturing jobs found. Create one to get started!</p>
                </div>
            )}
        </div>
    );
};

export default ManufacturingDashboard;