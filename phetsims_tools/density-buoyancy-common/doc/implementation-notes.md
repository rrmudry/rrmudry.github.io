# Density, Buoyancy, and Buoyancy: Basics - Implementation Notes

This document contains notes that may be helpful to developers and future maintainers of the simulations in the suite:
Density, Buoyancy, and Buoyancy: Basics.

## Table of Contents

- [Timeline](#timeline)
- [Directory Structure](#directory-structure)
- [External Libraries](#external-libraries)
- [Model & Engine Structure](#model-engine-structure)
- [Important Files](#important-files)
- [PhET-iO Considerations](#phet-io-considerations)
- [Resetting and `Mass.internalVisibleProperty`](#resetting-and-massinternalvisibleproperty)
- [Additional Comments](#additional-comments)

## Timeline

This suite of simulations spans several years of development, as outlined below:

- **2019**: Development of Density and Buoyancy began, with a shared repository named `density-buoyancy-common`.
- **2021**: The decision was made to split the project into two separate simulations, leading to the creation of the
  Buoyancy repository.
- **2022**: The Density simulation was published with PhET-iO, while the Buoyancy simulation was put on hold.
- **2024**: Development of Buoyancy resumed, incorporating significant design changes based on feedback. Buoyancy:
  Basics was added to the suite.

## Directory Structure

This suite differs from others in that all critical files are contained within the `density-buoyancy-common` repository,
while the specific simulation repositories only include the basic Sim and Screen logic.

Within the `density-buoyancy-common/js` directory, each simulation has its own folder, as well as a shared `common/`
folder. These folders are further divided into the usual `view/` and `model/` subfolders. In some cases, particularly in
Buoyancy, a screen required multiple individual files, so you may find paths such as
`density-buoyancy-common/js/buoyancy/model/applications/Bottle.ts`.

All three simulations feature a Compare Screen. Density has its own implementation, but Buoyancy and Buoyancy: Basics
share the same logic for both the model and screen view. Specifically, Buoyancy: Basics re-uses the `BuoyancyCompare*`
files.

## External Libraries

To achieve the desired behavior and interactions, a few additional libraries are used in these simulations, in addition
to the ones commonly used in PhET Sims:

- **THREE.js**: This library is utilized for 3D rendering. The most significant uses of THREE.js are in the
  `DensityBuoyancyCommonScreenView.ts` file, where 3D assets are created, model-to-view and view-to-model
  transformations are handled, ray tracing for mouse interaction is implemented, and elements like MassViews are
  managed.
- **P2 Physics Engine**: This library handles the collisions and movement of bodies, offering many customizable physical
  properties that can be adjusted via query parameters.

It's important to note that for every model step, the engine performs multiple substeps to improve accuracy. As a
result, some numerical properties are listed as `*InterpolatedProperty`, as they require correction for the potential
offset between the model's `dt` and the engine's internal `dt`. The `interpolationRatio` accounts for this.

## Model & Engine Structure

### DensityBuoyancyModel

- Contains the P2 engine and key simulation elements such as the pool and masses.
- `this.engine.addPostStepListener`: This callback is crucial as it determines the application of forces calculated by
  the engine. Buoyant forces, gravity, and viscosity are applied here, and the weight display for scales is also
  calculated in this section.
- At the end of the file, there are multiple no-ops which get rewritten in `BuoyancyApplicationsModel.ts`, reserved for
  the boat functionalities.

### BuoyancyApplicationsModel.ts

- Contains the boat functionalities, such as the features of spilling water into and out of the boat, depending on its
  height, i.e., if the boat is dragged out of the pool, it returns the water that might have been inside it.

### BlockSetModel

- An extension of the common model that handles the creation and memory of block sets, such as “Same Mass” or “Same
  Density” blocks, particularly in the Density Mystery Screen or Compare Screens across all three simulations.

### BuoyancyShapeModel.ts

- This class serves as the main model for a single shape object within the Buoyancy Shapes Screen. The class caches all
  possible mass instances to simplify PhET-iO implementation. This approach avoids unnecessary disposal since all
  properties persist for the lifetime of the simulation.

## Important Files

In addition to the model classes mentioned above, the following files are also important:

- **Mass.ts**: Provides the general implementation of a mass in these simulations and defines all its physical
  properties. All other shapes are derived from this class.
- **Material.ts**: Defines all mass and fluid materials, including their densities, viscosities, and colors.
- **MaterialView.ts**: Creates the MaterialViews for the materials defined above and loads all the textures seen in the
  simulation.
- **DisplayProperties.ts**: Handles the visibility of multiple UI elements in the sim, such as force vectors, depth
  lines, etc.

## PhET-iO Considerations

- Model objects, such as Mass and its subtypes, are statically preallocated; this simulation does not use PhetioGroup or
  PhetioCapsule. However, the views are dynamically created and destroyed as masses are added and removed from the
  active part of the model, called `visibleMasses`. The dynamic views are not PhET-iO instrumented, so the API has no
  dynamic parts.
- The simulation requires `propertyStateHandlerSingleton.registerPhetioOrderDependency`. Search for occurrences of that
  term for more comprehensive documentation.
- Material was refactored from an immutable type with IO Type support in Density 1.0 to be a mutable Property. The
  simulation still has `MassIO`, which encodes many parts of the Mass state.

## Resetting and `Mass.internalVisibleProperty`

- Each mass has an `internalVisibleProperty` that is managed by the simulation and is not PhET-iO stateful (but is
  uniquely determined by upstream quantities that are phet-io instrumented, such as which scene is selected). To ensure
  the correct objects are visible, the `internalVisibleProperty` instances are often reset last during the reset
  functions.

## Additional Comments

- **BlendedNumberProperty and BlendedVector2Property**: These properties use linear interpolation between old and new
  values to prevent sudden small changes and flickering.
- **MappedWrappedProperty.ts**: A utility class that manages materials and gravity by using a Property to represent
  their characteristics (e.g., density or gravity value). This class allows for custom values to be set alongside named
  constant values. For instance, when a density is changed via the slider, the simulation switches to a custom material.
- For more complex geometries, such as the Boat, Bottle, or Duck, the mesh data can be found in `BoatDesign.ts`,
  `Bottle.ts`, and `DuckData.ts`. Some important notes regarding each:
  - **Boat.ts and Bottle.ts**: These files include precomputed data, such as curves for displaced areas and volumes, and
    the 2D shape used for physics intersections. The geometry is calculated via the `compute*Data()` static functions.
  - **Duck**: Modeled in Blender and converted to THREE.js via scripting. If you need to modify the duck geometry, refer
    to this discussion: [Buoyancy Issue #101](https://github.com/phetsims/buoyancy/issues/101) and prepare accordingly.
    The Duck's displacement of water from the pool is modeled as an ellipsoid.
- Enumeration is managed using both `EnumerationValue` and `string[]`, depending on the specific requirements.
- [Query Parameters File](https://github.com/phetsims/density-buoyancy-common/blob/main/js/common/DensityBuoyancyCommonQueryParameters.ts).