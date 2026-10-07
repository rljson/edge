// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import type { UcCadNode, UcFacts, UcPart } from './usecase-facts.ts';
import {
  arrow,
  bookIcon,
  boxIcon,
  card,
  carIcon,
  chip,
  cubeIcon,
  factoryIcon,
  folderIcon,
  garageIcon,
  gearIcon,
  keyIcon,
  line,
  num,
  personIcon,
  screwIcon,
  svg,
  tagIcon,
  text,
  valveIcon,
} from './usecase-svg-kit.ts';

// .............................................................................
/**
 * Formats a price.
 * @param amount - The amount
 * @param currency - The currency
 */
const price = (amount: number, currency: string) =>
  `${num(amount)} ${currency}`;

/**
 * Turns an id like "subframe-front" into "Subframe front".
 * @param id - The id
 */
const label = (id: string) => {
  const words = id.replace(/-/g, ' ');
  return words[0].toUpperCase() + words.slice(1);
};

/**
 * Removes the brand from a model name.
 * @param f - The facts
 * @param model - The model, e.g. "Volkswagen Polo"
 */
const short = (f: UcFacts, model: string) =>
  model.replace(`${f.manufacturer.brand} `, '');

// .............................................................................
/**
 * The overview: manufacturer, catalog, cars, and what belongs to a car.
 * @param f - The facts
 */
const overview = (f: UcFacts): string => {
  const n = 'overview';
  const [first] = f.catalogs;
  const cars = first.cars;
  const car = f.car;
  const parts: string[] = [];

  parts.push(text(40, 48, 'The car world at a glance', 'uc-h'));

  // Manufacturer
  parts.push(card(40, 80, 200, 170));
  parts.push(factoryIcon(140, 140, 0.8));
  parts.push(text(140, 205, f.manufacturer.name, 'uc-b', 'middle'));
  parts.push(text(140, 225, 'Manufacturer', 'uc-s', 'middle'));
  parts.push(arrow(n, 'M244 165 L292 165'));

  // Catalogs
  parts.push(card(300, 80, 200, 170));
  f.catalogs.forEach((c, i) => parts.push(bookIcon(362 + i * 80, 140, c.year)));
  parts.push(text(400, 225, `${f.catalogs.length} catalogs`, 'uc-b', 'middle'));
  parts.push(text(400, 243, 'one per model year', 'uc-s', 'middle'));
  parts.push(arrow(n, 'M504 165 L552 165'));

  // Cars of the first catalog
  parts.push(card(560, 80, 360, 170));
  cars.forEach((c, i) => {
    const x = 610 + (i % 3) * 115;
    const y = 120 + Math.floor(i / 3) * 70;
    const isCar = c.id === car.id;
    parts.push(carIcon(x, y, 0.5, isCar ? 'orange' : 'blue'));
    parts.push(
      text(x, y + 30, short(f, c.model), isCar ? 'uc-b' : 'uc-s', 'middle'),
    );
  });
  parts.push(text(840, 205, `${cars.length} cars`, 'uc-b', 'middle'));
  parts.push(text(840, 225, `in ${first.year}`, 'uc-s', 'middle'));

  // The example car
  parts.push(line('M570 120 C520 120 480 200 480 283'));
  parts.push(card(330, 285, 300, 90, 'orange'));
  parts.push(carIcon(400, 332, 0.75, 'orange'));
  parts.push(text(470, 325, car.model, 'uc-b'));
  parts.push(text(470, 345, `car no. ${car.number}`, 'uc-s'));

  // What belongs to the car
  const items = [
    {
      title: 'Price',
      value: price(car.price, car.currency),
      icon: (x: number) => tagIcon(x, 450, '€'),
    },
    {
      title: 'Brand & model',
      value: `${short(f, car.model)}, ${car.powerKw} kW`,
      icon: (x: number) => keyIcon(x, 450),
    },
    {
      title: 'Workshop',
      value: car.workshop,
      icon: (x: number) => garageIcon(x, 452, 0.55),
    },
    {
      title: 'Parts',
      value: 'down to the screws',
      icon: (x: number) => gearIcon(x, 450, 0.9),
    },
    {
      title: '3D model',
      value: 'for the screen',
      icon: (x: number) => cubeIcon(x, 450, 0.9),
    },
  ];
  items.forEach((item, i) => {
    const x = 40 + i * 180;
    const cx = x + 80;
    parts.push(line(`M480 375 Q480 395 ${cx} 405`));
    parts.push(card(x, 405, 160, 125));
    parts.push(item.icon(cx));
    parts.push(text(cx, 495, item.title, 'uc-b', 'middle'));
    parts.push(text(cx, 515, item.value, 'uc-s', 'middle'));
  });

  return svg(
    n,
    'The car world at a glance',
    `${f.manufacturer.name} publishes a catalog per model year. A catalog lists cars. ` +
      `Each car, like the ${car.model}, has a price, a brand and model, a workshop, its parts and a 3D model.`,
    960,
    560,
    parts.join('\n'),
  );
};

