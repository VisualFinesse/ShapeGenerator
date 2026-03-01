# Shape Builder

This project allow me to create shapes. With full control, and build off of the shape generator to create more complex designs downstream. These shapes need to be Vectors. SVGs. SVGs are code-based shapes (not raster images) and perform much better, as far as the size of the file is concerned. While never losing quality, or sharpness. They can be scaled infinitely.

Taking this project and building on a strong foundation. Small steps. Here is the current roadmap.



Stage 1
Return primitive shapes
Circle, Square, Triangle, Rectangle.

Stage 1.5
Advanced shapes
Trapazoid, Octogon, polygon, Oval, Freeform Blob.

Stage 2.
Variation.
Return a distorted shape. Add variation. Chaos. Randomness.
Different sizes - Clamping ability.


Stage 3
Shape Masks
return a shape with a duplicate shape or alternate shape inside it.  Different size shape. Slightly distorted, not perfect, shape. Where the inner shape is a negative of the first, or a mask. The inner shape could be perfectly centered, and oriented like the first shape. Or not. Could add slight imperfections to add character.

Stage 3.5
Opacity
Allow shapes to have different opacity.

Stage 3.6
Color
Allow shapes to have different colors.

Stage 3.7
Gradients.
Allow shapes to have linear and radial gradients.

Stage 4
Bezier.
A bezier allows us to round corners, both inside and outside.

Stage 4
Shape Merger
Designs, almost like logos. Shapes that fit together, centerpieces. Several shapes joined to create a unique shape. Yet with consistant bezier or rounded corners. Procedural shape builder, perlin noise.

SHAPE generator should be complete.




____________________________
This shape builder is a standalone piece designed to be used in our Composition Builder:

### Composition Builder.

The designer interfaces with the shape builder to create designs.

Accent Pieces generator
Center Pieces generator
Background / fill pieces generator
Patterns generator

From the generators, they will return a component.

Using the components, we'll compile them with our

Composition Generator

Each generator will be governed by our:
Designer Rulebook / Laws

## Designer Rulebook - the Laws of design
These are rules the designer cannot break.
Some common examples revolve around color theory.
Line Theory
Shape Theory
Composition

- "Limited Colors, or a color pallette"
- "Limitations around multiple shape types"
- "Golden Ratio"
- "Rule of thirds"
- "Symattry vs Asymattry"

## Compositions

Compositions will consist of a variety of determanistic decisions. This will use components and pieces to compose the final artwork.
The artwork will feature markdown text - for a blog. This is our "Designer" where each blog will have a unique design.
The compositions must balance the artwork, against the written text. The artwork cannot overpower the text, the text must live inside and around the artwork. They must live in harmony - together.

The compositions will determine How the text will be displayed, if a large feature/centerpiece is used and where and how. Where components go, which layout to use. This will combine all the elements we have together.


## Components
Components will be the makeup of several elemnts from different parts of our creative engine.

For example.

A composition is a component.
Within composition we will have more components:
Color pallet, layout, center-piece, text, shape groups, Patterns, background, overlay

Inside shape groups, each shape might be its own component, as well.

