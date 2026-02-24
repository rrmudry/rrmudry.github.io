# Instructions for Duck-handling in the PhET Buoyancy Simulation

The Buoyancy Simulation has a Duck object in the Shapes Screen. You can access it via the shapes dropdown list, it was added to address the properties of irregular shapes. This document describes the process of creating the duck and adding it to the simulation, in case you need to modify it or add a new object. It was a non trivial endeavour so pay close attention, or ask for help from @AgustinVallejo or @zepumph.

The below steps are also discussed and described here https://github.com/phetsims/buoyancy/issues/101

## 1. Creating and importing the 3D duck
The duck and its boots were modelled in Blender, the original file is available in the `duck.blend` file, in the assets directory. It was then exported as an .obj file, and that's where things start to get tricky.

In order to get the 3D file into three.js, we have to convert it to a proper JSON. The Three.js package does this, but the way of doing so changes depending on the release you're using. For our case, we used `three.js-r86` which has a node script called `obj2three.js` which does the appropriate conversion. However, that file has been deprecated since, be aware of that if you're using a newer release.

The generated JSON object currently lives in `DuckData.ts`.

## 2. Displaying the 2D projection of the Duck
For the p2 engine, every shape needs to have an equivalent 2D representation. For the duck, it wasn't possible to simply project the 3D geometry into 2D, as it was a concave shape, and algorithms like a Graham Scan wouldn't properly trace the actual shape of the duck. The route we followed was a bit of a brute-forcing, and if the reader knows a better way, we encourage you to try it. Here's our way:

1. Squish the 3D shape into 2D in Blender (Scale times 0 in the Y axis)
2. Manually removing all the vertices that ended up inside the duck shape. Supposedly Blender can do this automatically, but we couldn't get it to work. Programatically it's way harder since with only the array of points, we have no way of knowing which ones are "inside". That's why Convex Hull algorithms fail this step.
3. If you're lucky, the resulting vertices are ordered properly for a Polygon. Otherwise, `duckFlatSorter.py` is a python script which reorders them in a proper line, by closeness. Again, there's probably better existing algorithms that already do this but I was just brute-forcing my way through it.
   - 3.1. Even with the algorithm, it got one foot backwards, so I had to manually re order about 5 vertices.
4. Once the vertices are ordered, create a polygon and enjoy your 2d duck.

Again, ideally we do not want to change again the shape of the Duck. But if the necessity arose and you're reading this, godspeed.