// .............................................................................
/**
 * The manufacturer with its headquarters and catalogs.
 * @param f - The facts
 */
const manufacturer = (f: UcFacts): string => {
  const n = 'manufacturer';
  const m = f.manufacturer;
  const parts: string[] = [];

  parts.push(text(40, 48, 'A manufacturer and its catalogs', 'uc-h'));

  parts.push(card(40, 80, 280, 330));
  parts.push(factoryIcon(180, 160, 1.1));
  parts.push(text(180, 250, m.name, 'uc-b', 'middle'));
  parts.push(text(180, 272, `Founded ${m.founded}`, 'uc-s', 'middle'));
  parts.push(text(180, 315, 'Headquarters', 'uc-s', 'middle'));
  parts.push(text(180, 337, m.headquarters, 'uc-t', 'middle'));
  parts.push(text(180, 380, `Brand: ${m.brand}`, 'uc-t', 'middle'));

  f.catalogs.forEach((c, i) => {
    const x = 370 + i * 290;
    parts.push(
      i === 0
        ? arrow(n, `M324 160 L${x - 6} 160`)
        : arrow(n, `M${x - 26} 160 L${x - 6} 160`),
    );
    parts.push(card(x, 80, 260, 330));
    parts.push(bookIcon(x + 50, 140, c.year));
    parts.push(text(x + 100, 125, `Catalog ${c.year}`, 'uc-b'));
    parts.push(text(x + 100, 145, `${c.cars.length} cars`, 'uc-s'));
    c.cars.forEach((car, j) => {
      const y = 215 + j * 30;
      parts.push(carIcon(x + 34, y - 5, 0.28));
      parts.push(text(x + 60, y, short(f, car.model), 'uc-t'));
      parts.push(
        text(x + 240, y, price(car.price, car.currency), 'uc-s', 'end'),
      );
    });
  });

  return svg(
    n,
    'A manufacturer and its catalogs',
    `${m.name}, founded ${m.founded}, has its headquarters at ${m.headquarters}. ` +
      `It publishes a catalog of cars for each of the years ${f.catalogs.map((c) => c.year).join(' and ')}.`,
    960,
    440,
    parts.join('\n'),
  );
};

// .............................................................................
/**
 * A car with its price, brand and workshop.
 * @param f - The facts
 */
const car = (f: UcFacts): string => {
  const n = 'car';
  const c = f.car;
  const shop = f.workshops.find((w) => w.name === c.workshop)!;
  const parts: string[] = [];

  parts.push(text(40, 48, `One car: the ${c.model}`, 'uc-h'));

  // The car in the middle
  parts.push(card(330, 140, 300, 200, 'orange'));
  parts.push(carIcon(480, 225, 1.6, 'orange'));
  parts.push(text(480, 300, c.model, 'uc-b', 'middle'));
  parts.push(text(480, 320, `car no. ${c.number}`, 'uc-s', 'middle'));

  // Price
  parts.push(card(40, 90, 240, 130));
  parts.push(tagIcon(160, 135, price(c.price, c.currency)));
  parts.push(text(160, 185, 'Price', 'uc-b', 'middle'));
  parts.push(text(160, 205, 'including tax', 'uc-s', 'middle'));
  parts.push(arrow(n, 'M326 200 L284 160'));

  // Brand and model
  parts.push(card(40, 260, 240, 160));
  parts.push(keyIcon(80, 300));
  parts.push(text(110, 296, 'Brand & model', 'uc-b'));
  parts.push(text(110, 314, c.model, 'uc-s'));
  [`Body: ${c.bodyType}`, `Fuel: ${c.fuel}`, `Power: ${c.powerKw} kW`].forEach(
    (t, i) => parts.push(text(60, 352 + i * 22, t, 'uc-t')),
  );
  parts.push(arrow(n, 'M326 280 L284 320'));

  // Workshop
  parts.push(card(680, 90, 240, 330));
  parts.push(garageIcon(800, 150, 1));
  parts.push(text(800, 220, shop.name, 'uc-b', 'middle'));
  parts.push(text(800, 240, 'services the car', 'uc-s', 'middle'));
  parts.push(text(800, 268, shop.street, 'uc-t', 'middle'));
  parts.push(text(800, 288, shop.city, 'uc-t', 'middle'));
  parts.push(personIcon(730, 325, 0.9));
  parts.push(text(752, 322, shop.owner, 'uc-t'));
  parts.push(text(752, 340, 'Owner', 'uc-s'));
  let x = 700;
  shop.services.forEach((s) => {
    const ch = chip(x, 380, s, 'purple');
    parts.push(ch.svg);
    x += ch.w + 6;
  });
  parts.push(arrow(n, 'M634 240 L676 240'));

  return svg(
    n,
    `One car: the ${c.model}`,
    `The ${c.model} costs ${price(c.price, c.currency)}. It is a ${c.bodyType} with ` +
      `${c.powerKw} kW running on ${c.fuel}. ${shop.name} in ${shop.city}, owned by ` +
      `${shop.owner}, services it.`,
    960,
    450,
    parts.join('\n'),
  );
};

