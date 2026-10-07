<!--
@license
Copyright (c) 2025 Rljson

Use of this source code is governed by terms that can be
found in the LICENSE file in the root of this package.
-->

# @rljson/edge - Der Rljson-Beispieldatengenerator

Edge erzeugt Beispieldaten für Rljson-Anwendungen: eine Autowelt mit
Herstellern, ihren Fahrzeugkatalogen und für jedes Fahrzeug einem Preis,
einer Marke, einer Werkstatt, einer Stückliste und einer CAD-Szene. Eine
erzeugte Welt nutzt jeden Rljson-Datentyp, von hundert Zeilen für einen
Unit-Test bis zu 25 Millionen Zeilen für einen Lasttest.

## Ziele

- Dem Uikit, `db`, den `io`-Backends und den Validatoren realistische
  Testdaten in jedem Rljson-Datentyp liefern
- Bei jedem Lauf und auf jedem Rechner dieselben Zeilen und Hashes erzeugen,
  ohne Zufallszahlen
- Vom Fixture eines Unit-Tests bis zum Lasttest mit 20 Millionen Objekten
  skalieren
- In Node.js, im Browser und in Web Workern laufen, ohne Abhängigkeit zu
  Dateisystem oder Datenbank
- Anschauliche Daten liefern: erfundene Marken und Modelle, plausible
  Teile, Werkstätten mit Adresse und Inhaber

## Stand

