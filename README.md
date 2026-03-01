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

The designer interfaces with the shape builder to create designs.

Accent Pieces generator
Center Pieces generator
Patterns generator

the Designer can call any of the generators to compile a design.

But first, the designer will use a composition generator to create a wireframe of the composition for the design.

The designer will use the generators to create a design from the composition
Each stage will be governed by our designer rulebook / laws to limit our generators from breaking fundamental design rules.
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

## Accent Pieces generator
Accent pieces will be called for by our Designer. Accent pieces are unique domain of graphic design. Their intent is to support the rest of the design, make it "pop" but without being a destraction. They typically are very closely related to the main design elements, with slight variation - following simliar or the same design patterns as the rest of the piece.
These are typically small, or in clusters, and there are usually multiple accents throughout the entire design where each accent is following the same design pattern as the other accent.
However, some are very large, but low in opacity to help blend elements together.

## Center Pieces generator
The center pieces will be much like "Logos". They are intricate, they draw your eye to them. Typically the primary color(s) of the design.

## Patterns generator
This will generate patterns - backgrounds. Overlay patterns, unique but in tiles.