// .............................................................................
/**
 * The parts of a car, from the car down to the screws.
 * @param f - The facts
 */
const parts = (f: UcFacts): string => {
  const n = 'parts';
  const out: string[] = [];
  const titles = ['Car', 'Assemblies', 'Components', 'Parts', 'Screws & nuts'];
  const icons = [
    (x: number, y: number) => carIcon(x, y, 0.32, 'orange'),
    (x: number, y: number) => gearIcon(x, y, 0.6),
    (x: number, y: number) => boxIcon(x, y, 0.7),
    (x: number, y: number) => valveIcon(x, y, 0.6),
    (x: number, y: number) => screwIcon(x, y, 0.5),
  ];

  out.push(text(40, 48, 'From the car down to the screws', 'uc-h'));

  const colW = 180;
  const rowH = 58;
  const top = 120;
  titles.forEach((t, i) => out.push(text(40 + i * colW + 10, 95, t, 'uc-s')));

  // Column 0 is the car; every further column shows the sub parts of the
  // first part of the column before.
  let parent: UcPart = f.parts;
  const parentY = top;
  const nameOf = (p: UcPart, level: number) =>
    level === 0 ? f.car.model.replace(`${f.manufacturer.brand} `, '') : p.name;

  const box = (p: UcPart, level: number, y: number, open: boolean) => {
    const x = 40 + level * colW;
    out.push(card(x, y, colW - 20, rowH - 10, open ? 'orange' : undefined));
    out.push(icons[level](x + 24, y + 24));
    out.push(text(x + 48, y + 21, nameOf(p, level), 'uc-t'));
    const detail =
      level === 0
        ? 'the whole car'
        : `${p.quantity} ×${p.material ? ` · ${p.material}` : ''}`;
    out.push(text(x + 48, y + 38, detail, 'uc-xs'));
  };

  box(parent, 0, top, true);
  for (let level = 1; level <= 4 && parent.children.length; level++) {
    const children = parent.children;
    children.forEach((child, i) => {
      const y = parentY + i * rowH;
      const x = 40 + level * colW;
      out.push(
        line(
          `M${x - 20} ${parentY + 24} C${x - 10} ${parentY + 24} ${x - 10} ${y + 24} ${x} ${y + 24}`,
        ),
      );
      box(child, level, y, i === 0 && child.children.length > 0);
    });
    parent = children[0];
  }

  const bottom = top + maxWidth(f.parts) * rowH + 30;
  out.push(
    text(
      40,
      bottom,
      `Every car has a bill of materials like this, ${countLevels(f.parts)} levels deep.`,
      'uc-t',
    ),
  );
  out.push(
    text(
      40,
      bottom + 22,
      'Only the first branch is opened here; the other boxes hold parts of their own.',
      'uc-s',
    ),
  );

  return svg(
    n,
    'From the car down to the screws',
    `The ${f.car.model} consists of assemblies like the ${f.parts.children.map((c) => c.name).join(' and the ')}. ` +
      `These contain components, which contain parts, which are held together by screws and nuts.`,
    960,
    bottom + 50,
    out.join('\n'),
  );
};

/**
 * Counts the sub parts of the widest part along the first branch.
 * @param p - The part
 */
