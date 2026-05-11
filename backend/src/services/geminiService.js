const REQUIRED_ENV_VARS = ['GEMINI_API_KEY'];
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

const getMissingEnvVars = () =>
  REQUIRED_ENV_VARS.filter((key) => !process.env[key] || !String(process.env[key]).trim());

const isGeminiConfigured = () => getMissingEnvVars().length === 0;

const getGeminiModel = () => process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

const buildGeminiUrl = () => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = getGeminiModel();

  if (!apiKey) {
    const error = new Error(`Configuration Gemini incomplete: ${getMissingEnvVars().join(', ')}`);
    error.code = 'GEMINI_CONFIG_MISSING';
    throw error;
  }

  return {
    model,
    url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
  };
};

const normalizeHistory = (history = []) =>
  history
    .filter(
      (item) =>
        item &&
        (item.role === 'user' || item.role === 'assistant') &&
        typeof item.content === 'string'
    )
    .map((item) => ({
      role: item.role,
      content: item.content.trim().slice(0, 1200),
    }))
    .filter((item) => item.content.length > 0)
    .slice(-8);

const buildSystemPrompt = ({ user, context }) => {
  const fullName = `${user?.prenom || ''} ${user?.nom || ''}`.trim() || 'N/A';
  const recentMovementSummaryText = Array.isArray(context.recentMovementSummary)
    ? context.recentMovementSummary
        .map((movement) => {
          const date = movement.date ? new Date(movement.date).toISOString() : 'unknown';
          return `${date} | ${movement.type} | ${movement.quantite} | ${movement.produitCode || 'N/A'} | ${movement.motif || ''}`.trim();
        })
        .join('\n')
    : 'aucun';

  return [
    'You are erp-stock-assistant, an inventory assistant for an ERP stock management application.',
    'Always answer in French unless the user explicitly requests another language.',
    'Be helpful for many inventory tasks: stock summaries, alert explanations, restocking priorities, movement analysis, short-term projections, and data-driven recommendations.',
    'If the user asks for a forecast, use the recent trend context and present it as a heuristic projection, not a certainty.',
    'If the user asks for an operational action, give concrete next steps.',
    'Keep answers concise when the user is brief, and more detailed when the user asks for analysis.',
    'Use the inventory context below when answering stock questions.',
    'If data is missing, state it clearly instead of inventing information.',
    'Never invent endpoints or database fields.',
    'When a question can be answered with the current snapshot, cite the relevant numbers directly.',
    'When the question is ambiguous, ask one focused clarifying question instead of guessing.',
    '',
    `Connected user role: ${user?.role || 'unknown'}`,
    `Connected user name: ${fullName}`,
    '',
    'Inventory snapshot:',
    `- Produits total: ${context.produitsTotal}`,
    `- Categories total: ${context.categoriesTotal}`,
    `- Mouvements total: ${context.mouvementsTotal}`,
    `- Mouvements recents (${context.recentWindowDays || 7} jours): ${context.recentMouvementsTotal || 0}`,
    `- Entrees recentes: ${context.recentEntrees || 0}`,
    `- Sorties recentes: ${context.recentSorties || 0}`,
    `- Net recent: ${context.recentNetTotal || 0}`,
    `- Moyenne quotidienne recente: ${Number(context.dailyAverageNet || 0).toFixed(2)}`,
    `- Projection stock 4 jours: ${context.projectedStock4Days || context.stockTotal}`,
    `- Tendance journaliere recente: ${context.recentTrendText || 'aucune'}`,
    `- Produits en rupture: ${context.ruptureTotal}`,
    `- Produits sous seuil: ${context.sousSeuilTotal}`,
    `- Stock cumule: ${context.stockTotal}`,
    `- Top alertes: ${context.topAlertesText || 'aucune'}`,
    '',
    'Recent movement samples:',
    recentMovementSummaryText,
    '',
    'Response patterns to prefer:',
    '- For forecasts, provide a short estimate plus the assumptions used.',
    '- For stock health questions, mention rupture and low-stock items first.',
    '- For management questions, summarize the issue, impact, and next action.',
  ].join('\n');
};

const askInventoryAssistant = async ({ user, message, history, context }) => {
  const { model, url } = buildGeminiUrl();

  const contents = normalizeHistory(history).map((item) => ({
    role: item.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: item.content }],
  }));

  contents.push({
    role: 'user',
    parts: [{ text: message }],
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: buildSystemPrompt({ user, context }) }],
      },
      contents,
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 450,
      },
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      payload?.error?.message || `Gemini API error (${response.status}) for model ${model}`
    );
    error.code = 'GEMINI_API_ERROR';
    error.status = response.status;
    throw error;
  }

  const reply = payload?.candidates
    ?.map((candidate) => candidate?.content?.parts || [])
    .flat()
    .map((part) => part?.text || '')
    .join('\n')
    .trim();

  return {
    reply: reply || 'Je n ai pas pu generer une reponse. Reessayez dans quelques secondes.',
    usage: payload?.usageMetadata || null,
  };
};

module.exports = {
  askInventoryAssistant,
  isGeminiConfigured,
  getMissingEnvVars,
};