// Chat Service - Firebase Sync
import { db, saveDocument, loadCollection, COLLECTIONS } from './firebase';

export interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

let cachedMessages: Message[] | null = null;

async function getMessagesFirebase(): Promise<Message[]> {
  if (cachedMessages) return cachedMessages;
  try {
    const data = await loadCollection<Message>(COLLECTIONS.CHAT);
    cachedMessages = data.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    return cachedMessages;
  } catch { return []; }
}

function getMessagesLocal(): Message[] {
  try {
    const data = localStorage.getItem('tradelink_chat_messages');
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveMessagesLocal(msgs: Message[]) {
  localStorage.setItem('tradelink_chat_messages', JSON.stringify(msgs));
  cachedMessages = msgs;
}

export async function loadMessages(): Promise<Message[]> {
  const fbMsgs = await getMessagesFirebase();
  if (fbMsgs.length > 0) {
    saveMessagesLocal(fbMsgs);
    return fbMsgs;
  }
  return getMessagesLocal();
}

export function loadMessagesSync(): Message[] {
  return getMessagesLocal();
}

export async function sendMessage(userId: string, userName: string, text: string): Promise<Message> {
  const msg: Message = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
    userId, userName, text: text.trim(),
    timestamp: new Date().toISOString(),
  };
  const msgs = [...getMessagesLocal(), msg].slice(-200);
  saveMessagesLocal(msgs);
  // Sync to Firebase in background
  saveDocument(COLLECTIONS.CHAT, msg as any).catch(() => {});
  return msg;
}

export function clearChatCache() {
  cachedMessages = null;
}
