---
name: frontend-design
description: >
  Guidance for distinctive, intentional visual design when building new UI or
  reshaping an existing one. Helps with aesthetic direction, typography, and
  making choices that don't read as templated defaults.
source: https://github.com/anthropics/skills/tree/main/skills/frontend-design
license: See LICENSE.txt in anthropics/skills repo
---

# Frontend Design

Approach this as the design lead at a small studio known for giving every client
a visual identity that could not be mistaken for anyone else's. This client has
already rejected proposals that felt templated, and is paying for a distinctive
point of view: make deliberate, opinionated choices about palette, typography,
and layout that are specific to this brief, and take one real aesthetic risk you
can justify.

## Ground it in the subject

If the brief does not pin down what the product or subject is, pin it yourself
before designing: name one concrete subject, its audience, and the page's single
job, and state your choice. If there's any information in your memory about the
human's preferences, context about what they're building, or designs you've made
before — use that as a hint. The subject's own world, its materials, instruments,
artifacts, and vernacular, is where distinctive choices come from. Build with
the brief's real content and subject matter throughout.

## Design principles

For web designs, the hero is a thesis. Open with the most characteristic thing
in the subject's world, in whatever form makes sense for it: a headline, an
image, an animation, a live demo, an interactive moment. Be deliberate with your
choice: a big number with a small label, supporting stats, and a gradient accent
is the template answer — only use if that's truly the best option.

Typography carries the personality of the page. Pair the display and body faces
deliberately, not the same families you would reach for on any other project,
and set a clear type scale with intentional weights, widths, and spacing. Make
the type treatment itself a memorable part of the design, not a neutral delivery
vehicle for the content.

Structure is information. Structural devices — numbering, eyebrows, dividers,
labels — should encode something true about the content, not decorate it. Many
generic designs use numbered markers (01 / 02 / 03), but that's only appropriate
if the content actually is a sequence. Question if choices like numbered markers
actually make sense before incorporating them.

Leverage motion deliberately. Think about where and if animation can serve the
subject: a page-load sequence, a scroll-triggered reveal, hover micro-interactions,
ambient atmosphere. An orchestrated moment usually lands harder than scattered
effects. However, sometimes less is more, and extra animation contributes to the
feeling that the design is AI-generated.

Match complexity to the vision. Maximalist directions need elaborate execution;
minimal directions need precision in spacing, type, and detail. Elegance is
executing the chosen vision well.

Consider written content carefully. Copy can make a design feel as templated as
the design itself. Write copy that is specific to the subject — not placeholder
phrases or generic SaaS marketing language.

## Process: brainstorm, explore, plan, critique, build, critique again

For calibration: AI-generated design right now clusters around three looks:
1. A warm cream background (near #F4F1EA) with a high-contrast serif display
   and a terracotta accent
2. A near-black background with a single bright acid-green or vermilion accent
3. A broadsheet-style layout with hairline rules, zero border-radius, and dense
   newspaper-like columns

All three are legitimate for some briefs — but only if you can specifically
justify why this brief calls for that look. If you cannot justify it, choose
something else.

Before committing to a direction, internally brainstorm at least three distinct
visual directions. Reject the first instinct if it falls into one of the above
clusters without good reason. Choose the direction that is most specific to
the subject matter.

## Forbidden patterns (unless specifically justified)

- **No purple on dark** — violet/purple text or glow on dark backgrounds
- **No colored border accents** — glowing colored outlines on cards or sections
- **No untracked huge type** — massive display type without intentional letter-spacing
- **No bento box icon grids** — icon-stuffed bento boxes with unrelated icons
- **No pill badges above headlines** — pulsing dot + pill badge above the main headline
- **No gradient text keywords** — CSS gradient fills on headline keywords
- **No grid/particle backgrounds** — grid line patterns or particle mesh overlays
- **No triple-nested cards** — rounded cards containing 3+ nested cards

## Implementation checklist

When building the HTML mockup:
- [ ] Palette is drawn from the subject's world, not a generic startup palette
- [ ] Font pairing is specific to this brief (not Inter + Playfair as default)
- [ ] Type scale has at least 4 sizes with deliberate weight contrast
- [ ] Layout structure encodes real information about the content
- [ ] At least one deliberate motion/animation choice with clear purpose
- [ ] Copy is subject-specific and not placeholder text
- [ ] The design passes the "could this be for a different product?" test — it should not
- [ ] Mobile responsive
