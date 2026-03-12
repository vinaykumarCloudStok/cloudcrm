import { GoogleGenerativeAI } from '@google/generative-ai';

let model: any = null;

function getModel() {
  if (!model && process.env.GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }
  return model;
}

export async function generateContent(systemPrompt: string, userPrompt: string): Promise<string> {
  const m = getModel();
  if (!m) return JSON.stringify({ error: 'No API key configured', fallback: true });
  try {
    const result = await m.generateContent([
      { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] },
    ]);
    return result.response.text();
  } catch (error: any) {
    console.error('Gemini API error:', error.message);
    return JSON.stringify({ error: 'AI generation failed', fallback: true });
  }
}

export function parseJsonResponse(text: string): any {
  try {
    const jsonMatch =
      text.match(/```json\n?([\s\S]*?)\n?```/) ||
      text.match(/\{[\s\S]*\}/) ||
      text.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    return JSON.parse(text);
  } catch {
    return null;
  }
}
