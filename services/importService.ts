import { v4 as uuidv4 } from 'uuid';
import { Reference, ReferenceStatus, Decision } from '../types';

export const parseRis = (content: string, projectId: string): Reference[] => {
  const references: Reference[] = [];
  // Normalized splitting for RIS: ER - followed by newline
  const entries = content.replace(/\r\n/g, '\n').split(/ER\s{1,2}-/g);

  entries.forEach(entry => {
    if (!entry.trim()) return;

    const getTag = (tag: string) => {
      // Regex to match tag at start of line (e.g. "TI  - Title")
      const regex = new RegExp(`^${tag}\\s{1,2}-\\s*(.*)$`, 'm');
      const match = entry.match(regex);
      return match ? match[1].trim() : '';
    };

    const title = getTag('TI') || getTag('T1');
    if (!title) return;

    references.push({
      id: uuidv4(),
      projectId,
      title: title,
      authors: getTag('AU') || getTag('A1'),
      year: (getTag('PY') || getTag('Y1') || '').substring(0, 4),
      journal: getTag('JO') || getTag('T2') || getTag('JF'),
      abstract: getTag('AB') || getTag('N2'),
      status: ReferenceStatus.IMPORTED,
      decisionTitleAbstract: Decision.PENDING,
      decisionFullText: Decision.PENDING,
      tags: []
    });
  });

  return references;
};

export const parseBibTex = (content: string, projectId: string): Reference[] => {
  const references: Reference[] = [];
  // Robust split by @ followed by entry type
  const entries = content.split(/@(?=\w+\s*\{)/g);

  entries.forEach((entry) => {
    if (!entry.trim() || !entry.includes('{')) return;

    const getField = (field: string) => {
      // Matches field = {value} or field = "value" or field = value
      const regex = new RegExp(`${field}\\s*=\\s*(?:\\{([^{}]*)\\}|"([^"]*)"|(\\S+))`, 'i');
      const match = entry.match(regex);
      if (!match) return '';
      return (match[1] || match[2] || match[3] || '').replace(/\s+/g, ' ').trim();
    };

    const title = getField('title');
    if (!title) return;

    references.push({
      id: uuidv4(),
      projectId,
      title: title.replace(/[{}]/g, ''),
      authors: getField('author').replace(/ and /g, ', '),
      year: getField('year'),
      journal: getField('journal'),
      abstract: getField('abstract'),
      status: ReferenceStatus.IMPORTED,
      decisionTitleAbstract: Decision.PENDING,
      decisionFullText: Decision.PENDING,
      tags: []
    });
  });

  return references;
};

export const parseCsv = (content: string, projectId: string): Reference[] => {
  const references: Reference[] = [];
  const lines = content.split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  const getIndex = (keys: string[]) => headers.findIndex(h => keys.some(k => h.includes(k)));
  
  const titleIdx = getIndex(['title', 'titre']);
  const authorIdx = getIndex(['author', 'auteur']);
  const yearIdx = getIndex(['year', 'année', 'date']);
  const journalIdx = getIndex(['journal', 'source', 'revue']);
  const abstractIdx = getIndex(['abstract', 'résumé']);

  if (titleIdx === -1) return [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Simple regex to split CSV respecting quotes
    const row = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    
    if (row && row.length > titleIdx) {
        const clean = (val: string) => val ? val.replace(/^"|"$/g, '').trim() : '';

        references.push({
            id: uuidv4(),
            projectId,
            title: clean(row[titleIdx]),
            authors: authorIdx > -1 ? clean(row[authorIdx]) : '',
            year: yearIdx > -1 ? clean(row[yearIdx]) : '',
            journal: journalIdx > -1 ? clean(row[journalIdx]) : '',
            abstract: abstractIdx > -1 ? clean(row[abstractIdx]) : '',
            status: ReferenceStatus.IMPORTED,
            decisionTitleAbstract: Decision.PENDING,
            decisionFullText: Decision.PENDING,
            tags: []
        });
    }
  }

  return references;
};

export const processImportFile = async (file: File, projectId: string): Promise<Reference[]> => {
  const text = await file.text();
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'ris') return parseRis(text, projectId);
  if (ext === 'bib') return parseBibTex(text, projectId);
  if (ext === 'csv') return parseCsv(text, projectId);
  
  // Auto-detect
  if (text.includes('TY  - ')) return parseRis(text, projectId);
  if (text.includes('@article') || text.includes('@book')) return parseBibTex(text, projectId);
  
  return parseCsv(text, projectId);
};
