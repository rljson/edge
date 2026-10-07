// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// The drawing kit of the use case images: colors, text and hand-drawn
// icons. Every color is a CSS variable, so one SVG has a light and a dark
// mode.

// .............................................................................
/** The colors of the light mode */
const light: Record<string, string> = {
  bg: '#f8fafc',
  card: '#ffffff',
  ink: '#1e293b',
  muted: '#64748b',
  line: '#cbd5e1',
  blue: '#2563eb',
  'blue-soft': '#dbeafe',
  orange: '#ea580c',
  'orange-soft': '#ffedd5',
  green: '#16a34a',
  'green-soft': '#dcfce7',
  purple: '#7c3aed',
  'purple-soft': '#ede9fe',
  steel: '#94a3b8',
  glass: '#bae6fd',
  tire: '#334155',
};

/** The colors of the dark mode */
const dark: Record<string, string> = {
  bg: '#0f172a',
  card: '#1e293b',
  ink: '#e2e8f0',
  muted: '#94a3b8',
  line: '#475569',
  blue: '#60a5fa',
  'blue-soft': '#1e3a8a',
  orange: '#fb923c',
  'orange-soft': '#7c2d12',
  green: '#4ade80',
  'green-soft': '#14532d',
  purple: '#a78bfa',
  'purple-soft': '#4c1d95',
  steel: '#64748b',
  glass: '#0c4a6e',
  tire: '#020617',
};

/**
 * Writes colors as CSS variables.
 * @param colors - The colors
 */
const vars = (colors: Record<string, string>) =>
  Object.entries(colors)
    .map(([name, value]) => `--uc-${name}:${value}`)
    .join(';');

/** The colors that have a fill and a stroke class */
const colorNames = Object.keys(light);

/**
 * The style sheet of an image. The site replaces the media query by its
 * theme switch, see scripts/sync-usecase.js of rljson.github.io.
 */
const style = (): string =>
  [
    `svg.uc{${vars(light)}}`,
    `@media (prefers-color-scheme: dark){svg.uc{${vars(dark)}}}`,
    ...colorNames.map((c) => `svg.uc .uc-f-${c}{fill:var(--uc-${c})}`),
    ...colorNames.map((c) => `svg.uc .uc-s-${c}{stroke:var(--uc-${c})}`),
    'svg.uc text{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;fill:var(--uc-ink)}',
    'svg.uc .uc-h{font-size:22px;font-weight:700}',
    'svg.uc .uc-b{font-size:15px;font-weight:600}',
    'svg.uc .uc-t{font-size:14px}',
    'svg.uc .uc-s{font-size:12px;fill:var(--uc-muted)}',
    'svg.uc .uc-xs{font-size:11px;fill:var(--uc-muted)}',
    'svg.uc .uc-line{fill:none;stroke:var(--uc-line);stroke-width:2}',
    'svg.uc .uc-thin{stroke-width:1.5}',
    'svg.uc .uc-dash{stroke-dasharray:5 4}',
    'svg.uc .uc-card{fill:var(--uc-card);stroke:var(--uc-line);stroke-width:1.5}',
  ].join('\n');

// .............................................................................
/**
 * Escapes text for SVG.
 * @param text - The text
 */
export const esc = (text: string | number): string =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Formats a number with thousands separators.
 * @param n - The number
 */
export const num = (n: number): string => n.toLocaleString('en-US');

/**
 * Wraps the body of an image into an SVG document.
 * @param name - The file name without extension, also the id prefix
 * @param title - The title, read by screen readers
 * @param desc - A sentence that describes the image
 * @param width - The width
 * @param height - The height
 * @param body - The drawing
 */
export const svg = (
  name: string,
  title: string,
  desc: string,
  width: number,
  height: number,
  body: string,
): string =>
  [
    `<svg xmlns="http://www.w3.org/2000/svg" class="uc uc-${name}" ` +
      `viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" ` +
      `role="img" aria-labelledby="${name}-title ${name}-desc">`,
    `<title id="${name}-title">${esc(title)}</title>`,
    `<desc id="${name}-desc">${esc(desc)}</desc>`,
    `<style>\n${style()}\n</style>`,
    `<defs><marker id="${name}-arrow" viewBox="0 0 10 10" refX="9" refY="5" ` +
      `markerWidth="7" markerHeight="7" orient="auto-start-reverse">` +
      `<path d="M0 0 L10 5 L0 10 z" class="uc-f-muted"/></marker></defs>`,
    `<rect width="${width}" height="${height}" rx="16" class="uc-f-bg"/>`,
    body,
    '</svg>',
    '',
  ].join('\n');

