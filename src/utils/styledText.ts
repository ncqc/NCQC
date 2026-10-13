export interface TextStyle {
  text: string;
  font?: string;
  color?: string;
  bold?: boolean;
}

export const GOOGLE_FONTS_50 = [
  // Modern Sans-Serif
  { name: 'Inter', category: 'Sans-Serif' },
  { name: 'Poppins', category: 'Sans-Serif' },
  { name: 'Roboto', category: 'Sans-Serif' },
  { name: 'Montserrat', category: 'Sans-Serif' },
  { name: 'Open Sans', category: 'Sans-Serif' },
  { name: 'Lato', category: 'Sans-Serif' },
  { name: 'Plus Jakarta Sans', category: 'Sans-Serif' },
  { name: 'DM Sans', category: 'Sans-Serif' },
  { name: 'Work Sans', category: 'Sans-Serif' },
  { name: 'Raleway', category: 'Sans-Serif' },
  { name: 'Nunito', category: 'Sans-Serif' },
  { name: 'Nunito Sans', category: 'Sans-Serif' },
  { name: 'Rubik', category: 'Sans-Serif' },
  { name: 'Quicksand', category: 'Sans-Serif' },
  { name: 'Barlow', category: 'Sans-Serif' },
  { name: 'Mulish', category: 'Sans-Serif' },
  { name: 'Ubuntu', category: 'Sans-Serif' },
  { name: 'Space Grotesk', category: 'Sans-Serif' },
  { name: 'Syne', category: 'Sans-Serif' },
  { name: 'Fira Sans', category: 'Sans-Serif' },
  { name: 'Mukta', category: 'Sans-Serif' },

  // Display & Impact
  { name: 'Bebas Neue', category: 'Display' },
  { name: 'Oswald', category: 'Display' },
  { name: 'Anton', category: 'Display' },
  { name: 'Russo One', category: 'Display' },
  { name: 'Archivo Black', category: 'Display' },
  { name: 'Alfa Slab One', category: 'Display' },
  { name: 'Righteous', category: 'Display' },
  { name: 'Bungee', category: 'Display' },
  { name: 'Orbitron', category: 'Display' },
  { name: 'Audiowide', category: 'Display' },
  { name: 'Exo 2', category: 'Display' },
  { name: 'Press Start 2P', category: 'Display' },

  // Serif & Editorial
  { name: 'Playfair Display', category: 'Serif' },
  { name: 'Merriweather', category: 'Serif' },
  { name: 'Lora', category: 'Serif' },
  { name: 'PT Serif', category: 'Serif' },
  { name: 'Cinzel', category: 'Serif' },
  { name: 'Cormorant Garamond', category: 'Serif' },
  { name: 'Abril Fatface', category: 'Serif' },
  { name: 'Josefin Sans', category: 'Serif' },

  // Script & Handwriting
  { name: 'Dancing Script', category: 'Script' },
  { name: 'Pacifico', category: 'Script' },
  { name: 'Lobster', category: 'Script' },
  { name: 'Caveat', category: 'Script' },
  { name: 'Great Vibes', category: 'Script' },
  { name: 'Satisfy', category: 'Script' },
  { name: 'Kaushan Script', category: 'Script' },
  { name: 'Shadows Into Light', category: 'Script' },
  { name: 'Permanent Marker', category: 'Script' },
  { name: 'Comfortaa', category: 'Script' }
];

export const PRESET_COLORS = [
  { name: 'Default Dark', value: '#0f172a' },
  { name: 'Charcoal', value: '#334155' },
  { name: 'Nalanda Maroon', value: '#991b1b' },
  { name: 'Crimson Red', value: '#dc2626' },
  { name: 'Royal Gold', value: '#d97706' },
  { name: 'Emerald Green', value: '#059669' },
  { name: 'Deep Cyan', value: '#0891b2' },
  { name: 'Cobalt Blue', value: '#2563eb' },
  { name: 'Royal Purple', value: '#7c3aed' },
  { name: 'Hot Pink', value: '#db2777' },
  { name: 'Pure White', value: '#ffffff' }
];

/**
 * Parses a stored value into its raw text and styling attributes.
 */
export function parseStyledText(value: string | undefined | null): TextStyle {
  if (!value) return { text: '', font: '', color: '', bold: false };

  const str = String(value).trim();
  // Match span format: <span style="..." data-styled="true">text</span>
  const spanMatch = str.match(/^<span\s+style="([^"]*)"(?:\s+data-styled="true")?>([\s\S]*)<\/span>$/i);
  if (spanMatch) {
    const styleStr = spanMatch[1];
    const text = spanMatch[2];

    let font = '';
    let color = '';
    let bold = false;

    const fontMatch = styleStr.match(/font-family:\s*['"]?([^'";,]+)['"]?/i);
    if (fontMatch) font = fontMatch[1].trim();

    const colorMatch = styleStr.match(/(?:^|;)\s*color:\s*([^;]+)/i);
    if (colorMatch) color = colorMatch[1].trim();

    const weightMatch = styleStr.match(/font-weight:\s*([^;]+)/i);
    if (weightMatch) {
      const w = weightMatch[1].trim().toLowerCase();
      bold = w === 'bold' || w === '700' || w === '800' || w === '900';
    }

    return { text, font, color, bold };
  }

  return { text: str, font: '', color: '', bold: false };
}

/**
 * Formats raw text and styling attributes into a string for storage.
 */
export function formatStyledText(
  text: string,
  style: { font?: string; color?: string; bold?: boolean }
): string {
  const cleanText = (text || '').trim();
  if (!cleanText) return '';

  const hasFont = style.font && style.font !== 'inherit' && style.font !== '';
  const hasColor = style.color && style.color !== 'inherit' && style.color !== '';
  const hasBold = !!style.bold;

  if (!hasFont && !hasColor && !hasBold) {
    return cleanText;
  }

  const styles: string[] = [];
  if (hasFont) styles.push(`font-family: '${style.font}', sans-serif`);
  if (hasColor) styles.push(`color: ${style.color}`);
  if (hasBold) styles.push(`font-weight: bold`);

  return `<span style="${styles.join('; ')}" data-styled="true">${cleanText}</span>`;
}

/**
 * Strips any HTML tags to return pure plain text (used for alt attributes, page titles, URLs).
 */
export function stripStyledText(value: string | undefined | null): string {
  if (!value) return '';
  return String(value).replace(/<[^>]*>/g, '').trim();
}
