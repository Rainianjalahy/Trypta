import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Plus, Upload, Trash2, CheckCircle, XCircle, HelpCircle, 
  FileText, Download, AlertTriangle, ArrowRight, BrainCircuit,
  Layers, Database, FileUp, FileCheck, Save, ClipboardList, Target, Search,
  List, Grid, ChevronDown, ChevronUp, CheckSquare, Table, Edit3, ExternalLink, Eye,
  TrendingUp, BookOpen, Users
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area
} from 'recharts';
import { Project, Reference, ReferenceStatus, Decision, ExtractionField, ExtractionFieldType } from '../types';
import { analyzeReferenceWithGemini } from '../services/geminiService';
import { processImportFile, parseBibTex } from '../services/importService';
import { v4 as uuidv4 } from 'uuid';

// --- Helper UI Components ---

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-6 ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, variant = 'primary', children, disabled = false, className = '' }: any) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2";
  const variants: any = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20",
    success: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20",
    ghost: "text-slate-400 hover:text-white hover:bg-slate-800/50"
  };
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, color = "blue" }: { children: React.ReactNode, color?: string }) => {
  const colors: any = {
    blue: "bg-blue-900/30 text-blue-400 border-blue-800",
    green: "bg-emerald-900/30 text-emerald-400 border-emerald-800",
    red: "bg-red-900/30 text-red-400 border-red-800",
    yellow: "bg-amber-900/30 text-amber-400 border-amber-800",
    slate: "bg-slate-800 text-slate-400 border-slate-700",
  };
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full border ${colors[color]}`}>
      {children}
    </span>
  );
};

// --- View Components ---

export const DashboardView = ({ projects, onCreateProject, onSelectProject }: any) => {
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', researchQuestion: '', description: '' });

  const handleSubmit = () => {
    if (!newProject.title) return;
    onCreateProject(newProject);
    setShowModal(false);
    setNewProject({ title: '', researchQuestion: '', description: '' });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Vos Projets</h2>
          <p className="text-slate-400 mt-1">Gérez vos revues systématiques et collaborations.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={18} /> <span>Nouveau Projet</span>
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800">
          <div className="p-4 bg-slate-900 rounded-full mb-4">
            <Layers size={32} className="text-slate-500" />
          </div>
          <h3 className="text-xl font-medium text-white">Aucun projet</h3>
          <p className="text-slate-500 mt-2 max-w-sm text-center">Commencez par créer votre première revue systématique pour importer des références.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p: Project) => (
            <div 
              key={p.id}
              onClick={() => onSelectProject(p)}
              className="group bg-slate-900 border border-slate-800 hover:border-blue-600/50 hover:bg-slate-850 p-6 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{p.title}</h3>
              <p className="text-slate-400 text-sm line-clamp-2 mb-4">{p.description || "Aucune description."}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge color="slate">Revue</Badge>
                <Badge color="blue">En cours</Badge>
              </div>
              <p className="text-xs text-slate-600 mt-4">Créé le {new Date(p.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Créer un nouveau projet</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Titre du projet</label>
                <input 
                  type="text" 
                  value={newProject.title}
                  onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                  placeholder="ex: Efficacité de l'IA en radiologie"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Question de recherche</label>
                <textarea 
                  value={newProject.researchQuestion}
                  onChange={(e) => setNewProject({...newProject, researchQuestion: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none h-24 resize-none"
                  placeholder="Quelle est..."
                />
              </div>
               <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                <textarea 
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none h-20 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-8">
              <Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button onClick={handleSubmit}>Créer le projet</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const SettingsView = ({ project, onUpdate }: { project: Project, onUpdate: (p: Project) => void }) => {
  const [formData, setFormData] = useState<Project>(project);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFormData(project);
  }, [project]);

  const handleSave = () => {
    onUpdate(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
           <h2 className="text-3xl font-bold text-white">Paramètres du projet</h2>
           <p className="text-slate-400 mt-2">Définissez la question de recherche et les critères de sélection.</p>
        </div>
        <Button onClick={handleSave} variant={saved ? "success" : "primary"}>
          {saved ? <CheckCircle size={18} /> : <Save size={18} />}
          <span>{saved ? "Enregistré" : "Enregistrer"}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <div className="flex items-center space-x-2 mb-4 text-blue-400">
             <ClipboardList size={20} />
             <h3 className="text-lg font-bold text-white">Informations Générales</h3>
          </div>
          <div className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Titre du projet</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none h-20 resize-none"
                />
             </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <div className="flex items-center space-x-2 mb-4 text-purple-400">
             <HelpCircle size={20} />
             <h3 className="text-lg font-bold text-white">Question de Recherche</h3>
          </div>
          <p className="text-xs text-slate-500 mb-2">Définissez clairement votre question (PICO) pour guider le processus de criblage.</p>
          <textarea 
            value={formData.researchQuestion}
            onChange={(e) => setFormData({...formData, researchQuestion: e.target.value})}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-4 text-white focus:border-purple-500 outline-none h-32 resize-none text-lg"
            placeholder="Quelle est..."
          />
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-l-4 border-l-emerald-500">
             <div className="flex items-center space-x-2 mb-4 text-emerald-400">
                <CheckCircle size={20} />
                <h3 className="text-lg font-bold text-white">Critères d'Inclusion</h3>
             </div>
             <textarea 
                value={formData.inclusionCriteria}
                onChange={(e) => setFormData({...formData, inclusionCriteria: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none h-64 resize-none"
                placeholder="- Population humaine&#10;- Études randomisées&#10;- Publié après 2010"
              />
          </Card>
          
          <Card className="border-l-4 border-l-red-500">
             <div className="flex items-center space-x-2 mb-4 text-red-400">
                <XCircle size={20} />
                <h3 className="text-lg font-bold text-white">Critères d'Exclusion</h3>
             </div>
             <textarea 
                value={formData.exclusionCriteria}
                onChange={(e) => setFormData({...formData, exclusionCriteria: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-red-500 outline-none h-64 resize-none"
                placeholder="- Modèles animaux&#10;- Éditoriaux&#10;- Langue autre que l'anglais"
              />
          </Card>
        </div>
      </div>
    </div>
  );
};

export const ImportView = ({ onImport, onNavigateNext, projectId }: { onImport: (refs: Reference[]) => void, onNavigateNext: () => void, projectId: string }) => {
  const [text, setText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [importSummary, setImportSummary] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    try {
      const refs = await processImportFile(file, projectId);
      if (refs.length > 0) {
        onImport(refs);
        setImportSummary(refs.length);
      } else {
        alert("Aucune référence trouvée dans le fichier.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la lecture du fichier.");
    }
  };

  const handleManualImport = () => {
    if (!text.trim()) {
      // Demo Mode
       const demoData = `@article{doe2023,
  title={Machine Learning in Systematic Reviews},
  author={Doe, John and Smith, Jane},
  journal={Journal of AI in Medicine},
  year={2023},
  abstract={This study explores the efficiency of AI agents in screening abstracts.}
}
@article{bar2022,
  title={Deep Learning for Cancer Detection},
  author={Bar, Foo},
  journal={Nature Digital Medicine},
  year={2022},
  abstract={A comprehensive review of DL models for detecting malignant tumors in MRI scans.}
}`;
      const refs = parseBibTex(demoData, projectId);
      onImport(refs);
      setImportSummary(refs.length);
    } else {
      const refs = parseBibTex(text, projectId);
      onImport(refs);
      setImportSummary(refs.length);
    }
  };

  if (importSummary !== null) {
    return (
       <div className="flex flex-col items-center justify-center h-96 space-y-6 animate-in fade-in zoom-in duration-300">
         <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
           <FileCheck className="text-emerald-500" size={40} />
         </div>
         <div className="text-center">
           <h2 className="text-3xl font-bold text-white mb-2">{importSummary} Références Importées</h2>
           <p className="text-slate-400">Vos références ont été ajoutées au projet avec succès.</p>
         </div>
         <div className="flex space-x-4 pt-4">
            <Button variant="secondary" onClick={() => { setImportSummary(null); setText(''); }}>
              Importer d'autres fichiers
            </Button>
            <Button onClick={onNavigateNext}>
              Passer au Dédoublonnage <ArrowRight size={18} />
            </Button>
         </div>
       </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-3xl font-bold text-white">Importer des références</h2>
        <p className="text-slate-400 mt-2">Supporte les formats RIS (.ris), BibTeX (.bib) et CSV (.csv). Compatible avec Zotero, EndNote, Mendeley.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* File Upload Zone */}
        <div 
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all h-64 cursor-pointer ${
            dragActive ? "border-blue-500 bg-blue-900/10" : "border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-900"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            accept=".ris,.bib,.csv,.txt" 
            onChange={handleChange}
          />
          <div className="bg-slate-800 p-4 rounded-full mb-4">
             <FileUp className="text-blue-400" size={32} />
          </div>
          <p className="text-white font-medium mb-1">Cliquez ou glissez un fichier ici</p>
          <p className="text-slate-500 text-sm">RIS, BibTeX, CSV (Max 10MB)</p>
        </div>

        {/* Quick Connectors */}
        <div className="grid grid-rows-3 gap-4 h-64">
           {['Zotero', 'EndNote', 'Mendeley'].map(source => (
            <button 
              key={source} 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-4 px-6 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 hover:border-slate-700 transition-all text-left group"
            >
              <Database className="text-slate-500 group-hover:text-blue-400 transition-colors" size={20} />
              <div>
                <span className="block text-sm font-medium text-slate-200 group-hover:text-white">Importer depuis {source}</span>
                <span className="block text-xs text-slate-500">Via export de fichier</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-slate-950 text-slate-500">ou copier-coller du texte</span>
        </div>
      </div>

      <Card>
        <textarea
          className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-300 font-mono text-sm focus:border-blue-600 outline-none resize-none"
          placeholder="Collez le contenu BibTeX ou RIS ici..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mt-4 flex justify-between items-center">
          <button 
             onClick={() => { setText(''); handleManualImport(); }}
             className="text-xs text-slate-600 hover:text-slate-400 underline"
          >
            Charger des données de démonstration
          </button>
          <Button onClick={handleManualImport} disabled={!text.trim() && text === ''}>
            <Upload size={18} /> <span>Traiter le texte</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export const DeduplicateView = ({ references, onMarkDuplicates }: { references: Reference[], onMarkDuplicates: (ids: string[]) => void }) => {
  
  const duplicates = useMemo(() => {
    // Helper: Levenshtein Distance
    const getLevenshteinDistance = (a: string, b: string) => {
      if (a.length === 0) return b.length;
      if (b.length === 0) return a.length;
      
      const matrix = [];
      for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
      for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
      
      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
          }
        }
      }
      return matrix[b.length][a.length];
    };

    const normalize = (str: string) => str ? str.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

    // Filter relevant references: ignore those already marked as duplicates
    const candidates = references.filter(r => r.status !== ReferenceStatus.DUPLICATE);
    
    const groups: Reference[][] = [];
    const visited = new Set<string>();

    for (let i = 0; i < candidates.length; i++) {
      if (visited.has(candidates[i].id)) continue;
      
      const group = [candidates[i]];
      const normTitleA = normalize(candidates[i].title);
      
      for (let j = i + 1; j < candidates.length; j++) {
        if (visited.has(candidates[j].id)) continue;
        
        const candidateB = candidates[j];
        const normTitleB = normalize(candidateB.title);
        let isDuplicate = false;

        // 1. Check DOI if available (Strongest signal)
        if (candidates[i].doi && candidateB.doi && candidates[i].doi.toLowerCase() === candidateB.doi.toLowerCase()) {
          isDuplicate = true;
        } 
        // 2. Title Fuzzy Match
        else if (normTitleA && normTitleB) {
          // Exact normalized match
          if (normTitleA === normTitleB) {
             isDuplicate = true;
          } 
          // Levenshtein for typos
          else if (Math.abs(normTitleA.length - normTitleB.length) < 10) { 
             // Only run expensive calc if lengths are close
             const dist = getLevenshteinDistance(normTitleA, normTitleB);
             const maxLength = Math.max(normTitleA.length, normTitleB.length);
             const similarity = 1 - (dist / maxLength);
             
             // 90% Similarity threshold
             if (similarity > 0.90) {
                isDuplicate = true;
             }
          }
        }

        if (isDuplicate) {
          group.push(candidateB);
          visited.add(candidateB.id);
        }
      }

      if (group.length > 1) {
        groups.push(group);
        visited.add(candidates[i].id); // Mark primary as visited too
      }
    }
    
    return groups;
  }, [references]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-white">Dédoublonnage Avancé</h2>
         {duplicates.length > 0 && (
             <Button variant="primary" onClick={() => onMarkDuplicates(duplicates.flatMap(g => g.slice(1).map(r => r.id)))} className="bg-blue-600 hover:bg-blue-500">
                <Layers size={18} /> <span>Fusionner tous les groupes ({duplicates.length})</span>
             </Button>
         )}
      </div>
      
      {duplicates.length === 0 ? (
         <div className="flex flex-col items-center justify-center h-64 bg-slate-900/50 rounded-xl border border-slate-800">
           <CheckCircle className="text-emerald-500 mb-3" size={32} />
           <p className="text-slate-300">Aucun doublon détecté.</p>
           <p className="text-slate-500 text-sm mt-1">L'analyse inclut les titres similaires (>90%) et les DOIs identiques.</p>
         </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-amber-400 bg-amber-900/10 p-4 rounded-lg border border-amber-900/30">
            <AlertTriangle size={20} />
            <span>{duplicates.length} groupes de doublons trouvés sur {references.length} références.</span>
          </div>
          
          {duplicates.map((group, idx) => (
            <Card key={idx} className="space-y-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                    <span className="bg-slate-800 text-slate-400 px-2 py-1 rounded text-xs font-mono">Groupe #{idx + 1}</span>
                    <h3 className="font-semibold text-white text-sm">Titres similaires détectés</h3>
                </div>
                <Button variant="secondary" onClick={() => onMarkDuplicates(group.slice(1).map(r => r.id))} className="text-xs py-1 h-8">
                  Fusionner (Garder le 1er)
                </Button>
              </div>
              <div className="space-y-2">
                {group.map((ref, i) => (
                  <div key={ref.id} className={`p-3 rounded border flex items-start justify-between ${i === 0 ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-slate-950 border-slate-800'}`}>
                    <div>
                        <div className="flex items-center gap-2">
                             {i === 0 && <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Conservé</span>}
                             <p className={`font-medium text-sm ${i === 0 ? 'text-emerald-100' : 'text-slate-300'}`}>{ref.title}</p>
                        </div>
                        <p className="text-slate-500 text-xs mt-1">{ref.authors} • {ref.year} • {ref.journal}</p>
                        <div className="flex gap-2 mt-1">
                             <span className="text-[10px] bg-slate-900 text-slate-500 px-1 rounded border border-slate-800">Statut: {ref.status}</span>
                             {ref.doi && <span className="text-[10px] bg-slate-900 text-slate-500 px-1 rounded border border-slate-800">DOI: {ref.doi}</span>}
                        </div>
                    </div>
                    {i > 0 && <span className="text-xs text-red-400 italic">Sera marqué doublon</span>}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export const ScreeningView = ({ references, onDecision, activeProject, stage = 'title', searchQuery, onSearch, onUploadPdf }: any) => {
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const pdfInputRef = useRef<HTMLInputElement>(null);
  
  // New state and ref for List view uploads
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const listInputRef = useRef<HTMLInputElement>(null);

  const pendingRefs = useMemo(() => {
    return references.filter((r: Reference) => {
      if (stage === 'title') return r.status === ReferenceStatus.IMPORTED || r.status === ReferenceStatus.SCREENING_TITLE_ABSTRACT;
      if (stage === 'fulltext') return r.status === ReferenceStatus.SCREENING_FULL_TEXT;
      return false;
    }).filter((r: Reference) => {
      if (stage === 'title' && r.decisionTitleAbstract !== Decision.PENDING) return false;
      if (stage === 'fulltext' && r.decisionFullText !== Decision.PENDING) return false;
      return true;
    });
  }, [references, stage]);

  const currentRef = pendingRefs[0];
  const [aiAnalysis, setAiAnalysis] = useState<{suggestion: string, reasoning: string} | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    setAiAnalysis(null);
  }, [currentRef?.id]);
  
  // Clear selection when search changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [searchQuery, stage]);

  const handleAiAssist = async () => {
    if (!currentRef) return;
    setLoadingAi(true);
    const result = await analyzeReferenceWithGemini(currentRef, activeProject);
    setAiAnalysis(result);
    setLoadingAi(false);
  };

  const handleBulkDecision = (decision: Decision) => {
    if (selectedIds.size === 0) return;
    Array.from(selectedIds).forEach(id => onDecision(id, decision));
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === pendingRefs.length && pendingRefs.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingRefs.map((r: Reference) => r.id)));
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && currentRef && onUploadPdf) {
      onUploadPdf(currentRef.id, e.target.files[0]);
    }
  };
  
  // List View Upload Handlers
  const triggerListUpload = (id: string) => {
    setUploadingId(id);
    listInputRef.current?.click();
  };

  const handleListPdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && uploadingId && onUploadPdf) {
      onUploadPdf(uploadingId, e.target.files[0]);
    }
    setUploadingId(null);
    if(listInputRef.current) listInputRef.current.value = ''; // Reset input
  };

  const getScholarUrl = (title: string) => {
    return `https://scholar.google.com/scholar?q=${encodeURIComponent(title)}`;
  };

  if (pendingRefs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center space-y-4">
        <div className="w-full max-w-md mx-auto mb-8">
           {onSearch && (
             <div className="relative mb-8">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
               <input 
                 type="text" 
                 value={searchQuery || ''}
                 onChange={(e) => onSearch(e.target.value)}
                 placeholder="Chercher dans les articles..."
                 className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-slate-200 focus:border-blue-500 outline-none shadow-lg"
               />
             </div>
           )}
        </div>
        <div className="bg-emerald-900/20 p-6 rounded-full mb-6">
          <CheckCircle className="text-emerald-500" size={48} />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Criblage terminé !</h2>
        <p className="text-slate-400 max-w-md">Aucune référence à traiter avec les filtres actuels.</p>
        {searchQuery && (
          <Button variant="ghost" onClick={() => onSearch('')} className="mt-4">
            Effacer la recherche
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              {stage === 'title' ? 'Criblage Titre & Résumé' : 'Lecture Texte Intégral'}
            </h2>
            <p className="text-slate-400 text-sm">Restant : {pendingRefs.length}</p>
          </div>
        </div>
        
        {/* Search Bar */}
        {onSearch && (
           <div className="relative flex-1 max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
             <input 
               type="text" 
               value={searchQuery || ''}
               onChange={(e) => onSearch(e.target.value)}
               placeholder="Filtrer la file d'attente (titre, résumé...)"
               className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-200 focus:border-blue-500 outline-none transition-all focus:bg-slate-800"
             />
           </div>
        )}

        <div className="flex items-center gap-2">
            {stage === 'title' && viewMode === 'card' && (
                <Button variant="ghost" onClick={handleAiAssist} disabled={loadingAi} className="border border-blue-900/50 bg-blue-900/10 hover:bg-blue-900/20 text-blue-400 py-1.5 px-3">
                  <BrainCircuit size={16} /> <span className="hidden sm:inline">{loadingAi ? '...' : 'IA'}</span>
                </Button>
            )}
            
            <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800">
               <button onClick={() => setViewMode('card')} className={`p-2 rounded transition-all ${viewMode === 'card' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`} title="Vue Carte">
                  <Grid size={18} />
               </button>
               <button onClick={() => setViewMode('list')} className={`p-2 rounded transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`} title="Vue Liste">
                  <List size={18} />
               </button>
            </div>
        </div>
      </div>

      {/* Bulk Action Bar for List Mode */}
      {selectedIds.size > 0 && viewMode === 'list' && (
         <div className="bg-blue-900/90 backdrop-blur-md border border-blue-700/50 p-3 rounded-xl mb-4 flex justify-between items-center animate-in slide-in-from-top-2 shadow-xl z-20">
            <div className="flex items-center space-x-3 px-2">
               <span className="font-bold text-white flex items-center gap-2">
                  <CheckSquare size={16} className="text-blue-300"/> 
                  {selectedIds.size} sélectionné(s)
               </span>
               <button onClick={() => setSelectedIds(new Set())} className="text-xs text-blue-300 hover:text-white underline">Annuler</button>
            </div>
            <div className="flex space-x-2">
               <Button variant="danger" className="py-1.5 px-3 text-sm" onClick={() => handleBulkDecision(Decision.EXCLUDE)}>Exclure</Button>
               <Button className="py-1.5 px-3 text-sm bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20" onClick={() => handleBulkDecision(Decision.UNCERTAIN)}>Incertain</Button>
               <Button variant="success" className="py-1.5 px-3 text-sm" onClick={() => handleBulkDecision(Decision.INCLUDE)}>Inclure</Button>
            </div>
         </div>
      )}

      <div className="flex-1 flex gap-6 overflow-hidden relative">
        {viewMode === 'card' ? (
          // --- CARD VIEW ---
          <>
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
              <div className="p-8 overflow-y-auto flex-1">
                <div className="mb-2 flex gap-2">
                   <span className="text-xs font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded">#{currentRef.id.slice(0,6)}</span>
                   <span className="text-xs font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded">{currentRef.year}</span>
                   {searchQuery && (
                     <span className="text-xs font-medium text-blue-400 bg-blue-900/20 border border-blue-900/50 px-2 py-1 rounded flex items-center">
                       <Search size={10} className="mr-1"/> Filtre actif
                     </span>
                   )}
                </div>
                <h1 className="text-2xl font-bold text-white leading-tight mb-4">{currentRef.title}</h1>
                <p className="text-blue-400 font-medium mb-6 text-sm">{currentRef.authors} • <span className="text-slate-400 italic">{currentRef.journal}</span></p>
                
                <div className="prose prose-invert prose-slate max-w-none">
                  <h3 className="text-sm uppercase tracking-widest text-slate-500 font-bold mb-2">Résumé</h3>
                  <p className="text-slate-300 leading-relaxed text-lg">{currentRef.abstract}</p>
                </div>
                
                {aiAnalysis && (
                   <div className="mt-8 p-4 bg-blue-950/30 border border-blue-900/50 rounded-xl animate-in fade-in slide-in-from-bottom-4">
                      <h4 className="flex items-center text-blue-400 font-bold mb-2">
                        <BrainCircuit size={16} className="mr-2" /> Suggestion IA
                      </h4>
                      <div className="text-slate-300 text-sm">
                        <p className="mb-2"><span className="font-semibold text-white">Décision suggérée :</span> {aiAnalysis.suggestion}</p>
                        <p><span className="font-semibold text-white">Raison :</span> {aiAnalysis.reasoning}</p>
                      </div>
                   </div>
                )}
              </div>

              <div className="p-4 bg-slate-950 border-t border-slate-800 z-10">
                <div className="flex justify-center items-center gap-8">
                    {/* Always visible PDF Upload and Search */}
                    <div className="flex items-center gap-4 pr-8 border-r border-slate-800">
                        <a 
                            href={getScholarUrl(currentRef.title)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group flex flex-col items-center gap-1 cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center text-blue-400 group-hover:border-blue-500 transition-colors">
                                <Search size={20} />
                            </div>
                            <span className="text-[10px] font-bold uppercase text-slate-500 group-hover:text-blue-400">Scholar</span>
                        </a>
                        
                        <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => pdfInputRef.current?.click()}>
                              <input 
                                type="file" 
                                ref={pdfInputRef} 
                                className="hidden" 
                                accept=".pdf" 
                                onChange={handlePdfUpload}
                            />
                            <div className={`w-12 h-12 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center transition-colors ${currentRef.pdfFileName ? 'text-emerald-500 border-emerald-500/50' : 'text-slate-400 group-hover:border-slate-500'}`}>
                                {currentRef.pdfFileName ? <FileCheck size={20} /> : <Upload size={20} />}
                            </div>
                            <span className={`text-[10px] font-bold uppercase ${currentRef.pdfFileName ? 'text-emerald-500' : 'text-slate-500 group-hover:text-slate-300'}`}>
                                {currentRef.pdfFileName ? 'PDF OK' : 'PDF'}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <button 
                          onClick={() => onDecision(currentRef.id, Decision.EXCLUDE)}
                          className="flex flex-col items-center space-y-1 text-slate-400 hover:text-red-500 hover:scale-105 transition-all p-2 w-20"
                        >
                          <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center">
                            <XCircle size={24} />
                          </div>
                          <span className="font-semibold text-xs">Exclure</span>
                        </button>

                        <button 
                          onClick={() => onDecision(currentRef.id, Decision.UNCERTAIN)}
                          className="flex flex-col items-center space-y-1 text-slate-400 hover:text-amber-500 hover:scale-105 transition-all p-2 w-20"
                        >
                          <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center">
                            <HelpCircle size={24} />
                          </div>
                          <span className="font-semibold text-xs">Incertain</span>
                        </button>

                        <button 
                          onClick={() => onDecision(currentRef.id, Decision.INCLUDE)}
                          className="flex flex-col items-center space-y-1 text-slate-400 hover:text-emerald-500 hover:scale-105 transition-all p-2 w-20"
                        >
                          <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center">
                             <CheckCircle size={24} />
                          </div>
                          <span className="font-semibold text-xs">Inclure</span>
                        </button>
                    </div>
                </div>
              </div>
            </div>
            
            <div className="w-80 hidden xl:block space-y-4">
               <Card className="h-full overflow-y-auto">
                 <h3 className="font-bold text-white mb-4">Critères</h3>
                 <div className="space-y-4">
                    <div>
                       <h4 className="text-xs uppercase text-emerald-500 font-bold mb-1">Inclusion</h4>
                       <p className="text-sm text-slate-400 whitespace-pre-wrap">{activeProject.inclusionCriteria || "Non définis"}</p>
                    </div>
                    <div className="border-t border-slate-800 pt-4">
                       <h4 className="text-xs uppercase text-red-500 font-bold mb-1">Exclusion</h4>
                       <p className="text-sm text-slate-400 whitespace-pre-wrap">{activeProject.exclusionCriteria || "Non définis"}</p>
                    </div>
                 </div>
               </Card>
            </div>
          </>
        ) : (
          // --- LIST VIEW ---
          <Card className="h-full overflow-hidden flex flex-col p-0 bg-slate-900/50 w-full">
             {/* Hidden input for list view uploads */}
             <input 
                 type="file" 
                 ref={listInputRef} 
                 className="hidden" 
                 accept=".pdf" 
                 onChange={handleListPdfChange}
             />

             <div className="flex items-center p-4 border-b border-slate-800 bg-slate-900 text-slate-400 text-sm font-medium z-10">
                <div className="flex items-center justify-center w-10">
                   <button onClick={handleSelectAll} className={`rounded p-1 hover:bg-slate-800 ${selectedIds.size === pendingRefs.length && pendingRefs.length > 0 ? 'text-blue-500' : 'text-slate-600 hover:text-slate-400'}`}>
                      {selectedIds.size === pendingRefs.length && pendingRefs.length > 0 ? <CheckSquare size={18} /> : <div className="w-4 h-4 border-2 border-slate-600 rounded" />}
                   </button>
                </div>
                <div className="flex-1 px-2">Référence</div>
                <div className="hidden md:block w-32 px-2 text-right">Journal</div>
                <div className="w-12"></div>
             </div>
             <div className="overflow-y-auto flex-1 p-2 space-y-2">
                {pendingRefs.map((ref: Reference) => (
                   <div key={ref.id} className={`group border rounded-lg transition-all duration-200 ${selectedIds.has(ref.id) ? 'bg-blue-900/10 border-blue-800 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                      {/* Row Main */}
                      <div className="flex items-center p-3 cursor-pointer" onClick={(e) => {
                          if(!(e.target as any).closest('button')) toggleExpand(ref.id);
                      }}>
                         <div className="flex items-center justify-center w-10">
                            <button onClick={(e) => { e.stopPropagation(); toggleSelect(ref.id); }} className={`transition-colors p-1 rounded hover:bg-slate-800 ${selectedIds.has(ref.id) ? 'text-blue-500' : 'text-slate-600 hover:text-slate-400'}`}>
                               {selectedIds.has(ref.id) ? <CheckSquare size={20} /> : <div className="w-4 h-4 border-2 border-slate-600 rounded" />}
                            </button>
                         </div>
                         <div className="flex-1 px-2 min-w-0">
                            <div className="flex items-baseline gap-2 mb-0.5">
                               <p className={`font-medium truncate ${selectedIds.has(ref.id) ? 'text-blue-200' : 'text-white'}`}>{ref.title}</p>
                               {ref.pdfFileName && <span title="PDF inclus"><FileCheck size={14} className="text-emerald-500 flex-shrink-0" /></span>}
                            </div>
                            <p className="text-xs text-slate-500 truncate">{ref.authors} ({ref.year})</p>
                         </div>
                         <div className="hidden md:block w-32 px-2 text-xs text-slate-500 truncate text-right">{ref.journal}</div>
                         <div className="w-12 flex justify-center text-slate-600 group-hover:text-slate-400">
                            {expandedIds.has(ref.id) ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                         </div>
                      </div>
                      {/* Expanded Content */}
                      {expandedIds.has(ref.id) && (
                         <div className="px-14 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                            <div className="bg-slate-950/50 p-4 rounded-lg text-sm text-slate-300 leading-relaxed border border-slate-800/50">
                               <span className="text-xs font-bold text-slate-500 uppercase block mb-2">Résumé</span>
                               {ref.abstract || <span className="text-slate-600 italic">Pas de résumé disponible.</span>}
                               
                               {/* Quick PDF Action in List View */}
                               <div className="mt-4 pt-4 border-t border-slate-800 flex items-center space-x-6">
                                     <button className="flex items-center space-x-2 text-xs text-blue-400 hover:text-blue-300 transition-colors" onClick={() => window.open(getScholarUrl(ref.title), '_blank')}>
                                         <ExternalLink size={14} /> <span>Google Scholar</span>
                                     </button>
                                     
                                     <button 
                                        onClick={() => triggerListUpload(ref.id)}
                                        className={`flex items-center space-x-2 text-xs transition-colors ${ref.pdfFileName ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-400 hover:text-white'}`}
                                     >
                                        {ref.pdfFileName ? <FileCheck size={14} /> : <Upload size={14} />}
                                        <span>{ref.pdfFileName ? 'Remplacer PDF' : 'Ajouter PDF'}</span>
                                     </button>
                                     
                                     {ref.pdfFileName && (
                                         <span className="text-xs text-slate-500 italic truncate max-w-[200px]">{ref.pdfFileName}</span>
                                     )}
                                  </div>
                            </div>
                            <div className="flex gap-2 mt-3 justify-end">
                               <Button variant="danger" className="text-xs py-1.5 px-3 h-8" onClick={() => onDecision(ref.id, Decision.EXCLUDE)}>Exclure</Button>
                               <Button variant="secondary" className="text-xs py-1.5 px-3 h-8" onClick={() => onDecision(ref.id, Decision.UNCERTAIN)}>Incertain</Button>
                               <Button variant="success" className="text-xs py-1.5 px-3 h-8" onClick={() => onDecision(ref.id, Decision.INCLUDE)}>Inclure</Button>
                            </div>
                         </div>
                      )}
                   </div>
                ))}
             </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export const ExtractionView = ({ project, references, onUpdateSchema, onUpdateData }: { project: Project, references: Reference[], onUpdateSchema: (schema: ExtractionField[]) => void, onUpdateData: (refId: string, data: any) => void }) => {
  const [mode, setMode] = useState<'config' | 'entry'>('entry');
  const [selectedRefId, setSelectedRefId] = useState<string | null>(null);
  
  const includedRefs = useMemo(() => references.filter(r => r.status === ReferenceStatus.INCLUDED), [references]);

  // --- Configuration Mode States ---
  const [newField, setNewField] = useState<Partial<ExtractionField>>({ label: '', type: 'text' });

  const handleAddField = () => {
    if(!newField.label) return;
    const field: ExtractionField = {
      id: uuidv4(),
      label: newField.label,
      type: newField.type || 'text',
      options: newField.options
    };
    onUpdateSchema([...project.extractionSchema, field]);
    setNewField({ label: '', type: 'text' });
  };

  const handleDeleteField = (id: string) => {
    onUpdateSchema(project.extractionSchema.filter(f => f.id !== id));
  };

  const handleExportCsv = () => {
    // Generate CSV headers
    const headers = ['ID', 'Auteurs', 'Année', 'Titre', ...project.extractionSchema.map(f => f.label)];
    const rows = includedRefs.map(ref => {
      const basicData = [ref.id.substring(0,6), ref.authors, ref.year, `"${ref.title.replace(/"/g, '""')}"`];
      const extraData = project.extractionSchema.map(field => {
         const val = ref.extractionData?.[field.id] || '';
         return `"${String(val).replace(/"/g, '""')}"`;
      });
      return [...basicData, ...extraData].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `extraction_${project.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col">
       <div className="flex justify-between items-center mb-6">
         <div>
           <h2 className="text-2xl font-bold text-white">Extraction des données</h2>
           <p className="text-slate-400 text-sm">Configurez la matrice et remplissez les données pour les articles inclus.</p>
         </div>
         <div className="flex space-x-2">
            <Button variant={mode === 'config' ? 'primary' : 'secondary'} onClick={() => setMode('config')}>
               <Edit3 size={16} /> <span>Configurer la matrice</span>
            </Button>
            <Button variant={mode === 'entry' ? 'primary' : 'secondary'} onClick={() => setMode('entry')}>
               <Table size={16} /> <span>Saisie des données</span>
            </Button>
            <Button variant="ghost" onClick={handleExportCsv} className="border border-slate-700">
               <Download size={16} /> <span className="hidden sm:inline">Export CSV</span>
            </Button>
         </div>
       </div>

       {mode === 'config' ? (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
               <Card>
                 <h3 className="font-bold text-white mb-4">Ajouter un champ</h3>
                 <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Nom du champ</label>
                      <input 
                        type="text" 
                        value={newField.label}
                        onChange={(e) => setNewField({...newField, label: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white text-sm"
                        placeholder="Ex: Méthodologie"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Type de donnée</label>
                      <select 
                        value={newField.type}
                        onChange={(e) => setNewField({...newField, type: e.target.value as any})}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white text-sm"
                      >
                         <option value="text">Texte libre</option>
                         <option value="number">Nombre</option>
                         <option value="select">Liste déroulante</option>
                         <option value="boolean">Oui / Non</option>
                      </select>
                    </div>
                    {newField.type === 'select' && (
                       <div>
                         <label className="block text-xs font-medium text-slate-400 mb-1">Options (séparées par virgule)</label>
                         <input 
                            type="text" 
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white text-sm"
                            placeholder="Quali, Quanti, Mixte"
                            onChange={(e) => setNewField({...newField, options: e.target.value.split(',').map(s => s.trim())})}
                         />
                       </div>
                    )}
                    <Button onClick={handleAddField} disabled={!newField.label} className="w-full">
                       <Plus size={16} /> <span>Ajouter</span>
                    </Button>
                 </div>
               </Card>
            </div>
            <div className="lg:col-span-2">
               <Card>
                  <h3 className="font-bold text-white mb-4">Matrice d'extraction actuelle</h3>
                  {project.extractionSchema.length === 0 ? (
                     <p className="text-slate-500 italic">Aucun champ défini.</p>
                  ) : (
                    <div className="space-y-3">
                       {project.extractionSchema.map((field, idx) => (
                          <div key={field.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-lg">
                             <div className="flex items-center space-x-3">
                                <span className="bg-slate-800 text-slate-400 text-xs font-mono px-2 py-1 rounded w-6 text-center">{idx + 1}</span>
                                <div>
                                   <p className="font-medium text-white">{field.label}</p>
                                   <p className="text-xs text-slate-500 capitalize">{field.type} {field.options ? `(${field.options.join(', ')})` : ''}</p>
                                </div>
                             </div>
                             <button onClick={() => handleDeleteField(field.id)} className="text-slate-600 hover:text-red-400">
                                <Trash2 size={16} />
                             </button>
                          </div>
                       ))}
                    </div>
                  )}
               </Card>
            </div>
         </div>
       ) : (
         <div className="flex-1 flex gap-6 overflow-hidden h-[600px]">
            {/* List of included refs */}
            <div className="w-1/3 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
               <div className="p-4 border-b border-slate-800">
                  <h3 className="font-bold text-white">Articles inclus ({includedRefs.length})</h3>
               </div>
               <div className="overflow-y-auto flex-1 p-2 space-y-2">
                  {includedRefs.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-sm">
                       Aucun article inclus pour le moment. Complétez le criblage.
                    </div>
                  ) : (
                     includedRefs.map(ref => (
                        <div 
                           key={ref.id} 
                           onClick={() => setSelectedRefId(ref.id)}
                           className={`p-3 rounded-lg cursor-pointer transition-colors border ${selectedRefId === ref.id ? 'bg-blue-900/20 border-blue-600' : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800'}`}
                        >
                           <p className={`font-medium text-sm mb-1 ${selectedRefId === ref.id ? 'text-white' : 'text-slate-300'}`}>{ref.title}</p>
                           <p className="text-xs text-slate-500">{ref.authors.split(',')[0]} et al. ({ref.year})</p>
                        </div>
                     ))
                  )}
               </div>
            </div>

            {/* Extraction Form */}
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
               {selectedRefId ? (
                 <div className="flex-1 overflow-y-auto p-6">
                    {(() => {
                       const ref = includedRefs.find(r => r.id === selectedRefId);
                       if(!ref) return null;
                       return (
                          <div className="space-y-6 max-w-2xl mx-auto">
                             <div className="border-b border-slate-800 pb-4 mb-6">
                                <h3 className="text-xl font-bold text-white">{ref.title}</h3>
                                <p className="text-slate-400 text-sm mt-1">{ref.authors}</p>
                                <div className="mt-4 p-3 bg-slate-950 rounded text-sm text-slate-400 max-h-32 overflow-y-auto border border-slate-800">
                                   <span className="font-bold text-slate-500 block text-xs uppercase mb-1">Abstract</span>
                                   {ref.abstract}
                                </div>
                             </div>
                             
                             <h4 className="font-bold text-emerald-400 uppercase text-xs tracking-wider mb-4">Données à extraire</h4>
                             
                             {project.extractionSchema.length === 0 && (
                                <p className="text-slate-500 italic">Aucun champ configuré. Passez en mode configuration.</p>
                             )}

                             <div className="space-y-5">
                                {project.extractionSchema.map(field => (
                                   <div key={field.id}>
                                      <label className="block text-sm font-medium text-slate-300 mb-1.5">{field.label}</label>
                                      {field.type === 'text' && (
                                         <textarea 
                                            value={ref.extractionData?.[field.id] || ''}
                                            onChange={(e) => onUpdateData(ref.id, { ...ref.extractionData, [field.id]: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none min-h-[80px]"
                                         />
                                      )}
                                      {field.type === 'number' && (
                                         <input 
                                            type="number"
                                            value={ref.extractionData?.[field.id] || ''}
                                            onChange={(e) => onUpdateData(ref.id, { ...ref.extractionData, [field.id]: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                                         />
                                      )}
                                      {field.type === 'select' && (
                                         <select
                                            value={ref.extractionData?.[field.id] || ''}
                                            onChange={(e) => onUpdateData(ref.id, { ...ref.extractionData, [field.id]: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                                         >
                                            <option value="">Sélectionner...</option>
                                            {field.options?.map(opt => (
                                               <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                         </select>
                                      )}
                                      {field.type === 'boolean' && (
                                         <div className="flex items-center space-x-4">
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                               <input 
                                                  type="radio" 
                                                  name={`${ref.id}-${field.id}`}
                                                  checked={ref.extractionData?.[field.id] === 'yes'}
                                                  onChange={() => onUpdateData(ref.id, { ...ref.extractionData, [field.id]: 'yes' })}
                                                  className="accent-emerald-500"
                                               />
                                               <span className="text-sm text-slate-300">Oui</span>
                                            </label>
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                               <input 
                                                  type="radio" 
                                                  name={`${ref.id}-${field.id}`}
                                                  checked={ref.extractionData?.[field.id] === 'no'}
                                                  onChange={() => onUpdateData(ref.id, { ...ref.extractionData, [field.id]: 'no' })}
                                                  className="accent-emerald-500"
                                               />
                                               <span className="text-sm text-slate-300">Non</span>
                                            </label>
                                         </div>
                                      )}
                                   </div>
                                ))}
                             </div>
                          </div>
                       );
                    })()}
                 </div>
               ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                     <Table size={48} className="mb-4 opacity-50" />
                     <p>Sélectionnez un article à gauche pour commencer l'extraction.</p>
                  </div>
               )}
            </div>
         </div>
       )}
    </div>
  );
};

export const SynthesisView = ({ references, project }: any) => {
  const stats = [
    { name: 'Importés', value: references.length, color: '#64748b' },
    { name: 'Titre/Abs', value: references.filter((r: Reference) => r.status !== ReferenceStatus.IMPORTED && r.status !== ReferenceStatus.DUPLICATE).length, color: '#3b82f6' },
    { name: 'Texte Intégral', value: references.filter((r: Reference) => r.status === ReferenceStatus.SCREENING_FULL_TEXT || r.status === ReferenceStatus.INCLUDED || (r.status === ReferenceStatus.EXCLUDED && r.decisionTitleAbstract === Decision.INCLUDE)).length, color: '#8b5cf6' },
    { name: 'Inclus Final', value: references.filter((r: Reference) => r.status === ReferenceStatus.INCLUDED).length, color: '#10b981' },
  ];
  
  const prismaData = [
    { label: "Identification", count: references.length, sub: "Records identified" },
    { label: "Dédoublonnage", count: references.filter((r:Reference) => r.status !== ReferenceStatus.DUPLICATE).length, sub: "Records after duplicates removed" },
    { label: "Criblage", count: references.filter((r:Reference) => r.decisionTitleAbstract === Decision.INCLUDE).length, sub: "Records screened" },
    { label: "Inclus", count: references.filter((r:Reference) => r.status === ReferenceStatus.INCLUDED).length, sub: "Studies included in review" },
  ];

  // --- Bibliometric Analysis Logic ---
  const getBibliometrics = (refs: Reference[]) => {
    // Focus on INCLUDED references only as requested
    const validRefs = refs.filter(r => r.status === ReferenceStatus.INCLUDED);
    
    // 1. Annual Production
    const yearsMap = new Map<string, number>();
    validRefs.forEach(r => {
      if(r.year) {
         const y = r.year.trim();
         if(y.match(/^\d{4}$/)) {
            yearsMap.set(y, (yearsMap.get(y) || 0) + 1);
         }
      }
    });
    const yearsData = Array.from(yearsMap.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year.localeCompare(b.year));

    // 2. Most Relevant Sources (Journals)
    const journalMap = new Map<string, number>();
    validRefs.forEach(r => {
      if(r.journal) {
         // Basic normalization
         const j = r.journal.trim(); 
         if(j.length > 2) journalMap.set(j, (journalMap.get(j) || 0) + 1);
      }
    });
    const journalsData = Array.from(journalMap.entries())
      .map(([name, count]) => ({ name: name.length > 30 ? name.substring(0,30) + '...' : name, full: name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 3. Most Productive Authors
    const authorMap = new Map<string, number>();
    validRefs.forEach(r => {
       if(r.authors) {
         // Split by common delimiters
         const authors = r.authors.split(/,|;|&| and /);
         authors.forEach(a => {
            const name = a.trim();
            if(name.length > 2) authorMap.set(name, (authorMap.get(name) || 0) + 1);
         });
       }
    });
    const authorsData = Array.from(authorMap.entries())
      .map(([name, count]) => ({ name: name.length > 20 ? name.substring(0,20) + '...' : name, full: name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { yearsData, journalsData, authorsData, hasData: validRefs.length > 0 };
  };

  const { yearsData, journalsData, authorsData, hasData } = useMemo(() => getBibliometrics(references), [references]);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Synthèse & Analyse Bibliométrique</h2>
        <Button variant="secondary">
          <Download size={18} /> <span>Exporter le rapport</span>
        </Button>
      </div>

      {/* Row 1: General Progress & PRISMA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <div className="flex items-center space-x-2 mb-6">
             <Target className="text-blue-500" />
             <h3 className="text-lg font-bold text-white">Progression de la revue</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                  cursor={{fill: '#1e293b'}}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
           <div className="flex items-center space-x-2 mb-6">
             <Layers className="text-blue-500" />
             <h3 className="text-lg font-bold text-white">Flux PRISMA</h3>
           </div>
           <div className="flex flex-col items-center space-y-4">
              {prismaData.map((stage, idx) => (
                <div key={idx} className="flex flex-col items-center w-full">
                  <div className="w-64 p-3 bg-slate-950 border border-slate-700 rounded text-center shadow-lg relative z-10">
                    <p className="font-bold text-white">{stage.label}</p>
                    <p className="text-2xl text-blue-500 font-mono my-1">{stage.count}</p>
                    <p className="text-xs text-slate-500">{stage.sub}</p>
                  </div>
                  {idx < prismaData.length - 1 && (
                    <div className="h-8 w-0.5 bg-slate-700 my-1"></div>
                  )}
                </div>
              ))}
           </div>
        </Card>
      </div>

      {/* Row 2: Bibliometrics - Annual Production */}
      <Card>
         <div className="flex items-center space-x-2 mb-2">
             <TrendingUp className="text-emerald-500" />
             <h3 className="text-lg font-bold text-white">Production Scientifique Annuelle</h3>
         </div>
         <p className="text-xs text-slate-500 mb-6">Basé sur les articles inclus (Sélection finale)</p>
         <div className="h-72 w-full">
            {hasData ? (
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={yearsData}>
                     <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <XAxis dataKey="year" stroke="#94a3b8" />
                     <YAxis stroke="#94a3b8" />
                     <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                     />
                     <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
               </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-slate-500 text-sm italic bg-slate-950/30 rounded border border-dashed border-slate-800">
                  Aucun article inclus pour le moment. Veuillez compléter le criblage.
               </div>
            )}
         </div>
      </Card>

      {/* Row 3: Bibliometrics - Journals and Authors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <Card>
            <div className="flex items-center space-x-2 mb-2">
                <BookOpen className="text-amber-500" />
                <h3 className="text-lg font-bold text-white">Sources les plus pertinentes</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">Top 10 Journaux (Articles inclus)</p>
            <div className="h-80 w-full">
               {hasData ? (
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart layout="vertical" data={journalsData} margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                        <XAxis type="number" stroke="#94a3b8" />
                        <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" tick={{fontSize: 11}} />
                        <Tooltip 
                           cursor={{fill: '#1e293b'}}
                           contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                        />
                        <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                     </BarChart>
                  </ResponsiveContainer>
               ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm italic bg-slate-950/30 rounded border border-dashed border-slate-800">
                     Pas de données disponibles.
                  </div>
               )}
            </div>
         </Card>

         <Card>
            <div className="flex items-center space-x-2 mb-2">
                <Users className="text-purple-500" />
                <h3 className="text-lg font-bold text-white">Auteurs les plus productifs</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">Top 10 Auteurs (Articles inclus)</p>
            <div className="h-80 w-full">
               {hasData ? (
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart layout="vertical" data={authorsData} margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                        <XAxis type="number" stroke="#94a3b8" />
                        <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" tick={{fontSize: 11}} />
                        <Tooltip 
                           cursor={{fill: '#1e293b'}}
                           contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                        />
                        <Bar dataKey="count" fill="#a855f7" radius={[0, 4, 4, 0]} barSize={20} />
                     </BarChart>
                  </ResponsiveContainer>
               ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm italic bg-slate-950/30 rounded border border-dashed border-slate-800">
                     Pas de données disponibles.
                  </div>
               )}
            </div>
         </Card>
      </div>

      <Card>
        <div className="flex justify-between mb-4">
           <h3 className="text-lg font-bold text-white">Liste des articles inclus</h3>
           <Button variant="ghost" className="text-xs">Exporter CSV</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 text-slate-200 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Auteurs</th>
                <th className="px-4 py-3">Année</th>
                <th className="px-4 py-3">Titre</th>
                <th className="px-4 py-3">Journal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {references.filter((r: Reference) => r.status === ReferenceStatus.INCLUDED).length === 0 ? (
                 <tr>
                   <td colSpan={4} className="px-4 py-8 text-center text-slate-600">Aucune référence incluse pour le moment.</td>
                 </tr>
              ) : (
                references.filter((r: Reference) => r.status === ReferenceStatus.INCLUDED).map((ref: Reference) => (
                  <tr key={ref.id} className="hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-white">{ref.authors.split(',')[0]} et al.</td>
                    <td className="px-4 py-3">{ref.year}</td>
                    <td className="px-4 py-3 text-white truncate max-w-md">{ref.title}</td>
                    <td className="px-4 py-3">{ref.journal}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};