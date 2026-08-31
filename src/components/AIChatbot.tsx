import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiAgent } from '../services/aiAgent';

// ============================================
// 🧑 Assistant IA - Homme Professionnel
// ============================================

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

// Messages proactifs de l'assistant
const PROACTIVE_MESSAGES = [
  "👋 Besoin d'aide ? Je suis là pour vous !",
  "📊 J'ai analysé vos données récemment, voulez-vous un résumé ?",
  "💡 Je vois des opportunités d'amélioration dans vos ventes !",
  "🔔 Attention, il y a des alertes importantes à vérifier !",
  "🤝 Comment puis-je vous aider aujourd'hui ?",
  "📈 Vos ventes progressent bien ce mois-ci !",
  "📦 Vérifiez vos stocks, certains produits sont bas !",
  "🧾 N'oubliez pas de suivre vos factures en retard !",
];

const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: "Bonjour ! 👋 Je suis **Karim**, votre assistant IA professionnel. Je peux analyser vos données, vous donner des conseils et répondre à vos questions sur votre business. Comment puis-je vous aider ?",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [proactiveMsg, setProactiveMsg] = useState('');
  const [showProactive, setShowProactive] = useState(false);
  const [isWaving, setIsWaving] = useState(false);
  const [mood, setMood] = useState<'happy' | 'thinking' | 'talking' | 'idle'>('idle');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Suggestions au démarrage
  useEffect(() => {
    if (isOpen) {
      setSuggestions(aiAgent.getSuggestions());
    }
  }, [isOpen]);

  // Messages proactifs
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOpen && Math.random() > 0.7) {
        const msg = PROACTIVE_MESSAGES[Math.floor(Math.random() * PROACTIVE_MESSAGES.length)];
        setProactiveMsg(msg);
        setShowProactive(true);
        setIsWaving(true);
        setTimeout(() => {
          setShowProactive(false);
          setIsWaving(false);
        }, 5000);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Animation de bienvenue
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsWaving(true);
      setTimeout(() => setIsWaving(false), 2000);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Drag functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.chatbot-input')) return;
    setIsDragging(true);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      
      const handleMouseMove = (e: MouseEvent) => {
        const newX = Math.max(0, Math.min(window.innerWidth - 400, e.clientX - offsetX));
        const newY = Math.max(0, Math.min(window.innerHeight - 500, e.clientY - offsetY));
        setPosition({ x: newX, y: newY });
      };
      
      const handleMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
      
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
  }, []);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    setMood('talking');
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setMood('thinking');

    try {
      const response = await aiAgent.ask(messageText);
      setMood('happy');
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Désolé, j'ai rencontré une erreur. Pouvez-vous répéter votre question ? 😅",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setMood('idle');
      setSuggestions(aiAgent.getSuggestions());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');
  };

  // ============================================
  // 🎨 Avatar de l'assistant
  // ============================================
  const renderAvatar = () => (
    <div style={{
      width: 60,
      height: 60,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '2rem',
      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
      position: 'relative',
      cursor: 'pointer',
    }}>
      {/* Corps/Stick Figure */}
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        {/* Tête */}
        <circle cx="20" cy="10" r="7" fill="white" />
        {/* Yeux */}
        <circle cx="17" cy="9" r="1.5" fill="#1d4ed8" />
        <circle cx="23" cy="9" r="1.5" fill="#1d4ed8" />
        {/* Sourire */}
        <path d="M16 13 Q20 17 24 13" stroke="#1d4ed8" strokeWidth="1.5" fill="none" />
        {/* Corps */}
        <line x1="20" y1="17" x2="20" y2="30" stroke="white" strokeWidth="2" />
        {/* Bras gauche */}
        <motion.line
          x1="20" y1="22" x2="12" y2="28"
          stroke="white" strokeWidth="2"
          animate={isWaving ? { x2: [12, 8, 12, 8, 12], y2: [28, 20, 28, 20, 28] } : {}}
          transition={{ duration: 1.5, repeat: isWaving ? 2 : 0 }}
        />
        {/* Bras droit */}
        <line x1="20" y1="22" x2="28" y2="28" stroke="white" strokeWidth="2" />
        {/* Jambes */}
        <line x1="20" y1="30" x2="14" y2="38" stroke="white" strokeWidth="2" />
        <line x1="20" y1="30" x2="26" y2="38" stroke="white" strokeWidth="2" />
      </svg>

      {/* Indicateur d'humeur */}
      <motion.div
        animate={{
          scale: mood === 'happy' ? [1, 1.2, 1] : 1,
          background: mood === 'thinking' ? '#f59e0b' : mood === 'happy' ? '#10b981' : '#3b82f6',
        }}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: '2px solid white',
        }}
      />
    </div>
  );

  return (
    <>
      {/* ============================================ */}
      {/* BOUTON FLOTTANT - Avatar de l'assistant */}
      {/* ============================================ */}
      <motion.div
        drag
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        style={{
          position: 'fixed',
          bottom: 88,
          right: 24,
          zIndex: 200,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        whileHover={{ scale: 1.1 }}
      >
        <motion.div
          onClick={() => { setIsOpen(!isOpen); setShowProactive(false); }}
          animate={isWaving ? { rotate: [0, -10, 10, -10, 0] } : {}}
          transition={{ duration: 0.5 }}
        >
          {renderAvatar()}
        </motion.div>

        {/* Message proactif */}
        <AnimatePresence>
          {showProactive && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              style={{
                position: 'absolute',
                bottom: 70,
                right: 0,
                background: 'white',
                borderRadius: '16px 16px 4px 16px',
                padding: '12px 16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                width: 250,
                fontSize: '0.85rem',
                color: '#374151',
                lineHeight: 1.4,
              }}
            >
              {proactiveMsg}
              <div style={{
                position: 'absolute',
                bottom: -8,
                right: 20,
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid white',
              }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badge de notifications */}
        {!isOpen && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{
              position: 'absolute',
              top: -5,
              right: -5,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: '#ef4444',
              color: 'white',
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            1
          </motion.div>
        )}
      </motion.div>

      {/* ============================================ */}
      {/* FENÊTRE DU CHATBOT */}
      {/* ============================================ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            style={{
              position: 'fixed',
              left: position.x,
              top: position.y,
              width: 400,
              height: isMinimized ? 'auto' : 550,
              background: 'var(--bg-primary)',
              borderRadius: 20,
              border: '1px solid var(--border-color)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              zIndex: 201,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header - Draggable */}
            <div
              ref={dragRef}
              onMouseDown={handleMouseDown}
              style={{
                padding: '14px 20px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
              }}
            >
              {renderAvatar()}
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Karim - Assistant IA</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}>
                  {isTyping ? '✍️ En train d\'écrire...' : '🟢 En ligne'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: 'white', fontSize: '0.8rem' }}
                >
                  {isMinimized ? '□' : '—'}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: 'white', fontSize: '0.8rem' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages */}
            {!isMinimized && (
              <>
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}>
                  {messages.map(msg => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        display: 'flex',
                        justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        alignItems: 'flex-end',
                        gap: 8,
                      }}
                    >
                      {msg.sender === 'ai' && (
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          flexShrink: 0,
                        }}>
                          🧑
                        </div>
                      )}
                      <div style={{
                        maxWidth: '75%',
                        padding: '10px 14px',
                        borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: msg.sender === 'user' ? 'var(--primary)' : 'var(--bg-secondary)',
                        color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                        fontSize: '0.85rem',
                        lineHeight: 1.5,
                      }}>
                        <div dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
                      </div>
                    </motion.div>
                  ))}

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.9rem', flexShrink: 0,
                      }}>
                        🧑
                      </div>
                      <div style={{
                        padding: '10px 14px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '16px 16px 16px 4px',
                        display: 'flex', gap: 4,
                      }}>
                        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} style={{ fontSize: '0.8rem' }}>●</motion.span>
                        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} style={{ fontSize: '0.8rem' }}>●</motion.span>
                        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} style={{ fontSize: '0.8rem' }}>●</motion.span>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Suggestions */}
                {suggestions.length > 0 && messages.length < 4 && (
                  <div style={{
                    padding: '0 16px 10px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                  }}>
                    {suggestions.map((s, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSend(s)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 16,
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        {s}
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="chatbot-input" style={{
                  padding: '12px 16px',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  gap: 8,
                }}>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Posez votre question à Karim..."
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isTyping}
                    style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: input.trim() ? 'var(--primary)' : 'var(--bg-tertiary)',
                      color: input.trim() ? 'white' : 'var(--text-muted)',
                      border: 'none',
                      cursor: input.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem',
                    }}
                  >
                    ➤
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbot;
