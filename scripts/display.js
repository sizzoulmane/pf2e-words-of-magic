/**
 * PF2e Words of Magic — Display
 *
 * Canvas animation modes:
 *   arch   — Characters placed along a top arc, tangent-rotated, spinning in place.
 *   burst  — Three words shoot outward in different directions.
 *   pulse  — Phrase hovers and breathes with a slow oscillating glow.
 *   scroll — Classic upward drift.
 *
 * Font: per-tradition path setting → resolveFont() → CSS/PIXI family string.
 * Radius: all modes respect the "radiusOffset" slider.
 */

import { TRADITION_COLORS, TRADITION_LABELS, DELIVERY_LABELS } from "./vocabulary.js";
import {
  TRADITION_FONT_KEYS, BUNDLED_FONT_MAP, DEFAULT_FONT_PATH,
  DARK_DIVINE_COLOR, ensureFontLoaded,
} from "./font-config.js";

const MODULE_ID = "pf2e-words-of-magic";

const get  = (key) => game.settings.get(MODULE_ID, key);
const cap  = (s="") => s.charAt(0).toUpperCase() + s.slice(1);

// ── Font resolution ───────────────────────────────────────────────────────────
/**
 * Returns a PIXI-ready font-family string.
 * When isDarkDivine is true, reads the darkDivine font path instead of divine.
 */
/**
 * Returns the font family name string for CSS use (dialog previews etc).
 */
export function resolveFontFamily(tradition = "arcane", isDarkDivine = false) {
  const tradKey  = isDarkDivine ? "darkDivine" : tradition;
  const key      = TRADITION_FONT_KEYS[tradKey] ?? TRADITION_FONT_KEYS.arcane;
  const path     = (get(key) ?? "").trim() || DEFAULT_FONT_PATH;
  const filename = path.split("/").pop();
  return BUNDLED_FONT_MAP[filename]
      ?? filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9 '_-]/g, "")
      ?? "Ultima Runes";
}

/**
 * Returns fontFamily as an ARRAY for PIXI.TextStyle.
 * PIXI does not parse CSS font stacks — it needs an array of family names.
 * Passing a CSS string like '"Mara\'s Eye", Georgia, serif' causes PIXI to
 * treat the entire string including quotes and commas as the family name,
 * fail silently, and fall back to its internal default (wrong font + wrong size).
 */
export function resolveFontArray(tradition = "arcane", isDarkDivine = false) {
  const primary = resolveFontFamily(tradition, isDarkDivine);
  return [primary, "Georgia", "Times New Roman", "serif"];
}

/**
 * Returns the display color for this incantation.
 * Dark divine overrides to crimson regardless of tradition color.
 */
export function resolveColor(tradition, isDarkDivine = false) {
  if (isDarkDivine) return DARK_DIVINE_COLOR;
  return TRADITION_COLORS[tradition] ?? "#FFFFFF";
}

/**
 * Preload all four tradition fonts at module ready so they're available
 * on the first spell cast without async delays.
 */
export async function preloadFonts() {
  const size = game.settings.get(MODULE_ID, "fontSize") ?? 40;
  for (const [trad, key] of Object.entries(TRADITION_FONT_KEYS)) {
    const path = (get(key) ?? "").trim() || DEFAULT_FONT_PATH;
    // ensureFontLoaded handles both FontFace injection and PIXI atlas warmup
    // with padding:20 matching makeStyle. Do NOT add a second warmup here —
    // a second render without padding overwrites the atlas metrics and causes clipping.
    await ensureFontLoaded(path, size).catch(() => {});
  }
  console.log("PF2e Words of Magic | All fonts preloaded.");
}

// ── v13-safe token resolution ─────────────────────────────────────────────────
function resolveTokenObj(tokenId) {
  if (!tokenId) return null;
  const doc = canvas.scene?.tokens?.get(tokenId);
  if (doc?.object) return doc.object;
  return canvas.tokens?.placeables?.find(
    t => t.id === tokenId || t.document?.id === tokenId
  ) ?? null;
}

