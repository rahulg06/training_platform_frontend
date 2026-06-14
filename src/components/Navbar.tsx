import { User } from "../types";
import { Award, LogIn, LogOut, Terminal, Users, Layers, ShieldCheck } from "lucide-react";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({
  user,
  onLogout,
  onOpenAuth,
  activeTab,
  setActiveTab,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Name */}
        <div 
          onClick={() => setActiveTab("explore")} 
          className="flex cursor-pointer items-center space-x-2.5 transition active:scale-95"
          id="nav-brand"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Terminal className="h-4.5 w-4.5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Delta<span className="text-indigo-600">clause</span>
          </span>
        </div>

        {/* Middle Navigation Routes */}
        <nav className="hidden md:flex space-x-6 h-full items-center">
          <button
            onClick={() => setActiveTab("explore")}
            className={`text-sm font-semibold transition py-5 border-b-2 ${
              activeTab === "explore"
                ? "text-indigo-600 border-indigo-600"
                : "text-slate-600 border-transparent hover:text-indigo-600 hover:border-indigo-100"
            }`}
            id="nav-btn-explore"
          >
            Trainings
          </button>
          
          <button
            onClick={() => setActiveTab("verify")}
            className={`text-sm font-semibold transition py-5 border-b-2 ${
              activeTab === "verify" || activeTab === "verification-result"
                ? "text-indigo-600 border-indigo-600"
                : "text-slate-600 border-transparent hover:text-indigo-600 hover:border-indigo-100"
            }`}
            id="nav-btn-verify"
          >
            Verify Certificate
          </button>

          {user && user.role === "student" && (
            <button
              onClick={() => setActiveTab("student-dashboard")}
              className={`text-sm font-semibold transition py-5 border-b-2 ${
                activeTab === "student-dashboard"
                  ? "text-indigo-600 border-indigo-600"
                  : "text-slate-600 border-transparent hover:text-indigo-600 hover:border-indigo-100"
              }`}
              id="nav-btn-student"
            >
              Student Portal
            </button>
          )}

          {user && user.role === "admin" && (
            <button
              onClick={() => setActiveTab("admin-dashboard")}
              className={`text-sm font-semibold transition py-5 border-b-2 ${
                activeTab === "admin-dashboard"
                  ? "text-indigo-600 border-indigo-600"
                  : "text-slate-600 border-transparent hover:text-indigo-600 hover:border-indigo-100"
              }`}
              id="nav-btn-admin"
            >
              Admin Dashboard
            </button>
          )}
        </nav>

        {/* Action Button Set */}
        <div className="flex items-center space-x-3" id="nav-actions">
          {/* Mobile indicator for navigation */}
          <div className="md:hidden flex space-x-2 mr-2">
            <button
              onClick={() => setActiveTab("explore")}
              className={`px-2.5 py-1 text-xs rounded-lg transition font-medium ${
                activeTab === "explore" ? "bg-indigo-50 text-indigo-700" : "text-slate-500"
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => setActiveTab("verify")}
              className={`px-2.5 py-1 text-xs rounded-lg transition font-medium ${
                activeTab === "verify" ? "bg-indigo-50 text-indigo-700" : "text-slate-500"
              }`}
            >
              Verify
            </button>
          </div>

          {user ? (
            <div className="flex items-center space-x-3">
              {/* Rewards Pill */}
              <div 
                className="hidden sm:flex items-center space-x-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100"
                title="Your Deltaclause Reward Points"
              >
                <span>🪙</span>
                <span>{user.rewardPoints} Pts</span>
              </div>

              {/* User Avatar & Role */}
              <div className="flex flex-col text-right hidden lg:block">
                <span className="text-xs font-bold text-slate-800 block">
                  {user.name}
                </span>
                <span className="text-[9px] uppercase tracking-widest text-indigo-600 block font-mono font-bold">
                  {user.role}
                </span>
              </div>

              <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

              {/* Secondary Navigation shortcuts */}
              <button
                onClick={() => {
                  if (user.role === "admin") setActiveTab("admin-dashboard");
                  else setActiveTab("student-dashboard");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-slate-300 transition"
                title="Go to Dashboard"
              >
                {user.role === "admin" ? <Layers className="h-4 w-4" /> : <Users className="h-4 w-4" />}
              </button>

              <button
                onClick={onLogout}
                className="flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-indigo-600 transition active:scale-95"
                id="btn-logout"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white transition active:scale-95 shadow-lg shadow-indigo-100"
              id="btn-open-login"
            >
              <LogIn className="h-4 w-4" />
              <span>Portal Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
