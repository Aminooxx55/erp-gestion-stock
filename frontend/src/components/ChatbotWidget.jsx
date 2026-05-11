import { useEffect, useMemo, useRef, useState } from 'react';
import { FiAlertCircle, FiBarChart2, FiLoader, FiMessageCircle, FiPackage, FiSend, FiTrendingUp, FiX, FiZap } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STARTER_PROMPTS = [
  { icon: FiBarChart2, text: 'Résumé du stock actuel', color: 'var(--blue)' },
  { icon: FiPackage,   text: 'Produits en rupture ?', color: 'var(--danger)' },
  { icon: FiTrendingUp, text: 'Quoi réapprovisionner en priorité ?', color: 'var(--success)' },
  { icon: FiTrendingUp, text: 'Prévision du stock sur 4 jours', color: 'var(--indigo)' },
];

const MAX_HISTORY_ITEMS = 8;
const MAX_INPUT_LENGTH = 1200;

const createMessage = (role, content) => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
});

function ChatbotWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [messages, setMessages] = useState(() => [
    createMessage(
      'assistant',
      `Bonjour ${user?.prenom || ''}, je suis erp-stock-assistant. Je peux vous aider avec vos stocks, alertes et mouvements.`
    ),
  ]);

  const bodyRef = useRef(null);

  const historyPayload = useMemo(
    () =>
      messages
        .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
        .slice(-MAX_HISTORY_ITEMS)
        .map(({ role, content }) => ({ role, content })),
    [messages]
  );

  const chatbotBlocked = statusError.toLowerCase().includes('non configure');

  useEffect(() => {
    if (!open || !bodyRef.current) return;
    bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [open, messages, sending, statusError]);

  const checkStatus = async () => {
    setStatusLoading(true);
    try {
      const { data } = await api.get('/chatbot/status');
      if (!data?.configured) {
        setStatusError('Chatbot non configure cote serveur. Ajoutez les variables Gemini dans le backend.');
      } else {
        setStatusError('');
      }
    } catch {
      setStatusError('Impossible de verifier le statut du chatbot pour le moment.');
    } finally {
      setStatusLoading(false);
      setStatusChecked(true);
    }
  };

  useEffect(() => {
    if (open && !statusChecked) {
      checkStatus();
    }
  }, [open, statusChecked]);

  const sendMessage = async (rawText) => {
    const text = String(rawText || '').trim();
    if (!text || sending || chatbotBlocked) return;

    if (text.length > MAX_INPUT_LENGTH) {
      setStatusError(`Votre message depasse ${MAX_INPUT_LENGTH} caracteres.`);
      return;
    }

    setMessages((prev) => [...prev, createMessage('user', text)]);
    setInput('');
    setSending(true);

    try {
      const { data } = await api.post('/chatbot/message', {
        message: text,
        history: historyPayload,
      });

      const reply = String(data?.reply || '').trim() || 'Aucune reponse du modele.';
      setMessages((prev) => [...prev, createMessage('assistant', reply)]);
    } catch (error) {
      const backendMessage = error.response?.data?.message;
      const fallback = backendMessage || 'Erreur reseau. Reessayez dans quelques secondes.';
      setMessages((prev) => [
        ...prev,
        createMessage('assistant', `Je n ai pas pu traiter la demande. ${fallback}`),
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[90]">
      <AnimatePresence>
        {open && (
          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="mb-3 w-[min(92vw,390px)] card-elevated overflow-hidden"
          >
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, var(--blue), var(--indigo))',
                    color: 'white',
                  }}
                >
                  <FiZap size={15} />
                </div>
                <div>
                  <p className="text-sm font-extrabold" style={{ color: 'var(--text-primary)' }}>
                    Assistant Stock
                  </p>
                  <p className="text-[11px] opacity-55" style={{ color: 'var(--text-secondary)' }}>
                    Gemini
                  </p>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Fermer le chatbot"
              >
                <FiX size={16} />
              </motion.button>
            </div>

            <div ref={bodyRef} className="max-h-[420px] overflow-y-auto px-4 py-4 space-y-3">
              {statusLoading && (
                <div className="text-xs flex items-center gap-2 opacity-70" style={{ color: 'var(--text-secondary)' }}>
                  <FiLoader className="animate-spin" size={13} /> Verification du service...
                </div>
              )}

              {statusError && (
                <div className="notice notice-error text-xs flex items-start gap-2">
                  <FiAlertCircle size={14} className="mt-0.5" />
                  <span>{statusError}</span>
                </div>
              )}

              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="max-w-[84%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                      style={
                        isUser
                          ? {
                              color: 'white',
                              background: 'linear-gradient(135deg, var(--blue), var(--indigo))',
                              boxShadow: '0 8px 20px rgba(110, 143, 219, 0.22)',
                            }
                          : {
                              color: 'var(--text-primary)',
                              background: 'var(--neutral-alpha-6)',
                              border: '1px solid var(--border-subtle)',
                            }
                      }
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}

              {messages.length <= 1 && !statusError && (
                <div className="pt-2">
                  <p className="text-[11px] mb-3 font-semibold uppercase tracking-widest opacity-40" style={{ color: 'var(--text-secondary)' }}>
                    Suggestions
                  </p>
                  <div className="flex flex-col gap-2">
                    {STARTER_PROMPTS.map((prompt, i) => {
                      const Icon = prompt.icon;
                      return (
                        <motion.button
                          key={prompt.text}
                          type="button"
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 300, damping: 24 }}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => sendMessage(prompt.text)}
                          disabled={sending || chatbotBlocked}
                          className="group flex items-center gap-3 w-full text-left rounded-xl px-3 py-2.5 transition-all duration-200"
                          style={{
                            background: 'var(--neutral-alpha-4)',
                            border: '1px solid var(--border-subtle)',
                            cursor: sending || chatbotBlocked ? 'not-allowed' : 'pointer',
                            opacity: sending || chatbotBlocked ? 0.4 : 1,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = `color-mix(in srgb, ${prompt.color} 30%, transparent)`;
                            e.currentTarget.style.background = `color-mix(in srgb, ${prompt.color} 6%, transparent)`;
                            e.currentTarget.style.boxShadow = `0 4px 16px color-mix(in srgb, ${prompt.color} 10%, transparent)`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            e.currentTarget.style.background = 'var(--neutral-alpha-4)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200"
                            style={{
                              background: `color-mix(in srgb, ${prompt.color} 12%, transparent)`,
                              border: `1px solid color-mix(in srgb, ${prompt.color} 18%, transparent)`,
                              color: prompt.color,
                            }}
                          >
                            <Icon size={13} />
                          </div>
                          <span className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                            {prompt.text}
                          </span>
                          <FiSend
                            size={11}
                            className="ml-auto opacity-0 group-hover:opacity-50 transition-opacity duration-200"
                            style={{ color: prompt.color }}
                          />
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {sending && (
                <div className="flex justify-start">
                  <div
                    className="rounded-2xl px-3.5 py-2.5 text-xs flex items-center gap-2"
                    style={{
                      color: 'var(--text-secondary)',
                      background: 'var(--neutral-alpha-6)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <FiLoader className="animate-spin" size={13} /> Generation de la reponse...
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-3"
              style={{ borderTop: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  rows={2}
                  className="input-field resize-none"
                  placeholder="Posez une question sur votre stock..."
                  disabled={sending || chatbotBlocked}
                  maxLength={MAX_INPUT_LENGTH}
                />

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="btn btn-primary btn-icon"
                  disabled={sending || !input.trim() || chatbotBlocked}
                  aria-label="Envoyer"
                >
                  <FiSend size={14} />
                </motion.button>
              </div>
              <p className="text-[10px] mt-2 opacity-45" style={{ color: 'var(--text-secondary)' }}>
                Entree pour envoyer, Shift + Entree pour nouvelle ligne.
              </p>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{
          color: 'white',
          background: 'linear-gradient(135deg, var(--blue), var(--indigo))',
          boxShadow: '0 16px 30px rgba(110, 143, 219, 0.32)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
        aria-label={open ? 'Fermer le chatbot' : 'Ouvrir le chatbot'}
      >
        {open ? <FiX size={20} /> : <FiMessageCircle size={20} />}
      </motion.button>
    </div>
  );
}

export default ChatbotWidget;
