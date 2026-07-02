/**
 * PF2e Words of Magic — Font Configuration
 *
 * Manages per-tradition font file paths via a FormApplication dialog.
 * Five rows: Arcane, Primal, Occult, Divine, Dark Divine.
 *
 * Dark Divine applies when a Divine-tradition caster has traits marking
 * them as a fiend, undead, or unholy creature — detected at cast time
 * in resolver.js and honoured in display.js.
 */

const MODULE_ID = "pf2e-words-of-magic";
const FONTS_DIR = "modules/pf2e-words-of-magic/fonts/";

export const DEFAULT_FONT_PATH = `${FONTS_DIR}UltimaRunes.ttf`;

// Bundled filename → registered CSS/PIXI family name
export const BUNDLED_FONT_MAP = {
  "UltimaRunes.ttf":      "Ultima Runes",
  "OuterRimAF.otf":       "Outer Rim AF",
  "Celestial.ttf":        "Celestial",
  "CthulhuRunes.ttf":     "Cthulhu Runes",
  "MarasEye.ttf":         "Mara's Eye",
  "DrennsRunes.ttf":      "Drenn's Runes",
  "Daedra.otf":           "Daedra",
  "DaedaBold.otf":        "Daedra Bold",
  "Iokharic.otf":         "Iokharic",
  "IokharicBold.otf":     "Iokharic Bold",
  "MageScript.otf":       "Mage Script",
  "MageScriptBold.otf":   "Mage Script Bold",
  "UnownRunes.ttf":       "Unown Runes",
  "Runas.ttf":            "Runas",
};

// Setting keys for each tradition + dark divine variant
export const TRADITION_FONT_KEYS = {
  arcane:     "fontPathArcane",
  primal:     "fontPathPrimal",
  occult:     "fontPathOccult",
  divine:     "fontPathDivine",
  darkDivine: "fontPathDarkDivine",
};

// Defaults — one path per tradition
export const TRADITION_FONT_DEFAULTS = {
  arcane:     `${FONTS_DIR}UltimaRunes.ttf`,
  primal:     `${FONTS_DIR}OuterRimAF.otf`,
  occult:     `${FONTS_DIR}CthulhuRunes.ttf`,
  divine:     `${FONTS_DIR}Celestial.ttf`,
  darkDivine: `${FONTS_DIR}IokharicBold.otf`,
};

// Dark divine color — vivid crimson, replaces the ceremonial gold of normal Divine
export const DARK_DIVINE_COLOR = "#C0392B";

// Traits that mark a caster as dark divine
export const DARK_DIVINE_TRAITS = new Set([
  "undead", "fiend", "devil", "demon", "daemon",
  "qlippoth", "div", "unholy", "velstrac", "sahkil",
]);

// ── Dialog display data ───────────────────────────────────────────────────────
const ROWS = [
  {
    key:   "fontPathArcane",
    label: "Arcane",
    color: "#9B59B6",
    hint:  "Scholarly and precise.",
  },
  {
    key:   "fontPathPrimal",
    label: "Primal",
    color: "#27AE60",
    hint:  "Guttural and raw.",
  },
  {
    key:   "fontPathOccult",
    label: "Occult",
    color: "#2471A3",
    hint:  "Alien and unknowable.",
  },
  {
    key:   "fontPathDivine",
    label: "Divine",
    color: "#D4AC0D",
    hint:  "Hymnal and ceremonial.",
  },
  {
    key:   "fontPathDarkDivine",
    label: "Dark Divine",
    color: "#C0392B",
    hint:  "Fiend, undead, or unholy divine casters. Overrides the Divine font and glows crimson.",
    separator: true, // visual divider above this row
  },
];

// ── Reliable font loading ─────────────────────────────────────────────────────
// We bypass CSS @font-face + document.fonts.load() because PIXI has its own
// internal font cache that doesn't automatically sync with browser fonts.
// The only reliable approach:
//   1. Inject a FontFace directly via the FontFace API
//   2. Render a temporary 1px invisible PIXI.Text to warm PIXI's cache
//   3. Keep a registry so we only do this once per family name

