/**
 * PF2e Words of Magic — Resolver
 * Analyzes a PF2e spell chat message and resolves all components needed
 * to generate an incantation: tradition, delivery type, element, and tier.
 *
 * Resolution priority chain for element:
 *   1. Summon UUID lookup (hardcoded, authoritative)
 *   2. Direct damage traits: fire, cold, electricity, acid, force, void,
 *      vitality, sonic, mental, poison, earth, air, water, metal, wood
 *   3. Descriptor traits: healing, light, darkness, holy, unholy, death,
 *      detection, teleportation, dream, emotion, fear, illusion, curse
 *   4. Name keyword scan (fallback)
 *   5. Default → aether
 */

import {
  DELIVERY, ELEMENTS, TIER_NAMES, SIGNATURES,
  SUMMON_LOOKUP, SUMMON_NAME_FRAGMENTS,
  TRADITION_COLORS, TRADITION_LABELS,
} from "./vocabulary.js";
import { DARK_DIVINE_TRAITS } from "./font-config.js";

const MODULE_ID = "pf2e-words-of-magic";

// ── Priority-ordered damage traits ───────────────────────────────────────────
const DAMAGE_TRAITS = [
  "fire", "cold", "electricity", "acid", "void", "vitality",
  "sonic", "mental", "poison", "force", "earth", "air", "water",
  "metal", "wood",
];

// ── Descriptor traits → element ───────────────────────────────────────────────
const DESCRIPTOR_MAP = {
  healing:       "vitality",
  light:         "light",
  darkness:      "darkness",
  holy:          "vitality",
  unholy:        "void",
  death:         "void",
  detection:     "aether",
  teleportation: "aether",
  dream:         "mental",
  emotion:       "mental",
  fear:          "mental",
  illusion:      "mental",
  curse:         "aether",
};

// ── Name keyword fallback — only fires when NO trait matches ─────────────────
// Note: 'bolt' deliberately excluded (Blazing Bolt = fire, Briny Bolt = water
// — both resolved by direct trait check before this runs).
// 'Faerie Fire' excluded — its Remaster name 'Revealing Light' has [light] trait.
const NAME_KEYWORDS = [
  { kw: ["fireball","flame","fire ","ignit","scorch","cinder","pyre","cauteriz","funeral flame","sticky fire","flammable","divine immolation","blazing fissure","dragon turret","crimson breath","boil blood"], el: "fire" },
  { kw: ["frost","freeze","frozen","blizzard","glacial","ice ","chilling ","rime ","polar ","arctic","howling blizzard","cone of cold","wall of ice"], el: "cold" },
  { kw: ["lightning","electric","arc ","conductive","horizon thunder","live wire","draw the lightning","chain lightning","stormburst","sudden bolt"], el: "electricity" },
  { kw: ["aqueous","flood","wave ","tide ","briny","drizzle","hydraulic","geyser","quench","waterproof","water walk","sea surge","crashing wave","whirlpool","deluge"], el: "water" },
  { kw: ["tremor","quake","rubble","gravel","pebble","interposing earth","weaken earth","pummeling rubble","scouring sand","spike stones","shape stone","earthbind","exploding earth","heaving earth","earthquake","scatter scree","glass sand","pillars of sand","grasping earth","control sand","transmute rock"], el: "earth" },
  { kw: ["acid ","corros","caustic","vitrifying","rusting grasp","rust cloud","worm's repast"], el: "acid" },
  { kw: ["wind","gust ","breeze","cyclone","airburst","buffeting","tailwind","wall of wind","slashing gust","gale blast","gentle breeze","propulsive breeze","blast of the bellows","unseasonable squall","vacuum","whirlwind","punishing winds","ancestral winds"], el: "air" },
  { kw: ["heal","mend ","tend ","restore","cure ","recover","infuse vitality","soothe","stabilize","breath of life","cleanse affliction","regenerate","revival","vital beacon","fated healing","consecrate flesh","sound body"], el: "vitality" },
  { kw: ["void ","drain ","wither","decay ","siphon","annihilat","necrotic","necrotize"," harm ","death knell","vampiric","devouring void","void warp","grim tendrils","ancient dust","hungry depths","enervation","wails of the damned","ghoulish","bonewall","seize soul","massacre","divinity leech","disintegrate"], el: "void" },
  { kw: ["shadow ","umbral","shade ","eclipse","penumbral","shadow blast","shadow zombie","shadow raid","shadow siphon","gray shadow","unspeakable shadow","swallow light","feral shades","chilling darkness","ravenous darkness"], el: "darkness" },
  { kw: ["radiant","luminous","glow ","blinding","illuminate","holy light","wall of radiance","moonlight","divine lance","sunburst","moonburst","holy cascade","cloak of light","blanket of stars","everlight","divine aura","sacred nimbus","dawnflower","revealing light"], el: "light" },
  { kw: ["mental","mind ","psychic","telepat","charm ","dominate","suggestion","compel","confuse","daze ","sleep ","dream ","hypnot","enthrall","paranoia","dull ambition","warp mind","agonizing despair","synesthesia","overwhelming presence","phantom pain","befuddle","agitate","mind probe","synaptic pulse","hallucination","fabricated truth"], el: "mental" },
  { kw: ["poison","toxic ","venom","goblin pox","spider sting","abyssal plague","toxic cloud","wyvern sting","envenom"], el: "poison" },
  { kw: ["sonic","sound ","resonat","vibrat","haunting hymn","ghost sound","noise blast","sculpt sound","phantom orchestra","blistering invective","concordant choir","painful vibrations","spirit song"], el: "sonic" },
  { kw: ["magnetic","metal ","iron ","steel ","ferrous","clad in metal","wall of metal","fold metal","dismantle"], el: "metal" },
  { kw: ["plant ","flora ","fungus","thorn","briar","bark ","vine ","grove ","forest","verdant","nettleskin","weave wood","wall of thorns","take root","oaken","wooden","timber","lignify","field of razors","tanglecurse","entangle"], el: "wood" },
  { kw: ["missile","kinetic ram","force barrage","forceful hand"], el: "force" },
];