[![Tests](https://github.com/rljson/edge/actions/workflows/quick_check.yaml/badge.svg)](https://github.com/rljson/edge/actions/workflows/quick_check.yaml)

## Installation

```bash
pnpm add @rljson/edge @rljson/rljson
```

## Dokumentation

- [Die Autowelt](doc/architecture.md): was Edge erzeugt und wozu, in
  Bildern erklärt, für Leser ohne technischen Hintergrund (Englisch)
- [Beispieldatengenerator](https://github.com/rljson/rljson-pm/blob/main/doc/2026-Q4/concepts/topics/example-data-generator.md):
  Entwurf, Größen und Ideen, im Projektmanagement-Repo
- [Entscheidungen edge-001 bis edge-004](https://github.com/rljson/rljson-pm/blob/main/doc/2026-Q4/concepts/decisions/000-index.md):
  keine Buffets, kein Zufall, Callback-Sinks, abgeleitete Modelljahre
- Die Sektion »Example« auf [rljson.github.io](https://rljson.github.io):
  Schritt-für-Schritt-Tutorials
- [Guides](doc/guides): wie in diesem Repo entwickelt, getestet und
  reviewt wird

## Code-Beispiele

[src/example.ts](src/example.ts) führt diese Beispiele in den Tests aus.

Eine Welt im Speicher erzeugen:

```ts
import { Edge } from '@rljson/edge';

// The tiny preset: one manufacturer with one catalog of five cars
const { world, stats } = await Edge.preset('tiny').generate();

console.log(`${stats.cars} cars, ${stats.rowsTotal} rows`);
console.log(world.manufacturers._data[0].name);
```

Eine Welt konfigurieren und vorher ihre Größe schätzen:

```ts
import { Edge } from '@rljson/edge';

const edge = new Edge({
  manufacturers: { count: 2, catalogsPerManufacturer: 2 },
  catalogs: { carsPerCatalog: 20, revisions: { count: 1 } },
  layers: {
    prices: { currencies: ['EUR', 'CHF'], range: { min: 20000, max: 80000 } },
    brands: { modelsPerManufacturer: 3, popularity: 'zipf' },
    workshops: { perCatalog: 4 },
    parts: { depth: 3, fanOut: 2 },
    cad: { depth: 2, fanOut: 3 },
  },
});

console.log(`estimated rows: ${edge.estimate().rowsTotal}`);
const { stats } = await edge.generate();
console.log(`generated rows: ${stats.rowsTotal}`);
```

Die Zeilen einer großen Welt über einen Callback weiterreichen, statt sie
zu behalten:

```ts
import { Edge } from '@rljson/edge';

const rowsPerTable: Record<string, number> = {};
await Edge.preset('small').run({
  onRow: (table) => {
    rowsPerTable[table] = (rowsPerTable[table] ?? 0) + 1;
  },
});
console.log(`prices: ${rowsPerTable.prices}, parts: ${rowsPerTable.parts}`);
```

## Funktionsweise

### Die Welt

```text
Manufacturers              components  manufacturers   (der Einstieg)
└─ Manufacturer
   ├─ Headquarters         components  addresses
   └─ Catalogs             jsonArray   manufacturers.catalogsRef
      └─ Catalog           cakes       catalogs        (Slices sind Fahrzeuge)
         ├─ Slice ids      sliceIds    carIds
         ├─ Prices         layers      carPrices    →  components  prices
         ├─ Brands         layers      carBrands    →  components  brands
         ├─ Workshops      layers      carWorkshops →  components  workshops
         │                                              ├─ addressRef → addresses
         │                                              └─ ownerRef   → persons
         ├─ Parts          layers      carParts     →  components  parts
         │                                              └─ subPartRefs → parts
         ├─ CAD            layers      carCad       →  trees       cadScenes
         │                                              └─ meta.partRef → parts
         └─ Revisions      revisions   revisions    (verknüpfen die Modelljahre)
```

- Jedes Modelljahr eines Katalogs ist ein eigener Cake. Seine Slice-Ids und
  Layer bauen mit `base`, `add` und `remove` auf dem Vorjahr auf, und eine
  Revision verknüpft die beiden Cakes.
- Eine Stückliste reicht bis zu vier Ebenen unter das Fahrzeug. Die Ebenen
  1 bis 3 gehören zu einer Variante, Ebene 4 ist ein Pool von Normteilen,
  den alle Stücklisten teilen. Eine CAD-Szene ist ein Baum aus Gruppen und
  Meshes, und ein Mesh verweist auf ein Teil.
- Listen sind Hash-Arrays in einer `jsonArray`-Spalte, die die
  Tabellenkonfiguration als Referenz deklariert. Jede Tabelle hat eine
  `TableCfg`, so prüft `BaseValidator` aus `@rljson/rljson` Typen und
  Referenzen.

### Kein Zufall

Jeder Wert leitet sich aus einem Index in die Wörterbücher ab: 166
Hersteller, 917 Modelle, neun Baugruppen mit je 36 Teilen, 40 Normteile,
126 Städte, 100 Straßen, 185 Vornamen und 180 Nachnamen. Ein Anteil wie
`discountShare` wählt jedes k-te Fahrzeug. Dieselbe Konfiguration ergibt
dieselben Hashes.

### Zeile für Zeile

Zeilen verweisen per Hash auf Zeilen, deshalb gibt Edge eine Zeile erst
nach den Zeilen aus, auf die sie verweist. Edge hasht jede Zeile, verwirft
eine Zeile, deren Hash schon ausgegeben wurde, und reicht die übrigen
einzeln und abgewartet an einen Sink weiter. `generate()` sammelt sie in
einem `EMemorySink`; `run(sink)` reicht sie an `onRow` und behält
nichts, nachdem `onTable` jede Tabelle mit ihrer Konfiguration angekündigt
hat.

Stücklisten und Szenen werden pro Fahrzeug, pro Modell oder pro Katalog
geteilt. `estimate()` zählt die Zeilen jeder Tabelle allein aus der
Konfiguration, und `scale.targetRows` wählt damit die Fahrzeuge pro
Katalog.

### Öffentliche API

| Export                                   | Zweck                                                                                                                                                                                                      |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Edge`                                   | `new Edge(config)`, `preset()`, `estimate()`, `generate()`, `run()`                                                                                                                                        |
| `mergeConfigs`                           | Führt zwei Konfigurationen abschnittsweise zusammen                                                                                                                                                        |
| `edgeDefaults`, `resolveEdgeConfig`      | Die Standardwerte und eine geprüfte Konfiguration mit Standardwerten                                                                                                                                       |
| `edgePresets`, `edgePresetNames`         | Die Presets `tiny`, `small`, `medium`, `large` und `xl`                                                                                                                                                    |
| `ESink`, `EMemorySink`                   | Die Callback-Schnittstelle von `run()` und der Sink von `generate()`                                                                                                                                       |
| `carWorldTableKeys`, `carWorldTableCfgs` | Die Tabellenschlüssel und ihre Tabellenkonfigurationen                                                                                                                                                     |
| `ECarWorld` und seine Zeilentypen        | `EManufacturer`, `EAddress`, `EPerson`, `EWorkshop`, `EPrice`, `EBrand`, `EPart`, `ECadMeta`                                                                                                               |
| `EConfig` und seine Abschnitte           | `ELayersConfig`, `EPricesConfig`, `EBrandsConfig`, `EWorkshopsConfig`, `EPartsConfig`, `ECadConfig`, `ERevisionsConfig`, `EResolvedConfig`                                                                 |
| `EStats`, `EEstimate`, `EProgress`       | Die Ergebnisse und der Fortschritt eines Laufs                                                                                                                                                             |
| Wörterbücher                             | `manufacturers`, `vehicles`, `modelsOf`, `assemblies`, `standardParts`, `materialsOf`, `cadSystems`, `cadDetails`, `cadMaterials`, `cities`, `citiesIn`, `cityNamed`, `streets`, `firstNames`, `lastNames` |

## Erfundene Namen

Edge erfindet alle Namen: Marken, Modelle, Firmen, Personen und
Werkstätten. Nur Länder und Städte sind echt. Ähnlichkeiten mit echten
Namen sind zufällig.

## Mitwirken

Gearbeitet wird Ticket für Ticket mit `gg`, wie es der
[Develop Guide](doc/guides/develop-guide.md) beschreibt. Reviews folgen dem
[Review Guide](doc/guides/for-ai/ai-review-guide.md).
