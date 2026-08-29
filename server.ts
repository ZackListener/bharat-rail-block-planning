import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API: AI Reschedule Missed Maintenance Block
app.post('/api/ai/reschedule-missed-block', async (req, res) => {
  try {
    const {
      blockId,
      corridorName,
      section,
      division,
      blockType,
      department,
      durationHours,
      missedReason,
      originalDate,
      originalStartTime,
      originalEndTime,
      location,
      criticality,
    } = req.body;

    const ai = getAiClient();

    // Fallback default for the "original" (missed) date when the caller
    // doesn't supply one — yesterday, relative to whenever this runs.
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const defaultOriginalDate = yesterday.toISOString().split('T')[0];

    if (ai) {
      const prompt = `You are the Chief Train Controller & AI Block Scheduling Engine for Indian Railways (operating systems: TMS, SMMS, TDMS, COA).
A vital track/traction/signaling maintenance block on a high-density corridor was MISSED / DEFERRED and must be immediately rescheduled with zero safety compromise and minimal passenger delay.

MISSED BLOCK DETAILS:
- Block ID: ${blockId || 'MB-MISSED-01'}
- Corridor: ${corridorName || 'New Delhi - Kanpur (NDLS-CNB)'}
- Section: ${section || 'NDLS - CNB Main Line'}
- Division: ${division || 'Northern Railway'}
- Work Type: ${blockType || 'Track Renewal & Tamping'}
- Department: ${department || 'Civil'}
- Required Duration: ${durationHours || 4} Hours
- Reason for Missed Window: ${missedReason || 'High priority express train congestion and freight path overrun'}
- Original Window: Date ${originalDate || defaultOriginalDate}, ${originalStartTime || '10:00'} to ${originalEndTime || '14:00'}
- Location/Chainage: ${location || 'Km 430 - 435'}
- Criticality: ${criticality || 'High'}

Generate an optimal new slot and 2 alternative fallback slots. Consider:
1. Indian Railways night maintenance windows (usually 00:30 to 05:30) or low-density midday dips.
2. Speed restrictions (PSR/TSR) and safety implications of delaying this block further.
3. Specific train path adjustments (e.g. Swarna Shatabdi, Rajdhani, Goods trains regulation at loop lines).
4. Synchronized TMS, SMMS, and TDMS readiness.

Return a structured JSON object.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert railway operations AI for Indian Railways. Always return realistic Indian Railways train numbers, stations, speed restrictions, and practical track possession time slots in valid JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendedSlot: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING, description: 'Recommended date in YYYY-MM-DD format, on or after the original missed date' },
                  startTime: { type: Type.STRING, description: 'Start time e.g. 01:00 Hrs' },
                  endTime: { type: Type.STRING, description: 'End time e.g. 05:00 Hrs' },
                  durationHours: { type: Type.NUMBER, description: 'Possession window hours' },
                  trafficDensity: { type: Type.STRING, description: 'e.g. Low Night Traffic (2 Goods Rakes only)' },
                  reliabilityScore: { type: Type.NUMBER, description: 'Punctuality reliability percentage e.g. 98' },
                  rationale: { type: Type.STRING, description: 'Operational reason why this window was selected' },
                },
                required: ['date', 'startTime', 'endTime', 'durationHours', 'reliabilityScore', 'rationale'],
              },
              alternativeSlots: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING },
                    startTime: { type: Type.STRING },
                    endTime: { type: Type.STRING },
                    durationHours: { type: Type.NUMBER },
                    prosAndCons: { type: Type.STRING },
                    reliabilityScore: { type: Type.NUMBER },
                  },
                  required: ['date', 'startTime', 'endTime', 'durationHours', 'prosAndCons'],
                },
              },
              trainImpactMitigations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    trainNumber: { type: Type.STRING, description: 'e.g. 12004 Swarna Shatabdi or Freight 4481' },
                    regulationPlan: { type: Type.STRING, description: 'e.g. Diverted to 3rd loop at Aligarh (+3m delay)' },
                    impactLevel: { type: Type.STRING, description: 'None | Low | Managed' },
                  },
                  required: ['trainNumber', 'regulationPlan', 'impactLevel'],
                },
              },
              safetyUrgencyNote: {
                type: Type.STRING,
                description: 'Operational safety assessment regarding why this block cannot be deferred further',
              },
              systemSyncStatus: {
                type: Type.OBJECT,
                properties: {
                  tmsReady: { type: Type.BOOLEAN },
                  smmsReady: { type: Type.BOOLEAN },
                  tdmsReady: { type: Type.BOOLEAN },
                  coaCleared: { type: Type.BOOLEAN },
                },
                required: ['tmsReady', 'smmsReady', 'tdmsReady', 'coaCleared'],
              },
            },
            required: [
              'recommendedSlot',
              'alternativeSlots',
              'trainImpactMitigations',
              'safetyUrgencyNote',
              'systemSyncStatus',
            ],
          },
        },
      });

      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText);
        return res.json({ success: true, aiGenerated: true, data: parsed });
      }
    }

    // Fallback if Gemini key is missing or offline
    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() + 1);
    const dateStr = fallbackDate.toISOString().split('T')[0];

    return res.json({
      success: true,
      aiGenerated: false,
      data: {
        recommendedSlot: {
          date: dateStr,
          startTime: '01:00 Hrs',
          endTime: `${(1 + (durationHours || 4)).toString().padStart(2, '0')}:00 Hrs`,
          durationHours: durationHours || 4,
          trafficDensity: 'Minimal Night Traffic (Non-Peak Rake Corridor)',
          reliabilityScore: 97.5,
          rationale: `Computed optimal non-passenger window on ${section || 'the corridor'} avoiding Vande Bharat & Rajdhani express rakes.`,
        },
        alternativeSlots: [
          {
            date: dateStr,
            startTime: '11:30 Hrs',
            endTime: `${(11.5 + (durationHours || 4)).toFixed(0)}:30 Hrs`,
            durationHours: durationHours || 4,
            prosAndCons: 'Midday slot between morning and evening express batches; requires loop regulation for 1 freight train.',
            reliabilityScore: 92.0,
          },
          {
            date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
            startTime: '00:30 Hrs',
            endTime: `${(0.5 + (durationHours || 4)).toFixed(0)}:30 Hrs`,
            durationHours: durationHours || 4,
            prosAndCons: 'Weekend early morning possession with clear track clearance from Control Office.',
            reliabilityScore: 99.0,
          },
        ],
        trainImpactMitigations: [
          {
            trainNumber: '12004 Swarna Shatabdi',
            regulationPlan: 'Clear green path through Main Up Line before 00:45 Hrs (Zero delay)',
            impactLevel: 'None',
          },
          {
            trainNumber: 'Goods Rake CONCOR #8921',
            regulationPlan: 'Regulated at Hathras Junction siding for 25 mins',
            impactLevel: 'Managed',
          },
          {
            trainNumber: '12560 Shiv Ganga Express',
            regulationPlan: 'Diverted via 3rd loop line at 30 km/h with 4-minute slack absorption',
            impactLevel: 'Low',
          },
        ],
        safetyUrgencyNote:
          'Critical ultrasonic / OHE tension clearance required. Deferring past 48 hours will trigger a mandatory 30 km/h Temporary Speed Restriction (TSR).',
        systemSyncStatus: {
          tmsReady: true,
          smmsReady: true,
          tdmsReady: true,
          coaCleared: true,
        },
      },
    });
  } catch (error: any) {
    console.error('Error in /api/ai/reschedule-missed-block:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate replacement AI block schedule',
    });
  }
});

async function startServer() {
  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Indian Railways AI Block Planning Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