// .............................................................................
/**
 * Writes a text.
 * @param x - The x position
 * @param y - The baseline
 * @param text - The text
 * @param cls - The text class: uc-h, uc-b, uc-t, uc-s or uc-xs
 * @param anchor - The text anchor
 */
export const text = (
  x: number,
  y: number,
  text: string | number,
  cls = 'uc-t',
  anchor: 'start' | 'middle' | 'end' = 'start',
): string =>
  `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(text)}</text>`;

/**
 * Draws a card: a rounded box.
 * @param x - The left edge
 * @param y - The top edge
 * @param w - The width
 * @param h - The height
 * @param accent - A color name that tints the card, or undefined
 */
export const card = (
  x: number,
  y: number,
  w: number,
  h: number,
  accent?: string,
): string =>
  accent
    ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" class="uc-f-${accent}-soft uc-s-${accent}" stroke-width="1.5"/>`
    : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" class="uc-card"/>`;

/**
 * Draws an arrow along a path.
 * @param name - The image name, for the marker id
 * @param d - The path
 * @param dashed - Whether the arrow is dashed
 */
export const arrow = (name: string, d: string, dashed = false): string =>
  `<path d="${d}" class="uc-line${dashed ? ' uc-dash' : ''}" marker-end="url(#${name}-arrow)"/>`;

/**
 * Draws a connecting line without arrow head.
 * @param d - The path
 */
export const line = (d: string): string =>
  `<path d="${d}" class="uc-line uc-thin"/>`;

/**
 * Draws a small chip with a label.
 * @param x - The left edge
 * @param y - The top edge
 * @param label - The label
 * @param color - The color name
 */
export const chip = (x: number, y: number, label: string, color: string) => {
  const w = label.length * 7 + 16;
  return {
    w,
    svg:
      `<rect x="${x}" y="${y}" width="${w}" height="20" rx="10" class="uc-f-${color}-soft"/>` +
      text(x + w / 2, y + 14, label, 'uc-xs', 'middle'),
  };
};

// .............................................................................
// Icons. Each icon is drawn around (x, y) and scaled by s.

/**
 * Wraps an icon into a group that moves and scales it.
 * @param x - The x position
 * @param y - The y position
 * @param s - The scale
 * @param body - The drawing at the origin
 */
const at = (x: number, y: number, s: number, body: string) =>
  `<g transform="translate(${x} ${y}) scale(${s})">${body}</g>`;

/**
 * A car seen from the side, 120 wide and 50 high, centered on (x, y).
 * @param x - The center
 * @param y - The center
 * @param s - The scale
 * @param color - The body color
 */
export const carIcon = (x: number, y: number, s = 1, color = 'blue') =>
  at(
    x,
    y,
    s,
    `<path d="M-58 12 L-58 -2 Q-56 -10 -44 -12 L-28 -14 L-12 -28 Q-6 -32 4 -32 L26 -32 Q34 -32 40 -26 L52 -13 Q60 -11 60 -2 L60 12 Z" class="uc-f-${color}"/>` +
      `<path d="M-22 -14 L-10 -26 Q-6 -28 -2 -28 L10 -28 L10 -14 Z" class="uc-f-glass"/>` +
      `<path d="M14 -28 L26 -28 Q32 -28 36 -24 L46 -14 L14 -14 Z" class="uc-f-glass"/>` +
      `<circle cx="-34" cy="12" r="12" class="uc-f-tire"/><circle cx="-34" cy="12" r="5" class="uc-f-steel"/>` +
      `<circle cx="36" cy="12" r="12" class="uc-f-tire"/><circle cx="36" cy="12" r="5" class="uc-f-steel"/>`,
  );

/**
 * A factory with a saw-tooth roof and a chimney, about 100 by 80.
 * @param x - The center
 * @param y - The center
 * @param s - The scale
 */
