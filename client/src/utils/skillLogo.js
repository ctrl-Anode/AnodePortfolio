/**
 * Resolve a skill's logo image source.
 *
 * Priority:
 *  1. `logoUrl` - an uploaded image or any custom logo URL
 *  2. `icon`    - a Simple Icons slug (e.g. "python", "openai") rendered
 *                 through the free cdn.simpleicons.org service
 *  3. `icon` that is already a full URL is used verbatim
 */
export function skillLogoUrl(skill) {
  if (!skill) return '';
  if (skill.logoUrl) return skill.logoUrl;

  const icon = (skill.icon || '').trim();
  if (!icon) return '';
  if (/^https?:\/\//i.test(icon) || icon.startsWith('data:')) return icon;

  return `https://cdn.simpleicons.org/${encodeURIComponent(icon)}`;
}

/** True when the logo is a custom/uploaded image (kept in full colour, never themed). */
export function isCustomSkillLogo(skill) {
  if (!skill) return false;
  if (skill.logoUrl) return true;
  const icon = (skill.icon || '').trim();
  return /^https?:\/\//i.test(icon) || icon.startsWith('data:');
}
