import { Router } from 'express';
import { buildAnalystCopilotPrompt, sanitizeCopilotOutput } from '../../src/ai/analystCopilot';
import { PUBLIC_MODE } from '../security/middleware';
import { classifyGeminiError, COPILOT_MODELS, generateCopilotWithFallback, getGenAiClient, normalizeCopilotModel } from '../services/gemini';

export function copilotRouter(): Router {
  const router = Router();

  router.get('/api/intelligence/copilot/status', (req, res) => {
    const personalKey = typeof req.headers['x-gemini-api-key'] === 'string'
      ? req.headers['x-gemini-api-key']
      : '';
    const personalConfigured = personalKey.trim().length > 10;
    const serverConfigured = !PUBLIC_MODE && Boolean(process.env.GEMINI_API_KEY);

    res.json({
      configured: personalConfigured || serverConfigured,
      source: personalConfigured ? 'personal' : serverConfigured ? 'server' : 'none',
      defaultModel: COPILOT_MODELS[0],
      supportedModels: [...COPILOT_MODELS],
      provider: 'Google Gemini',
    });
  });

  // Evidence-bounded AI analyst copilot. This endpoint summarizes the local assessment;
  // it does not collect new target data and cannot raise factual confidence on its own.
  router.post('/api/intelligence/copilot', async (req, res) => {
    const { targetLabel = 'target', assessment, analystQuestion, model, customApiKey } = req.body || {};
    const headerKey = (req.headers['x-gemini-api-key'] as string) || customApiKey;

    if (!assessment || typeof assessment !== 'object') {
      return res.status(400).json({ error: 'A local intelligence assessment is required.' });
    }

    const evidenceCount = Array.isArray(assessment.evidence) ? assessment.evidence.length : 0;
    if (evidenceCount > 100) {
      return res.status(400).json({ error: 'Copilot accepts at most 100 prioritized evidence records per request.' });
    }

    const clientInfo = getGenAiClient(headerKey);
    if (!clientInfo) {
      return res.status(503).json({
        error: 'Gemini is not configured. Add a personal API key in AI settings or configure GEMINI_API_KEY on the server.',
        errorType: 'not_configured',
        provenance: { type: 'AI_SYNTHESIZED', factualConfidenceRaised: false },
      });
    }

    const prompt = buildAnalystCopilotPrompt({
      targetLabel: String(targetLabel).slice(0, 200),
      assessment,
      analystQuestion: typeof analystQuestion === 'string' ? analystQuestion.slice(0, 1000) : undefined,
    });

    try {
      const generated = await generateCopilotWithFallback(clientInfo.client, prompt, model);
      const evidenceIds = (Array.isArray(assessment.evidence) ? assessment.evidence : []).map((e: any) => String(e?.id));
      const { output, droppedEvidenceIds } = sanitizeCopilotOutput(generated.parsed, evidenceIds);
      return res.json({
        ...output,
        droppedEvidenceIds,
        modelUsed: generated.modelUsed,
        attemptedModels: generated.attemptedModels,
        generatedAt: new Date().toISOString(),
        provenance: {
          type: 'AI_SYNTHESIZED',
          factualConfidenceRaised: false,
        },
      });
    } catch (error) {
      return res.status(502).json({
        error: error instanceof Error ? error.message : 'AI analyst request failed',
        errorType: classifyGeminiError(error),
        requestedModel: normalizeCopilotModel(model),
        provenance: {
          type: 'AI_SYNTHESIZED',
          factualConfidenceRaised: false,
        },
      });
    }
  });

  return router;
}
