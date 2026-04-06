# RANO Simulator-First MVP Plan

## Product Direction

RANO should move from a "market search site" to a "build decision tool for Ragnarok players".

Primary value:

- Damage simulator
- Build comparison
- Equipment decision support

Supporting value:

- Item DB as simulator data source
- Vending search as a supporting lookup tool, not the core product

## Product Pillars

### 1. Damage Simulator

This is the main product.

MVP scope:

- Manual stat input
- Core equipment slot input
- Refine / grade / card input
- Single-target damage estimation
- Before/after build comparison

### 2. Item DB

This is not a standalone end-goal.

Its role is to power:

- equipment selection
- effect parsing
- simulator calculations
- later OCR / AI item matching

### 3. Vending Search

Keep it as a lightweight supporting feature.

Its role is to help users answer:

- "Can I buy this item now?"
- "What is the rough current market price?"

It should not define the product roadmap.

## MVP Scope

### Supported jobs in MVP

- Rune Knight / physical melee baseline
- Arch Mage / magic baseline

These two tracks give one physical and one magic reference model.

### Core equipment slots in MVP

- weapon
- armor
- garment
- shoes
- accRight
- accLeft
- headUpper

Optional in later steps:

- headMid
- headLower
- shield
- costume / shadow gear
- set bonuses with complex conditions

### MVP outputs

- estimated damage range
- expected crit / magic summary
- build completion score
- missing input warnings
- comparison between current build and candidate build

## Data Model Direction

The item system should be designed as a calculation engine, not just a text encyclopedia.

Core entities:

- items
- item_effects
- item_set_effects
- cards
- builds

Important rule:

- Store structured effects first
- Keep raw description for fallback and debugging

## Delivery Roadmap

### Phase 1. Simulator foundation

- define MVP jobs and core slots
- define build completion / warning logic
- stabilize current simulator UI around MVP scope

### Phase 2. Calculation engine cleanup

- centralize physical / magic calculation helpers
- stop duplicating formula logic across components
- make parsed item effects reusable

### Phase 3. Build persistence

- save / load builds
- compare two builds
- recommend missing slots

### Phase 4. OCR / AI assist

- screenshot upload
- OCR item candidate extraction
- user confirmation flow
- simulator auto-fill

## Immediate Engineering Priorities

1. Make simulator scope explicit in code
2. Reduce UI complexity to MVP-supported inputs
3. Reuse existing item DB / parsed data instead of rebuilding item pages first
4. Keep vending search online, but do not let it drive product decisions
