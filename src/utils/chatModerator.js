// AI Automated Chat Content Moderation Guard
// Evaluates messages for slurs, hate speech, severe harassment, profanity, and spam.

const BAD_WORDS_REGEX = /\b(nigg|fagg|retard|chink|kike|spic|tranny|cunt|dickhead|bitch|whore|slut|motherfucker|pussy|cock)\b/i;
const HARASSMENT_TERMS = /\b(kill yourself|kys|die in a fire|hope you die|go die|i will find you|doxx|threat|bomb)\b/i;
const SPAM_PATTERNS = /(.)\1{9,}|(http[s]?:\/\/|\b[a-z0-9]+\.[a-z]{2,}\b)/i;

/**
 * AI Moderation Evaluator
 * Checks message text against safety criteria
 */
export const evaluateMessageSafety = (text, userEmail = '') => {
  if (!text || typeof text !== 'string') {
    return { allowed: false, reason: 'Message cannot be empty.' };
  }

  const cleanText = text.trim();
  if (cleanText.length === 0) {
    return { allowed: false, reason: 'Message cannot be empty.' };
  }

  if (cleanText.length > 500) {
    return { allowed: false, reason: 'Message exceeds maximum length (500 characters).' };
  }

  // 1. Check for Severe Slurs or Hate Speech
  if (BAD_WORDS_REGEX.test(cleanText)) {
    return {
      allowed: false,
      reason: 'AI MODERATION: Message blocked due to offensive language or slurs.',
      category: 'SLUR_OR_HATE_SPEECH',
      severity: 'high',
    };
  }

  // 2. Check for Harassment or Threats
  if (HARASSMENT_TERMS.test(cleanText)) {
    return {
      allowed: false,
      reason: 'AI MODERATION: Message blocked due to harassment or threatening content.',
      category: 'HARASSMENT_OR_THREAT',
      severity: 'critical',
    };
  }

  // 3. Check for Excessive Spam or Malicious Links
  if (SPAM_PATTERNS.test(cleanText)) {
    return {
      allowed: false,
      reason: 'AI MODERATION: Links and repeated spam characters are disabled in Live Chat.',
      category: 'SPAM_OR_LINK',
      severity: 'medium',
    };
  }

  // All safety checks passed
  return {
    allowed: true,
    sanitizedText: cleanText,
  };
};

/**
 * Format relative time for chat messages (e.g. "Just now", "2m ago", "1h ago")
 */
export const formatChatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
