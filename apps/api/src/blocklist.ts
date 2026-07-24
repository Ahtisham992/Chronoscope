export const BLOCKLIST_DOMAINS = [
  'pornhub.com',
  'xvideos.com',
  'xnxx.com',
  'malware.com',
  'bad-domain.example'
];

export const BLOCKLIST_TERMS = [
  'porn',
  'xxx',
  'sex',
  'malware',
  'hack'
];

export function isBlocked(domain: string): boolean {
  const lowerDomain = domain.toLowerCase();
  
  // Exact domain match
  if (BLOCKLIST_DOMAINS.includes(lowerDomain)) {
    return true;
  }
  
  // Term match
  for (const term of BLOCKLIST_TERMS) {
    if (lowerDomain.includes(term)) {
      return true;
    }
  }
  
  return false;
}
