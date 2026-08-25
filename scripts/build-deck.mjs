#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

import { findPresentationsSkillDir } from "./find-presentations-skill.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

if (!process.env.HOME) {
  process.env.HOME = os.homedir();
}

/* ------------------------------------------------------------------ */
/* CLI                                                                */
/* ------------------------------------------------------------------ */

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith("--")) {
      throw new Error(`Unexpected positional argument: ${current}`);
    }
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[current.slice(2)] = true;
      continue;
    }
    args[current.slice(2)] = next;
    index += 1;
  }
  return args;
}

function usage() {
  return [
    "Usage:",
    "  node codex-ppt-automation/scripts/build-deck.mjs [options]",
    "",
    "Options:",
    "  --brief <file>        JSON brief file",
    "  --out <file>          Output .pptx file",
    "  --workspace <dir>     Runtime workspace for the artifact tool",
  ].join("\n");
}

/* ------------------------------------------------------------------ */
/* Themes                                                             */
/* ------------------------------------------------------------------ */

const BASE_THEME = {
  bg: "#F6F1E8",
  panel: "#FFF9F2",
  ink: "#1E1B18",
  muted: "#6B6258",
  accent: "#C65D2E",
  accentSoft: "#E7B08B",
  border: "#D6C8B8",
  inverse: "#FFF8F0",
  deep: "#1F2738",
  deepSoft: "#2F3951",
  titleFont: "Times New Roman",
  bodyFont: "Aptos",
  monoFont: "Aptos Mono",
};

const THEMES = {
  ember: {
    bg: "#F6F1E8",
    panel: "#FFF9F2",
    ink: "#1E1B18",
    muted: "#6B6258",
    accent: "#C65D2E",
    accentSoft: "#E7B08B",
    border: "#D6C8B8",
    inverse: "#FFF8F0",
    deep: "#1F2738",
    deepSoft: "#2F3951",
    titleFont: "Times New Roman",
    bodyFont: "Aptos",
    monoFont: "Aptos Mono",
  },
  ocean: {
    bg: "#EDF4F7",
    panel: "#F9FCFD",
    ink: "#16242C",
    muted: "#5E7480",
    accent: "#1F7A8C",
    accentSoft: "#8BC4D0",
    border: "#C7DCE2",
    inverse: "#F6FBFC",
    deep: "#0F3A47",
    deepSoft: "#175563",
    titleFont: "Times New Roman",
    bodyFont: "Aptos",
    monoFont: "Aptos Mono",
  },
  forest: {
    bg: "#EEF3EC",
    panel: "#FAFDF9",
    ink: "#1B251C",
    muted: "#617064",
    accent: "#2F6B3B",
    accentSoft: "#A7C6AE",
    border: "#CDD9CE",
    inverse: "#F7FBF7",
    deep: "#14351D",
    deepSoft: "#1E4A2A",
    titleFont: "Times New Roman",
    bodyFont: "Aptos",
    monoFont: "Aptos Mono",
  },
  cathedral: {
    bg: "#F4EEE4",
    panel: "#FBF7F0",
    ink: "#1E2230",
    muted: "#6D675E",
    accent: "#A77A2F",
    accentSoft: "#DCC08A",
    border: "#D8CCBC",
    inverse: "#FFF9F1",
    deep: "#1F2738",
    deepSoft: "#2F3951",
    titleFont: "Times New Roman",
    bodyFont: "Aptos",
    monoFont: "Aptos Mono",
  },
  slate: {
    bg: "#EFF2F5",
    panel: "#FFFFFF",
    ink: "#1F2937",
    muted: "#6B7280",
    accent: "#3B82F6",
    accentSoft: "#93C5FD",
    border: "#D1D5DB",
    inverse: "#F9FAFB",
    deep: "#1E3A5F",
    deepSoft: "#2C4A6E",
    titleFont: "Aptos Display",
    bodyFont: "Aptos",
    monoFont: "Aptos Mono",
  },
  sunset: {
    bg: "#FDF0E9",
    panel: "#FFF7F2",
    ink: "#3B2A20",
    muted: "#8A6A55",
    accent: "#E4572E",
    accentSoft: "#F5A97F",
    border: "#E8CFC0",
    inverse: "#FFF9F5",
    deep: "#4A1F0E",
    deepSoft: "#6B2D14",
    titleFont: "Aptos Display",
    bodyFont: "Aptos",
    monoFont: "Aptos Mono",
  },
  midnight: {
    bg: "#101828",
    panel: "#1C2A3A",
    ink: "#F3F4F6",
    muted: "#9CA3AF",
    accent: "#60A5FA",
    accentSoft: "#93C5FD",
    border: "#374151",
    inverse: "#F9FAFB",
    deep: "#0B1220",
    deepSoft: "#16233A",
    titleFont: "Aptos Display",
    bodyFont: "Aptos",
    monoFont: "Aptos Mono",
  },
  paper: {
    bg: "#FAFAF7",
    panel: "#FFFFFF",
    ink: "#262626",
    muted: "#737373",
    accent: "#2563EB",
    accentSoft: "#BFDBFE",
    border: "#E5E5E5",
    inverse: "#FFFFFF",
    deep: "#1F2937",
    deepSoft: "#374151",
    titleFont: "Aptos Display",
    bodyFont: "Aptos",
    monoFont: "Aptos Mono",
  },
  spring: {
    bg: "#F0F7F0",
    panel: "#FAFDFA",
    ink: "#1B2E1B",
    muted: "#5F7A5F",
    accent: "#2E9E5B",
    accentSoft: "#A7D8B8",
    border: "#CDE0CD",
    inverse: "#F7FBF7",
    deep: "#123B22",
    deepSoft: "#1E5731",
    titleFont: "Aptos Display",
    bodyFont: "Aptos",
    monoFont: "Aptos Mono",
  },
  royal: {
    bg: "#F5F2FA",
    panel: "#FBF9FE",
    ink: "#241B38",
    muted: "#6E6285",
    accent: "#6D4FC4",
    accentSoft: "#C4B1F0",
    border: "#DCD3EE",
    inverse: "#FBF9FE",
    deep: "#2A1E4F",
    deepSoft: "#3D2C6E",
    titleFont: "Aptos Display",
    bodyFont: "Aptos",
    monoFont: "Aptos Mono",
  },
};

