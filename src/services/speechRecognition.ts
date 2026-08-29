/**
 * Service de reconnaissance vocale (Web Speech API)
 * Permet de dicter des commandes à VentePro
 */

export interface SpeechResult {
  transcript: string;
  confidence: number;
}

export type SpeechCallback = (result: SpeechResult) => void;
export type SpeechErrorCallback = (error: string) => void;

// Déclaration des types pour Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

/**
 * Vérifie si la reconnaissance vocale est supportée
 */
export const isSpeechRecognitionSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
};

/**
 * Créer une instance de reconnaissance vocale
 */
export const createSpeechRecognition = (
  onResult: SpeechCallback,
  onError: SpeechErrorCallback,
  onEnd?: () => void
): any | null => {
  if (!isSpeechRecognitionSupported()) {
    onError('La reconnaissance vocale n\'est pas supportée par ce navigateur');
    return null;
  }

  const SpeechRecognitionAPI =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const recognition = new SpeechRecognitionAPI();

  // Configuration
  recognition.lang = 'fr-FR'; // Français
  recognition.continuous = false; // Écoute unique
  recognition.interimResults = false; // Résultat final uniquement
  recognition.maxAlternatives = 1;

  // Événement : résultat
  recognition.onresult = (event: any) => {
    const result = event.results[0][0];
    onResult({
      transcript: result.transcript,
      confidence: result.confidence,
    });
  };

  // Événement : erreur
  recognition.onerror = (event: any) => {
    const errorMessages: Record<string, string> = {
      'no-speech': 'Aucune parole détectée. Réessayez.',
      'audio-capture': 'Microphone non disponible.',
      'not-allowed': 'Accès au microphone refusé.',
      'network': 'Erreur réseau.',
      'aborted': 'Écoute annulée.',
    };
    onError(errorMessages[event.error] || `Erreur: ${event.error}`);
  };

  // Événement : fin
  recognition.onend = () => {
    onEnd?.();
  };

  return recognition;
};

/**
 * Parser les commandes vocales en actions
 */
export type VoiceCommand = {
  action: string;
  params: Record<string, string>;
};

export const parseVoiceCommand = (transcript: string): VoiceCommand => {
  const lower = transcript.toLowerCase().trim();

  // Commandes pour les produits
  if (lower.includes('ajouter un produit') || lower.includes('nouveau produit')) {
    return { action: 'add_product', params: { name: extractProductName(lower) } };
  }
  if (lower.includes('voir les produits') || lower.includes('liste des produits')) {
    return { action: 'navigate', params: { page: 'products' } };
  }

  // Commandes pour les clients
  if (lower.includes('ajouter un client') || lower.includes('nouveau client')) {
    return { action: 'add_client', params: { name: extractClientName(lower) } };
  }
  if (lower.includes('voir les clients') || lower.includes('liste des clients')) {
    return { action: 'navigate', params: { page: 'clients' } };
  }

  // Commandes pour les factures
  if (lower.includes('nouvelle facture') || lower.includes('créer une facture')) {
    return { action: 'add_invoice', params: {} };
  }
  if (lower.includes('voir les factures') || lower.includes('liste des factures')) {
    return { action: 'navigate', params: { page: 'invoices' } };
  }

  // Commande dashboard
  if (lower.includes('tableau de bord') || lower.includes('dashboard') || lower.includes('accueil')) {
    return { action: 'navigate', params: { page: 'dashboard' } };
  }

  // Commande inconnue
  return { action: 'unknown', params: { transcript: lower } };
};

/**
 * Extraire le nom d'un produit depuis la commande vocale
 */
const extractProductName = (text: string): string => {
  const patterns = [
    /ajouter un produit (.+)/i,
    /nouveau produit (.+)/i,
    /produit (.+)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return '';
};

/**
 * Extraire le nom d'un client depuis la commande vocale
 */
const extractClientName = (text: string): string => {
  const patterns = [
    /ajouter un client (.+)/i,
    /nouveau client (.+)/i,
    /client (.+)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return '';
};
