# Model for Density and Buoyancy

Documented by @AgustinVallejo with support from @samreid and @zepumph

This document is a high-level description of the model used in the following PhET’s suite of simulations: _Density_,
_Buoyancy_ and _Buoyancy: Basics_. These simulations address concepts related to buoyant forces, floatability, and their
relationship with densities, different materials, and Archimedes principle of displaced liquid.

The physics are generally handled using the following types of forces:

* Gravity: A constant acceleration downward. For this simulation, it's 9.8m/s
* Buoyancy: A force based on the different pressures on the top/bottom of masses. For this simulation, it's only upward,
  and is equal to the weight of the displaced fluid.
* Contact: Masses can push into each other or the ground. The ground is immovable. No restitution. Contact force will
  also show up when dragging by the mouse, or when pushing down on a block against the scale. The contact force
  visualization vector only shows the Y value of it.
* Friction: Only horizontal friction is handled in this simulation
* Viscosity: A custom function determining a viscous force is applied, so that oscillations stabilize at a proper rate.

Despite all the forces listed above, no rotation or torque is considered in these simulations, which can lead to
unrealistic scenarios, which have no negative impact on the learning goals of the sim. Some of these forces,
specifically gravity, contact and buoyancy, can be visualized as vectors, and some screens include a Force Zoom set of
buttons which increases or decreases the length of the vectors by 2x.

Additionally:

* Internally, the p2.js physics library is used, read
  _[implementation-notes.md](https://github.com/phetsims/density-buoyancy-common/blob/main/doc/implementation-notes.md)_
  for further information.
* Velocity is limited to 5m/s.
* There are invisible walls and an invisible ceiling that keep masses within the workable area.
* The liquid level always stays flat, that is, fluid "instantly" moves out of the way.
* Air is ignored (buoyancy acts like there is a vacuum, and there is no air friction).
* Across the simulations, the scales and force values show different decimal places, depending on the size of the value.
  If the value is small, it will show two: for example 1.11 vs 11.1.

## Density

For this simulation, all the masses are cubes. The following is a brief description of each screen:

* **Intro Screen**: Allows you to explore different materials and see how they interact with a fluid, typically water.
  Each material has a fixed density, so adjusting the mass will change the volume accordingly, and vice versa. There is
  also a Custom material option for independent adjustment of mass and volume. The density of each material is
  displayed, and you can observe whether the material floats or sinks based on its density compared to the fluid.
* **Compare Screen**: Lets you analyze different blocks by comparing their mass, volume, and density. You can select
  blocks to have the same mass, volume, or density using the options on the right. Adjust the mass slider to see how
  different materials with the same mass interact with the fluid and observe their floating or sinking behavior. This
  screen helps illustrate the relationship between mass, volume, and density across various materials.
* **Mystery Screen**: This screen challenges you to identify unknown materials by comparing their behaviors to known
  densities. You can select different sets of mystery blocks or randomize them using the options on the right. A Density
  Table in the center displays the densities of various materials for reference. By observing how the mystery blocks
  interact with the fluid, you can infer their densities and match them to the materials listed in the table. This
  screen helps you apply your understanding of density to solve practical identification problems.

## Buoyancy

Like Density but now with the option to change the pool’s fluid. Buoyancy also has readouts the density of the blocks,
the percentage of the block submerged, and lets you visualize the forces acting on the blocks, including gravity,
buoyancy, and contact forces. Also, there’s a pool scale which let’s you take weight measurements and slightly change
how submerged the object is, via a slider.

* **Compare Screen**: Allows you to investigate how different blocks with the same mass, volume, or density interact
  with a fluid. You can adjust the mass of the blocks using the slider on the right and observe their behavior in the
  fluid.
* **Explore Screen**: Gets you to investigate the effects of varying mass, volume, and fluid density on an object's
  buoyancy. You can select different materials, adjust their mass and volume using the sliders, and observe how they
  interact with the fluid.
* **Lab Screen**: You can adjust the fluid density and gravity, providing insights into how these variables affect
  buoyant forces. This screen introduces the "Fluid Displaced" visualization, showing the volume and weight of the fluid
  displaced by the object, enhancing understanding of Archimedes' principle.
  * Displaced Fluid considerations: The water that goes in the beaker is the one displaced directly by the block. This
    is calculated by the following formula:

    `` V_disp = F_buoy / ( rho_fluid * g ) ``

    Where `V_disp` is the volume of liquid displaced, calculated by dividing the buoyant force currently acting on the
    block, by the density of the liquid `rho_fluid` and `g`. This is also how the % submerged is calculated.

* **Shapes Screen**: You can select from various shapes, including blocks, ellipsoids, vertical and horizontal
  cylinders, cones, inverted cones, and a duck. Adjust the height and width of the shapes to see how these dimensions
  impact their volume and interaction with the fluid. This screen enhances understanding by demonstrating that shape,
  along with mass and volume, plays a crucial role in buoyancy and flotation behavior.
  * Duck considerations: It is modelled internally as an ellipse for simpler calculations.
* **Applications Screen**: This screen has two different scenes: Bottle and Boat. You can fill a bottle with different
  materials and adjust its air volume to see how it affects buoyancy. The second scene allows you to load objects into a
  boat and observe how it impacts flotation. This screen emphasizes real-world applications of buoyancy concepts,
  demonstrating how varying the contents and structure of objects influence their interaction with the fluid.
  * Bottle Considerations: The bottle system is called 'System A', and its displayed density is calculated by taking the
    mass of the bottle's plastic, the air inside, and the fluid inside, and dividing by the bottle's volume.
  * Boat Considerations: Because the boat has its own basin, blocks can float on the boat if partially full. There are
    also some rules for the boat liquid dynamics:
    * If water overflows from the boat's basin, it gets added back to the pool.
    * If the boat is dragged out of the pool, the water in the basin is added back to the pool.
    * If the selected liquid is more dense than aluminum, the boat will float even if full, because of its hull.

## Buoyancy: Basics

* Compare Screen: See above for Buoyancy Compare Screen. This is the same implementation.
* Explore Screen: A simpler version of Buoyancy Explore Screen, for younger students.

## Mystery Materials, Liquids and Gravity

The following are tables related to the mystery items in the sim, which are mini challenges for the student to calculate
their values based on other elements.

### Table 1. Mystery Materials

| Name       | Material | Density (kg/m^3) | Screen              |
|------------|----------|------------------|---------------------|
| MATERIAL R | Pyrite   | 5010             | Explore             |
| MATERIAL S | Gold     | 19320            | Explore             |
| MATERIAL T | Human    | 950              | Lab                 |
| MATERIAL U | Diamond  | 3510             | Lab                 |
| MATERIAL V | Ice      | 919              | Applications Bottle |
| MATERIAL W | Lead     | 11342            | Applications Bottle |
| MATERIAL X | Titanium | 4500             | Applications Boat   |
| MATERIAL Y | Mercury  | 13593            | Applications Boat   |

### Table 2. Mystery Liquids

| Name      | Density (kg/m^3) | Screen       |
|-----------|------------------|--------------|
| DENSITY A | 3100             | Explore, Lab |
| DENSITY B | 790              | Explore, Lab |
| DENSITY C | 490              | Shapes       |
| DENSITY D | 2890             | Shapes       |
| DENSITY E | 1260             | Applications |
| DENSITY F | 6440             | Applications |

### Table 3. Mystery Gravity

| Name     | Gravity (m/s^2) | Screen |
|----------|-----------------|--------|
| PLANET X | 19.6            | Lab    |