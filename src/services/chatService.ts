// Chat Service - Firebase Sync
import { COLLECTIONS } from './firebase';
import { syncToFirestore, loadCollection, getFromStorage, saveToStorage } from './firebaseSync';

export interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

const CHAT_KEY = 'tradelink_chat_messages';

export async function loadMessages(): Promise<Message[]> {
  const fbMsgs = await loadCollection<Message>(COLLECTIONS.CHAT);
  if (fbMsgs.length > 0) {
    saveToStorage(CHAT_KEY, fbMsgs.sort((a, b) => a.timestamp.localeCompare(b.timestamp)));
    return fbMsgs;
  }
  return getFromStorage<Message>(CHAT_KEY);
}

export function loadMessagesSync(): Message[] {
  return getFromStorage<Message>(CHAT_KEY);
}

export async function sendMessage(userId: string, userName: string, text: string): Promise<Message> {
  const msg: Message = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
    userId, userName, text: text.trim(),
    timestamp: new Date().toISOString(),
  };
  const msgs = [...getFromStorage<Message>(CHAT_KEY), msg].slice(-200);
  saveToStorage(CHAT_KEY, msgs);
  // Sync to Firebase in background
  syncToFirestore(COLLECTIONS.CHAT, msg as any, CHAT_KEY);
  return msg;
}

export function clearChatCache() {
  // Cache is managed by firebaseSync
}
