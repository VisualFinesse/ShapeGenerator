# SVGComponentGenerator Constitution

Spec Constitution · TaskFlow Constitution

## Core Principles

### Scope Discipline

The Shape Builder is responsible only for geometric shape generation and transformation.

It must not implement:

* Composition logic
* Layout rules
* Color theory enforcement
* Designer rulebook constraints
* Text placement
* Blog composition decisions

Those concerns belong to higher-level systems (Composition Builder, Designer Rulebook).

The Shape Builder produces shapes.
It does not decide how they are used.


### Composability

All shapes must be composable.

A shape must be usable:

* As a standalone element
* As part of a group
* As a mask
* As a component inside larger compositions

No shape implementation may assume final context or layout.

Shapes must remain self-contained geometric primitives.

### Incremental Expansion

The system evolves in discrete stages.

Each stage must:

* Extend capabilities without rewriting prior foundations
* Preserve backward compatibility unless explicitly versioned
* Avoid premature abstraction for future stages

The engine must grow by layering features, not replacing core concepts.


### Deterministic Variation

All variation, distortion, randomness, and chaos must be derived solely from the provided seed and canonical configuration.

No runtime randomness may influence output.

Variation must remain reproducible.

# Path Standardization Decision

“Rendering Strategy. Stage 1 defaults to semantic SVG primitives for readability and exactness. A path export mode is supported for downstream uniformity. The default output mode is semantic.”

### Domain Integrity

The engine must preserve designer intent as a first-class concern.

Domain concepts must not be collapsed or inferred for implementation convenience.
If two shapes are distinct in the design domain (e.g., square vs. rectangle), they remain distinct in the model even if they share an underlying SVG representation.

The system must not automatically coerce, substitute, or reinterpret declared shape types.

Implementation details must serve domain semantics, not redefine them.

### Geometry First

Geometric definition of shapes must remain independent from styling attributes (color, opacity, gradients).

Styling must layer on top of geometry and must not redefine shape identity.


### Library-First Core

The SVG generator shall exist as a standalone, framework-agnostic TypeScript engine.

The core must:

- Accept explicit input (seed + config)
- Return explicit output (SVG + metadata as needed)
- Be deterministic under identical inputs
- Remain free of side effects
- Be independently testable without any application layer

All application layers (web, CLI, worker, orchestration) act strictly as adapters. They may validate, persist, cache, or authenticate, but must not contain generation logic.

If the application layer were removed, the engine must continue to function in isolation.

---

### Explicit Contracts and Canonical Replay

All external interfaces must define and validate clear input/output contracts.

Generation shall operate only on canonical, normalized input. Unknown or extraneous input must not influence output.

Persisted replay bundles must contain only the minimal information required to reproduce output:

- generator version
- seed
- canonical configuration

Replay integrity is mandatory. The same replay bundle must always produce the same output for a given generator version.

Reproducibility is a non-negotiable invariant.

## TaskFlow

We build in small, readable increments and extend through explicit extension points.

1. Define the intent (1–3 sentences) and the smallest usable slice.
2. Identify the extension point (registry/interface). No hardcoded special cases.
3. Add a minimal example config and at least one invariant test.
4. Implement with readability-first constraints (small functions, minimal branching).
5. Refactor while tests are green.
6. Update extension documentation when conventions change.

## Governance

1. Authority
   The project owner is final authority on contract and behavioral changes. Decisions are recorded in the changelog.

2. Contract Discipline
   Public contract changes must be documented and classified (breaking or non-breaking).

3. Replay Integrity
   If output changes for an existing replay bundle, the generator version must be incremented.

4. Merge Rule
   No change is merged unless tests pass and replay integrity is preserved or versioned appropriately.

5. Amendments
   Changes to this constitution require documented rationale and updated version metadata.

6. Layer Boundaries
   Shape Builder must not import or depend on Composition Builder, Designer Rulebook, or higher-level orchestration systems.