# PF2e Words of Magic

> *"The worlds are dark and full of horrors. The players are goofs and full of hubris."*
> — Death Dreams Studio

A Foundry VTT module for **Pathfinder 2e** that generates tradition-flavored spell incantations whenever a spell is cast. Inspired by the Words of Power system from *Ultima / Ultima Online* — each spell produces a three-word phonetic phrase from the caster's tradition, displayed as animated canvas text above their token and as a styled card in chat.

**Formula:** `[Delivery] + [Element] + [Signature]`

Each tradition has a completely distinct phonetic character:

| Tradition | Character | Roots |
|-----------|-----------|-------|
| **Arcane** | Swooping vowels, rolled R's, breathed aahhs — scholarly and precise | Latin / Greek |
| **Primal** | Grunts, growls, hums, buzzes — guttural and instinctive | Gaelic / Afrikaans |
| **Occult** | Glottal apostrophes, alien sibilants — unknowable and slippery | French / Mandarin |
| **Divine** | Hymnal Latin cadence, chant-like weight — ceremonial authority | Classical Latin |

Dark Divine casters (fiend, undead, unholy, and similar traits) override the Divine tradition with a separate font and a deep crimson glow — the same words, corrupted.

---

## Requirements

| Dependency | Version |
|-----------|---------|
| Foundry VTT | v13+ (verified 13.348) |
| PF2e System | v6.0+ (verified 7.9.1) |

No other modules required. Compatible with Dice So Nice.

---

## Installation

### Manual

1. Download the latest release zip.
2. Extract the `pf2e-words-of-magic` folder into your Foundry `Data/modules/` directory.
3. Restart Foundry, go to **Settings → Manage Modules**, enable **PF2e Words of Magic**.

### Manifest URL

Paste into **Settings → Manage Modules → Install Module**:

```
https://github.com/sizzoul/pf2e-words-of-magic/releases/latest/download/module.json
```

---

## How It Works

### The Three Words

**Delivery** — resolved from the spell's area type in PF2e:

| Area / Range | Delivery |
|---|---|
| Burst | Burst |
| Cone | Cone |
| Line | Line |
| Emanation | Emanation |
| Touch range | Touch |
| Ray | Ray |
| Self only | Self |
| Summon spells | Summon |
| No area/target | Point |

**Element** — resolved in priority order:
1. Direct damage trait (`fire`, `cold`, `electricity`, `acid`, etc.)
2. Descriptor traits (`healing` → Vitality, `holy`, `unholy`, `light`, `darkness`, etc.)
3. Hardcoded summon lookup (covers 40+ summon spells)
4. Name keyword scan
5. Default: **Aether**

**Tier** — scales from the cast rank:

| Cast Rank | Tier | Fire Example |
|---|---|---|
| Cantrip / 1–2 | 1 | Spark |
| 3–4 | 2 | Ember |
| 5–6 | 3 | Flame |
| 7–8 | 4 | Blaze |
| 9–10 | 5 | Inferno |

**Signature** — a stable per-spell-per-rank syllable derived by hashing the item ID and cast rank. The same spell at the same rank always produces the same third word. A different rank produces a different word, so heightening feels linguistically meaningful.

### Dark Divine

Any actor carrying `fiend`, `undead`, `demon`, `devil`, `daemon`, `unholy`, `qlippoth`, `velstrac`, or `sahkil` traits automatically uses the Dark Divine font (Iokharic Bold by default) and renders in crimson instead of ceremonial gold. This works on both PCs and NPCs and requires no configuration.

---

## Settings

All settings are world-scoped (GM-controlled) unless noted.

### General

| Setting | Default | Description |
|---|---|---|
| Enable PF2e Words of Magic | On | Master switch |
| Suppress Cantrip Incantations | Off | Reduce noise at high level play |
| Default Tradition Fallback | Arcane | Used when tradition cannot be determined |

### Canvas

| Setting | Default | Description |
|---|---|---|
| Show Incantation on Canvas | On | Animate text above the caster's token |
| Canvas Animation Mode | Burst | Burst / Arch / Pulse / Scroll |
| Canvas Font Size | 40 | 20–80px |
| Canvas Display Duration | 6s | 1–15s — also controls Arch revolution speed |
| Text Distance from Token | 0 | Adjusts how close or far text sits from center |

### Fonts

Click **Configure Fonts…** to assign a font file per tradition. Browse opens the module's `fonts/` folder. All traditions default to bundled fonts. Custom fonts anywhere in your Foundry data directory are supported.

Bundled fonts: Ultima Runes, Outer Rim AF, Celestial, Cthulhu Runes, Mara's Eye, Drenn's Runes, Daedra, Daedra Bold, Iokharic, Iokharic Bold, Mage Script, Mage Script Bold, Unown Runes, Runas.

### Chat Card

| Setting | Default | Description |
|---|---|---|
| Show Incantation in Chat | On | Posts styled card to chat log |
| Show Spell Name | PC + Allies | Controls when the spell name is revealed |
| Show Tradition | On | Shows the [ARCANE] / [DIVINE] badge |
| Show Word Breakdown | On | Shows the three labeled word pills |
| Show Meta Line | On | Shows Delivery · Element · Tier · Rank line |
| Chat Card Visibility | Public | Public / GM Only / Author Only |

**Show Spell Name** options:
- **Always** — spell name always visible to everyone
- **PC + Allies** (default) — shown when cast by a PC or a token with party alliance; hidden for enemies and neutrals
- **PC Only** — shown only when cast by a player character
- **Never / GM Only** — spell name hidden in chat; GM sees it in a GM-only note

---

## Customization

All vocabulary lives in `scripts/vocabulary.js`. The structure is straightforward:

```javascript
// Delivery words by tradition
DELIVERY.burst.arcane  // → "ashaah"

// Element words: ELEMENTS[element][tier][tradition]
ELEMENT_WORDS.fire[3].arcane  // → "ifrignir" (tier 3 fire, arcane)

// Signatures: 20 per tradition
SIGNATURES.divine[0]  // → "demis"
```

To add a new element: add it to `ELEMENTS`, `TIER_NAMES`, and register it in the trait or keyword detection in `resolver.js`.

---

## Animation Modes

**Burst** (default) — the three words shoot outward from the token in different directions sequentially, fading as they travel.

**Arch** — individual characters are placed along a 200° arc above the token, tangent-rotated, spinning one full revolution before fading.

**Pulse** — the full phrase hovers above the token and breathes with a slow oscillating glow for the duration.

**Scroll** — classic upward drift from the token.

---

## Credits

- **Author:** sizzoul
- **Studio:** [Death Dreams Studio](https://www.twitch.tv/DeathDreamsStudio)
- **Inspiration:** Ultima / Ultima Online Words of Power
- **Built for:** *Echoes of Death and Steel* — live Mondays 7PM PST

### Fonts

Several bundled fonts are the work of other creators. Full license details,
attribution, and distribution rights are documented in [FONTS.md](FONTS.md).

Special acknowledgment to **Neale Davidson** of Pixel Sagas, whose fantasy
script fonts are central to this module's aesthetic and are shared in his memory.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
