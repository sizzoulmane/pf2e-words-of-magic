/**
 * PF2e Words of Magic — Main
 * Entry point, settings, and hooks.
 *
 * Settings structure:
 *   General   : enabled, suppressCantrips, defaultTradition
 *   Canvas    : showAboveToken, displayMode, fontSize, scrollDuration, radiusOffset
 *   Fonts     : "Configure Fonts" menu button → FontConfigApp (per-tradition file paths)
 *   Chat      : showInChat, showTraditionTag, showWordBreakdown, showMetaLine, chatVisibility
 */

import { WordsOfMagicResolver } from "./resolver.js";
import { WordsOfMagicDisplay, preloadFonts } from "./display.js";
import { FontConfigApp, TRADITION_FONT_KEYS, DEFAULT_FONT_PATH } from "./font-config.js";

const MODULE_ID = "pf2e-words-of-magic";

// ── INIT ──────────────────────────────────────────────────────────────────────
Hooks.once("init", () => {
  console.log("PF2e Words of Magic | Initializing…");
  _registerFonts();
  _registerSettings();
});

/**
 * Register all bundled fonts with Foundry's font system via CONFIG.fontDefinitions.
 * This is the correct v13 approach — the "fonts" key in module.json is not
 * recognized in v13 and generates a manifest warning. CONFIG.fontDefinitions
 * set before the setup hook are automatically loaded during world initialization.
 */
function _registerFonts() {
  const FONTS_DIR = "modules/pf2e-words-of-magic/fonts/";
  const fonts = [
    { family: "Ultima Runes",      file: "UltimaRunes.ttf",      ext: "truetype" },
    { family: "Outer Rim AF",      file: "OuterRimAF.otf",       ext: "opentype" },
    { family: "Celestial",         file: "Celestial.ttf",         ext: "truetype" },
    { family: "Cthulhu Runes",     file: "CthulhuRunes.ttf",      ext: "truetype" },
    { family: "Mara's Eye",        file: "MarasEye.ttf",          ext: "truetype" },
    { family: "Drenn's Runes",     file: "DrennsRunes.ttf",       ext: "truetype" },
    { family: "Daedra",            file: "Daedra.otf",            ext: "opentype" },
    { family: "Daedra Bold",       file: "DaedaBold.otf",         ext: "opentype" },
    { family: "Iokharic",          file: "Iokharic.otf",          ext: "opentype" },
    { family: "Iokharic Bold",     file: "IokharicBold.otf",      ext: "opentype" },
    { family: "Mage Script",       file: "MageScript.otf",        ext: "opentype" },
    { family: "Mage Script Bold",  file: "MageScriptBold.otf",    ext: "opentype" },
    { family: "Unown Runes",       file: "UnownRunes.ttf",        ext: "truetype" },
    { family: "Runas",             file: "Runas.ttf",             ext: "truetype" },
  ];

  for (const { family, file, ext } of fonts) {
    CONFIG.fontDefinitions[family] = {
      editor: true,
      fonts: [{ urls: [`${FONTS_DIR}${file}`] }],
    };
  }
  console.log(`PF2e Words of Magic | Registered ${fonts.length} fonts with CONFIG.fontDefinitions.`);
}

Hooks.once("ready", async () => {
  console.log("PF2e Words of Magic | Ready — Live by the die, and die by the die.");
  if (game.system?.id !== "pf2e") {
    ui.notifications.warn("PF2e Words of Magic requires the Pathfinder 2e system.");
    return;
  }
  // Preload all four tradition fonts so the first spell cast doesn't stutter
  await preloadFonts();
});

