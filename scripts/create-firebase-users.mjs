// Créer les comptes Firebase Auth correspondant aux utilisateurs locaux
// Usage : node scripts/create-firebase-users.mjs
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDV6LdXrfQxZGv8KiDVTv7mbr1fz_VmUC0',
  authDomain: 'ventepro-714f5.firebaseapp.com',
  projectId: 'ventepro-714f5',
};

const USERS = [
  { email: 'ismail@tradelink.app', password: '2024TL!26' },
  { email: 'houssam@tradelink.app', password: '2026TL!26' },
];

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

(async () => {
  for (const u of USERS) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, u.email, u.password);
      console.log(`✅ Compte créé : ${u.username} → ${u.email} (uid=${cred.user.uid})`);
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        console.log(`ℹ️  ${u.email} existe déjà — ok`);
      } else {
        console.error(`❌ ${u.email} : ${e.code || e.message}`);
        process.exitCode = 1;
      }
    }
  }
})();