// ── Delivery type → summon name fragment patterns ────────────────────────────
const isSummonByName = (name) =>
  SUMMON_NAME_FRAGMENTS.some(frag => name.toLowerCase().includes(frag));

export class WordsOfMagicResolver {

  /** Rank → Tier.  Cantrip (rank 0) = tier 1. Cap at tier 5. */
  static rankToTier(rank) {
    if (!rank || rank <= 0) return 1;
    return Math.min(5, Math.ceil(rank / 2));
  }

  /**
   * Harden cast-rank resolution against the many ways PF2e stores it.
   *
   * Known paths that can carry the actual cast rank:
   *   flags.pf2e.casting.level      — standard player cast (most reliable)
   *   flags.pf2e.origin.level       — some NPC / ancient spellcasting entries
   *   flags.pf2e.spellLevel         — older flag path, still appears on some builds
   *   message.system?.value         — PF2e v7 system-level storage (some versions)
   *   HTML data-cast-level          — present in rendered spell card content
   *   HTML data-spell-level         — alternate attribute name
   *   spell.system.level.value      — spell BASE rank (last resort — wrong for
   *                                   heightened spells but better than 1)
   *
   * The dragon ancient-spellcasting case specifically needs the HTML fallback
   * because the flag path isn't always populated for innate/ancient entries.
   */
  static resolveCastRank(message, spell) {
    const pf2e = message.flags?.pf2e ?? {};

    // Flag paths — try each in priority order
    const fromFlags =
      pf2e.casting?.level ??
      pf2e.spellLevel ??
      pf2e.origin?.level ??
      null;

    if (fromFlags && Number.isInteger(fromFlags) && fromFlags > 0) return fromFlags;

    // System data path (PF2e v7+ on some message types)
    const fromSystem = message.system?.value;
    if (fromSystem && Number.isInteger(fromSystem) && fromSystem > 0) return fromSystem;

    // Parse from rendered HTML — reliable fallback for NPCs, ancient casters,
    // and Divine Font spells which use a different spellcasting entry type.
    if (message.content) {
      const castMatch      = message.content.match(/data-cast-level="(\d+)"/);
      const levelMatch     = message.content.match(/data-spell-level="(\d+)"/);
      const rankMatch      = message.content.match(/data-rank="(\d+)"/);
      // PF2e v7 Divine Font and heightened spells use data-heightened-level
      const heightenMatch  = message.content.match(/data-heightened-level="(\d+)"/);
      const slotMatch      = message.content.match(/data-slot-level="(\d+)"/);
      const parsed = parseInt(
        castMatch?.[1] ??
        heightenMatch?.[1] ??
        slotMatch?.[1] ??
        levelMatch?.[1] ??
        rankMatch?.[1] ??
        "0"
      );
      if (parsed > 0) return parsed;

      // PF2e renders a visible rank badge — parse it as a last HTML resort
      const badgeMatch = message.content.match(/Rank\s+(\d+)|rank-(\d+)|spell-level[^>]+>(\d+)/i);
      if (badgeMatch) {
        const n = parseInt(badgeMatch[1] ?? badgeMatch[2] ?? badgeMatch[3] ?? "0");
        if (n > 0) return n;
      }
    }

    // Final fallback: spell base rank (correct for non-heightened, wrong for heightened,
    // but prevents the tier-1 collapse that was showing up in testing)
    const baseRank = spell.system?.level?.value ?? 1;
    console.debug(`PF2e Words of Magic | Cast rank not found in flags/HTML for "${spell.name}", using base rank ${baseRank}`);
    return baseRank;
  }

