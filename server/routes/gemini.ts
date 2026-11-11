import { Router } from 'express';
import { requireJsonBody } from '../errors';
import { classifyGeminiError, COPILOT_MODELS, getGenAiClient, normalizeCopilotModel, parseCleanJson, withTimeout } from '../services/gemini';

export function geminiRouter(): Router {
  const router = Router();

  // Endpoint to validate a personal Gemini API key or check system key status
  router.post('/api/osint/gemini-validate', requireJsonBody, async (req, res) => {
    const customKey = req.body.apiKey || (req.headers['x-gemini-api-key'] as string);
    const selectedModel = normalizeCopilotModel(req.body.model);

    const clientInfo = getGenAiClient(customKey);
    if (!clientInfo) {
      return res.json({
        valid: false,
        isConfigured: false,
        message: 'No API key provided or found in environment.',
        supportedModels: [...COPILOT_MODELS],
      });
    }

    try {
      const response = await withTimeout(
        clientInfo.client.models.generateContent({
          model: selectedModel,
          contents: 'Respond with JSON: {"status":"ok","service":"gemini"}',
          config: { responseMimeType: 'application/json', temperature: 0 },
        }),
        8000
      );

      const parsed = parseCleanJson(response.text || '{}');
      return res.json({
        valid: parsed?.status === 'ok',
        isConfigured: true,
        isCustom: clientInfo.isCustom,
        modelTested: selectedModel,
        message: 'Gemini is configured and responding.',
        supportedModels: [...COPILOT_MODELS],
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(400).json({
        valid: false,
        isConfigured: true,
        isCustom: clientInfo.isCustom,
        modelTested: selectedModel,
        errorType: classifyGeminiError(error),
        error: error instanceof Error ? error.message : 'Failed to validate Gemini connection',
        supportedModels: [...COPILOT_MODELS],
      });
    }
  });

  return router;
}