/**
 * Resolve a theme from the brief.
 * - A string looks up a preset (ember, ocean, forest, cathedral, slate, sunset, midnight, paper, spring, royal).
 * - An object is treated as a custom theme and merged over the base (or over a preset named by `theme.base`).
 */
function themeForName(name) {
  if (name && typeof name === "object" && !Array.isArray(name)) {
    const base =
      typeof name.base === "string" && THEMES[name.base] ? THEMES[name.base] : undefined;
    return { ...BASE_THEME, ...(base || {}), ...name };
  }
  return THEMES[name] || THEMES.ember;
}

/* ------------------------------------------------------------------ */
/* Brief normalization                                               */
/* ------------------------------------------------------------------ */

function ensureArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }
  return value;
}

function normalizeTheme(rawTheme) {
  if (rawTheme && typeof rawTheme === "object" && !Array.isArray(rawTheme)) {
    return rawTheme;
  }
  return String(rawTheme || "ember");
}

function normalizeBrief(rawBrief) {
  if (!rawBrief || typeof rawBrief !== "object") {
    throw new Error("Brief must be a JSON object.");
  }
  if (!rawBrief.deck || typeof rawBrief.deck !== "object") {
    throw new Error("Brief is missing the deck object.");
  }

  const slides = ensureArray(rawBrief.slides, "slides");
  if (slides.length === 0) {
    throw new Error("Brief must contain at least one slide.");
  }

  return {
    deck: {
      title: String(rawBrief.deck.title || "Untitled Deck"),
      subtitle: String(rawBrief.deck.subtitle || ""),
      author: String(rawBrief.deck.author || "Codex"),
      theme: normalizeTheme(rawBrief.deck.theme),
    },
    slides: slides.map((slide, index) => ({
      ...slide,
      type: String(slide.type || "").trim(),
      index: index + 1,
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Text measurement & auto-fit                                        */
/* ------------------------------------------------------------------ */

/** Rough heuristic for CJK / full-width characters (counted as double width). */
function isWideChar(ch) {
  const code = ch.codePointAt(0);
  return (
    (code >= 0x1100 && code <= 0x115f) || // Hangul Jamo
    code === 0x2329 ||
    code === 0x232a ||
    (code >= 0x2e80 && code <= 0xa4cf) || // CJK radicals .. Yi
    (code >= 0xac00 && code <= 0xd7a3) || // Hangul syllables
    (code >= 0xf900 && code <= 0xfaff) || // CJK compat ideographs
    (code >= 0xfe10 && code <= 0xfe19) || // vertical forms
    (code >= 0xfe30 && code <= 0xfe6f) || // CJK compat forms
    (code >= 0xff00 && code <= 0xff60) || // fullwidth forms
    (code >= 0xffe0 && code <= 0xffe6)
  );
}

function effectiveTextLength(text) {
  let length = 0;
  for (const ch of String(text)) {
    length += isWideChar(ch) ? 2 : 1;
  }
  return length;
}

/** Estimate how many rendered lines a text will occupy inside a box. */
function estimateLines(text, fontSize, width, bold = false) {
  const charWidth = fontSize * (bold ? 0.62 : 0.55);
  const charsPerLine = Math.max(1, Math.floor(width / charWidth));
  let total = 0;
  for (const rawLine of String(text).split("\n")) {
    const length = effectiveTextLength(rawLine);
    total += Math.max(1, Math.ceil(length / charsPerLine));
  }
  return total;
}

/**
 * Shrink a font size until the estimated text height fits the box,
 * never going below `minSize`. This is the core overflow guard.
 */
function fitFontSize(text, width, height, fontSize, minSize = 9, lineHeight = 1.25, bold = false) {
  let size = fontSize;
  while (size > minSize) {
    const lines = estimateLines(text, size, width, bold);
    const needed = lines * size * lineHeight;
    if (needed <= height) break;
    size -= 1;
  }
  return Math.max(minSize, size);
}

/* ------------------------------------------------------------------ */
/* Low-level drawing helpers                                          */
/* ------------------------------------------------------------------ */

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function imageSourceFromPath(imagePath) {
  const absolute = path.resolve(projectRoot, imagePath);
  if (!(await fileExists(absolute))) {
    throw new Error(`Image not found: ${absolute}`);
  }

  const extension = path.extname(absolute).toLowerCase();
  if (extension === ".svg") {
    const text = await fs.readFile(absolute, "utf8");
    return {
      dataUrl: `data:image/svg+xml;base64,${Buffer.from(text, "utf8").toString("base64")}`,
    };
  }

  return { path: absolute };
}

async function maybeAddImage(ctx, slide, imagePath, frame, fit = "cover") {
  if (!imagePath) return;
  const source = await imageSourceFromPath(imagePath);
  await ctx.addImage(slide, {
    ...frame,
    ...source,
    fit,
  });
}

function addShape(ctx, slide, x, y, width, height, fill, lineFill = "#00000000", lineWidth = 0, geometry = "rect") {
  ctx.addShape(slide, {
    x,
    y,
    width,
    height,
    fill,
    line: ctx.line(lineFill, lineWidth),
    geometry,
  });
}

/**
 * Wrapper around ctx.addText with automatic overflow protection:
 * - estimates wrapped line count and shrinks the font to fit `height`
 * - applies line spacing when the runtime supports it
 * Pass `fit: false` for short labels that must keep their exact size.
 */
function addText(ctx, slide, options) {
  const {
    text = "",
    width,
    height,
    fontSize = 24,
    minSize = 9,
    lineHeight = 1.25,
    fit = true,
    ...rest
  } = options;

  let size = fontSize;
  if (fit && width && height && text) {
    size = fitFontSize(text, width, height, fontSize, minSize, lineHeight, Boolean(rest.bold));
  }

  const shape = ctx.addText(slide, {
    text,
    width,
    height,
    fontSize: size,
    ...rest,
  });

  // Best-effort line spacing; ignore if the runtime does not expose it.
  if (lineHeight !== 1 && shape?.text?.style && typeof shape.text.style === "object") {
    try {
      shape.text.style.lineSpacing = lineHeight;
    } catch {
      // ignore
    }
  }
  return shape;
}

function addBaseBackground(ctx, slide, theme) {
  addShape(ctx, slide, 0, 0, ctx.W, ctx.H, theme.bg);
}

function addTopBand(ctx, slide, theme) {
  addShape(ctx, slide, 0, 0, ctx.W, 28, theme.deep || theme.accent);
}

function addKicker(ctx, slide, theme, text, x = 72, y = 68, width = 220) {
  if (!text) return;
  addShape(ctx, slide, x, y, width, 24, theme.accent);
  addText(ctx, slide, {
    text: String(text).toUpperCase(),
    x: x + 10,
    y: y + 4,
    width: width - 20,
    height: 16,
    fontSize: 10,
    bold: true,
    color: theme.inverse,
    typeface: theme.bodyFont,
    align: "center",
    fit: false,
  });
}

function addFooter(ctx, slide, theme, deck, slideNumber, slideCount, onDark = false) {
  const lineColor = onDark ? theme.accentSoft : theme.border;
  const textColor = onDark ? theme.accentSoft : theme.muted;
  addShape(ctx, slide, 72, 676, ctx.W - 144, 1, lineColor);
  addText(ctx, slide, {
    text: `${deck.title}  |  ${deck.author}`,
    x: 72,
    y: 687,
    width: 320,
    height: 16,
    fontSize: 9,
    color: textColor,
    typeface: theme.bodyFont,
    fit: false,
  });
  addText(ctx, slide, {
    text: `${slideNumber}/${slideCount}`,
    x: ctx.W - 130,
    y: 687,
    width: 60,
    height: 16,
    fontSize: 9,
    color: textColor,
    typeface: theme.bodyFont,
    align: "right",
    fit: false,
  });
}

function addSectionTitle(ctx, slide, theme, kicker, title) {
  addKicker(ctx, slide, theme, kicker, 72, 62, 138);
  addText(ctx, slide, {
    text: title,
    x: 72,
    y: 112,
    width: 840,
    height: 120,
    fontSize: 30,
    bold: true,
    color: theme.ink,
    typeface: theme.titleFont,
  });
}

function bulletLines(items, marker = "•") {
  return ensureArray(items, "bullets")
    .map((item) => `${marker} ${String(item)}`)
    .join("\n");
}

/* ------------------------------------------------------------------ */
/* Slide renderers                                                    */
/* ------------------------------------------------------------------ */

async function renderCoverSlide(ctx, slide, theme, deck, spec, slideNumber, slideCount) {
  addBaseBackground(ctx, slide, theme);
  addTopBand(ctx, slide, theme);
  addShape(ctx, slide, 0, 0, ctx.W, ctx.H, theme.bg);
  addShape(ctx, slide, 814, 0, 466, ctx.H, theme.deep || "#1F2738");
  addShape(ctx, slide, 760, 0, 88, ctx.H, theme.accentSoft);

  await maybeAddImage(ctx, slide, spec.imagePath, { x: 858, y: 110, width: 360, height: 500 }, "cover");
  addShape(ctx, slide, 858, 110, 360, 500, "#00000000", theme.accentSoft, 2);

  addKicker(ctx, slide, theme, spec.tag, 72, 86, 152);
  addText(ctx, slide, {
    text: String(spec.title || deck.title),
    x: 72,
    y: 172,
    width: 630,
    height: 170,
    fontSize: 35,
    bold: true,
    color: theme.ink,
    typeface: theme.titleFont,
  });
  addText(ctx, slide, {
    text: String(spec.subtitle || deck.subtitle || ""),
    x: 72,
    y: 374,
    width: 560,
    height: 90,
    fontSize: 19,
    color: theme.muted,
    typeface: theme.bodyFont,
  });

  addShape(ctx, slide, 72, 548, 210, 2, theme.accent);
  addText(ctx, slide, {
    text: String(spec.note || ""),
    x: 72,
    y: 566,
    width: 480,
    height: 40,
    fontSize: 13,
    color: theme.accent,
    typeface: theme.bodyFont,
    bold: true,
  });

  // Right-panel branding: read from the brief, never hardcoded.
  const brandTitle = spec.brandTitle ?? deck.title;
  const brandSubtitle = spec.brandSubtitle ?? deck.subtitle;
  if (brandTitle) {
    addText(ctx, slide, {
      text: String(brandTitle),
      x: 892,
      y: 628,
      width: 260,
      height: 28,
      fontSize: 20,
      bold: true,
      color: theme.inverse,
      typeface: theme.titleFont,
      fit: false,
    });
  }
  if (brandSubtitle) {
    addText(ctx, slide, {
      text: String(brandSubtitle),
      x: 892,
      y: 654,
      width: 260,
      height: 24,
      fontSize: 12,
      color: "#DCCFBF",
      typeface: theme.bodyFont,
      fit: false,
    });
  }

  addFooter(ctx, slide, theme, deck, slideNumber, slideCount);
}

async function renderBulletsSlide(ctx, slide, theme, deck, spec, slideNumber, slideCount) {
  addBaseBackground(ctx, slide, theme);
  addTopBand(ctx, slide, theme);
  addSectionTitle(ctx, slide, theme, spec.kicker, spec.title);

  addShape(ctx, slide, 72, 224, 580, 348, theme.panel, theme.border, 1);
  addText(ctx, slide, {
    text: bulletLines(spec.bullets || []),
    x: 102,
    y: 266,
    width: 510,
    height: 240,
    fontSize: 20,
    color: theme.ink,
    typeface: theme.bodyFont,
  });

  addShape(ctx, slide, 686, 224, 522, 228, theme.deep || "#1F2738");
  addText(ctx, slide, {
    text: String(spec.asideTitle || "Context").toUpperCase(),
    x: 722,
    y: 258,
    width: 120,
    height: 16,
    fontSize: 10,
    bold: true,
    color: theme.accentSoft,
    typeface: theme.bodyFont,
    fit: false,
  });
  addText(ctx, slide, {
    text: String(spec.asideText || ""),
    x: 722,
    y: 300,
    width: 420,
    height: 110,
    fontSize: 22,
    color: theme.inverse,
    typeface: theme.titleFont,
  });

  await maybeAddImage(ctx, slide, spec.imagePath, { x: 686, y: 470, width: 522, height: 132 }, "cover");
  addShape(ctx, slide, 686, 470, 522, 132, "#00000000", theme.border, 1);

  addFooter(ctx, slide, theme, deck, slideNumber, slideCount);
}

async function renderMetricsSlide(ctx, slide, theme, deck, spec, slideNumber, slideCount) {
  addShape(ctx, slide, 0, 0, ctx.W, ctx.H, theme.deep || "#1F2738");
  addShape(ctx, slide, 0, 0, ctx.W, 28, theme.accent);
  addKicker(ctx, slide, theme, spec.kicker, 72, 68, 188);
  addText(ctx, slide, {
    text: String(spec.title || ""),
    x: 72,
    y: 120,
    width: 820,
    height: 90,
    fontSize: 31,
    bold: true,
    color: theme.inverse,
    typeface: theme.titleFont,
  });

  const cards = ensureArray(spec.metrics || [], "metrics");
  if (cards.length === 0) {
    throw new Error("metrics slide must contain at least one metric.");
  }
  const gutter = 28;
  const left = 72;
  const cardWidth = Math.floor((ctx.W - left * 2 - gutter * (cards.length - 1)) / cards.length);
  const top = 260;

  cards.forEach((metric, index) => {
    const x = left + index * (cardWidth + gutter);
    addShape(ctx, slide, x, top, cardWidth, 248, theme.panel, theme.accentSoft, 2);
    addShape(ctx, slide, x, top, cardWidth, 16, theme.accent);
    addText(ctx, slide, {
      text: String(metric.value || ""),
      x: x + 24,
      y: top + 42,
      width: cardWidth - 48,
      height: 52,
      fontSize: 28,
      bold: true,
      color: theme.accent,
      typeface: theme.titleFont,
    });
    addText(ctx, slide, {
      text: String(metric.label || ""),
      x: x + 24,
      y: top + 116,
      width: cardWidth - 48,
      height: 24,
      fontSize: 15,
      bold: true,
      color: theme.ink,
      typeface: theme.bodyFont,
    });
    addText(ctx, slide, {
      text: String(metric.note || ""),
      x: x + 24,
      y: top + 152,
      width: cardWidth - 48,
      height: 58,
      fontSize: 13,
      color: theme.muted,
      typeface: theme.bodyFont,
    });
  });

  addShape(ctx, slide, 72, 560, 1136, 2, theme.accentSoft);
  addText(ctx, slide, {
    text: String(spec.takeaway || ""),
    x: 72,
    y: 584,
    width: 980,
    height: 48,
    fontSize: 18,
    bold: true,
    color: theme.inverse,
    typeface: theme.bodyFont,
  });

  addFooter(ctx, slide, theme, deck, slideNumber, slideCount, true);
}

async function renderClosingSlide(ctx, slide, theme, deck, spec, slideNumber, slideCount) {
  addBaseBackground(ctx, slide, theme);
  addTopBand(ctx, slide, theme);
  addShape(ctx, slide, 72, 144, 1136, 392, theme.deep || "#1F2738");
  addShape(ctx, slide, 72, 144, 20, 392, theme.accent);
  addText(ctx, slide, {
    text: String(spec.kicker || "").toUpperCase(),
    x: 124,
    y: 194,
    width: 180,
    height: 18,
    fontSize: 11,
    bold: true,
    color: theme.accentSoft,
    typeface: theme.bodyFont,
    fit: false,
  });
  addText(ctx, slide, {
    text: String(spec.title || ""),
    x: 124,
    y: 232,
    width: 904,
    height: 90,
    fontSize: 34,
    bold: true,
    color: theme.inverse,
    typeface: theme.titleFont,
  });
  addText(ctx, slide, {
    text: String(spec.message || deck.subtitle || ""),
    x: 124,
    y: 356,
    width: 910,
    height: 90,
    fontSize: 21,
    color: "#ECE2D3",
    typeface: theme.bodyFont,
  });
  if (spec.cta) {
    addShape(ctx, slide, 124, 466, 148, 34, theme.accent);
    addText(ctx, slide, {
      text: String(spec.cta),
      x: 138,
      y: 474,
      width: 120,
      height: 18,
      fontSize: 14,
      bold: true,
      color: theme.inverse,
      typeface: theme.bodyFont,
      align: "center",
      fit: false,
    });
  }
  addFooter(ctx, slide, theme, deck, slideNumber, slideCount);
}

/**
 * Agenda / overview: numbered topics in two columns.
 * spec: { kicker, title, items: [{ title, detail? } | string] }
 */
async function renderAgendaSlide(ctx, slide, theme, deck, spec, slideNumber, slideCount) {
  addBaseBackground(ctx, slide, theme);
  addTopBand(ctx, slide, theme);
  addSectionTitle(ctx, slide, theme, spec.kicker, spec.title);

  const items = ensureArray(spec.items || [], "agenda items").map((item, index) => {
    if (typeof item === "string") return { title: item, detail: "" };
    return {
      title: String(item?.title || ""),
      detail: String(item?.detail || ""),
      number: item?.number != null ? String(item.number) : String(index + 1).padStart(2, "0"),
    };
  });

  const colX = [72, 668];
  const colWidth = 540;
  const startY = 250;
  const rowHeight = 97;

  items.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = colX[col];
    const y = startY + row * rowHeight;

    addShape(ctx, slide, x, y + 2, 46, 46, theme.accent, "#00000000", 0, "ellipse");
    addText(ctx, slide, {
      text: item.number,
      x,
      y,
      width: 46,
      height: 46,
      fontSize: 18,
      bold: true,
      color: theme.inverse,
      typeface: theme.bodyFont,
      align: "center",
      valign: "middle",
      fit: false,
    });

    addText(ctx, slide, {
      text: item.title,
      x: x + 64,
      y,
      width: colWidth - 64,
      height: 34,
      fontSize: 19,
      bold: true,
      color: theme.ink,
      typeface: theme.bodyFont,
    });

    if (item.detail) {
      addText(ctx, slide, {
        text: item.detail,
        x: x + 64,
        y: y + 38,
        width: colWidth - 64,
        height: 44,
        fontSize: 13,
        color: theme.muted,
        typeface: theme.bodyFont,
      });
    }
  });

  addFooter(ctx, slide, theme, deck, slideNumber, slideCount);
}

/**
 * Section divider.
 * spec: { number?, title, subtitle? }
 */
async function renderSectionSlide(ctx, slide, theme, deck, spec, slideNumber, slideCount) {
  addShape(ctx, slide, 0, 0, ctx.W, ctx.H, theme.deep || "#1F2738");
  addShape(ctx, slide, 0, 0, ctx.W, 28, theme.accent);

  const number = spec.number != null ? String(spec.number) : String(spec.index).padStart(2, "0");
  addShape(ctx, slide, ctx.W / 2 - 70, 170, 140, 140, theme.accent, "#00000000", 0, "ellipse");
  addText(ctx, slide, {
    text: number,
    x: ctx.W / 2 - 70,
    y: 170,
    width: 140,
    height: 140,
    fontSize: 64,
    bold: true,
    color: theme.inverse,
    typeface: theme.titleFont,
    align: "center",
    valign: "middle",
    fit: false,
  });

  addText(ctx, slide, {
    text: String(spec.title || ""),
    x: 180,
    y: 360,
    width: 920,
    height: 90,
    fontSize: 40,
    bold: true,
    color: theme.inverse,
    typeface: theme.titleFont,
    align: "center",
  });

  addText(ctx, slide, {
    text: String(spec.subtitle || ""),
    x: 240,
    y: 470,
    width: 800,
    height: 60,
    fontSize: 20,
    color: theme.accentSoft,
    typeface: theme.bodyFont,
    align: "center",
  });

  addFooter(ctx, slide, theme, deck, slideNumber, slideCount, true);
}

/**
 * Two text columns.
 * spec: { kicker, title, leftHeading?, leftBullets?, rightHeading?, rightBullets? }
 */
async function renderTwoColumnSlide(ctx, slide, theme, deck, spec, slideNumber, slideCount) {
  addBaseBackground(ctx, slide, theme);
  addTopBand(ctx, slide, theme);
  addSectionTitle(ctx, slide, theme, spec.kicker, spec.title);

  const columns = [
    { x: 72, heading: spec.leftHeading, bullets: spec.leftBullets || [] },
    { x: 668, heading: spec.rightHeading, bullets: spec.rightBullets || [] },
  ];

  columns.forEach((column) => {
    addShape(ctx, slide, column.x, 240, 540, 400, theme.panel, theme.border, 1);
    if (column.heading) {
      addText(ctx, slide, {
        text: String(column.heading),
        x: column.x + 24,
        y: 268,
        width: 492,
        height: 40,
        fontSize: 20,
        bold: true,
        color: theme.accent,
        typeface: theme.bodyFont,
      });
    }
    addText(ctx, slide, {
      text: bulletLines(column.bullets),
      x: column.x + 24,
      y: column.heading ? 320 : 268,
      width: 492,
      height: column.heading ? 300 : 350,
      fontSize: 18,
      color: theme.ink,
      typeface: theme.bodyFont,
    });
  });

  addFooter(ctx, slide, theme, deck, slideNumber, slideCount);
}

/**
 * Side-by-side comparison.
 * spec: { kicker, title, leftHeading?, leftPoints?, rightHeading?, rightPoints? }
 */
async function renderComparisonSlide(ctx, slide, theme, deck, spec, slideNumber, slideCount) {
  addBaseBackground(ctx, slide, theme);
  addTopBand(ctx, slide, theme);
  addSectionTitle(ctx, slide, theme, spec.kicker, spec.title);

  // Left panel (light)
  addShape(ctx, slide, 72, 240, 540, 400, theme.panel, theme.border, 1);
  addText(ctx, slide, {
    text: String(spec.leftHeading || ""),
    x: 96,
    y: 268,
    width: 492,
    height: 40,
    fontSize: 20,
    bold: true,
    color: theme.accent,
    typeface: theme.bodyFont,
  });
  addText(ctx, slide, {
    text: bulletLines(spec.leftPoints || []),
    x: 96,
    y: 320,
    width: 492,
    height: 300,
    fontSize: 18,
    color: theme.ink,
    typeface: theme.bodyFont,
  });

  // Center divider
  addShape(ctx, slide, 640, 240, 2, 400, theme.accent);

  // Right panel (dark)
  addShape(ctx, slide, 668, 240, 540, 400, theme.deep || "#1F2738");
  addText(ctx, slide, {
    text: String(spec.rightHeading || ""),
    x: 692,
    y: 268,
    width: 492,
    height: 40,
    fontSize: 20,
    bold: true,
    color: theme.accentSoft,
    typeface: theme.bodyFont,
  });
  addText(ctx, slide, {
    text: bulletLines(spec.rightPoints || []),
    x: 692,
    y: 320,
    width: 492,
    height: 300,
    fontSize: 18,
    color: theme.inverse,
    typeface: theme.bodyFont,
  });

  addFooter(ctx, slide, theme, deck, slideNumber, slideCount);
}

/**
 * Large quote.
 * spec: { kicker, title?, quote, attribution? }
 */
async function renderQuoteSlide(ctx, slide, theme, deck, spec, slideNumber, slideCount) {
  addBaseBackground(ctx, slide, theme);
  addTopBand(ctx, slide, theme);
  if (spec.kicker) {
    addKicker(ctx, slide, theme, spec.kicker, 72, 68, 188);
  }
  if (spec.title) {
    addText(ctx, slide, {
      text: String(spec.title),
      x: 72,
      y: 112,
      width: 840,
      height: 90,
      fontSize: 26,
      bold: true,
      color: theme.ink,
      typeface: theme.titleFont,
    });
  }

  const panelTop = spec.title ? 230 : 168;
  addShape(ctx, slide, 72, panelTop, 1136, 400, theme.panel, theme.border, 1);
  addShape(ctx, slide, 72, panelTop, 12, 400, theme.accent);

  addText(ctx, slide, {
    text: String(spec.quote || ""),
    x: 140,
    y: panelTop + 70,
    width: 1000,
    height: 240,
    fontSize: 34,
    color: theme.ink,
    typeface: theme.titleFont,
    align: "center",
    valign: "middle",
  });

  if (spec.attribution) {
    addText(ctx, slide, {
      text: String(spec.attribution),
      x: 140,
      y: panelTop + 330,
      width: 1000,
      height: 40,
      fontSize: 16,
      bold: true,
      color: theme.accent,
      typeface: theme.bodyFont,
      align: "center",
    });
  }

  addFooter(ctx, slide, theme, deck, slideNumber, slideCount);
}

/**
 * Data table.
 * spec: { kicker, title, headers: [], rows: [[...], ...] }
 */
async function renderTableSlide(ctx, slide, theme, deck, spec, slideNumber, slideCount) {
  addBaseBackground(ctx, slide, theme);
  addTopBand(ctx, slide, theme);
  addSectionTitle(ctx, slide, theme, spec.kicker, spec.title);

  const headers = ensureArray(spec.headers || [], "table headers");
  const rows = ensureArray(spec.rows || [], "table rows");
  if (headers.length === 0 || rows.length === 0) {
    throw new Error("table slide requires non-empty headers and rows.");
  }

  const tableX = 72;
  const tableY = 240;
  const tableWidth = 1136;
  const tableHeight = 400;
  const headerH = 52;
  const bodyH = (tableHeight - headerH) / rows.length;
  const colWidth = tableWidth / headers.length;

  const cellText = (rowIndex, colIndex, cell, x, y, width, height, fill, color, align) => {
    addShape(ctx, slide, x, y, width, height, fill, theme.border, 1);
    addText(ctx, slide, {
      text: String(cell ?? ""),
      x: x + 8,
      y: y + 4,
      width: width - 16,
      height: height - 8,
      fontSize: 15,
      bold: rowIndex === -1,
      color,
      typeface: theme.bodyFont,
      align,
      valign: "middle",
    });
  };

  headers.forEach((header, colIndex) => {
    cellText(
      -1,
      colIndex,
      header,
      tableX + colIndex * colWidth,
      tableY,
      colWidth,
      headerH,
      theme.accent,
      theme.inverse,
      "center",
    );
  });

  rows.forEach((row, rowIndex) => {
    const y = tableY + headerH + rowIndex * bodyH;
    const fill = rowIndex % 2 === 0 ? theme.panel : theme.bg;
    row.forEach((cell, colIndex) => {
      cellText(
        rowIndex,
        colIndex,
        cell,
        tableX + colIndex * colWidth,
        y,
        colWidth,
        bodyH,
        fill,
        theme.ink,
        colIndex === 0 ? "left" : "center",
      );
    });
  });

  addFooter(ctx, slide, theme, deck, slideNumber, slideCount);
}

/**
 * Horizontal timeline.
 * spec: { kicker, title, items: [{ title, detail? } | string] }
 */
async function renderTimelineSlide(ctx, slide, theme, deck, spec, slideNumber, slideCount) {
  addBaseBackground(ctx, slide, theme);
  addTopBand(ctx, slide, theme);
  addSectionTitle(ctx, slide, theme, spec.kicker, spec.title);

  const items = ensureArray(spec.items || [], "timeline items").map((item) => {
    if (typeof item === "string") return { title: item, detail: "" };
    return { title: String(item?.title || ""), detail: String(item?.detail || "") };
  });
  if (items.length === 0) {
    throw new Error("timeline slide requires at least one item.");
  }

  const lineY = 380;
  addShape(ctx, slide, 72, lineY, 1136, 3, theme.accent);

  items.forEach((item, index) => {
    const nodeX = items.length === 1 ? 640 : 72 + (1136 / (items.length - 1)) * index;
    addShape(ctx, slide, nodeX - 9, lineY - 8, 18, 18, theme.accent, theme.bg, 2, "ellipse");

    addText(ctx, slide, {
      text: item.title,
      x: nodeX - 140,
      y: 300,
      width: 280,
      height: 64,
      fontSize: 18,
      bold: true,
      color: theme.ink,
      typeface: theme.bodyFont,
      align: "center",
    });
    if (item.detail) {
      addText(ctx, slide, {
        text: item.detail,
        x: nodeX - 140,
        y: 404,
        width: 280,
        height: 90,
        fontSize: 13,
        color: theme.muted,
        typeface: theme.bodyFont,
        align: "center",
      });
    }
  });

  addFooter(ctx, slide, theme, deck, slideNumber, slideCount);
}

/* ------------------------------------------------------------------ */
/* Dispatch                                                           */
/* ------------------------------------------------------------------ */

const SUPPORTED_TYPES = [
  "cover",
  "bullets",
  "metrics",
  "closing",
  "agenda",
  "section",
  "twoColumn",
  "comparison",
  "quote",
  "table",
  "timeline",
];

async function renderSlide(ctx, presentation, brief, spec, theme) {
  const slide = presentation.slides.add();
  const slideNumber = spec.index;
  const slideCount = brief.slides.length;

  switch (spec.type) {
    case "cover":
      await renderCoverSlide(ctx, slide, theme, brief.deck, spec, slideNumber, slideCount);
      break;
    case "bullets":
      await renderBulletsSlide(ctx, slide, theme, brief.deck, spec, slideNumber, slideCount);
      break;
    case "metrics":
      await renderMetricsSlide(ctx, slide, theme, brief.deck, spec, slideNumber, slideCount);
      break;
    case "closing":
      await renderClosingSlide(ctx, slide, theme, brief.deck, spec, slideNumber, slideCount);
      break;
    case "agenda":
      await renderAgendaSlide(ctx, slide, theme, brief.deck, spec, slideNumber, slideCount);
      break;
    case "section":
      await renderSectionSlide(ctx, slide, theme, brief.deck, spec, slideNumber, slideCount);
      break;
    case "twoColumn":
      await renderTwoColumnSlide(ctx, slide, theme, brief.deck, spec, slideNumber, slideCount);
      break;
    case "comparison":
      await renderComparisonSlide(ctx, slide, theme, brief.deck, spec, slideNumber, slideCount);
      break;
    case "quote":
      await renderQuoteSlide(ctx, slide, theme, brief.deck, spec, slideNumber, slideCount);
      break;
    case "table":
      await renderTableSlide(ctx, slide, theme, brief.deck, spec, slideNumber, slideCount);
      break;
    case "timeline":
      await renderTimelineSlide(ctx, slide, theme, brief.deck, spec, slideNumber, slideCount);
      break;
    default:
      throw new Error(
        `Unsupported slide type "${spec.type}" on slide ${slideNumber}. Supported types: ${SUPPORTED_TYPES.join(", ")}.`,
      );
  }

  return slide;
}

/* ------------------------------------------------------------------ */
/* Build pipeline                                                     */
/* ------------------------------------------------------------------ */

async function loadJson(jsonPath) {
  const text = await fs.readFile(jsonPath, "utf8");
  return JSON.parse(text);
}

async function importHelpers(skillDir) {
  // The runtime has moved artifact_tool_utils.mjs between releases; probe both locations.
  const candidates = [
    path.join(skillDir, "scripts", "artifact_tool_utils.mjs"),
    path.join(skillDir, "container_tools", "artifact_tool_utils.mjs"),
  ];
  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      return import(pathToFileURL(candidate).href);
    }
  }
  throw new Error(`Could not find artifact_tool_utils.mjs under ${skillDir}`);
}

async function ensureDirectory(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
}

async function buildDeck({ briefPath, outPath, runtimeWorkspace }) {
  const skillDir = await findPresentationsSkillDir();
  const helpers = await importHelpers(skillDir);
  const { ensureArtifactToolWorkspace, importArtifactTool, createSlideContext, saveBlobToFile } = helpers;

  await ensureArtifactToolWorkspace(runtimeWorkspace);
  const artifact = await importArtifactTool(runtimeWorkspace);
  const { Presentation, PresentationFile } = artifact;

  const brief = normalizeBrief(await loadJson(briefPath));
  const theme = themeForName(brief.deck.theme);
  const presentation = Presentation.create({ slideSize: { width: 1280, height: 720 } });
  const slides = [];

  for (const spec of brief.slides) {
    const ctx = createSlideContext(artifact, {
      slideSize: { width: 1280, height: 720 },
      slideNumber: spec.index,
      outputDir: path.dirname(outPath),
      assetDir: path.join(projectRoot, "assets"),
      workspaceDir: runtimeWorkspace,
      titleFont: theme.titleFont,
      bodyFont: theme.bodyFont,
      monoFont: theme.monoFont,
    });
    slides.push(await renderSlide(ctx, presentation, brief, spec, theme));
  }

  await ensureDirectory(path.dirname(outPath));
  const previewDir = path.join(path.dirname(outPath), "previews");
  await ensureDirectory(previewDir);

  for (let index = 0; index < slides.length; index += 1) {
    const preview = await presentation.export({ slide: slides[index], format: "png", scale: 1 });
    const previewPath = path.join(previewDir, `slide-${String(index + 1).padStart(2, "0")}.png`);
    await saveBlobToFile(preview, previewPath);
  }

  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(outPath);

  const stat = await fs.stat(outPath);
  if (stat.size <= 0) {
    throw new Error(`Generated PPTX is empty: ${outPath}`);
  }

  return {
    briefPath,
    outPath,
    runtimeWorkspace,
    skillDir,
    slideCount: slides.length,
    outputBytes: stat.size,
    previewDir,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  const briefPath = path.resolve(args.brief || path.join(projectRoot, "briefs", "hello-world.json"));
  const outPath = path.resolve(args.out || path.join(projectRoot, "dist", "hello-world-codex.pptx"));
  const runtimeWorkspace = path.resolve(args.workspace || path.join(projectRoot, ".runtime"));

  const result = await buildDeck({ briefPath, outPath, runtimeWorkspace });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  console.error(usage());
  process.exit(1);
});
