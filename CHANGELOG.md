# Changelog

## 1.2.0

Verified on Foundry VTT 14.370 and PF2e 8.7.0.

### Fixed
- Cast rank is now read from `flags.pf2e.origin.castRank`, the path PF2e itself uses. Heightened spells now land on the correct tier and signature word instead of falling back to the base rank.
- "Suppress Cantrip Incantations" no longer silences every spell. Cantrips are detected by their trait, since PF2e auto-heightens them and their cast rank is never 0.
- Spells cast from scrolls, wands, and staves resolve through PF2e's own message item, so they pick up the right rank and variant.
- Scroll animation mode now applies the tradition font and color correctly.
- Chat card whispers (GM Only / Author Only) pass user IDs as Foundry expects.

### Added
- Per-source easter egg sliders (0–100%, default 25%): Ultima Online, Skyrim Shouts, and Armageddon. The existing Easter Egg Incantations toggle remains the master switch.

### Changed
- Variable-summon element prompt moved from the V1 `Dialog` to `DialogV2` (V1 is removed in Foundry v16).
- Font file browser uses the namespaced `FilePicker` (the global is removed in Foundry v15).
- Easter egg lookup reads the compendium source from `_stats.compendiumSource`.
- Tradition falls back to the tradition PF2e stamps on the cast message before guessing from the actor.
- Chat card shows "Cantrip N" for cantrips instead of a bare rank.
- Manifest download URL is pinned to the release tag.
- Style debug logging moved from `console.log` to `console.debug`.

## 1.1.0
- Foundry v14 support: font configuration moved to `ApplicationV2` and `DialogV2`.
- UUID-based easter egg incantations (Ultima Online and Skyrim).

## 1.0.0
- Initial release.
