import React from 'react';
import { LayoutDashboard, FileText, Layers, Filter, Database, BarChart3, Settings, LogOut, Table } from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
  activeProjectTitle?: string;
  user: User | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, activeProjectTitle, user, onLogout }) => {
  
  const NavItem = ({ view, icon: Icon, label, disabled = false }: { view: string; icon: any; label: string; disabled?: boolean }) => {
    const isActive = activeView === view;
    return (
      <button
        onClick={() => !disabled && setActiveView(view)}
        disabled={disabled}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
          isActive 
            ? 'bg-blue-900/30 text-blue-400 border-l-4 border-blue-500' 
            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
        } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
      >
        <Icon size={20} />
        <span className="font-medium text-sm">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-900 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <div className="w-3 h-8 bg-blue-600 rounded-sm"></div>
            <span>Trypta</span>
          </h1>
          {activeProjectTitle && (
            <div className="mt-4 px-3 py-2 bg-slate-900 rounded border border-slate-800">
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Projet Actif</p>
              <p className="text-sm font-medium text-blue-300 truncate" title={activeProjectTitle}>{activeProjectTitle}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Tableau de bord" />
          
          {activeProjectTitle && (
            <>
              <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Revue
              </div>
              <NavItem view="import" icon={Database} label="Importer" />
              <NavItem view="duplicates" icon={Layers} label="Dédoublonnage" />
              <NavItem view="screening" icon={Filter} label="Criblage (Titre/Abs)" />
              <NavItem view="fulltext" icon={FileText} label="Texte Intégral" />
              <NavItem view="extraction" icon={Table} label="Extraction" />
              <NavItem view="synthesis" icon={BarChart3} label="Synthèse & Export" />
              
              <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Configuration
              </div>
              <NavItem view="settings" icon={Settings} label="Paramètres du projet" />
            </>
          )}

        </nav>

        <div className="p-4 border-t border-slate-900">
          {user && (
            <div className="mb-4 px-2">
              <p className="text-xs text-slate-500">Connecté en tant que</p>
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
            </div>
          )}
          <button 
            className="flex items-center space-x-3 text-slate-500 hover:text-red-400 transition-colors w-full px-4 py-2"
            onClick={onLogout}
          >
            <LogOut size={18} />
            <span className="text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-950 relative">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};