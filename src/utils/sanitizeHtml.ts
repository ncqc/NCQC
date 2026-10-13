/**
 * Formats rich text HTML for public pages:
 * 1. Replaces non-breaking spaces (&nbsp; and \u00a0) with regular whitespace
 *    so words wrap cleanly on mobile screens without splitting words in half.
 * 2. Cleans up excessive blank paragraphs that create huge awkward gaps on mobile screens.
 */
export function formatPublicHtml(html?: string): string {
  if (!html) return '';
  
  let formatted = html
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    // Ensure space after literal bullet if typed without space like •Name
    .replace(/•([^\s<])/g, '• $1')
    // Remove empty lists
    .replace(/<(ul|ol)[^>]*>\s*<li[^>]*>\s*<\/li>\s*<\/\1>/gi, '')
    // Collapse 2 or more consecutive empty paragraph tags into a single clean spacing
    .replace(/(<p[^>]*>\s*(<br\s*\/?>)?\s*<\/p>\s*){2,}/gi, '<p><br></p>')
    // Remove leading and trailing empty paragraphs
    .replace(/^(<p[^>]*>\s*(<br\s*\/?>)?\s*<\/p>\s*)+/gi, '')
    .replace(/(<p[^>]*>\s*(<br\s*\/?>)?\s*<\/p>\s*)+$/gi, '');

  return formatted;
}

