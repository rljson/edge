// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// #############################################################################
/** A sub assembly of an assembly, with the names of its parts (level 2 and 3) */
export interface ESubAssembly {
  /** The name of the sub assembly */
  name: string;

  /** The names of the parts the sub assembly consists of */
  parts: readonly string[];
}

// #############################################################################
/** An assembly of a car: level 1 of a bill of materials */
export interface EAssembly {
  /** The name of the assembly */
  name: string;

  /** The category of the assembly and of everything below it */
  category: string;

  /** The sub assemblies the assembly consists of */
  subAssemblies: readonly ESubAssembly[];
}

// #############################################################################
/** A standard part shared by many bills of materials: level 4 */
export interface EStandardPart {
  /** The name of the standard part */
  name: string;

  /** The material of the standard part */
  material: string;
}

// .............................................................................
/** The assemblies of a car, each with six sub assemblies of six parts */
export const assemblies: readonly EAssembly[] = [
  {
    name: 'Engine',
    category: 'engine',
    subAssemblies: [
      {
        name: 'Cylinder head',
        parts: [
          'Intake valve',
          'Exhaust valve',
          'Valve spring',
          'Camshaft',
          'Rocker arm',
          'Head gasket',
        ],
      },
      {
        name: 'Engine block',
        parts: [
          'Cylinder liner',
          'Piston',
          'Piston ring',
          'Connecting rod',
          'Crankshaft',
          'Main bearing',
        ],
      },
      {
        name: 'Lubrication',
        parts: [
          'Oil pump',
          'Oil filter',
          'Oil pan',
          'Oil cooler',
          'Pressure relief valve',
          'Dipstick',
        ],
      },
      {
        name: 'Air intake',
        parts: [
          'Air filter',
          'Intake manifold',
          'Throttle body',
          'Mass air flow sensor',
          'Intake hose',
          'Resonator',
        ],
      },
      {
        name: 'Turbocharging',
        parts: [
          'Turbocharger',
          'Wastegate',
          'Intercooler',
          'Boost pipe',
          'Blow-off valve',
          'Boost sensor',
        ],
      },
      {
        name: 'Timing drive',
        parts: [
          'Timing chain',
          'Chain tensioner',
          'Chain guide',
          'Camshaft sprocket',
          'Crankshaft sprocket',
          'Timing cover',
        ],
      },
    ],
  },
  {
    name: 'Transmission',
    category: 'transmission',
    subAssemblies: [
      {
        name: 'Gearbox housing',
        parts: [
          'Housing front',
          'Housing rear',
          'Bell housing',
          'Breather',
          'Drain plug',
          'Dowel pin',
        ],
      },
      {
        name: 'Gear set',
        parts: [
          'Input shaft',
          'Output shaft',
          'Synchronizer ring',
          'First gear',
          'Second gear',
          'Reverse idler',
        ],
      },
      {
        name: 'Clutch',
        parts: [
          'Clutch disc',
          'Pressure plate',
          'Release bearing',
          'Flywheel',
          'Slave cylinder',
          'Master cylinder',
        ],
      },
      {
        name: 'Shift mechanism',
        parts: [
          'Shift fork',
          'Shift rail',
          'Detent spring',
          'Selector lever',
          'Shift cable',
          'Gear knob',
        ],
      },
      {
        name: 'Differential',
        parts: [
          'Ring gear',
          'Pinion gear',
          'Side gear',
          'Spider gear',
          'Differential case',
          'Pinion bearing',
        ],
      },
      {
        name: 'Torque converter',
        parts: [
          'Impeller',
          'Turbine',
          'Stator',
          'Lock-up clutch',
          'Converter housing',
          'Hub seal',
        ],
      },
    ],
  },
  {
    name: 'Chassis',
    category: 'chassis',
    subAssemblies: [
      {
        name: 'Front suspension',
        parts: [
          'Control arm',
          'Ball joint',
          'Coil spring',
          'Shock absorber',
          'Stabilizer bar',
          'Stabilizer link',
        ],
      },
      {
        name: 'Rear suspension',
        parts: [
          'Trailing arm',
          'Lateral link',
          'Rear spring',
          'Rear damper',
          'Subframe bushing',
          'Toe link',
        ],
      },
      {
        name: 'Steering',
        parts: [
          'Steering rack',
          'Tie rod',
          'Tie rod end',
          'Steering column',
          'Power steering pump',
          'Steering wheel',
        ],
      },
      {
        name: 'Front brakes',
        parts: [
          'Front brake disc',
          'Front brake caliper',
          'Front brake pad',
          'Caliper carrier',
          'Brake hose',
          'Wheel speed sensor',
        ],
      },
      {
        name: 'Rear brakes',
        parts: [
          'Rear brake disc',
          'Rear brake caliper',
          'Rear brake pad',
          'Parking brake cable',
          'Brake drum',
          'Wheel cylinder',
        ],
      },
      {
        name: 'Wheels',
        parts: [
          'Alloy rim',
          'Tire',
          'Wheel hub',
          'Wheel bearing',
          'Wheel bolt',
          'Valve stem',
        ],
      },
    ],
  },
  {
    name: 'Body',
    category: 'body',
    subAssemblies: [
      {
        name: 'Body shell',
        parts: [
          'Floor pan',
          'A-pillar',
          'B-pillar',
          'Roof panel',
          'Rear quarter panel',
          'Sill',
        ],
      },
      {
        name: 'Doors',
        parts: [
          'Front door shell',
          'Rear door shell',
          'Door hinge',
          'Door lock',
          'Window regulator',
          'Door seal',
        ],
      },
      {
        name: 'Hood and trunk',
        parts: [
          'Hood panel',
          'Hood hinge',
          'Hood latch',
          'Trunk lid',
          'Trunk hinge',
          'Gas strut',
        ],
      },
      {
        name: 'Bumpers',
        parts: [
          'Front bumper cover',
          'Rear bumper cover',
          'Bumper beam',
          'Crash absorber',
          'Tow hook cover',
          'Parking sensor bracket',
        ],
      },
      {
        name: 'Glazing',
        parts: [
          'Windshield',
          'Rear window',
          'Front side window',
          'Rear side window',
          'Quarter glass',
          'Sunroof glass',
        ],
      },
      {
        name: 'Exterior trim',
        parts: [
          'Grille',
          'Side mirror',
          'Roof rail',
          'Wheel arch trim',
          'Rear spoiler',
          'Emblem',
        ],
      },
    ],
  },
  {
    name: 'Interior',
    category: 'interior',
    subAssemblies: [
      {
        name: 'Seats',
        parts: [
          'Seat frame',
          'Seat cushion',
          'Backrest',
          'Headrest',
          'Seat rail',
          'Seat belt buckle',
        ],
      },
      {
        name: 'Dashboard',
        parts: [
          'Dashboard carrier',
          'Instrument cluster',
          'Glove box',
          'Air vent',
          'Center display',
          'Steering column cover',
        ],
      },
      {
        name: 'Center console',
        parts: [
          'Console housing',
          'Armrest',
          'Cup holder',
          'Gear selector trim',
          'Storage bin',
          'USB module',
        ],
      },
      {
        name: 'Door panels',
        parts: [
          'Front door panel',
          'Rear door panel',
          'Armrest pad',
          'Window switch',
          'Door speaker grille',
          'Inner door handle',
        ],
      },
      {
        name: 'Headliner',
        parts: [
          'Headliner board',
          'Sun visor',
          'Grab handle',
          'Dome light',
          'Microphone',
          'Rear view mirror',
        ],
      },
      {
        name: 'Floor',
        parts: [
          'Front carpet',
          'Rear carpet',
          'Floor mat',
          'Pedal box',
          'Dead pedal',
          'Sound insulation',
        ],
      },
    ],
  },
  {
    name: 'Electrical system',
    category: 'electrical',
    subAssemblies: [
      {
        name: 'Power supply',
        parts: [
          '12 V battery',
          'Alternator',
          'Battery tray',
          'Battery cable',
          'Fuse box',
          'Main relay',
        ],
      },
      {
        name: 'Lighting',
        parts: [
          'Headlamp',
          'Tail lamp',
          'Turn signal',
          'Fog lamp',
          'License plate lamp',
          'Interior lamp',
        ],
      },
      {
        name: 'Control units',
        parts: [
          'Engine control unit',
          'Body control module',
          'Gateway module',
          'Transmission control unit',
          'Airbag control unit',
          'Parking assist module',
        ],
      },
      {
        name: 'Sensors',
        parts: [
          'Oxygen sensor',
          'Crankshaft sensor',
          'Camshaft sensor',
          'Coolant temperature sensor',
          'Rain sensor',
          'Ultrasonic sensor',
        ],
      },
      {
        name: 'Wiring',
        parts: [
          'Main harness',
          'Engine harness',
          'Door harness',
          'Ground strap',
          'Connector housing',
          'Cable duct',
        ],
      },
      {
        name: 'Infotainment',
        parts: [
          'Head unit',
          'Antenna',
          'Amplifier',
          'Speaker',
          'Microphone module',
          'Display panel',
        ],
      },
    ],
  },
  {
    name: 'Cooling and climate',
    category: 'hvac',
    subAssemblies: [
      {
        name: 'Engine cooling',
        parts: [
          'Radiator',
          'Water pump',
          'Thermostat',
          'Coolant hose',
          'Expansion tank',
          'Radiator fan',
        ],
      },
      {
        name: 'Air conditioning',
        parts: [
          'Compressor',
          'Condenser',
          'Evaporator',
          'Expansion valve',
          'Receiver dryer',
          'Refrigerant line',
        ],
      },
      {
        name: 'Heating',
        parts: [
          'Heater core',
          'Blower motor',
          'Blend door actuator',
          'Cabin filter',
          'Heater valve',
          'Heater duct',
        ],
      },
      {
        name: 'Climate control',
        parts: [
          'Climate control panel',
          'Cabin temperature sensor',
          'Sun load sensor',
          'Humidity sensor',
          'Climate control module',
          'Climate harness',
        ],
      },
      {
        name: 'Ventilation',
        parts: [
          'Fresh air inlet',
          'Recirculation flap',
          'Rear vent',
          'Defroster nozzle',
          'Side vent',
          'Foot well duct',
        ],
      },
      {
        name: 'Charge air',
        parts: [
          'Charge air cooler',
          'Charge air hose',
          'Charge air pipe',
          'Hose clamp set',
          'Charge pressure sensor',
          'Cooler bracket',
        ],
      },
    ],
  },
  {
    name: 'Fuel and exhaust',
    category: 'fuel',
    subAssemblies: [
      {
        name: 'Fuel tank',
        parts: [
          'Tank shell',
          'Filler neck',
          'Fuel cap',
          'Tank strap',
          'Fuel level sender',
          'Rollover valve',
        ],
      },
      {
        name: 'Fuel delivery',
        parts: [
          'Fuel pump',
          'Fuel filter',
          'Fuel line',
          'Fuel rail',
          'Fuel injector',
          'Pressure regulator',
        ],
      },
      {
        name: 'Exhaust manifold',
        parts: [
          'Manifold casting',
          'Manifold gasket',
          'Heat shield',
          'Downpipe',
          'Flex pipe',
          'Lambda sensor boss',
        ],
      },
      {
        name: 'Catalytic converter',
        parts: [
          'Catalyst substrate',
          'Converter shell',
          'Particulate filter',
          'Exhaust temperature sensor',
          'Differential pressure sensor',
          'Pipe clamp',
        ],
      },
      {
        name: 'Muffler',
        parts: [
          'Center muffler',
          'Rear muffler',
          'Tailpipe',
          'Exhaust hanger',
          'Resonator chamber',
          'End trim',
        ],
      },
      {
        name: 'Emission control',
        parts: [
          'EGR valve',
          'EGR cooler',
          'Charcoal canister',
          'Purge valve',
          'Crankcase vent valve',
          'Secondary air pump',
        ],
      },
    ],
  },
  {
    name: 'High voltage system',
    category: 'ev',
    subAssemblies: [
      {
        name: 'Traction battery',
        parts: [
          'Battery module',
          'Battery cell',
          'Cooling plate',
          'Battery housing',
          'Busbar',
          'Battery management unit',
        ],
      },
      {
        name: 'Electric motor',
        parts: [
          'Motor stator',
          'Motor rotor',
          'Resolver',
          'Inverter',
          'Motor housing',
          'Reduction gear',
        ],
      },
      {
        name: 'Charging',
        parts: [
          'Onboard charger',
          'Charge port',
          'DC converter',
          'Charging cable',
          'Charge inlet lid',
          'Contactor',
        ],
      },
      {
        name: 'High voltage wiring',
        parts: [
          'HV harness',
          'HV connector',
          'Service disconnect',
          'HV fuse',
          'Cable shielding',
          'Cable gland',
        ],
      },
      {
        name: 'Thermal management',
        parts: [
          'Chiller',
          'HV coolant pump',
          'Heat pump',
          'PTC heater',
          'Three-way valve',
          'Thermal sensor',
        ],
      },
      {
        name: 'Power electronics',
        parts: [
          'Power module',
          'DC link capacitor',
          'Gate driver',
          'Heat sink',
          'Current sensor',
          'Control board',
        ],
      },
    ],
  },
];

