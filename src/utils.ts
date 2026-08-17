/**
 * Safe unique ID generator that works in all browser environments,
 * non-secure HTTP contexts, iframes, and Figma Make sandboxes.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch {
      // Fallback if crypto.randomUUID is restricted in the execution environment
    }
  }
  return 'id-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36)
}