export const factoryIcon = (x: number, y: number, s = 1) =>
  at(
    x,
    y,
    s,
    `<rect x="26" y="-46" width="12" height="40" class="uc-f-steel"/>` +
      `<path d="M-50 40 L-50 -10 L-25 -26 L-25 -10 L0 -26 L0 -10 L25 -26 L25 -10 L50 -10 L50 40 Z" class="uc-f-blue"/>` +
      [-38, -14, 10, 32]
        .map(
          (wx) =>
            `<rect x="${wx}" y="2" width="12" height="12" rx="2" class="uc-f-glass"/>`,
        )
        .join('') +
      `<rect x="-8" y="20" width="16" height="20" class="uc-f-blue-soft"/>`,
  );

/**
 * A catalog: a closed book with a year on its cover, about 70 by 90.
 * @param x - The center
 * @param y - The center
 * @param year - The year on the cover
 * @param color - The cover color
 */
export const bookIcon = (
  x: number,
  y: number,
  year: number,
  color = 'orange',
) =>
  at(
    x,
    y,
    1,
    `<rect x="-30" y="-42" width="64" height="86" rx="4" class="uc-f-line"/>` +
      `<rect x="-34" y="-45" width="64" height="86" rx="4" class="uc-f-${color}"/>` +
      `<rect x="-34" y="-45" width="8" height="86" rx="2" class="uc-f-${color}-soft" opacity="0.5"/>` +
      `<rect x="-20" y="-28" width="40" height="22" rx="3" class="uc-f-card"/>` +
      `<text x="0" y="-12" class="uc-b" text-anchor="middle">${year}</text>` +
      `<text x="0" y="22" class="uc-xs" text-anchor="middle" style="fill:var(--uc-card)">CATALOG</text>`,
  );

/**
 * A price tag with a hole, 44 high and as wide as its label.
 * @param x - The center
 * @param y - The center
 * @param label - The price
 */
export const tagIcon = (x: number, y: number, label: string) => {
  const half = Math.max(46, label.length * 4.6 + 14);
  return at(
    x,
    y,
    1,
    `<path d="M${-half} -20 L${half - 18} -20 L${half} 0 L${half - 18} 20 L${-half} 20 Z" class="uc-f-green-soft uc-s-green" stroke-width="2"/>` +
      `<circle cx="${half - 14}" cy="0" r="4" class="uc-f-bg uc-s-green" stroke-width="2"/>` +
      `<text x="-8" y="5" class="uc-b" text-anchor="middle">${esc(label)}</text>`,
  );
};

/**
 * A workshop: a garage with a roll-up door and a wrench, about 90 by 70.
 * @param x - The center
 * @param y - The center
 * @param s - The scale
 */
export const garageIcon = (x: number, y: number, s = 1) =>
  at(
    x,
    y,
    s,
    `<path d="M-44 34 L-44 -12 L0 -36 L44 -12 L44 34 Z" class="uc-f-purple"/>` +
      `<rect x="-28" y="-2" width="56" height="36" class="uc-f-purple-soft"/>` +
      [6, 14, 22, 30]
        .map(
          (dy) =>
            `<line x1="-28" y1="${dy - 4}" x2="28" y2="${dy - 4}" class="uc-s-purple" stroke-width="2"/>`,
        )
        .join('') +
      `<g transform="translate(0 -18) rotate(-35)"><rect x="-2.5" y="-8" width="5" height="16" class="uc-f-card"/>` +
      `<circle cx="0" cy="-10" r="5" class="uc-f-card"/><rect x="-1.5" y="-16" width="3" height="6" class="uc-f-purple"/></g>`,
  );

/**
 * A person: head and shoulders, about 30 by 34.
 * @param x - The center
 * @param y - The center
 * @param s - The scale
 */
export const personIcon = (x: number, y: number, s = 1) =>
  at(
    x,
    y,
    s,
    `<circle cx="0" cy="-8" r="8" class="uc-f-purple"/>` +
      `<path d="M-14 16 Q-14 2 0 2 Q14 2 14 16 Z" class="uc-f-purple"/>`,
  );

/**
 * A gear, radius about 22.
 * @param x - The center
 * @param y - The center
 * @param s - The scale
 * @param color - The color
 */