const maxWidth = (p: UcPart): number =>
  p.children.length ? Math.max(p.children.length, maxWidth(p.children[0])) : 1;

/**
 * Counts the levels of a part tree below the car.
 * @param p - The part
 */
const countLevels = (p: UcPart): number =>
  p.children.length ? 1 + Math.max(...p.children.map(countLevels)) : 0;

// .............................................................................
/**
 * The 3D model of a car as a tree of groups and shapes.
 * @param f - The facts
 */
const cad = (f: UcFacts): string => {
  const n = 'cad';
  const out: string[] = [];
  out.push(text(40, 48, 'The 3D model of a car', 'uc-h'));

  // A drawing of the car with the shapes of the scene
  out.push(card(40, 80, 400, 300));
  out.push(carIcon(240, 230, 2.6, 'blue-soft'));
  // Callouts for the shapes, in the order of the tree
  const spots = [
    [360, 196, 400, 130],
    [270, 150, 290, 110],
    [190, 258, 170, 330],
    [350, 250, 390, 330],
  ];
  const meshes: UcCadNode[] = [];
  const collect = (node: UcCadNode) => {
    if (node.type === 'mesh') meshes.push(node);
    node.children.forEach(collect);
  };
  collect(f.cad);
  meshes.slice(0, spots.length).forEach((mesh, i) => {
    const [x, y, lx, ly] = spots[i];
    out.push(`<circle cx="${x}" cy="${y}" r="5" class="uc-f-blue"/>`);
    out.push(line(`M${x} ${y} L${lx} ${ly}`));
    out.push(
      text(lx, ly + (ly < y ? -6 : 16), label(mesh.id), 'uc-s', 'middle'),
    );
  });
  out.push(
    text(240, 368, 'Each shape is a piece of the 3D model', 'uc-s', 'middle'),
  );

  // The tree of the scene
  const rows: { node: UcCadNode; depth: number }[] = [];
  const walk = (node: UcCadNode, depth: number) => {
    rows.push({ node, depth });
    node.children.forEach((c) => walk(c, depth + 1));
  };
  walk(f.cad, 0);

  out.push(card(480, 80, 440, 300));
  rows.forEach(({ node, depth }, i) => {
    const x = 510 + depth * 40;
    const y = 112 + i * 38;
    if (depth > 0)
      out.push(line(`M${x - 28} ${y - 22} L${x - 28} ${y} L${x - 16} ${y}`));
    out.push(
      node.type === 'group' ? folderIcon(x, y, 0.6) : cubeIcon(x, y, 0.55),
    );
    const name = depth === 0 ? `${f.car.model}` : label(node.id);
    out.push(text(x + 22, y + 5, name, depth === 0 ? 'uc-b' : 'uc-t'));
    if (node.material) out.push(text(900, y + 5, node.material, 'uc-s', 'end'));
  });

  out.push(folderIcon(60, 420, 0.6));
  out.push(text(80, 425, 'Group: holds other pieces', 'uc-s'));
  out.push(cubeIcon(300, 420, 0.55));
  out.push(
    text(320, 425, 'Shape: a piece you can see, made of a material', 'uc-s'),
  );

  return svg(
    n,
    'The 3D model of a car',
    `The 3D model of the ${f.car.model} is a tree of groups and shapes, like ` +
      `${rows
        .filter((r) => r.depth === 2)
        .map((r) => label(r.node.id).toLowerCase())
        .join(', ')}.`,
    960,
    450,
    out.join('\n'),
  );
};

// .............................................................................
/**
 * A new catalog edition: what changes from one year to the next.
 * @param f - The facts
 */
