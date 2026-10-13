import { describe, it, expect } from 'vitest';
import { isCustomSkillLogo, skillLogoUrl } from '../src/utils/skillLogo';

describe('skillLogoUrl', () => {
  it('prefers an uploaded/custom logoUrl', () => {
    expect(skillLogoUrl({ name: 'Python', logoUrl: 'https://cdn.example.com/py.png', icon: 'python' }))
      .toBe('https://cdn.example.com/py.png');
  });

  it('builds a Simple Icons CDN url from an icon slug', () => {
    expect(skillLogoUrl({ name: 'OpenAI', icon: 'openai' }))
      .toBe('https://cdn.simpleicons.org/openai');
  });

  it('accepts a full url in the icon field', () => {
    expect(skillLogoUrl({ name: 'Custom', icon: 'https://example.com/logo.svg' }))
      .toBe('https://example.com/logo.svg');
  });

  it('returns an empty string when no logo is configured', () => {
    expect(skillLogoUrl({ name: 'Communication' })).toBe('');
    expect(skillLogoUrl(null)).toBe('');
  });
});

describe('isCustomSkillLogo', () => {
  it('treats uploaded logos and full urls as custom (never themed)', () => {
    expect(isCustomSkillLogo({ logoUrl: 'https://x/y.png' })).toBe(true);
    expect(isCustomSkillLogo({ icon: 'https://example.com/logo.svg' })).toBe(true);
  });

  it('treats slugs as themed icons', () => {
    expect(isCustomSkillLogo({ icon: 'python' })).toBe(false);
    expect(isCustomSkillLogo({})).toBe(false);
  });
});
