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

// Initialiser Firebase Auth
const auth = getAuth(app);

// ============================================
// 👤 Interface Utilisateur
// ============================================
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
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
      photoURL: firebaseUser.photoURL,
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
    await signOut(auth);
    localStorage.removeItem('tradelink_current_user');
    localStorage.removeItem('tradelink_access');
    localStorage.removeItem('tradelink_demo');
    console.log('✅ Déconnexion réussie');
  } catch (error: any) {
    console.error('❌ Erreur déconnexion:', error.message);
    throw error;
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
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
        photoURL: firebaseUser.photoURL,
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
      photoURL: firebaseUser.photoURL,
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