const revision = (f: UcFacts): string => {
  const n = 'revision';
  const r = f.revision;
  const [first, second] = f.catalogs;
  const out: string[] = [];
  out.push(text(40, 48, `A new catalog for ${r.to}`, 'uc-h'));

  const added = new Set(r.added.map((c) => c.id));
  const changed = new Map(r.changed.map((c) => [c.after.id, c.before]));

  const column = (
    x: number,
    year: number,
    cars: typeof first.cars,
    mark: boolean,
  ) => {
    out.push(card(x, 80, 360, 130 + cars.length * 34));
    out.push(bookIcon(x + 50, 134, year));
    out.push(text(x + 100, 125, `Catalog ${year}`, 'uc-b'));
    out.push(text(x + 100, 145, `${cars.length} cars`, 'uc-s'));
    cars.forEach((c, i) => {
      const y = 215 + i * 34;
      const isNew = mark && added.has(c.id);
      const before = mark ? changed.get(c.id) : undefined;
      if (isNew || before) {
        out.push(
          `<rect x="${x + 12}" y="${y - 20}" width="336" height="30" rx="8" class="uc-f-${isNew ? 'green' : 'orange'}-soft"/>`,
        );
      }
      out.push(
        carIcon(
          x + 38,
          y - 5,
          0.28,
          isNew ? 'green' : before ? 'orange' : 'blue',
        ),
      );
      out.push(
        text(x + 64, y, `${short(f, c.model)} (no. ${c.number})`, 'uc-t'),
      );
      out.push(
        text(
          x + 340,
          y,
          price(c.price, c.currency),
          before || isNew ? 'uc-b' : 'uc-s',
          'end',
        ),
      );
      if (before)
        out.push(text(x + 230, y, `was ${num(before.price)}`, 'uc-xs', 'end'));
      if (isNew) out.push(text(x + 230, y, 'new', 'uc-xs', 'end'));
    });
  };

  column(40, first.year, first.cars, false);
  out.push(arrow(n, 'M410 230 L476 230'));
  out.push(text(443, 220, 'next year', 'uc-xs', 'middle'));
  column(480, second.year, second.cars, true);

  const y = 130 + second.cars.length * 34 + 90;
  const legend = [
    chip(40, y, `${r.added.length} new`, 'green'),
    chip(140, y, `${r.changed.length} new price`, 'orange'),
  ];
  legend.forEach((l) => out.push(l.svg));
  out.push(
    text(
      260,
      y + 14,
      'Everything else stays the same and is kept only once.',
      'uc-s',
    ),
  );

  return svg(
    n,
    `A new catalog for ${r.to}`,
    `The catalog ${r.to} builds on the catalog ${r.from}: ${r.added.length} car is new ` +
      `and ${r.changed.length} car gets a new price. Everything else is taken over.`,
    960,
    y + 50,
    out.join('\n'),
  );
};

// .............................................................................
/**
 * The sizes: the same world from a handful to millions of cars.
 * @param f - The facts
 */
const sizes = (f: UcFacts): string => {
  const n = 'sizes';
  const out: string[] = [];
  out.push(text(40, 48, 'From a handful of cars to millions', 'uc-h'));

  const max = Math.log10(Math.max(...f.sizes.map((s) => s.cars)));
  const uses: Record<string, string> = {
    tiny: 'a quick check',
    small: 'a test of one feature',
    medium: 'a test of the whole app',
    large: 'a load test',
    xl: 'a stress test',
  };
  f.sizes.forEach((s, i) => {
    const y = 90 + i * 64;
    const w = Math.max(24, (Math.log10(s.cars) / max) * 420);
    out.push(card(40, y, 880, 52));
    out.push(text(60, y + 23, s.name, 'uc-b'));
    out.push(text(60, y + 41, uses[s.name] ?? '', 'uc-xs'));
    out.push(
      `<rect x="230" y="${y + 14}" width="${w}" height="24" rx="6" class="uc-f-blue-soft"/>`,
    );
    out.push(carIcon(230 + w - 18, y + 28, 0.2));
    out.push(text(230 + w + 14, y + 31, `${num(s.cars)} cars`, 'uc-b'));
    out.push(
      text(
        900,
        y + 31,
        `${s.manufacturers} manufacturer${s.manufacturers > 1 ? 's' : ''}`,
        'uc-s',
        'end',
      ),
    );
  });
  const y = 90 + f.sizes.length * 64 + 16;
  out.push(
    text(
      40,
      y,
      'Each step of a bar means ten times more cars. The same settings always give the same cars.',
      'uc-s',
    ),
  );

  return svg(
    n,
    'From a handful of cars to millions',
    `The world comes in ${f.sizes.length} sizes, from ${num(f.sizes[0].cars)} cars to ` +
      `${num(f.sizes[f.sizes.length - 1].cars)} cars.`,
    960,
    y + 30,
    out.join('\n'),
  );
};

// .............................................................................
/** The images of the use case page, by file name */
export const usecaseImages = (f: UcFacts): Record<string, string> => ({
  'usecase-overview.svg': overview(f),
  'usecase-manufacturer.svg': manufacturer(f),
  'usecase-car.svg': car(f),
  'usecase-parts.svg': parts(f),
  'usecase-cad.svg': cad(f),
  'usecase-revision.svg': revision(f),
  'usecase-sizes.svg': sizes(f),
});