const _fontRegistry = new Map(); // family name → true when fully warmed up

export function _clearFontRegistry(path) {
  if (!path) return;
  const filename = path.split("/").pop();
  const family   = BUNDLED_FONT_MAP[filename]
                ?? filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9 '_-]/g, "").trim();
  if (family) _fontRegistry.delete(family);
}

export async function ensureFontLoaded(path, sizeHint = 40) {
  if (!path) return "Ultima Runes";

  const filename = path.split("/").pop();
  const family   = BUNDLED_FONT_MAP[filename]
                ?? filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9 '_-]/g, "").trim()
                ?? "Ultima Runes";

  if (_fontRegistry.get(family)) return family; // already warmed

  try {
    // Step 1: Inject FontFace regardless of CSS — guarantees browser has it
    const ext    = path.split(".").pop().toLowerCase();
    const format = ext === "otf" ? "opentype" : "truetype";
    const face   = new FontFace(family, `url("${path}") format("${format}")`);
    await face.load();
    document.fonts.add(face);

    if (canvas?.app?.renderer) {
      const padding = Math.ceil(sizeHint * 0.75) + 15;
      const warmup = new PIXI.Text("abcdefghijklmnopqrstuvwxyz", new PIXI.TextStyle({
        fontFamily: [family, "Georgia", "serif"],
        fontSize:   sizeHint,
        align:      "center",
        fill:       "#ffffff",
        alpha:      0,
        padding,
      }));
      canvas.app.stage.addChild(warmup);
      await new Promise(r => canvas.app.ticker.addOnce(r));
      await new Promise(r => canvas.app.ticker.addOnce(r));
      warmup.destroy();
    }

    _fontRegistry.set(family, true);
    console.log(`PF2e Words of Magic | Font ready: "${family}"`);
  } catch (e) {
    console.warn(`PF2e Words of Magic | Could not load font "${family}" from "${path}":`, e);
  }

  return family;
}

// ── Font Config Dialog ────────────────────────────────────────────────────────
/**
 * FontConfigApp extends ApplicationV2 — the correct v14 base class.
 * registerMenu accepts ApplicationV2 subclasses directly in v14.
 * We override _renderHTML to open the DialogV2 UI directly rather than
 * rendering a Handlebars template, keeping all logic self-contained.
 */
export class FontConfigApp extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id:       "wom-font-config",
    window:   { title: "PF2e Words of Magic — Font Configuration" },
    position: { width: 560 },
  };

  // Override render to open the DialogV2 instead of a standard app window
  async render(options = {}) {
    openFontConfigDialog();
  }
}