function tokenBounds(t) {
  const g  = canvas.grid?.size ?? 100;
  const dw = t.document?.width  ?? 1;
  const dh = t.document?.height ?? 1;
  return {
    cx: (t.x ?? 0) + dw * g / 2,
    cy: (t.y ?? 0) + dh * g / 2,
    w:  dw * g,
    h:  dh * g,
  };
}

// ── PIXI text style ───────────────────────────────────────────────────────────
function makeStyle(tradition, isDarkDivine = false, overrides = {}) {
  const color      = resolveColor(tradition, isDarkDivine);
  const fontSize   = get("fontSize") ?? 40;
  const fontFamily = resolveFontArray(tradition, isDarkDivine);
  const padding    = Math.ceil(fontSize * 0.75) + 15;

  console.log(`PF2e Words of Magic | makeStyle — font:"${fontFamily[0]}" size:${fontSize} padding:${padding} color:${color}`);

  return new PIXI.TextStyle({
    fontSize,
    fontFamily,
    align:              "center",
    fill:               color,
    stroke:             "#000000",
    strokeThickness:    5,
    dropShadow:         true,
    dropShadowColor:    color,
    dropShadowBlur:     18,
    dropShadowDistance: 0,
    dropShadowAlpha:    0.9,
    wordWrap:           false,
    padding,
    ...overrides,
  });
}

// ── Spell name visibility ─────────────────────────────────────────────────────
/**
 * Determines whether the spell name should be shown on the chat card.
 *
 * PF2e alliance values on token documents:
 *   "party"      — friendly / allied (includes party-allied NPCs)
 *   "opposition" — enemy
 *   null         — neutral / unknown
 *
 * Actor type "character" = player character.
 * Actor type "npc"       = NPC (could be ally or enemy depending on alliance).
 */
function resolveSpellNameVisible(actor) {
  const setting = get("showSpellName") ?? "allies";

  if (setting === "always") return true;
  if (setting === "never")  return false;

  const isPC      = actor?.type === "character";
  const alliance  = actor?.token?.alliance
                 ?? actor?.prototypeToken?.disposition === 1 ? "party"
                 : actor?.prototypeToken?.disposition === -1 ? "opposition"
                 : null;
  // PF2e sets token.alliance directly on synthetic tokens;
  // for linked actors fall back to prototypeToken disposition flags.
  const isAlly    = isPC || alliance === "party";

  if (setting === "allies") return isAlly;
  if (setting === "pc")     return isPC;
  return false;
}

export class WordsOfMagicDisplay {

  // ── Main dispatch ─────────────────────────────────────────────────────────
  static async showFloatingText(message, incantation) {
    if (!get("showAboveToken")) return;
    if (!canvas?.interface)     return;

    const tokenObj = resolveTokenObj(message.speaker?.token);
    if (!tokenObj) {
      console.debug("PF2e Words of Magic | Token not on canvas — skipping canvas text.");
      return;
    }

    const tradKey  = incantation.isDarkDivine ? "darkDivine" : incantation.tradition;
    const fontKey  = TRADITION_FONT_KEYS[tradKey] ?? TRADITION_FONT_KEYS.arcane;
    const fontPath = (get(fontKey) ?? "").trim() || DEFAULT_FONT_PATH;
    await ensureFontLoaded(fontPath, get("fontSize") ?? 40);

    const mode = get("displayMode") ?? "burst";
    ({
      arch:   () => this._showArch(tokenObj, incantation),
      burst:  () => this._showBurst(tokenObj, incantation),
      pulse:  () => this._showPulse(tokenObj, incantation),
      scroll: () => this._showScroll(tokenObj, incantation),
    }[mode] ?? (() => this._showScroll(tokenObj, incantation)))();
  }

