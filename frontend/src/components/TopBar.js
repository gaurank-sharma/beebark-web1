import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { FiSearch, FiBell, FiMoon, FiLogOut } from 'react-icons/fi';
import { Badge } from './ui/badge';

const TopBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-slate-200 z-10 px-6 flex items-center justify-between">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Search projects, jobs, or partners..."
            className="pl-10 bg-slate-50 border-slate-200"
            data-testid="search-input"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="text-center px-3 py-1 bg-slate-100 rounded-lg">
            <div className="flex items-center space-x-1">
              <span className="text-lg font-bold text-black">2.4k</span>
            </div>
          </div>
          <div className="text-center px-3 py-1 bg-yellow-400 rounded-lg">
            <div className="flex items-center space-x-1">
              <span className="text-lg font-bold text-black">12</span>
            </div>
          </div>
        </div>

        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <FiMoon className="w-5 h-5 text-slate-600" />
        </button>

        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative">
          <FiBell className="w-5 h-5 text-slate-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full"></span>
        </button>

        <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
          <div className="text-right">
            <p className="font-semibold text-sm text-black">{user?.name}</p>
            <p className="text-xs text-slate-500">
              {user?.role === 'recruiter' ? 'Recruiter' : 'Professional'} • 
              <span className="text-yellow-600 font-semibold"> PRO</span>
            </p>
          </div>
          <Avatar className="w-10 h-10 cursor-pointer" onClick={() => navigate('/profile')}>
            <AvatarImage src={user?.profilePic} />
            <AvatarFallback className="bg-yellow-400 text-black font-semibold">
              {user?.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>

        <Button
          onClick={handleLogout}
          variant="ghost"
          size="sm"
          className="text-slate-600 hover:text-red-600"
          data-testid="logout-button"
        >
          <FiLogOut className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default TopBar;