import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { 
  DashboardView, 
  ImportView, 
  DeduplicateView, 
  ScreeningView, 
  SynthesisView,
  SettingsView,
  ExtractionView
} from './components/ProjectComponents';
import { Project, Reference, ReferenceStatus, Decision, Role, User, ExtractionField } from './types';
import { v4 as uuidv4 } from 'uuid';

// Simple ID generator fallback
const generateId = () => uuidv4();

const App: React.FC = () => {
  // --- State ---
  // Default to a local admin user to bypass authentication
  const [user, setUser] = useState<User | null>({
    id: 'local_admin',
    name: 'Administrateur',
    email: 'admin@trypta.local',
    role: Role.ADMIN
  });
  
  const [activeView, setActiveView] = useState('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [references, setReferences] = useState<Reference[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // --- Persistence (Simulated Backend) ---
  
  // Load Projects
  useEffect(() => {
    const savedProjects = localStorage.getItem('trypta_projects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('trypta_projects', JSON.stringify(projects));
    }
  }, [projects]);

  // Load references when project changes
  useEffect(() => {
    if (activeProject) {
      const savedRefs = localStorage.getItem(`trypta_refs_${activeProject.id}`);
      if (savedRefs) {
        setReferences(JSON.parse(savedRefs));
      } else {
        setReferences([]);
      }
      setSearchQuery(''); // Reset search when project changes
    }
  }, [activeProject]);

  useEffect(() => {
    if (activeProject && references.length > 0) {
      localStorage.setItem(`trypta_refs_${activeProject.id}`, JSON.stringify(references));
    }
  }, [references, activeProject]);

  // Reset search when view changes for better UX
  useEffect(() => {
    setSearchQuery('');
  }, [activeView]);


  // --- Actions ---

  const handleLogout = () => {
    // Since there is no auth page, logout acts as a session reset or no-op
    // We'll just alert for now as removing the user would break the app (it expects a user)
    if(window.confirm("Ceci est une version locale sans authentification. Voulez-vous recharger l'application ?")) {
        window.location.reload();
    }
  };

  const handleCreateProject = (projectData: Partial<Project>) => {
    const newProject: Project = {
      id: generateId(),
      title: projectData.title || 'Untitled',
      description: projectData.description || '',
      researchQuestion: projectData.researchQuestion || '',
      inclusionCriteria: 'Doit traiter du sujet spécifique. Population humaine. Anglais ou Français.',
      exclusionCriteria: 'Éditoriaux, revues narratives, modèles animaux.',
      extractionSchema: [
         { id: 'methodology', label: 'Méthodologie', type: 'select', options: ['Quantitative', 'Qualitative', 'Mixte', 'Revue'] },
         { id: 'population', label: 'Population', type: 'text' },
         { id: 'results', label: 'Principaux Résultats', type: 'text' }
      ],
      createdAt: Date.now()
    };
    setProjects([...projects, newProject]);
    handleSelectProject(newProject);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    setActiveProject(updatedProject);
  };

  const handleSelectProject = (project: Project) => {
    setActiveProject(project);
    setActiveView('import'); // Default to import when opening a project, or screening if data exists
  };

  const handleImport = (newRefs: Reference[]) => {
    if (!activeProject) return;
    setReferences(prev => [...prev, ...newRefs]);
  };

  const handleMarkAsDuplicates = (idsToMark: string[]) => {
    setReferences(prev => prev.map(ref => {
      if (idsToMark.includes(ref.id)) {
        return { ...ref, status: ReferenceStatus.DUPLICATE };
      }
      return ref;
    }));
  };

  const handleScreeningDecision = (id: string, decision: Decision) => {
    setReferences(prev => prev.map(ref => {
      if (ref.id === id) {
        if (activeView === 'screening') {
          return {
            ...ref,
            decisionTitleAbstract: decision,
            status: decision === Decision.INCLUDE ? ReferenceStatus.SCREENING_FULL_TEXT : ReferenceStatus.EXCLUDED
          };
        } else if (activeView === 'fulltext') {
           return {
            ...ref,
            decisionFullText: decision,
            status: decision === Decision.INCLUDE ? ReferenceStatus.INCLUDED : ReferenceStatus.EXCLUDED
          };
        }
      }
      return ref;
    }));
  };
  
  const handleUploadPdf = (refId: string, file: File) => {
     setReferences(prev => prev.map(r => r.id === refId ? { ...r, pdfFileName: file.name } : r));
  };

  const handleUpdateExtractionSchema = (schema: ExtractionField[]) => {
     if(activeProject) {
        handleUpdateProject({ ...activeProject, extractionSchema: schema });
     }
  };

  const handleUpdateExtractionData = (refId: string, data: any) => {
     setReferences(prev => prev.map(r => r.id === refId ? { ...r, extractionData: data } : r));
  };

  // --- Filtering ---
  const filteredReferences = useMemo(() => {
    if (!searchQuery) return references;
    const lowerQuery = searchQuery.toLowerCase();
    return references.filter(r => 
      r.title.toLowerCase().includes(lowerQuery) || 
      r.abstract.toLowerCase().includes(lowerQuery) ||
      r.authors.toLowerCase().includes(lowerQuery)
    );
  }, [references, searchQuery]);

  // --- Render ---

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView projects={projects} onCreateProject={handleCreateProject} onSelectProject={handleSelectProject} />;
      case 'import':
        return (
          <ImportView 
            onImport={handleImport} 
            onNavigateNext={() => setActiveView('duplicates')}
            projectId={activeProject?.id || ''} 
          />
        );
      case 'duplicates':
        // We pass ALL references to duplicate view, as deduplication should happen on full dataset
        return <DeduplicateView references={references} onMarkDuplicates={handleMarkAsDuplicates} />;
      case 'screening':
        return (
          <ScreeningView 
            references={filteredReferences} 
            onDecision={handleScreeningDecision} 
            activeProject={activeProject} 
            stage="title"
            searchQuery={searchQuery}
            onSearch={setSearchQuery} 
          />
        );
      case 'fulltext':
         return (
          <ScreeningView 
            references={filteredReferences} 
            onDecision={handleScreeningDecision} 
            activeProject={activeProject} 
            stage="fulltext" 
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            onUploadPdf={handleUploadPdf}
          />
        );
      case 'extraction':
         return activeProject ? (
            <ExtractionView 
               project={activeProject}
               references={references}
               onUpdateSchema={handleUpdateExtractionSchema}
               onUpdateData={handleUpdateExtractionData}
            />
         ) : null;
      case 'synthesis':
        return <SynthesisView references={references} project={activeProject} />;
      case 'settings':
        return activeProject ? <SettingsView project={activeProject} onUpdate={handleUpdateProject} /> : null;
      default:
        return <div className="text-white">Vue introuvable</div>;
    }
  };

  return (
    <Layout 
      activeView={activeView} 
      setActiveView={setActiveView}
      activeProjectTitle={activeProject?.title}
      user={user}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;