  // ── ARCH ────────────────────────────────────────────────────────────────────
  /**
   * Characters placed individually along a 200° arc, tangent-rotated.
   * Faint tradition-colored ring traces the arc. Spins one revolution, fades.
   * radiusOffset adds to the auto-calculated orbital radius.
   */
  static _showArch(tokenObj, incantation) {
    const { cx, cy, w, h } = tokenBounds(tokenObj);
    const color    = resolveColor(incantation.tradition, incantation.isDarkDivine);
    const colorInt = parseInt(color.replace("#", ""), 16);
    const duration = get("scrollDuration") * 1000;
    const offset   = get("radiusOffset") ?? 0;
    const radius   = Math.max(w, h) / 2 + 70 + offset;

    const container = new PIXI.Container();
    container.position.set(cx, cy);
    container.zIndex = 999;

    const ring = new PIXI.Graphics();
    ring.lineStyle(1, colorInt, 0.20);
    ring.drawCircle(0, 0, radius);
    container.addChild(ring);

    const chars      = [...incantation.phrase];
    const arcSpan    = (200 * Math.PI) / 180;
    const startAngle = -Math.PI / 2 - arcSpan / 2;
    const step       = chars.length > 1 ? arcSpan / (chars.length - 1) : 0;

    // One-frame delay before creating Text objects — ensures font atlas is ready
    requestAnimationFrame(() => {
      chars.forEach((ch, i) => {
        if (ch === " ") return;
        const angle   = startAngle + step * i;
        // Fresh style per character — never share a PIXI.TextStyle instance
        const charObj = new PIXI.Text(ch, makeStyle(incantation.tradition, incantation.isDarkDivine));
        charObj.anchor.set(0.5, 1.0);
        charObj.position.set(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius
        );
        charObj.rotation = angle + Math.PI / 2;
        container.addChild(charObj);
      });

      canvas.interface.sortableChildren = true;
      canvas.interface.addChild(container);

      const start = performance.now();
      const tick  = () => {
        const p = Math.min((performance.now() - start) / duration, 1);
        container.rotation = p * Math.PI * 2;
        if (p >= 0.70) container.alpha = 1 - (p - 0.70) / 0.30;
        if (p >= 1) {
          canvas.app.ticker.remove(tick);
          container.parent?.removeChild(container);
          container.destroy({ children: true });
        }
      };
      canvas.app.ticker.add(tick);
    });
  }

  // ── BURST ────────────────────────────────────────────────────────────────────
  /**
   * Three words shoot outward one after another with a short stagger.
   * Each word gets its own fresh PIXI.TextStyle instance — sharing a single
   * style object causes PIXI to corrupt internal metrics after the first
   * render, breaking font and size on subsequent text objects.
   * A one-frame delay before any text is created lets PIXI finish building
   * the font atlas from the preload warmup so the first word isn't clipped.
   */
  static _showBurst(tokenObj, incantation) {
    const { cx, cy, w, h } = tokenBounds(tokenObj);
    const duration  = get("scrollDuration") * 1000;
    const offset    = get("radiusOffset") ?? 0;

    const baseTravel = Math.max(w, h) / 2 + 80 + Math.max(0, offset);
    const staggerMs  = Math.min(280, duration * 0.12);

    // Easter egg: use the phrase words instead of the formula words.
    // Long phrases (4+ words, e.g. Armageddon) rise as a single centered
    // text rather than bursting apart — keeps it readable and dramatic.
    let words;
    if (incantation.isEasterEgg) {
      const phraseWords = incantation.phrase.split(" ");
      if (phraseWords.length <= 3) {
        words = phraseWords;
      } else {
        // Show as single rising text — reuse the scroll path
        return this._showEasterEggRise(tokenObj, incantation);
      }
    } else {
      words = [incantation.deliveryWord, incantation.elementWord, incantation.signatureWord];
    }

    const angles = [-3 * Math.PI / 4, -Math.PI / 2, -Math.PI / 4];

    canvas.interface.sortableChildren = true;

    requestAnimationFrame(() => {
      words.forEach((word, i) => {
        const style = makeStyle(incantation.tradition, incantation.isDarkDivine);

        const delay   = i * staggerMs;
        const wordDur = duration - delay;
        const angle   = (angles[i] ?? -Math.PI / 2) + (Math.random() - 0.5) * 0.12;
        const travel  = baseTravel + Math.random() * 15;

        const obj = new PIXI.Text(word, style);
        obj.anchor.set(0.5, 0.5);
        obj.position.set(cx, cy);
        obj.alpha  = 0;
        obj.zIndex = 999;
        canvas.interface.addChild(obj);

        const launchTime = performance.now() + delay;

        const tick = () => {
          const now = performance.now();
          if (now < launchTime) return;

          const p    = Math.min((now - launchTime) / wordDur, 1);
          const ease = 1 - Math.pow(1 - p, 2);

          obj.alpha = p < 0.50 ? 1 : 1 - (p - 0.50) / 0.50;
          obj.x     = cx + Math.cos(angle) * ease * travel;
          obj.y     = cy + Math.sin(angle) * ease * travel;

          if (p >= 1) {
            canvas.app.ticker.remove(tick);
            obj.parent?.removeChild(obj);
            obj.destroy();
          }
        };

        canvas.app.ticker.add(tick);
      });
    });
  }

