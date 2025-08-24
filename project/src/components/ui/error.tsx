import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  variant?: 'error' | 'warning' | 'info';
}

export function ErrorMessage({ 
  title = 'Something went wrong',
  message, 
  onRetry, 
  onGoHome,
  variant = 'error' 
}: ErrorMessageProps) {
  const variantStyles = {
    error: 'border-red-200 bg-red-50 text-red-800',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800'
  };

  const iconColor = {
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500'
  };

  return (
    <div className={`border rounded-lg p-4 ${variantStyles[variant]}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor[variant]}`} />
        <div className="flex-1">
          <h3 className="font-medium">{title}</h3>
          <p className="mt-1 text-sm">{message}</p>
          
          {(onRetry || onGoHome) && (
            <div className="mt-3 flex gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try again
                </button>
              )}
              {onGoHome && (
                <button
                  onClick={onGoHome}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Go home
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ErrorPageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

export function ErrorPage({ 
  title = 'Oops! Something went wrong',
  message, 
  onRetry, 
  onGoHome 
}: ErrorPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="flex gap-3 justify-center">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            )}
            {onGoHome && (
              <button
                onClick={onGoHome}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}