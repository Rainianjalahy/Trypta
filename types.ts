export enum Role {
  ADMIN = 'Administrateur',
  REVIEWER = 'Évaluateur',
  VIEWER = 'Lecteur'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export enum ReferenceStatus {
  IMPORTED = 'IMPORTED',
  SCREENING_TITLE_ABSTRACT = 'SCREENING_TITLE_ABSTRACT',
  SCREENING_FULL_TEXT = 'SCREENING_FULL_TEXT',
  INCLUDED = 'INCLUDED',
  EXCLUDED = 'EXCLUDED',
  DUPLICATE = 'DUPLICATE'
}

export enum Decision {
  INCLUDE = 'INCLUDE',
  EXCLUDE = 'EXCLUDE',
  UNCERTAIN = 'UNCERTAIN',
  PENDING = 'PENDING'
}

export type ExtractionFieldType = 'text' | 'number' | 'select' | 'boolean';

export interface ExtractionField {
  id: string;
  label: string;
  type: ExtractionFieldType;
  options?: string[]; // For 'select' type, comma separated
}

export interface Reference {
  id: string;
  projectId: string;
  title: string;
  authors: string;
  year: string;
  journal: string;
  abstract: string;
  doi?: string;
  status: ReferenceStatus;
  decisionTitleAbstract: Decision;
  decisionFullText: Decision;
  exclusionReason?: string;
  fullTextContent?: string; // Simulated content
  pdfFileName?: string; // Name of the uploaded PDF
  tags: string[];
  extractionData?: Record<string, any>; // Key is ExtractionField.id
}

export interface Project {
  id: string;
  title: string;
  description: string;
  researchQuestion: string;
  inclusionCriteria: string;
  exclusionCriteria: string;
  extractionSchema: ExtractionField[];
  createdAt: number;
}

export interface StatData {
  stage: string;
  count: number;
}