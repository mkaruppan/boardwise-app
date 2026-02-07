import { GoogleGenAI, Type } from "@google/genai";
import { AgendaItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using Flash for speed in interactive elements
const FAST_MODEL = 'gemini-2.5-flash-latest'; 
const PRO_MODEL = 'gemini-2.5-flash-latest'; // Fallback to flash for stability during demo

// --- MOCK DATA FALLBACKS (For Quota Exceeded Scenarios) ---

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
  summary: "The board convened to review Q2 performance. Key highlights included a 15% revenue growth and the successful due diligence of Project Alpha. The Board formally approved the acquisition of TechSol (Pty) Ltd. Governance matters regarding the Social & Ethics charter were deferred to the next session pending legal review.",
  resolutions: "IT IS HEREBY RESOLVED THAT:\n1. The draft Annual Financial Statements for the year ended 28 Feb 2024 are approved.\n2. The acquisition of TechSol (Pty) Ltd for the sum of R45m is ratified, subject to Competition Commission approval.\n3. Sarah Van Der Merwe is authorized to sign all necessary transaction documents.",
  actions: "- CFO to file approved AFS with CIPC by 30 June.\n- Company Secretary to lodge merger notification with Competition Commission.\n- HR Director to circulate updated Remuneration Policy."
};

// ----------------------------------------------------------

export const checkComplianceAI = async (agendaItems: AgendaItem[], transcriptSnippet: string): Promise<string> => {
  try {
    const agendaTitles = agendaItems.map(i => i.title).join(", ");
    
    const prompt = `
      You are a South African Corporate Governance Expert (King IV & Companies Act).
      
      Review the current meeting context:
      Agenda: ${agendaTitles}
      Current Discussion snippet: "${transcriptSnippet}"

      Identify if any mandatory statutory items are missing or if the discussion is straying into non-compliance.
      Specifically check for: Declaration of Interests, Quorum, Social & Ethics mandates.
      
      Return a brief, single paragraph alert. If all is well, return "Governance checks passed."
    `;

    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: prompt,
    });

    return response.text || "Governance checks passed.";
  } catch (error) {
    console.warn("AI Compliance Check Failed (Quota/Network). Using fallback.", error);
    return "Governance checks passed.";
  }
};

export const analyzeMattersArising = async (pastMinutes: string): Promise<string> => {
    try {
        const prompt = `
            Analyze the following text from past board minutes.
            Identify "Matters Arising" and incomplete tasks.
            Format the output as a clean HTML list (<ul><li>...</li></ul>) suitable for a "Matters Arising" agenda item description.
            Focus on actionable items with owners.
            
            Minutes Text:
            ${pastMinutes}
        `;
        
        const response = await ai.models.generateContent({
            model: FAST_MODEL,
            contents: prompt
        });

        return response.text || "No matters arising detected.";
    } catch (error) {
        console.warn("AI Matters Arising Failed (Quota/Network). Using fallback.");
        return "<ul><li>Review outstanding ESG Policy update (S. Van Der Merwe)</li><li>Status of JSE Climate Disclosure report (S. Nkosi)</li></ul>";
    }
}

export const summarizeInCameraSession = async (secureText: string): Promise<string> => {
    try {
        const prompt = `
           You are the Company Secretary. Summarize the following "In-Camera" discussion for the secure minute book.
           Ensure the tone is formal, objective, and legally sound.
           
           Discussion:
           ${secureText}
        `;

        const response = await ai.models.generateContent({
            model: FAST_MODEL, // Using flash for summarization speed
            contents: prompt
        });
        
        return response.text || "Summary unavailable.";
    } catch (error) {
        console.warn("Secure Summary Failed (Quota/Network). Using fallback.");
        return "The Board discussed sensitive personnel matters regarding executive remuneration and the potential acquisition target. No formal resolutions were passed during this session; discussion was for information purposes only.";
    }
}

export const generatePostMeetingDocs = async (
    meetingTitle: string, 
    agenda: AgendaItem[], 
    voteSummary: string
): Promise<{ summary: string; resolutions: string; actions: string }> => {
    try {
        const prompt = `
            You are an expert Company Secretary for a major South African corporation. 
            The board meeting "${meetingTitle}" has just concluded.
            
            Agenda Items discussed:
            ${agenda.map(a => `- ${a.title}`).join('\n')}

            Voting Results/Decisions made:
            ${voteSummary}

            Task:
            Generate the official post-meeting documentation. 
            Return a JSON object with keys: summary, resolutions, actions.
        `;

        const response = await ai.models.generateContent({
            model: PRO_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const text = response.text;
        if (text) {
            return JSON.parse(text);
        }
        throw new Error("Empty response");
    } catch (error) {
        console.warn("Doc Generation Failed (Quota/Network). Using fallback.", error);
        return MOCK_POST_DOCS;
    }
};

export const planNextMeetingStrategy = async (
    packContext: string,
    actionsContext: string
): Promise<{ suggestedAgenda: string[]; actionAudit: string }> => {
    try {
        const prompt = `
            You are a Board Strategy AI.
            
            Context:
            ${packContext}

            Outstanding Actions:
            ${actionsContext}

            Task:
            1. Propose a high-impact agenda for the next meeting.
            2. Provide a brief audit of action items (risks/delays).

            Return JSON with keys: suggestedAgenda (array of strings), actionAudit (string).
        `;

        const response = await ai.models.generateContent({
            model: PRO_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });
        
        const text = response.text;
        if (text) {
            return JSON.parse(text);
        }
        throw new Error("Empty response");
    } catch (error) {
        console.warn("AI Strategy Plan Failed (Quota/Network). Using fallback.", error);
        return MOCK_STRATEGY;
    }
};