async function openFontConfigDialog() {
  // Build current values
  const values = {};
  for (const row of ROWS) {
    values[row.key] = game.settings.get(MODULE_ID, row.key)
                   || TRADITION_FONT_DEFAULTS[
                        Object.keys(TRADITION_FONT_KEYS).find(
                          k => TRADITION_FONT_KEYS[k] === row.key
                        )
                      ]
                   || DEFAULT_FONT_PATH;
  }

  // Build HTML
  let rows = "";
  for (const row of ROWS) {
    const sep = row.separator
      ? `<hr style="border-color:#333;margin:10px 0 14px;">`
      : "";
    rows += `
${sep}
<div style="margin-bottom:14px;">
  <div style="color:${row.color};font-weight:bold;font-size:13px;margin-bottom:2px;">
    ${row.label}
  </div>
  <div style="font-size:11px;color:#888;margin-bottom:6px;">${row.hint}</div>
  <input id="wom-input-${row.key}"
         type="text"
         value="${values[row.key]}"
         style="width:100%;box-sizing:border-box;font-size:11px;
                font-family:monospace;background:#1a1a1a;color:#ddd;
                border:1px solid #444;border-radius:3px;
                padding:3px 6px;margin-bottom:4px;"
         placeholder="${FONTS_DIR}..." />
  <button type="button"
          id="wom-browse-${row.key}"
          style="padding:3px 12px;cursor:pointer;">
    Browse…
  </button>
  <div id="wom-preview-${row.key}"
       style="margin-top:6px;font-size:22px;color:${row.color};
              text-shadow:0 0 8px ${row.color};font-style:italic;
              min-height:30px;padding:2px 0;">
    loading…
  </div>
</div>`;
  }

  const content = `
<div style="padding:4px 0;">
  <p style="font-size:11px;color:#aaa;margin-bottom:14px;">
    Choose a font for each tradition.
    <strong>Browse…</strong> opens the module's fonts folder.
    Changes take effect on the next spell cast — no reload needed.
  </p>
  ${rows}
</div>`;

  // ── DialogV2 (v14 replacement for Dialog) ─────────────────────────────────
  // DialogV2 callbacks receive a native HTMLElement, not jQuery.
  // Use .querySelector() instead of .find().
  await foundry.applications.api.DialogV2.wait({
    window:  { title: "PF2e Words of Magic — Font Configuration" },
    content,
    modal:   false,
    position: { width: 560 },
    buttons: [
      {
        action:  "save",
        icon:    "fas fa-save",
        label:   "Save Fonts",
        default: true,
        callback: async (event, button, dialog) => {
          const html = dialog.element;
          for (const row of ROWS) {
            const input    = html.querySelector(`#wom-input-${row.key}`);
            const path     = (input?.value ?? "").trim();
            const tradKey  = Object.keys(TRADITION_FONT_KEYS).find(
              k => TRADITION_FONT_KEYS[k] === row.key
            );
            const fallback = TRADITION_FONT_DEFAULTS[tradKey] ?? DEFAULT_FONT_PATH;
            await game.settings.set(MODULE_ID, row.key, path || fallback);
          }
          // Reload fonts for immediate use
          for (const row of ROWS) {
            const path = game.settings.get(MODULE_ID, row.key);
            if (path) ensureFontLoaded(path).catch(() => {});
          }
          ui.notifications.info("PF2e Words of Magic | Fonts saved.");
        },
      },
      {
        action: "cancel",
        icon:   "fas fa-times",
        label:  "Cancel",
      },
    ],
    render: (event, dialog) => {
      const html = dialog.element;
      // Wire up Browse buttons — native DOM, no jQuery
      for (const row of ROWS) {
        html.querySelector(`#wom-browse-${row.key}`)
            ?.addEventListener("click", () => {
          const input    = html.querySelector(`#wom-input-${row.key}`);
          const current  = input?.value || DEFAULT_FONT_PATH;
          const startDir = current.includes("/")
            ? current.substring(0, current.lastIndexOf("/") + 1)
            : FONTS_DIR;

          new FilePicker({
            type:     "font",
            current,
            callback: async (path) => {
              if (input) input.value = path;
              await updatePreview(html, row.key, path, row.color);
            },
          }).browse(startDir);
        });

        // Live preview on type
        html.querySelector(`#wom-input-${row.key}`)
            ?.addEventListener("input", async (ev) => {
          const path = ev.currentTarget.value.trim();
          if (path) await updatePreview(html, row.key, path, row.color);
        });

        // Initial preview
        updatePreview(html, row.key, values[row.key], row.color);
      }
    },
  }).catch(() => {}); // Dismissed dialog resolves to null — ignore
}

async function updatePreview(html, key, path, color) {
  const el = html.querySelector(`#wom-preview-${key}`);
  if (!el) return;
  try {
    const family = await ensureFontLoaded(path);
    el.style.fontFamily = `"${family}", Georgia, serif`;
    el.style.color      = color;
    el.textContent      = "ashaah ifrignir vael";
  } catch {
    el.textContent = "(preview unavailable)";
    el.style.color = "#888";
  }
}
