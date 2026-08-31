import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentUser } from '../services/userService';

interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

const CHAT_KEY = 'tradelink_chat_messages';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const user = getCurrentUser();

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = () => {
    try {
      const data = localStorage.getItem(CHAT_KEY);
      const msgs: Message[] = data ? JSON.parse(data) : [];
      setMessages(msgs);
      if (!isOpen) {
        const lastRead = localStorage.getItem('tradelink_chat_read') || '';
        const newMsgs = msgs.filter(m => m.timestamp > lastRead && m.userId !== user?.id);
        setUnread(newMsgs.length);
      }
    } catch {}
  };

  const sendMessage = () => {
    if (!input.trim() || !user) return;
    const msg: Message = {
      id: 'msg_' + Date.now(),
      userId: user.id,
      userName: user.displayName || user.username,
      text: input.trim(),
      timestamp: new Date().toISOString(),
    };
    const updated = [...messages, msg].slice(-100);
    localStorage.setItem(CHAT_KEY, JSON.stringify(updated));
    setMessages(updated);
    setInput('');
  };

  const openChat = () => {
    setIsOpen(true);
    setUnread(0);
    localStorage.setItem('tradelink_chat_read', new Date().toISOString());
  };

  return (
    <>
      <motion.button
        onClick={isOpen ? () => setIsOpen(false) : openChat}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 999,
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          color: 'white', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
        }}
      >
        {isOpen ? '✕' : '💬'}
        {unread > 0 && !isOpen && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            width: 20, height: 20, borderRadius: 10,
            background: '#dc2626', color: 'white',
            fontSize: '0.65rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{unread}</span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            style={{
              position: 'fixed', bottom: 88, right: 20, zIndex: 999,
              width: 340, height: 450, borderRadius: 18,
              background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            <div style={{
              padding: '14px 16px', borderBottom: '1px solid var(--border-color)',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              color: 'white', fontWeight: 700, fontSize: '0.9rem',
            }}>
              💬 Chat Equipe
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {messages.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 40 }}>
                  Aucun message. Commence la conversation !
                </p>
              )}
              {messages.map(m => (
                <div key={m.id} style={{
                  alignSelf: m.userId === user?.id ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                }}>
                  {m.userId !== user?.id && (
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 2, fontWeight: 600 }}>{m.userName}</p>
                  )}
                  <div style={{
                    padding: '8px 12px', borderRadius: 12,
                    background: m.userId === user?.id ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'var(--bg-tertiary)',
                    color: m.userId === user?.id ? 'white' : 'var(--text-primary)',
                    fontSize: '0.82rem', wordBreak: 'break-word',
                  }}>
                    {m.text}
                  </div>
                  <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: 2, textAlign: m.userId === user?.id ? 'right' : 'left' }}>
                    {new Date(m.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
              <div ref={messagesEnd} />
            </div>
            <div style={{ padding: 12, borderTop: '1px solid var(--border-color)', display: 'flex', gap: 8 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ecrire un message..."
                style={{
                  flex: 1, padding: '10px 14px', border: '2px solid var(--border-color)',
                  borderRadius: 10, fontSize: '0.82rem', background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)', outline: 'none',
                }}
              />
              <motion.button
                onClick={sendMessage}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '10px 14px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.82rem',
                }}
              >➤</motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chat;