  // ── SIGNATURE ───────────────────────────────────────────────────────────────
  /**
   * Generate a stable per-spell-per-rank signature syllable.
   * Seeds the hash with BOTH the item ID and the cast rank so that the same
   * spell cast at different ranks (e.g. Lightning Bolt in slots 3, 4, 5)
   * always produces distinct third words.
   *
   * Hash: djb2-style over (itemId + ":" + castRank) → mod table length.
   */
  static resolveSignature(spell, tradition, castRank = 1) {
    const itemId  = this.extractItemId(spell.uuid ?? spell.id ?? spell.name ?? "unknown");
    const seed    = `${itemId}:${castRank}`;
    let   hash    = 5381;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) + hash) ^ seed.charCodeAt(i);
      hash = hash & 0x7FFFFFFF; // keep positive 31-bit
    }
    const table = SIGNATURES[tradition] ?? SIGNATURES.arcane;
    return table[hash % table.length];
  }

  static getSignatureWord(spell, tradition, castRank = 1) {
    return this.resolveSignature(spell, tradition, castRank);
  }

  /** Extract the item ID from a full Foundry UUID. */
  static extractItemId(uuid = "") {
    const parts = uuid.split(".");
    return parts[parts.length - 1];
  }

  // ── DELIVERY ────────────────────────────────────────────────────────────────
  static resolveDelivery(spell) {
    const traits = spell.system?.traits?.value ?? [];
    const area   = spell.system?.area;
    const range  = (spell.system?.range?.value  ?? "").toLowerCase();
    const target = (spell.system?.target?.value ?? "").toLowerCase();
    const name   = spell.name.toLowerCase();

    // Summon check: UUID lookup first, then name patterns
    const itemId = this.extractItemId(spell.uuid ?? "");
    if (SUMMON_LOOKUP[itemId] || isSummonByName(name)) return "summon";

    // Area type
    if (area?.type) {
      const areaMap = {
        burst:     "burst",
        cone:      "cone",
        line:      "line",
        emanation: "emanation",
        radius:    "emanation",
      };
      if (areaMap[area.type]) return areaMap[area.type];
    }

    // Touch
    if (range === "touch" || range.startsWith("touch")) return "touch";

    // Ray — by name or range
    if (name.includes(" ray") || name.endsWith("ray") || range.includes("ray")) return "ray";

    // Self-only spells
    const selfTarget = !target || target === "self" || target === "you" || target.startsWith("you");
    const noRange    = !range || range === "" || range === "—" || range === "-";
    if (selfTarget && noRange) return "self";

    // Default: single-target point
    return "point";
  }

  // ── ELEMENT ─────────────────────────────────────────────────────────────────
  static resolveElement(spell) {
    const itemId = this.extractItemId(spell.uuid ?? "");
    const traits = spell.system?.traits?.value ?? [];

    // 1. Summon UUID lookup
    const summonEntry = SUMMON_LOOKUP[itemId];
    if (summonEntry) return summonEntry.element;

    // 2. Direct damage traits (priority ordered)
    for (const t of DAMAGE_TRAITS) {
      if (traits.includes(t)) return t;
    }

    // 3. Descriptor traits
    for (const [trait, element] of Object.entries(DESCRIPTOR_MAP)) {
      if (traits.includes(trait)) return element;
    }

    // 4. Name keyword scan (last resort)
    const spellName = " " + spell.name.toLowerCase() + " ";
    for (const { kw, el } of NAME_KEYWORDS) {
      for (const fragment of kw) {
        if (spellName.includes(fragment)) return el;
      }
    }

    // 5. Default
    return "aether";
  }

  // ── TRADITION ───────────────────────────────────────────────────────────────
  static resolveTradition(actor, spell, messageFlags) {
    const fallback = game.settings.get(MODULE_ID, "defaultTradition") ?? "arcane";

    // Spellcasting entry ID from PF2e message flags
    if (actor && messageFlags?.casting?.id) {
      const entry = actor.spellcasting?.find(e => e.id === messageFlags.casting.id);
      if (entry?.tradition) return entry.tradition;
    }

    // Primary non-innate spellcasting entry
    if (actor?.spellcasting) {
      const primary = actor.spellcasting.find(e => !e.isInnate && e.tradition);
      if (primary?.tradition) return primary.tradition;
    }

    // Spell's own traditions list
    const traditions = spell.system?.traits?.traditions ?? [];
    if (traditions.length > 0) return traditions[0];

    return fallback;
  }

  // ── VARIABLE SUMMON DIALOG ──────────────────────────────────────────────────
  static promptVariableElement(summonEntry) {
    return new Promise((resolve) => {
      const buttons = {};
      for (const opt of (summonEntry.options ?? ["aether"])) {
        buttons[opt] = {
          label: opt.charAt(0).toUpperCase() + opt.slice(1),
          callback: () => resolve(opt),
        };
      }
      new Dialog({
        title: `PF2e Words of Magic — ${summonEntry.name ?? "Summon"}`,
        content: `<p style="margin:8px 0">Which element is being summoned?</p>`,
        buttons,
        default: (summonEntry.options ?? ["aether"])[0],
        close: () => resolve("aether"),
      }).render(true);
    });
  }

  // ── WORD LOOKUP ─────────────────────────────────────────────────────────────
  static getDeliveryWord(delivery, tradition) {
    return DELIVERY[delivery]?.[tradition]
        ?? DELIVERY.point[tradition]
        ?? "...";
  }

  static getElementWord(element, tier, tradition) {
    return ELEMENTS[element]?.[tier]?.[tradition]
        ?? ELEMENTS.aether[1][tradition]
        ?? "...";
  }

  static getTierName(element, tier) {
    return TIER_NAMES[element]?.[tier - 1] ?? "Unknown";
  }

  // ── MAIN ENTRY POINT ────────────────────────────────────────────────────────
  /**
   * Resolve a full incantation from a PF2e spell chat message.
   * Returns null if the message is not a spell cast.
   *
   * @param {ChatMessage} message
   * @returns {Promise<object|null>}
   */
  static async resolve(message) {
    const pf2eFlags = message.flags?.pf2e;
    if (!pf2eFlags?.origin) return null;

    const origin = pf2eFlags.origin;
    if (origin.type !== "spell") return null;

    // Load the spell item
    let spell;
    try {
      spell = await fromUuid(origin.uuid);
    } catch (e) {
      console.warn(`PF2e Words of Magic | Could not load spell UUID: ${origin.uuid}`, e);
      return null;
    }
    if (!spell) return null;

    // Actor — use PF2e's own message.actor property which correctly resolves
    // synthetic token actors (unlinked NPCs). This is the root cause of the
    // previous failures: game.actors.get() only finds world-linked actors.
    const actor = message.actor
               ?? ChatMessage.getSpeakerActor(message.speaker)
               ?? null;

    // Cast rank — use hardened multi-path resolver
    const castRank = this.resolveCastRank(message, spell);

    const tier      = this.rankToTier(castRank);
    const tradition = this.resolveTradition(actor, spell, pf2eFlags);
    const delivery  = this.resolveDelivery(spell);
    let   element   = this.resolveElement(spell);

    // Handle variable summons — prompt the caster for element choice
    if (element === "variable") {
      const itemId      = this.extractItemId(spell.uuid ?? "");
      const summonEntry = SUMMON_LOOKUP[itemId];
      if (summonEntry && (message.isAuthor || game.user.isGM)) {
        element = await this.promptVariableElement(summonEntry);
      } else {
        element = "aether";
      }
    }

    // Look up the actual words
    const deliveryWord   = this.getDeliveryWord(delivery, tradition);
    const elementWord    = this.getElementWord(element, tier, tradition);
    const signatureWord  = this.getSignatureWord(spell, tradition, castRank);
    const tierName       = this.getTierName(element, tier);

    // Dark divine detection — any caster carrying fiend/undead/unholy traits
    // gets the Mara's Eye treatment regardless of spell tradition.
    // Removing the tradition===divine guard because innate NPC spellcasting
    // entries are skipped by resolveTradition, so a Balor may resolve to
    // "arcane" fallback even though all its spells are unholy in character.
    const isDarkDivine = this._hasDarkTraits(actor);
    console.debug(
      `PF2e Words of Magic | ${spell.name} — tradition: "${tradition}", ` +
      `isDarkDivine: ${isDarkDivine}, ` +
      `actorTraits: [${actor?.system?.traits?.value?.join(", ") ?? "none"}]`
    );

    // Full three-word incantation
    const phrase = `${deliveryWord} ${elementWord} ${signatureWord}`;

    return {
      spell,
      spellName:     spell.name,
      castRank,
      tier,
      tierName,
      tradition,
      delivery,
      element,
      deliveryWord,
      elementWord,
      signatureWord,
      isDarkDivine,
      phrase,
      actor,
    };
  }

  /**
   * Check whether an actor carries traits marking them as a dark caster.
   *
   * PF2e v7+ exposes actor.traits as a proper Set — use .has() for O(1) checks.
   * Falls back to actor.system.traits.value array for older data shapes.
   * Also checks the token document's own traits in case the token overrides them.
   */
  static _hasDarkTraits(actor) {
    if (!actor) return false;

    // PF2e v7+ Set-based traits (most reliable)
    if (actor.traits instanceof Set) {
      for (const t of DARK_DIVINE_TRAITS) {
        if (actor.traits.has(t)) {
          console.debug(`PF2e Words of Magic | Dark trait found via Set: "${t}"`);
          return true;
        }
      }
    }

    // Array fallback — actor.system.traits.value
    const traitArr = actor.system?.traits?.value ?? [];
    if (traitArr.some(t => DARK_DIVINE_TRAITS.has(t))) return true;

    // Token-level trait override (some NPC tokens carry their own trait list)
    const tokenDoc    = actor.token ?? actor.prototypeToken;
    const tokenTraits = tokenDoc?.system?.traits?.value
                     ?? tokenDoc?.actor?.system?.traits?.value
                     ?? [];
    return tokenTraits.some(t => DARK_DIVINE_TRAITS.has(t));
  }
}
