## @layout Lay out the package

- Name the package after the repo, and prefix its types with `E`, short
  for Example. The full name `Edge` would make every type name long.
- Keep one top level concept per package
- Expose the package through a single entry point that re-exports and
  holds no implementation of its own
- Name a file after the main type it holds, without the prefix:
  `ECatalogGenerator` lives in `catalog-generator.ts`
- Mirror the source tree in the test tree one to one

## @naming Name things consistently

- Types in PascalCase, carrying the prefix `E`, e.g. `ECarWorld`. The
  class `Edge` keeps its name.
- Private members marked the way the language marks them
- Constants and enum values in lowerCamelCase
- A test file named after the file it covers