// ── SPELL CAST HOOK ───────────────────────────────────────────────────────────
Hooks.on("createChatMessage", async (message) => {
  if (!game.settings.get(MODULE_ID, "enabled"))          return;
  if (message.flags?.[MODULE_ID]?.isIncantation)          return;

  const pf2e = message.flags?.pf2e;
  if (!pf2e?.origin || pf2e.origin.type !== "spell")      return;

  // Only fire on the initial spell cast card.
  //
  // PF2e sends multiple messages per cast:
  //   1. Spell card (has pf2e.casting, no damage context) ← we want this
  //   2. Damage roll  (no pf2e.casting, context.type = "damage-roll")
  //   3. Healing roll (no pf2e.casting, context.type = "healing-roll")
  //
  // Guard 1: pf2e.casting must exist — it's only on the initial cast message.
  // Guard 2: explicitly exclude known damage/heal context types as backstop.
  if (!pf2e.casting) return;
  const ctxType = pf2e.context?.type ?? "";
  if (ctxType === "damage-roll" || ctxType === "healing-roll") return;

  const castRank = pf2e.casting?.level ?? pf2e.origin?.level ?? 0;
  if (castRank === 0 && game.settings.get(MODULE_ID, "suppressCantrips")) return;

  let incantation;
  try {
    incantation = await WordsOfMagicResolver.resolve(message);
  } catch (err) {
    console.error("PF2e Words of Magic | Resolve error:", err);
    return;
  }
  if (!incantation) return;

  // Canvas: every client renders locally
  WordsOfMagicDisplay.showFloatingText(message, incantation);

  // Chat card: one authoritative post
  const activeGMs  = game.users.filter(u => u.isGM && u.active).sort((a, b) => a.id > b.id ? -1 : 1);
  const isMasterGM = activeGMs.length > 0 && game.user === activeGMs[0];
  const isAuthor   = message.author?.id === game.user.id;
  const noGM       = activeGMs.length === 0;

  if (isMasterGM || (noGM && isAuthor)) {
    await WordsOfMagicDisplay.postChatMessage(incantation);
  }
});

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function _registerSettings() {

  // ── General ────────────────────────────────────────────────────────────────
  game.settings.register(MODULE_ID, "enabled", {
    name: "Enable PF2e Words of Magic",
    hint: "Master switch — disable to silence all incantation output.",
    scope: "world", config: true, type: Boolean, default: true,
  });

  game.settings.register(MODULE_ID, "suppressCantrips", {
    name: "Suppress Cantrip Incantations",
    hint: "Skip incantations for cantrips to reduce noise at high levels.",
    scope: "world", config: true, type: Boolean, default: false,
  });

  game.settings.register(MODULE_ID, "defaultTradition", {
    name: "Default Tradition Fallback",
    hint: "Used when the caster's tradition cannot be determined from actor or spell data.",
    scope: "world", config: true, type: String,
    choices: { arcane: "Arcane", primal: "Primal", occult: "Occult", divine: "Divine" },
    default: "arcane",
  });

  // ── Canvas ─────────────────────────────────────────────────────────────────
  game.settings.register(MODULE_ID, "showAboveToken", {
    name: "Show Incantation on Canvas",
    hint: "Animate the incantation on the battle map when a spell is cast.",
    scope: "world", config: true, type: Boolean, default: true,
  });

  game.settings.register(MODULE_ID, "displayMode", {
    name: "Canvas Animation Mode",
    hint: "How the incantation phrase animates on the map.",
    scope: "world", config: true, type: String,
    choices: {
      arch:   "Arch — letters arc above the token and spin in place",
      burst:  "Burst — words explode outward in three directions",
      pulse:  "Pulse — phrase breathes with a slow magical glow",
      scroll: "Scroll — drifts upward from the token",
    },
    default: "burst",
  });

  game.settings.register(MODULE_ID, "fontSize", {
    name: "Canvas Font Size",
    hint: "Size of incantation text on the canvas (20–80).",
    scope: "world", config: true, type: Number,
    range: { min: 20, max: 80, step: 2 },
    default: 40,
  });

  game.settings.register(MODULE_ID, "scrollDuration", {
    name: "Canvas Display Duration (seconds)",
    hint: "How long the incantation stays visible. In Arch mode this equals one full revolution.",
    scope: "world", config: true, type: Number,
    range: { min: 1, max: 15, step: 0.5 },
    default: 6,
  });

  game.settings.register(MODULE_ID, "radiusOffset", {
    name: "Text Distance from Token Center",
    hint: "Adjusts how close or far the incantation sits from the token. 0 = auto-calculated from token size. Negative moves text closer; positive moves further out. Changes take effect immediately — no reload required.",
    scope: "world", config: true, type: Number,
    range: { min: -60, max: 200, step: 5 },
    default: 0,
  });

  // ── Font config menu button ─────────────────────────────────────────────────
  game.settings.registerMenu(MODULE_ID, "fontConfig", {
    name: "Configure Tradition Fonts",
    label: "Configure Fonts…",
    hint: "Choose a font file for each spell tradition. Opens a file browser pointed at the module's fonts folder. All traditions default to Ultima Runes.",
    icon: "fas fa-font",
    type: FontConfigApp,
    restricted: true,
  });

  // Hidden settings — font file path per tradition + dark divine.
  // Managed via FontConfigApp, not shown in the main config panel.
  for (const [trad, key] of Object.entries(TRADITION_FONT_KEYS)) {
    const defaults = {
      arcane:     "modules/pf2e-words-of-magic/fonts/UltimaRunes.ttf",
      primal:     "modules/pf2e-words-of-magic/fonts/OuterRimAF.otf",
      occult:     "modules/pf2e-words-of-magic/fonts/CthulhuRunes.ttf",
      divine:     "modules/pf2e-words-of-magic/fonts/Celestial.ttf",
      darkDivine: "modules/pf2e-words-of-magic/fonts/IokharicBold.otf",
    };
    game.settings.register(MODULE_ID, key, {
      name:    `Font Path — ${trad}`,
      scope:   "world",
      config:  false,
      type:    String,
      default: defaults[trad] ?? "modules/pf2e-words-of-magic/fonts/UltimaRunes.ttf",
    });
  }

  // ── Chat card ──────────────────────────────────────────────────────────────
  game.settings.register(MODULE_ID, "showSpellName", {
    name: "Chat Card: Show Spell Name",
    hint: "Controls when the spell name is revealed on the incantation card. 'PC + Allies' uses PF2e's token alliance — party-allied NPCs count as allies. Enemy and neutral casters always have their spell name hidden.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      always:    "Always — spell name always visible",
      allies:    "PC + Allies — hidden for enemies and neutrals (default)",
      pc:        "PC Only — hidden for all NPCs including allies",
      never:     "Never / GM Only — spell name hidden from players",
    },
    default: "allies",
  });

  game.settings.register(MODULE_ID, "showInChat", {
    name: "Show Incantation in Chat",
    hint: "Post a styled incantation card to the chat log.",
    scope: "world", config: true, type: Boolean, default: true,
  });

  game.settings.register(MODULE_ID, "showTraditionTag", {
    name: "Chat Card: Show Tradition",
    hint: "Show the colored [ARCANE] / [DIVINE] badge. Hide to let players hear only the words.",
    scope: "world", config: true, type: Boolean, default: true,
  });

  game.settings.register(MODULE_ID, "showWordBreakdown", {
    name: "Chat Card: Show Word Breakdown",
    hint: "Show the three labeled pills (Delivery + Element + Signature) beneath the phrase.",
    scope: "world", config: true, type: Boolean, default: true,
  });

  game.settings.register(MODULE_ID, "showMetaLine", {
    name: "Chat Card: Show Meta Line",
    hint: "Show the small Delivery · Element · Tier · Rank info line at the bottom.",
    scope: "world", config: true, type: Boolean, default: true,
  });

  game.settings.register(MODULE_ID, "chatVisibility", {
    name: "Chat Card Visibility",
    hint: "Who can see the incantation card in chat.",
    scope: "world", config: true, type: String,
    choices: { public: "Public — everyone", gm: "GM Only", self: "Message Author Only" },
    default: "public",
  });
}
