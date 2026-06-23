/**
 * Dynamically resolves a country name to its flag emoji using Intl.DisplayNames.
 * Builds a reverse lookup map (country name → ISO alpha-2 code) at module load time,
 * covering all ~264 UN-recognised territories — no static list to maintain.
 */

// Build reverse lookup: lowercase display name → ISO alpha-2 code
const nameToCode: Record<string, string> = (() => {
  try {
    const dn = new Intl.DisplayNames(['en'], { type: 'region' });
    const map: Record<string, string> = {};
    for (let i = 65; i <= 90; i++) {
      for (let j = 65; j <= 90; j++) {
        const code = String.fromCharCode(i) + String.fromCharCode(j);
        try {
          const name = dn.of(code);
          if (name && name !== code) map[name.toLowerCase()] = code;
        } catch {
          // invalid code — skip
        }
      }
    }
    return map;
  } catch {
    return {};
  }
})();

// Special-case overrides for common football names that don't match ISO display names
const OVERRIDES: Record<string, string> = {
  england: 'GB',
  'great britain': 'GB',
  'south korea': 'KR',
  korea: 'KR',
  'north korea': 'KP',
  'czech republic': 'CZ',
  czechia: 'CZ',
  türkiye: 'TR',
  turkey: 'TR',
  'ivory coast': 'CI',
  "côte d'ivoire": 'CI',
  'cape verde': 'CV',
  'cabo verde': 'CV',
  'dr congo': 'CD',
  'democratic republic of congo': 'CD',
  'republic of ireland': 'IE',
  palestine: 'PS',
  kosovo: 'XK',
  curacao: 'CW',
};

/**
 * Converts an ISO alpha-2 country code to a flag emoji using regional indicator symbols.
 * Works in all modern browsers and Node.js ≥ 13.
 */
const codeToFlag = (code: string): string =>
  [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(c.codePointAt(0)! - 65 + 0x1f1e6))
    .join('');

/**
 * Returns the flag emoji for a given country name.
 * Falls back to 🏳️ if no match is found.
 */
export const flagFor = (name: string): string => {
  if (!name) return '🏳️';
  const key = name.trim().toLowerCase();

  // 1. Exact override match
  const overrideCode = OVERRIDES[key];
  if (overrideCode) return codeToFlag(overrideCode);

  // 2. Exact Intl reverse lookup
  const exactCode = nameToCode[key];
  if (exactCode) return codeToFlag(exactCode);

  // 3. Partial match — name contains a known country name as substring
  for (const [countryName, code] of Object.entries(nameToCode)) {
    if (key.includes(countryName) || countryName.includes(key)) {
      return codeToFlag(code);
    }
  }

  // 4. Partial override match
  for (const [ovKey, code] of Object.entries(OVERRIDES)) {
    if (key.includes(ovKey) || ovKey.includes(key)) {
      return codeToFlag(code);
    }
  }

  return '🏳️';
};
