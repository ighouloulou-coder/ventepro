// ============================================
// 🔐 Firebase Authentication Service
// ============================================
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';
import app from './firebase';
import { stopRealtimeSync } from './firebaseSync';

// Initialiser Firebase Auth
const auth = getAuth(app);

// ============================================
// 👤 Interface Utilisateur
// ============================================
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null | undefined;
  role: 'admin' | 'user' | 'viewer';
  createdAt: string;
}

// ============================================
// 🔑 Connexion avec Email/Password
// ============================================
export async function loginWithEmail(email: string, password: string): Promise<User> {
  try {
    // Persister la session dans le navigateur
    await setPersistence(auth, browserLocalPersistence);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Créer l'objet utilisateur
    const user: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || email.split('@')[0],
      photoURL: firebaseUser.photoURL ?? null,
      role: 'user', // Par défaut, on pourra mapper depuis Firestore
      createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
    };
    
    // Sauvegarder dans localStorage pour la session
    localStorage.setItem('tradelink_current_user', JSON.stringify(user));
    localStorage.setItem('tradelink_access', 'granted');
    
    console.log('✅ Connexion réussie:', user.email);
    return user;
  } catch (error: any) {
    console.error('❌ Erreur connexion:', error.message);
    throw error;
  }
}

// ============================================
// 📝 Inscription
// ============================================
export async function registerWithEmail(
  email: string, 
  password: string, 
  displayName: string
): Promise<User> {
  try {
    await setPersistence(auth, browserLocalPersistence);
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Mettre à jour le profil
    await updateProfile(firebaseUser, { displayName });
    
    const user: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: displayName,
      photoURL: null,
      role: 'user',
      createdAt: new Date().toISOString(),
    };
    
    localStorage.setItem('tradelink_current_user', JSON.stringify(user));
    localStorage.setItem('tradelink_access', 'granted');
    
    console.log('✅ Inscription réussie:', user.email);
    return user;
  } catch (error: any) {
    console.error('❌ Erreur inscription:', error.message);
    throw error;
  }
}

// ============================================
// 🚪 Déconnexion
// ============================================
export async function logout(): Promise<void> {
  try {
    // ⏹️ Stoppe listeners + polling Firestore AVANT la révocation de la session
    try { stopRealtimeSync(); } catch { /* noop */ }
    await signOut(auth);
    console.log('✅ Déconnexion Firebase réussie');
  } catch (error: any) {
    // On n'échoue jamais : même si Firebase refuse, on nettoie et on sort
    console.error('❌ Erreur déconnexion Firebase (nettoyage local quand même):', error.message);
  } finally {
    // Garde-fou : empêche toute reconnexion auto (restauration de session,
    // listener onAuthStateChanged) de renvoyer vers l'app après le logout
    sessionStorage.setItem('tradelink_logged_out', '1');
    localStorage.removeItem('tradelink_current_user');
    localStorage.removeItem('tradelink_access');
    localStorage.removeItem('tradelink_access_time');
    localStorage.removeItem('tradelink_demo');
    console.log('✅ Déconnexion réussie');
  }
}

// ============================================
// 👁️ Observer l'état d'authentification
// ============================================
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const user: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || null,
        photoURL: firebaseUser.photoURL || null,
        role: 'user',
        createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
      };
      callback(user);
    } else {
      callback(null);
    }
  });
}

// ============================================
// 🔑 Réinitialisation mot de passe
// ============================================
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('✅ Email de réinitialisation envoyé');
  } catch (error: any) {
    console.error('❌ Erreur réinitialisation:', error.message);
    throw error;
  }
}

// ============================================
// 👤 Mettre à jour le profil
// ============================================
export async function updateUserProfile(updates: { 
  displayName?: string; 
  photoURL?: string 
}): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');
    
    await updateProfile(user, updates);
    
    // Mettre à jour le localStorage
    const savedUser = localStorage.getItem('tradelink_current_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      Object.assign(parsed, updates);
      localStorage.setItem('tradelink_current_user', JSON.stringify(parsed));
    }
    
    console.log('✅ Profil mis à jour');
  } catch (error: any) {
    console.error('❌ Erreur mise à jour profil:', error.message);
    throw error;
  }
}

// ============================================
// 📧 Connexion avec Google (optionnel)
// ============================================
export async function loginWithGoogle(): Promise<User> {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;
    
    const user: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL || null,
      role: 'user',
      createdAt: new Date().toISOString(),
    };
    
    localStorage.setItem('tradelink_current_user', JSON.stringify(user));
    localStorage.setItem('tradelink_access', 'granted');
    
    console.log('✅ Connexion Google réussie:', user.email);
    return user;
  } catch (error: any) {
    console.error('❌ Erreur connexion Google:', error.message);
    throw error;
  }
}

// ============================================
// 🔍 Vérifier si connecté
// ============================================
export function isAuthenticated(): boolean {
  return !!auth.currentUser || localStorage.getItem('tradelink_access') === 'granted';
}

// ============================================
// 👤 Obtenir l'utilisateur actuel
// ============================================
export function getCurrentUser(): User | null {
  const saved = localStorage.getItem('tradelink_current_user');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
}

export { auth };
export default auth;

// ============================================
// 🔑 Correspondance comptes locaux → Firebase
// (créés une fois via scripts/create-firebase-users.mjs).
// Le mot de passe Firebase = mot de passe local + suffixe
// (Firebase exige ≥ 6 caractères).
// Note : les e-mails ne sont pas des secrets. En revanche,
// AUCUN mot de passe ne doit jamais être écrit en dur ici.
// ============================================
export const FIREBASE_EMAILS: Record<string, string> = {
  ismail: 'ighouloulou@gmail.com',
  houssam: 'houssam@tradelink.app',
};
export const FIREBASE_PWD_SUFFIX = 'TL!26';
