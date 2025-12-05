import { GoogleGenAI, Type } from "@google/genai";
import { Reference, Project } from '../types';

export const analyzeReferenceWithGemini = async (
  reference: Reference,
  project: Project
): Promise<{ suggestion: string; reasoning: string }> => {
  if (!process.env.API_KEY) {
    return { suggestion: "N/A", reasoning: "Clé API non configurée." };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Tu es un assistant de recherche académique expert réalisant une revue systématique.
      
      Question de recherche: "${project.researchQuestion}"
      Critères d'inclusion: "${project.inclusionCriteria}"
      Critères d'exclusion: "${project.exclusionCriteria}"
      
      Article à analyser:
      Titre: "${reference.title}"
      Résumé: "${reference.abstract}"
      
      Tâche:
      Analyse si cet article doit être INCLU, EXCLU ou INCERTAIN pour la phase de criblage Titre/Résumé.
      Sois strict sur les critères.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestion: {
              type: Type.STRING,
              enum: ["INCLURE", "EXCLURE", "INCERTAIN"],
              description: "La décision suggérée."
            },
            reasoning: {
              type: Type.STRING,
              description: "Une explication concise (max 2 phrases) justifiant la décision."
            }
          },
          required: ["suggestion", "reasoning"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      suggestion: result.suggestion || "INCERTAIN",
      reasoning: result.reasoning || "Analyse échouée."
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    return { suggestion: "ERREUR", reasoning: "Impossible de contacter l'IA." };
  }
};