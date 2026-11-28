import { transformerMetaHighlight } from '@shikijs/transformers';
import { bundledLanguages, createHighlighter, type BundledLanguage, type Highlighter } from 'shiki';

/**
 * Build-time syntax highlighting with Shiki, for Mantine's `CodeHighlight`.
 *
 * Every docs page is prerendered, so this runs once per code block during `next build` and the
 * browser downloads no highlighter at all. (Next.js keeps `shiki` out of the server bundle by
 * default and loads it with Node, so its WASM engine works as is.)
 *
 * The output carries both themes at once (`--shiki-light` / `--shiki-dark` on every token) and
 * `components/docs/CodeBlock.module.css` picks one from Mantine's `data-mantine-color-scheme`,
 * which `ColorSchemeScript` sets before the first paint: dark-mode readers never see the light
 * colours flash.
 */

const THEMES = { light: 'github-light-default', dark: 'github-dark-default' } as const;

const ALIASES: Record<string, BundledLanguage> = {
  js: 'javascript',
  ts: 'typescript',
  sh: 'shellscript',
  shell: 'shellscript',
  bash: 'shellscript',
  zsh: 'shellscript',
  md: 'markdown',
  yml: 'yaml',
};

let highlighter: Promise<Highlighter> | undefined;

function getHighlighter() {
  highlighter ??= createHighlighter({ themes: [THEMES.light, THEMES.dark], langs: [] });
  return highlighter;
}

/**
 * Shiki's special `ansi` language colours a terminal's escape sequences (a command's own output,
 * a log): it is not in `bundledLanguages`, and without it the block shows the raw `ESC[38;5;76m`
 * characters, which Nextra's code blocks coloured.
 */
const ANSI = 'ansi';

function resolveLanguage(language: string | undefined): BundledLanguage | typeof ANSI | undefined {
  if (!language) {
    return undefined;
  }
  const name = language.toLowerCase();
  if (name === ANSI) {
    return ANSI;
  }
  if (name in ALIASES) {
    return ALIASES[name];
  }
  return name in bundledLanguages ? (name as BundledLanguage) : undefined;
}

/** The code as `CodeHighlight` shows it: no leading blank lines, no trailing whitespace. */
export function normalizeCode(code: string): string {
  return code.replace(/^\s*\n/, '').trimEnd();
}

/**
 * The inner HTML of the `<code>` element for this code, or `null` for a language Shiki does not
 * know (the block then renders as plain text). `meta` is the fence meta: `{4}` or `{2,5-7}`
 * highlights those lines.
 */
export async function highlightCode(
  code: string,
  language: string | undefined,
  meta?: string
): Promise<string | null> {
  const lang = resolveLanguage(language);
  if (!lang) {
    return null;
  }

  const shiki = await getHighlighter();
  if (lang !== ANSI && !shiki.getLoadedLanguages().includes(lang)) {
    await shiki.loadLanguage(lang);
  }

  const html = shiki.codeToHtml(code, {
    lang,
    themes: THEMES,
    defaultColor: false,
    meta: { __raw: meta },
    transformers: [transformerMetaHighlight()],
  });

  // Keep what is inside <code>…</code>: CodeHighlight renders its own <pre> and <code>.
  const inner = html.match(/<code[^>]*>([\s\S]*)<\/code>/);
  return inner ? inner[1] : null;
}