// .............................................................................
/** Standard parts: screws, seals, bearings, shared by every bill of materials */
export const standardParts: readonly EStandardPart[] = [
  { name: 'Hex bolt M6x20', material: 'steel' },
  { name: 'Hex bolt M8x25', material: 'steel' },
  { name: 'Hex bolt M10x30', material: 'steel' },
  { name: 'Flange bolt M8x30', material: 'steel' },
  { name: 'Hex nut M6', material: 'steel' },
  { name: 'Hex nut M8', material: 'steel' },
  { name: 'Flange nut M10', material: 'steel' },
  { name: 'Lock nut M12', material: 'steel' },
  { name: 'Washer 6 mm', material: 'stainless steel' },
  { name: 'Washer 8 mm', material: 'stainless steel' },
  { name: 'Spring washer 8 mm', material: 'spring steel' },
  { name: 'O-ring 12x2', material: 'nitrile' },
  { name: 'O-ring 20x2.5', material: 'nitrile' },
  { name: 'Shaft seal 30x47x7', material: 'rubber' },
  { name: 'Paper gasket 0.5 mm', material: 'gasket paper' },
  { name: 'Circlip 25 mm', material: 'spring steel' },
  { name: 'Cotter pin 3x30', material: 'steel' },
  { name: 'Rivet 4x8', material: 'aluminium' },
  { name: 'Plastic clip 8 mm', material: 'nylon' },
  { name: 'Cable tie 200 mm', material: 'nylon' },
  { name: 'Hose clamp 40 mm', material: 'stainless steel' },
  { name: 'Hose clamp 60 mm', material: 'stainless steel' },
  { name: 'Ball bearing 6203', material: 'bearing steel' },
  { name: 'Ball bearing 6205', material: 'bearing steel' },
  { name: 'Needle bearing 15x21x12', material: 'bearing steel' },
  { name: 'Compression spring 20x60', material: 'spring steel' },
  { name: 'Torsion spring 12 mm', material: 'spring steel' },
  { name: 'Grease nipple M6', material: 'brass' },
  { name: 'Bushing 20x24x30', material: 'bronze' },
  { name: 'Grommet 10 mm', material: 'rubber' },
  { name: 'Spacer 8x16x5', material: 'aluminium' },
  { name: 'Threaded insert M6', material: 'brass' },
  { name: 'Stud M8x40', material: 'steel' },
  { name: 'Set screw M5x10', material: 'steel' },
  { name: 'Rivet nut M6', material: 'steel' },
  { name: 'Spring pin 6x24', material: 'spring steel' },
  { name: 'Woodruff key 5x7.5', material: 'steel' },
  { name: 'Shim 0.2 mm', material: 'steel' },
  { name: 'Cap plug 12 mm', material: 'plastic' },
  { name: 'Dowel pin 8x20', material: 'steel' },
];

// .............................................................................
/** The materials of the parts of a category, picked by index */
export const materialsOf: Readonly<Record<string, readonly string[]>> = {
  engine: ['aluminium', 'cast iron', 'steel', 'forged steel'],
  transmission: ['steel', 'aluminium', 'hardened steel', 'sintered metal'],
  chassis: ['steel', 'aluminium', 'cast iron', 'rubber'],
  body: ['steel', 'aluminium', 'glass', 'plastic'],
  interior: ['plastic', 'leather', 'fabric', 'foam'],
  electrical: ['copper', 'plastic', 'silicon', 'glass fibre'],
  hvac: ['aluminium', 'plastic', 'rubber', 'copper'],
  fuel: ['stainless steel', 'plastic', 'steel', 'ceramic'],
  ev: ['aluminium', 'copper', 'lithium', 'plastic'],
};
