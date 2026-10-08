import fs from 'fs';
import path from 'path';
import { render, screen } from '@/test-utils';
import config from '@/config';
import { DiscordCallToAction } from './DiscordCallToAction';

describe('DiscordCallToAction', () => {
  it('names the server in a heading and links to the invite in a new tab', () => {
    render(<DiscordCallToAction />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Join the community on Discord'
    );
    const link = screen.getByRole('link', { name: /join the discord/i });
    expect(link).toHaveAttribute('href', config.community.discord);
    expect(link).toHaveAttribute('target', '_blank');
  });
});

/**
 * The invite is read from config everywhere but `content/faq.mdx`, where a
 * plain markdown link is what gets the docs' link style. A new invite has to
 * reach that page too.
 */
describe('The Discord invite', () => {
  it('is the same in the FAQ page as in config', () => {
    const mdx = fs.readFileSync(path.join(__dirname, '../../content/faq.mdx'), 'utf8');
    const invites = mdx.match(/https:\/\/(?:discord\.gg|discord\.com\/invite)\/[\w-]+/g) ?? [];
    expect(invites.length).toBeGreaterThan(0);
    expect(new Set(invites)).toEqual(new Set([config.community.discord]));
  });
});