  // ── EASTER EGG RISE ──────────────────────────────────────────────────────────
  /**
   * Long easter egg phrases (4+ words) rise as a single text directly above
   * the token. Used for Armageddon and other multi-word incantations that
   * would be unreadable if burst apart.
   */
  static _showEasterEggRise(tokenObj, incantation) {
    const { cx, cy, h } = tokenBounds(tokenObj);
    const duration = get("scrollDuration") * 1000;
    const offset   = get("radiusOffset") ?? 0;
    const travel   = h / 2 + 100 + Math.max(0, offset);

    canvas.interface.sortableChildren = true;

    requestAnimationFrame(() => {
      const style = makeStyle(incantation.tradition, incantation.isDarkDivine);
      const obj   = new PIXI.Text(incantation.phrase, style);
      obj.anchor.set(0.5, 0.5);
      obj.position.set(cx, cy);
      obj.alpha  = 0;
      obj.zIndex = 999;
      canvas.interface.addChild(obj);

      const start = performance.now();

      const tick = () => {
        const p    = Math.min((performance.now() - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 2);

        obj.alpha = p < 0.40 ? p / 0.40 : 1 - (p - 0.40) / 0.60;
        obj.y     = cy - ease * travel;

        if (p >= 1) {
          canvas.app.ticker.remove(tick);
          obj.parent?.removeChild(obj);
          obj.destroy();
        }
      };

      canvas.app.ticker.add(tick);
    });
  }

  // ── PULSE ────────────────────────────────────────────────────────────────────
  /**
   * Phrase hovers above the token and breathes with a slow oscillating glow.
   * radiusOffset shifts the hover height above the token.
   */
  static _showPulse(tokenObj, incantation) {
    const { cx, cy, h } = tokenBounds(tokenObj);
    const duration  = get("scrollDuration") * 1000;
    const offset    = get("radiusOffset") ?? 0;
    const fontSize  = get("fontSize") ?? 40;

    const hoverY = cy - h / 2 - fontSize * 0.9 - Math.max(0, offset);

    requestAnimationFrame(() => {
      const text = new PIXI.Text(incantation.phrase, makeStyle(incantation.tradition, incantation.isDarkDivine));
      text.anchor.set(0.5, 0.5);
      text.position.set(cx, hoverY);
      text.zIndex = 999;
      canvas.interface.sortableChildren = true;
      canvas.interface.addChild(text);

      const start    = performance.now();
      const beatHz   = 1.1;
      const fadeAt   = 0.75;

      const tick = () => {
        const p    = Math.min((performance.now() - start) / duration, 1);
        const beat = (Math.sin(p * duration / 1000 * beatHz * Math.PI * 2) + 1) / 2;
        text.scale.set(0.92 + beat * 0.16);
        text.alpha = p >= fadeAt
          ? 1 - (p - fadeAt) / (1 - fadeAt)
          : 0.85 + beat * 0.15;
        if (p >= 1) {
          canvas.app.ticker.remove(tick);
          text.parent?.removeChild(text);
          text.destroy();
        }
      };
      canvas.app.ticker.add(tick);
    });
  }

  // ── SCROLL ────────────────────────────────────────────────────────────────────
  /**
   * Classic upward drift. radiusOffset shifts start position upward.
   */
  static _showScroll(tokenObj, incantation) {
    const { cx, cy, h } = tokenBounds(tokenObj);
    const color    = resolveColor(incantation.tradition, incantation.isDarkDivine);
    const duration = get("scrollDuration") * 1000;
    const offset   = get("radiusOffset") ?? 0;
    const style    = makeStyle(incantation.tradition, incantation.isDarkDivine);
    const startY   = cy - h / 2 - Math.max(0, offset);

    canvas.interface.sortableChildren = true;
    canvas.interface.createScrollingText(
      { x: cx, y: startY },
      incantation.phrase,
      {
        anchor:             CONST.TEXT_ANCHOR_POINTS.BOTTOM,
        direction:          CONST.TEXT_ANCHOR_POINTS.TOP,
        duration,
        distance:           160 + Math.max(0, offset),
        jitter:             0.04,
        zIndex:             999,
        ...style,
      }
    );
  }

  // ── CHAT CARD ─────────────────────────────────────────────────────────────────
  static async postChatMessage(incantation) {
    if (!get("showInChat")) return;

    const tColor   = resolveColor(incantation.tradition, incantation.isDarkDivine);
    const tLabel   = incantation.isDarkDivine
                   ? `${TRADITION_LABELS[incantation.tradition] ?? "Divine"} ✦ Dark`
                   : (TRADITION_LABELS[incantation.tradition] ?? "Unknown");
    const dLabel   = DELIVERY_LABELS[incantation.delivery]   ?? incantation.delivery;
    const elLabel  = cap(incantation.element);

    const fontFamily  = resolveFontFamily(incantation.tradition, incantation.isDarkDivine);
    const phraseStyle = `font-family:"${fontFamily}", Georgia, serif; letter-spacing:3px;`;

    // Spell name visibility — based on caster type and alliance
    const showName    = resolveSpellNameVisible(incantation.actor);
    const spellNameHTML = showName
      ? `<span class="wom-spell-name">${incantation.spellName}</span>`
      : `<span class="wom-spell-name wom-spell-hidden" title="Spell name hidden">[Unknown Spell]</span>`;

    const traditionHTML = get("showTraditionTag")
      ? `<span class="wom-tag">${tLabel}</span>` : ``;

    const breakdownHTML = get("showWordBreakdown") && !incantation.isEasterEgg ? `
  <div class="wom-breakdown">
    <span class="wom-word wom-delivery"  title="${dLabel} — Delivery">${incantation.deliveryWord}</span>
    <span class="wom-sep">+</span>
    <span class="wom-word wom-element"   title="${elLabel} · ${incantation.tierName} — Element">${incantation.elementWord}</span>
    <span class="wom-sep">+</span>
    <span class="wom-word wom-signature" title="Signature (Rank ${incantation.castRank || "C"})">${incantation.signatureWord}</span>
  </div>` : ``;

    const metaHTML = get("showMetaLine") && !incantation.isEasterEgg
      ? `<div class="wom-meta">${dLabel} &middot; ${elLabel} (${incantation.tierName}) &middot; Tier&nbsp;${incantation.tier} &middot; Rank&nbsp;${incantation.castRank || "C"}</div>`
      : ``;

    const content = `
<div class="pf2e-wom-card" style="--wom-color:${tColor};">
  <div class="wom-header">
    ${traditionHTML}
    ${spellNameHTML}
  </div>
  <div class="wom-phrase" style="${phraseStyle}">${incantation.phrase}</div>
  ${breakdownHTML}
  ${metaHTML}
</div>`.trim();

    const visibility = get("chatVisibility") ?? "public";
    const whisper    = visibility === "gm"   ? ChatMessage.getWhisperRecipients("GM")
                     : visibility === "self" ? [game.user]
                     : [];

    await ChatMessage.create({
      content,
      speaker: { alias: "⚔ PF2e Words of Magic" },
      whisper,
      flags: { [MODULE_ID]: { isIncantation: true } },
    });
  }
}
