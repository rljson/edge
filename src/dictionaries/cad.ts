// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// #############################################################################
/** A system group of a CAD scene (level 1) with its component groups (level 2) */
export interface ECadSystem {
  /** The id of the group, unique among the children of the scene */
  id: string;

  /** The ids of the component groups below the system */
  children: readonly string[];
}

// .............................................................................
/** The system groups of a car scene, each with six components */
export const cadSystems: readonly ECadSystem[] = [
  {
    id: 'body',
    children: ['hood', 'roof', 'doors', 'trunk', 'bumpers', 'fenders'],
  },
  {
    id: 'chassis',
    children: [
      'frame',
      'subframe-front',
      'subframe-rear',
      'crossmembers',
      'mounts',
      'underbody',
    ],
  },
  {
    id: 'drivetrain',
    children: [
      'engine',
      'transmission',
      'driveshaft',
      'axles',
      'exhaust',
      'cooling',
    ],
  },
  {
    id: 'interior',
    children: ['seats', 'dashboard', 'console', 'headliner', 'carpet', 'trim'],
  },
  {
    id: 'electrics',
    children: [
      'harness',
      'battery',
      'ecu',
      'lighting',
      'sensors',
      'infotainment',
    ],
  },
  {
    id: 'wheels',
    children: ['wheel-fl', 'wheel-fr', 'wheel-rl', 'wheel-rr', 'spare', 'hubs'],
  },
  {
    id: 'exterior',
    children: ['grille', 'mirrors', 'spoiler', 'sills', 'mouldings', 'badges'],
  },
  {
    id: 'safety',
    children: ['airbags', 'belts', 'abs', 'camera', 'radar', 'crash-bars'],
  },
];

// .............................................................................
/** Names for the nodes below the component groups (level 3 and deeper) */
export const cadDetails: readonly string[] = [
  'shell',
  'frame',
  'bracket',
  'cover',
  'mount',
  'seal',
  'hinge',
  'panel',
  'bolt-set',
  'clip-set',
];

// .............................................................................
/** The materials of meshes, picked by index */
export const cadMaterials: readonly string[] = [
  'steel',
  'aluminium',
  'glass',
  'plastic',
  'rubber',
  'leather',
  'carbon fibre',
  'chrome',
];