export const gearIcon = (x: number, y: number, s = 1, color = 'orange') => {
  const teeth = Array.from(
    { length: 8 },
    (_, i) =>
      `<rect x="-5" y="-24" width="10" height="10" rx="2" class="uc-f-${color}" transform="rotate(${i * 45})"/>`,
  ).join('');
  return at(
    x,
    y,
    s,
    teeth +
      `<circle r="17" class="uc-f-${color}"/><circle r="7" class="uc-f-bg"/>`,
  );
};

/**
 * A screw: hex head and threaded shaft, about 20 by 50.
 * @param x - The center
 * @param y - The center
 * @param s - The scale
 */
export const screwIcon = (x: number, y: number, s = 1) =>
  at(
    x,
    y,
    s,
    `<path d="M-12 -24 L12 -24 L14 -18 L12 -12 L-12 -12 L-14 -18 Z" class="uc-f-steel"/>` +
      `<rect x="-5" y="-12" width="10" height="34" class="uc-f-steel"/>` +
      [-8, -2, 4, 10, 16]
        .map(
          (dy) =>
            `<line x1="-6" y1="${dy}" x2="6" y2="${dy + 4}" class="uc-s-tire" stroke-width="1.5"/>`,
        )
        .join('') +
      `<path d="M-5 22 L0 28 L5 22 Z" class="uc-f-steel"/>`,
  );

/**
 * An assembly: a box with a lid, about 40 by 36.
 * @param x - The center
 * @param y - The center
 * @param s - The scale
 * @param color - The color
 */
export const boxIcon = (x: number, y: number, s = 1, color = 'orange') =>
  at(
    x,
    y,
    s,
    `<path d="M-20 -8 L0 -18 L20 -8 L0 2 Z" class="uc-f-${color}-soft uc-s-${color}" stroke-width="2"/>` +
      `<path d="M-20 -8 L0 2 L0 22 L-20 12 Z" class="uc-f-${color}"/>` +
      `<path d="M20 -8 L0 2 L0 22 L20 12 Z" class="uc-f-${color}" opacity="0.7"/>`,
  );

/**
 * A valve: a stem with a disc, about 20 by 46.
 * @param x - The center
 * @param y - The center
 * @param s - The scale
 */
export const valveIcon = (x: number, y: number, s = 1) =>
  at(
    x,
    y,
    s,
    `<rect x="-3" y="-24" width="6" height="36" class="uc-f-steel"/>` +
      `<path d="M-3 10 L-14 20 L14 20 L3 10 Z" class="uc-f-steel"/>` +
      `<rect x="-5" y="-24" width="10" height="5" class="uc-f-tire"/>`,
  );

/**
 * A 3D cube in wire frame, about 44 wide.
 * @param x - The center
 * @param y - The center
 * @param s - The scale
 */
export const cubeIcon = (x: number, y: number, s = 1) =>
  at(
    x,
    y,
    s,
    `<path d="M-20 -10 L0 -20 L20 -10 L20 12 L0 22 L-20 12 Z" class="uc-f-blue-soft uc-s-blue" stroke-width="2"/>` +
      `<path d="M-20 -10 L0 0 L20 -10 M0 0 L0 22" fill="none" class="uc-s-blue" stroke-width="2"/>`,
  );

/**
 * A folder, about 40 by 30.
 * @param x - The center
 * @param y - The center
 * @param s - The scale
 */
export const folderIcon = (x: number, y: number, s = 1) =>
  at(
    x,
    y,
    s,
    `<path d="M-20 -12 L-6 -12 L-2 -7 L20 -7 L20 14 L-20 14 Z" class="uc-f-orange"/>` +
      `<rect x="-20" y="-3" width="40" height="17" rx="1" class="uc-f-orange-soft"/>`,
  );

/**
 * A car key: a round head and a toothed blade, about 50 by 20. A neutral
 * symbol for brand and model, no logo of a real brand.
 * @param x - The center
 * @param y - The center
 */
export const keyIcon = (x: number, y: number) =>
  at(
    x,
    y,
    1,
    `<circle cx="-14" cy="0" r="12" class="uc-f-blue-soft uc-s-blue" stroke-width="2.5"/>` +
      `<circle cx="-14" cy="0" r="4" class="uc-f-blue"/>` +
      `<path d="M-2 -4 L24 -4 L24 0 L20 0 L20 4 L14 4 L14 0 L10 0 L10 4 L-2 4 Z" class="uc-f-blue"/>`,
  );
