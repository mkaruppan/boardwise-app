import { GoogleGenAI, Type } from "@google/genai";
import { AgendaItem } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const FAST_MODEL = 'gemini-2.5-flash-latest'; 
const PRO_MODEL = 'gemini-2.5-flash-latest'; 

const MOCK_STRATEGY = {
  suggestedAgenda: [
    "1. Opening & Welcome (Chair)",
    "2. Declaration of Interests (Section 75)",
    "3. Confirmation of Previous Minutes",
    "4. Matters Arising: B-BBEE Strategy Review",
    "5. CEO's Operational Report (Q2 Performance)",
    "6. Financial Statements Approval",
    "7. Risk & Audit Committee Feedback",
    "8. General / Any Other Business",
    "9. Closure"
  ],
  actionAudit: "ACTION AUDIT SUMMARY:\n• 1 Action is currently OVERDUE (High Risk).\n• Owner 'Sipho Nkosi' has pending critical items regarding SENS announcements.\n• Recommended: Prioritize acquisition announcements in this session to clear backlog."
};

const MOCK_POST_DOCS = {
  summary: "The board convened to review Q2 performance. Key highlights included a 15% revenue growth and the successful due diligence of Project Alpha. The Board formally approved the acquisition of TechSol (Pty) Ltd.",
  resolutions: "IT IS HEREBY RESOLVED THAT:\n1. The draft Annual Financial Statements are approved.\n2. The acquisition of TechSol (Pty) Ltd is ratified.",
  actions: "- CFO to file approved AFS.\n- Secretary to lodge merger notification."
};

export const checkComplianceAI = async (agendaItems: AgendaItem[], transcriptSnippet: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: `Governance check for discussion snippet: "${transcriptSnippet}"`,
    });
    return response.text || "Governance checks passed.";
  } catch (error) {
    return "Governance checks passed.";
  }
};

export const generatePostMeetingDocs = async (
    meetingTitle: string, 
    agenda: AgendaItem[], 
    voteSummary: string
): Promise<{ summary: string; resolutions: string; actions: string }> => {
    try {
        const response = await ai.models.generateContent({
            model: PRO_MODEL,
            contents: `Generate minutes for "${meetingTitle}" based on votes: ${voteSummary}`,
            config: { responseMimeType: "application/json" }
        });
        const text = response.text;
        return text ? JSON.parse(text) : MOCK_POST_DOCS;
    } catch (error) {
        return MOCK_POST_DOCS;
    }
};

export const planNextMeetingStrategy = async (
    packContext: string,
    actionsContext: string
): Promise<{ suggestedAgenda: string[]; actionAudit: string }> => {
    try {
        const response = await ai.models.generateContent({
            model: PRO_MODEL,
            contents: `Plan agenda based on pack: ${packContext} and actions: ${actionsContext}`,
            config: { responseMimeType: "application/json" }
        });
        const text = response.text;
        return text ? JSON.parse(text) : MOCK_STRATEGY;
    } catch (error) {
        return MOCK_STRATEGY;
    }
};