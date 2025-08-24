import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Plus, 
  Search, 
  History, 
  Settings, 
  LogOut,
  Factory,
  Users,
  BarChart3,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function Sidebar() {
  const { user, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'New Job', href: '/jobs/new', icon: Plus },
    { name: 'Search Jobs', href: '/jobs/search', icon: Search },
    { name: 'History', href: '/jobs/history', icon: History },
    { name: 'Dossier Automation', href: '/dossier', icon: FileText },
    { name: 'Quality Notification', href: '/quality-notification', icon: AlertTriangle },
  ];

  const adminNavigation = [
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const managerNavigation = [
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ];

  const engineerNavigation = [
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ];

  return (
    <>
      {/* Sidebar - Static for mobile, collapsible for desktop */}
      <div className={`
        lg:static inset-y-0 left-0
        bg-slate-900 text-white
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}
        w-64 lg:flex
        flex-col h-full
      `}>
        {/* Logo Section with Desktop Toggle */}
        <div className={`flex items-center justify-between p-6 border-b border-slate-700 ${isCollapsed ? 'lg:justify-center lg:px-3' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Factory className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-sm font-bold text-white">Completion Products</h1>
                <p className="text-xs text-slate-400">Manufacturing System</p>
              </div>
            )}
          </div>
          
          {/* Desktop Toggle Button - Inside Header */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-6 h-6 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* User Info */}
        <div className={`p-4 border-b border-slate-700 ${isCollapsed ? 'lg:px-3' : ''}`}>
          <div className={`bg-slate-800 rounded-lg p-3 ${isCollapsed ? 'lg:p-2' : ''}`}>
            <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:justify-center' : ''}`}>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-white">
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-white truncate">{user?.full_name}</p>
                  <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 p-4 space-y-1 ${isCollapsed ? 'lg:px-3' : ''}`}>
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                } ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`
              }
              title={isCollapsed ? item.name : ''}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 hidden lg:block">
                  {item.name}
                </div>
              )}
            </NavLink>
          ))}

          {/* Admin Section */}
          {user?.role === 'admin' && (
            <>
              <div className="pt-4 mt-4 border-t border-slate-700">
                {!isCollapsed && (
                  <p className="px-3 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Administration
                  </p>
                )}
              </div>
              {adminNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    } ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`
                  }
                  title={isCollapsed ? item.name : ''}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 hidden lg:block">
                      {item.name}
                    </div>
                  )}
                </NavLink>
              ))}
            </>
          )}

          {/* Manager/Engineer Section */}
          {(user?.role === 'manager' || user?.role === 'engineer') && (
            <>
              <div className="pt-4 mt-4 border-t border-slate-700">
                {!isCollapsed && (
                  <p className="px-3 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Management
                  </p>
                )}
              </div>
              {(user?.role === 'manager' ? managerNavigation : engineerNavigation).map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    } ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`
                  }
                  title={isCollapsed ? item.name : ''}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 hidden lg:block">
                      {item.name}
                    </div>
                  )}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Sign Out */}
        <div className={`p-4 border-t border-slate-700 ${isCollapsed ? 'lg:px-3' : ''}`}>
          <button
            onClick={signOut}
            className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-200 group relative ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
            title={isCollapsed ? 'Sign Out' : ''}
          >
            <LogOut className="w-5 h-5 flex-shrink-0 group-hover:rotate-12 transition-transform" />
            {!isCollapsed && <span>Sign Out</span>}
            
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 hidden lg:block">
                Sign Out
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Spacer for desktop layout */}
      <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}></div>
    </>
  );
}