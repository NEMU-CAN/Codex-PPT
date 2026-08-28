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
  bg: "#F5F7FA",
  panel: "#FFFFFF",
  ink: "#1B2A3A",
  muted: "#64748B",
  accent: "#156082",
  accentSoft: "#8FC1D0",
  border: "#D9E2EC",
  inverse: "#FFFFFF",
  deep: "#0E2841",
  deepSoft: "#1B3A5C",
  highlight: "#E97132",
  titleFont: "Microsoft YaHei UI",
  bodyFont: "Microsoft YaHei",
  monoFont: "Cascadia Mono",
};

const THEMES = {
  academic: {
    style: "academic",
    bg: "#F3F6FA",
    panel: "#FFFFFF",
    ink: "#1C2530",
    muted: "#5B677A",
    accent: "#1F6FB2",
    accentSoft: "#D9E8F5",
    border: "#D9E1EC",
    inverse: "#FFFFFF",
    deep: "#15385B",
    deepSoft: "#204573",
    highlight: "#FF9900",
    danger: "#F65C5C",
    red: "#C5282F",
    secondary: "#00A6A6",
    titleFont: "Microsoft YaHei UI",
    bodyFont: "Microsoft YaHei",
    monoFont: "Cascadia Mono",
  },
  corporate: {
    bg: "#F5F7FA",
    panel: "#FFFFFF",
    ink: "#1B2A3A",
    muted: "#64748B",
    accent: "#156082",
    accentSoft: "#8FC1D0",
    border: "#D9E2EC",
    inverse: "#FFFFFF",
    deep: "#0E2841",
    deepSoft: "#1B3A5C",
    highlight: "#E97132",
    titleFont: "Microsoft YaHei UI",
    bodyFont: "Microsoft YaHei",
    monoFont: "Cascadia Mono",
  },
  ocean: {
    bg: "#EDF4F8",
    panel: "#FFFFFF",
    ink: "#123A4A",
    muted: "#5B7A8C",
    accent: "#1F7A8C",
    accentSoft: "#9CD2DE",
    border: "#C9DEE6",
    inverse: "#FFFFFF",
    deep: "#0F3A47",
    deepSoft: "#175563",
    highlight: "#E4572E",
    titleFont: "Microsoft YaHei UI",
    bodyFont: "Microsoft YaHei",
    monoFont: "Cascadia Mono",
  },
  forest: {
    bg: "#EEF4EE",
    panel: "#FFFFFF",
    ink: "#1B3320",
    muted: "#5F7A63",
    accent: "#2F6B3B",
    accentSoft: "#A9CDB0",
    border: "#CDE0CF",
    inverse: "#FFFFFF",
    deep: "#14351D",
    deepSoft: "#1E4A2A",
    highlight: "#D9A520",
    titleFont: "Microsoft YaHei UI",
    bodyFont: "Microsoft YaHei",
    monoFont: "Cascadia Mono",
  },
  cathedral: {
    bg: "#F5F0E6",
    panel: "#FDFAF3",
    ink: "#232A3A",
    muted: "#6E675C",
    accent: "#A77A2F",
    accentSoft: "#DCC08A",
    border: "#DCD0BE",
    inverse: "#FFFFFF",
    deep: "#1F2738",
    deepSoft: "#2F3951",
    highlight: "#C65D2E",
    titleFont: "Microsoft YaHei UI",
    bodyFont: "Microsoft YaHei",
    monoFont: "Cascadia Mono",
  },
  slate: {
    bg: "#EEF1F5",
    panel: "#FFFFFF",
    ink: "#1F2937",
    muted: "#6B7280",
    accent: "#3B82F6",
    accentSoft: "#A5C8FA",
    border: "#D1D5DB",
    inverse: "#FFFFFF",
    deep: "#1E3A5F",
    deepSoft: "#2C4A6E",
    highlight: "#F59E0B",
    titleFont: "Microsoft YaHei UI",
    bodyFont: "Microsoft YaHei",
    monoFont: "Cascadia Mono",
  },
  sunset: {
    bg: "#FDF1E9",
    panel: "#FFFFFF",
    ink: "#3B2A20",
    muted: "#8A6A55",
    accent: "#E4572E",
    accentSoft: "#F5B08A",
    border: "#EAD2C2",
    inverse: "#FFFFFF",
    deep: "#4A1F0E",
    deepSoft: "#6B2D14",
    highlight: "#2E86AB",
    titleFont: "Microsoft YaHei UI",
    bodyFont: "Microsoft YaHei",
    monoFont: "Cascadia Mono",
  },
  midnight: {
    bg: "#0F172A",
    panel: "#1E293B",
    ink: "#F1F5F9",
    muted: "#94A3B8",
    accent: "#38BDF8",
    accentSoft: "#7DD3FC",
    border: "#334155",
    inverse: "#F8FAFC",
    deep: "#0B1220",
    deepSoft: "#16233A",
    highlight: "#F59E0B",
    titleFont: "Microsoft YaHei UI",
    bodyFont: "Microsoft YaHei",
    monoFont: "Cascadia Mono",
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
    highlight: "#F59E0B",
    titleFont: "Microsoft YaHei UI",
    bodyFont: "Microsoft YaHei",
    monoFont: "Cascadia Mono",
  },
  spring: {
    bg: "#F0F7F0",
    panel: "#FFFFFF",
    ink: "#1B2E1B",
    muted: "#5F7A5F",
    accent: "#2E9E5B",
    accentSoft: "#A9D8B8",
    border: "#CDE0CD",
    inverse: "#FFFFFF",
    deep: "#123B22",
    deepSoft: "#1E5731",
    highlight: "#F59E0B",
    titleFont: "Microsoft YaHei UI",
    bodyFont: "Microsoft YaHei",
    monoFont: "Cascadia Mono",
  },
  royal: {
    bg: "#F5F2FA",
    panel: "#FFFFFF",
    ink: "#241B38",
    muted: "#6E6285",
    accent: "#6D4FC4",
    accentSoft: "#C9B8F0",
    border: "#DCD3EE",
    inverse: "#FFFFFF",
    deep: "#2A1E4F",
    deepSoft: "#3D2C6E",
    highlight: "#E97132",
    titleFont: "Microsoft YaHei UI",
    bodyFont: "Microsoft YaHei",
    monoFont: "Cascadia Mono",
  },
};

/**
 * Resolve a theme from the brief.
 * - A string looks up a preset (corporate, ocean, forest, cathedral, slate, sunset, midnight, paper, spring, royal).
 * - An object is treated as a custom theme and merged over the base (or over a preset named by `theme.base`).
 */
function themeForName(name) {
  if (name && typeof name === "object" && !Array.isArray(name)) {
    const base =
      typeof name.base === "string" && THEMES[name.base] ? THEMES[name.base] : undefined;
    return { ...BASE_THEME, ...(base || {}), ...name };
  }
  return THEMES[name] || THEMES.corporate;
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
  return String(rawTheme || "corporate");
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
      brand: rawBrief.deck.brand && typeof rawBrief.deck.brand === "object"
        ? {
            mark: String(rawBrief.deck.brand.mark || ""),
            secondaryMark: String(rawBrief.deck.brand.secondaryMark || ""),
            name: String(rawBrief.deck.brand.name || rawBrief.deck.title || ""),
            tagline: String(rawBrief.deck.brand.tagline || ""),
            logoPath: rawBrief.deck.brand.logoPath ? String(rawBrief.deck.brand.logoPath) : "",
          }
        : { mark: "", secondaryMark: "", name: String(rawBrief.deck.title || ""), tagline: "", logoPath: "" },
      sections: ensureArray(rawBrief.deck.sections || [], "deck.sections").map((section, index) => ({
        id: String(section.id || index + 1),
        label: String(section.label || section.title || `第${index + 1}部分`),
        title: String(section.title || section.label || ""),
      })),
    },
    slides: slides.map((slide, index) => ({
      ...slide,
      type: String(slide.type || "").trim(),
      section: slide.section != null ? String(slide.section) : "",
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
    (code >= 0x1100 && code <= 0x115f) ||
    code === 0x2329 ||
    code === 0x232a ||
    (code >= 0x2e80 && code <= 0xa4cf) ||
    (code >= 0xac00 && code <= 0xd7a3) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xfe10 && code <= 0xfe19) ||
    (code >= 0xfe30 && code <= 0xfe6f) ||
    (code >= 0xff00 && code <= 0xff60) ||
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

function estimateLines(text, fontSize, width, bold = false) {
  const charWidth = fontSize * (bold ? 0.55 : 0.5);
  const charsPerLine = Math.max(1, Math.floor(width / charWidth));
  let total = 0;
  for (const rawLine of String(text).split("\n")) {
    const length = effectiveTextLength(rawLine);
    total += Math.max(1, Math.ceil(length / charsPerLine));
  }
  return total;
}

function fitFontSize(text, width, height, fontSize, minSize = 10, lineHeight = 1.5, bold = false) {
  let size = fontSize;
  while (size > minSize) {
    const lines = estimateLines(text, size, width, bold);
    const needed = lines * size * lineHeight;
    if (needed <= height) break;
    size -= 1;
  }
  return Math.max(minSize, size);
}

/**
 * The runtime renders at 96 dpi (1280x720 px slide), while PowerPoint stores font
 * sizes in points. A runtime fontSize of N px becomes N * 72/96 = 0.75N pt in the
 * exported file. We scale configured sizes by 4/3 so they appear at their intended
 * point size in PowerPoint.
 */
const FONT_SCALE = 4 / 3;

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

/**
 * Add a shape, optionally with rounded corners.
 * `radius` accepts values like "rounded-sm", "rounded-lg" (or a number if the runtime supports it).
 */
function addShape(ctx, slide, x, y, width, height, fill, lineFill = "#00000000", lineWidth = 0, geometry = "rect", radius) {
  const options = {
    geometry,
    position: { left: x, top: y, width, height },
    fill,
    line: ctx.line(lineFill, lineWidth),
  };
  if (radius) options.borderRadius = radius;
  return slide.shapes.add(options);
}

function addText(ctx, slide, options) {
  const {
    text = "",
    width,
    height,
    fontSize = 24,
    minSize = 10,
    lineHeight = 1.5,
    fit = true,
    ...rest
  } = options;

  let size = fontSize * FONT_SCALE;
  if (fit && width && height && text) {
    size = fitFontSize(text, width, height, size, minSize * FONT_SCALE, lineHeight, Boolean(rest.bold));
  }

  const shape = ctx.addText(slide, {
    text,
    width,
    height,
    fontSize: size,
    ...rest,
  });

  // Best-effort line spacing; the runtime exposes a direct `lineSpacing` setter
  // that accepts a multiplier (e.g. 1.5) and converts it to a percentage.
  // The runtime defaults every textbox to 150%, so we must explicitly set 100%
  // for single-line labels (badges, buttons, nav, footer) — that keeps glyphs
  // centered inside circles/rectangles in PowerPoint. Multi-line body text gets
  // the generous 1.5x spacing.
  if (shape?.text) {
    const isSingleLine = estimateLines(text, size, width, Boolean(rest.bold)) <= 1;
    const effectiveLineHeight = isSingleLine ? 1 : lineHeight;
    try {
      shape.text.lineSpacing = effectiveLineHeight;
    } catch {
      // ignore
    }
  }
  return shape;
}

/** Split text on `**keyword**` markers into { text, highlight } segments. */
function parseMarkedText(text) {
  const segments = [];
  const regex = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m;
  while ((m = regex.exec(text))) {
    if (m.index > last) segments.push({ text: text.slice(last, m.index), highlight: false });
    segments.push({ text: m[1], highlight: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), highlight: false });
  return segments.filter((s) => s.text.length > 0);
}

/**
 * Rich-text aware text renderer.
 * - Plain text (no `**`) delegates to addText (auto-fit + line spacing).
 * - Text with `**keyword**` markers is laid out as per-segment textboxes so the
 *   highlighted words render in `highlightColor`. This avoids the fragile run
 *   text-style API of the runtime.
 */
function addRichText(ctx, slide, options) {
  const {
    text = "",
    x,
    y,
    width,
    height,
    fontSize = 24,
    minSize = 10,
    lineHeight = 1.5,
    highlightColor = "#C5282F",
    bold = false,
    color = "#1C2530",
    typeface = "Microsoft YaHei",
    align = "left",
    bullet = false,
  } = options;

  const raw = String(text);
  if (!raw.includes("**")) {
    return addText(ctx, slide, {
      text: raw,
      x,
      y,
      width,
      height,
      fontSize,
      minSize,
      lineHeight,
      bold,
      color,
      typeface,
      align,
    });
  }

  const plain = raw.replace(/\*\*/g, "");
  let pxSize = fitFontSize(plain, width, height, fontSize * FONT_SCALE, minSize * FONT_SCALE, lineHeight, bold);
  const charW = (s) => effectiveTextLength(s) * pxSize * (bold ? 0.55 : 0.5);
  const lineH = pxSize * lineHeight;
  const indent = bullet ? pxSize : 0;
  const effWidth = width - indent;

  // Never split a keyword across lines: shrink the font until every segment
  // fits the box width on its own.
  const rawLines = raw.split("\n");
  const allSegs = rawLines.flatMap((line) => parseMarkedText(line));
  const maxSegUnits = Math.max(1, ...allSegs.map((s) => effectiveTextLength(s.text)));
  while (pxSize > minSize * FONT_SCALE && maxSegUnits * pxSize * (bold ? 0.55 : 0.5) > effWidth) {
    pxSize -= 1;
  }

  // Wrap whole segments into visual lines (segments are never split).
  // Each raw line (e.g. one bullet) keeps its own group so continuation lines
  // get the hanging indent while every first line starts at the box origin.
  const lineGroups = [];
  for (const rawLine of rawLines) {
    const segs = parseMarkedText(rawLine);
    const group = [];
    let line = [];
    let lineW = 0;
    for (const seg of segs) {
      const w = charW(seg.text);
      if (line.length > 0 && lineW + w > effWidth) {
        group.push(line);
        line = [];
        lineW = 0;
      }
      line.push({ text: seg.text, highlight: seg.highlight });
      lineW += w;
    }
    if (line.length > 0) group.push(line);
    lineGroups.push(group);
  }

  let globalLine = 0;
  lineGroups.forEach((group) => {
    group.forEach((line, li) => {
      const lineY = y + globalLine * lineH;
      const lineX = li === 0 ? x : x + indent;
      const totalW = line.reduce((acc, s) => acc + charW(s.text), 0);
      let cx = lineX;
      if (align === "center") cx = x + (width - totalW) / 2;
      else if (align === "right") cx = x + width - totalW;
      for (const seg of line) {
        const w = charW(seg.text);
        const shape = ctx.addText(slide, {
          text: seg.text,
          x: cx,
          y: lineY,
          width: w + 2,
          height: lineH,
          fontSize: pxSize,
          bold: seg.highlight ? true : bold,
          color: seg.highlight ? highlightColor : color,
          typeface,
          align: "left",
          valign: "top",
        });
        try {
          if (shape?.text) shape.text.lineSpacing = 1;
        } catch {
          // ignore
        }
        cx += w + 1;
      }
      globalLine += 1;
    });
  });
}

function addBaseBackground(ctx, slide, theme) {
  addShape(ctx, slide, 0, 0, ctx.W, ctx.H, theme.bg);
}

function addKicker(ctx, slide, theme, text, x = 72, y = 62, width = 150) {
  if (!text) return;
  const height = 28;
  addShape(ctx, slide, x, y, width, height, theme.accent, "#00000000", 0, "rect", "rounded-sm");
  addText(ctx, slide, {
    text: String(text).toUpperCase(),
    x,
    y,
    width,
    height,
    fontSize: 12,
    bold: true,
    color: theme.inverse,
    typeface: theme.bodyFont,
    align: "center",
    valign: "middle",
    fit: false,
  });
}

function addFooter(ctx, slide, theme, deck, slideNumber, slideCount, onDark = false) {
  const lineColor = onDark ? theme.accentSoft : theme.border;
  const textColor = onDark ? theme.accentSoft : theme.muted;
  const brandName = deck.brand?.name || deck.title;
  addShape(ctx, slide, 52, 676, ctx.W - 104, 1, lineColor);
  addText(ctx, slide, {
    text: `${brandName}  |  ${deck.author}`,
    x: 52,
    y: 686,
    width: 430,
    height: 18,
    fontSize: 11,
    color: textColor,
    typeface: theme.bodyFont,
    fit: false,
  });
  addText(ctx, slide, {
    text: `${slideNumber}/${slideCount}`,
    x: ctx.W - 112,
    y: 686,
    width: 60,
    height: 18,
    fontSize: 10,
    color: textColor,
    typeface: theme.bodyFont,
    align: "right",
    fit: false,
  });
}

function addBrandMark(ctx, slide, theme, deck, onDark = false) {
  const mark = deck.brand?.mark || "班";
  const secondaryMark = deck.brand?.secondaryMark || "";
  const name = deck.brand?.name || deck.title;
  const fg = onDark ? theme.inverse : theme.deep;
  const badgeFill = onDark ? theme.inverse : theme.deep;
  const badgeText = onDark ? theme.deep : theme.inverse;

  // Reference-style dual mark area at top-left. A real logo can be supplied later via logoPath.
  addShape(ctx, slide, 52, 24, 46, 46, badgeFill, "#00000000", 0, "ellipse");
  addText(ctx, slide, {
    text: mark,
    x: 52,
    y: 24,
    width: 46,
    height: 46,
    fontSize: 18,
    bold: true,
    color: badgeText,
    typeface: theme.bodyFont,
    align: "center",
    valign: "middle",
    fit: false,
  });
  if (secondaryMark) {
    addShape(ctx, slide, 106, 28, 38, 38, theme.highlight || theme.accent, "#00000000", 0, "ellipse");
    addText(ctx, slide, {
      text: secondaryMark,
      x: 106,
      y: 28,
      width: 38,
      height: 38,
      fontSize: 12,
      bold: true,
      color: theme.inverse,
      typeface: theme.bodyFont,
      align: "center",
      valign: "middle",
      fit: false,
    });
  }
  addText(ctx, slide, {
    text: name,
    x: 1090,
    y: 25,
    width: 170,
    height: 24,
    fontSize: 14,
    bold: true,
    color: fg,
    typeface: theme.bodyFont,
    align: "right",
  });
  if (deck.brand?.tagline) {
    addText(ctx, slide, {
      text: deck.brand.tagline,
      x: 1090,
      y: 50,
      width: 170,
      height: 18,
      fontSize: 10,
      color: onDark ? theme.accentSoft : theme.muted,
      typeface: theme.bodyFont,
      align: "right",
    });
  }
}

function addSectionNav(ctx, slide, theme, deck, activeSection, onDark = false) {
  const sections = deck.sections || [];
  if (sections.length === 0) return;
  const numerals = ["一", "二", "三", "四", "五", "六"];
  const x = 170;
  const y = 22;
  const totalWidth = 880;
  const height = 52;
  const itemWidth = totalWidth / sections.length;

  // Continuous blue band with an orange sliding active segment, matching the reference deck.
  addShape(ctx, slide, x, y, totalWidth, height, onDark ? theme.deepSoft : theme.deep, "#00000000", 0);
  sections.forEach((section, index) => {
    const active = String(section.id) === String(activeSection || "");
    const sx = x + index * itemWidth;
    if (active) addShape(ctx, slide, sx, y, itemWidth, height, theme.highlight || "#FF9900");
    if (index > 0) addShape(ctx, slide, sx, y + 7, 1, height - 14, onDark ? theme.accentSoft : "#7EA4C7");
    addText(ctx, slide, {
      text: `${numerals[index] || index + 1}  ${section.label}`,
      x: sx + 8,
      y: y + 16,
      width: itemWidth - 16,
      height: 22,
      fontSize: 15,
      bold: active,
      color: theme.inverse,
      typeface: theme.bodyFont,
      align: "center",
      fit: false,
    });
  });
}

/** Consistent academic header: chapter navigation + brand mark + title block. */
function addHeader(ctx, slide, theme, deck, spec, onDark = false) {
  const titleColor = onDark ? theme.inverse : theme.ink;
  const kickerColor = onDark ? theme.accentSoft : theme.accent;
  addShape(ctx, slide, 0, 0, ctx.W, 8, theme.accent);
  addSectionNav(ctx, slide, theme, deck, spec.section, onDark);
  addBrandMark(ctx, slide, theme, deck, onDark);
  addText(ctx, slide, {
    text: String(spec.kicker || ""),
    x: 52,
    y: 90,
    width: 260,
    height: 24,
    fontSize: 16,
    bold: true,
    color: kickerColor,
    typeface: theme.bodyFont,
  });
  addText(ctx, slide, {
    text: spec.title,
    x: 52,
    y: 120,
    width: 1080,
    height: 78,
    fontSize: 36,
    bold: true,
    color: titleColor,
    typeface: theme.titleFont,
  });
  addShape(ctx, slide, 52, 200, 840, 3, theme.danger || theme.highlight || theme.accent);
}

/** Soft decorative circles peeking from corners to add visual interest. */
function addCornerDecor(ctx, slide, theme, corner = "tr") {
  if (corner === "tr") {
    addShape(ctx, slide, ctx.W - 230, -130, 360, 360, theme.accentSoft, "#00000000", 0, "ellipse");
  } else if (corner === "bl") {
    addShape(ctx, slide, -110, ctx.H - 170, 260, 260, theme.accentSoft, "#00000000", 0, "ellipse");
  } else if (corner === "tl") {
    addShape(ctx, slide, -130, -130, 300, 300, theme.accentSoft, "#00000000", 0, "ellipse");
  } else if (corner === "br") {
    addShape(ctx, slide, ctx.W - 170, ctx.H - 170, 280, 280, theme.accentSoft, "#00000000", 0, "ellipse");
  }
}

function bulletLines(items, marker = "•") {
  return ensureArray(items, "bullets")
    .map((item) => `${marker} ${String(item)}`)
    .join("\n");
}

function cardPalette(theme, index = 0) {
  if (theme.style !== "academic") {
    return { fill: theme.panel, accent: theme.accent };
  }
  const fills = ["#EAF3FB", "#FCEDEE", "#E8F7F7", "#FFF7E6", "#F1F4F8"];
  const accents = ["#1F6FB2", "#C5282F", "#00A6A6", "#D9A441", "#3A8F5C"];
  return {
    fill: fills[index % fills.length],
    accent: accents[index % accents.length],
  };
}

/* ------------------------------------------------------------------ */
/* Slide renderers                                                    */
/* ------------------------------------------------------------------ */

async function renderCoverSlide(ctx, slide, theme, deck, spec, slideNumber, slideCount) {
  addBaseBackground(ctx, slide, theme);
  addShape(ctx, slide, 0, 0, ctx.W, 8, theme.accent);
  addCornerDecor(ctx, slide, theme, "tr");
  addCornerDecor(ctx, slide, theme, "bl");

  // Right deep panel with brand
  addShape(ctx, slide, 760, 0, 520, ctx.H, theme.deep);
  addShape(ctx, slide, 760, 0, 520, 8, theme.highlight || theme.accent);
  addShape(ctx, slide, 940, 420, 340, 340, theme.deepSoft, "#00000000", 0, "ellipse");
  addShape(ctx, slide, 700, 520, 200, 200, theme.accent, "#00000000", 0, "ellipse");

  await maybeAddImage(ctx, slide, spec.imagePath, { x: 800, y: 110, width: 440, height: 380 }, "cover");
  addShape(ctx, slide, 800, 110, 440, 380, "#00000000", theme.accentSoft, 2, "rect", "rounded-lg");

  // Left content
  addKicker(ctx, slide, theme, spec.tag, 72, 96, 160);
  addText(ctx, slide, {
    text: String(spec.title || deck.title),
    x: 72,
    y: 168,
    width: 620,
    height: 190,
    fontSize: 50,
    bold: true,
    color: theme.ink,
    typeface: theme.titleFont,
  });
  addText(ctx, slide, {
    text: String(spec.subtitle || deck.subtitle || ""),
    x: 72,
    y: 386,
    width: 560,
    height: 100,
    fontSize: 24,
    color: theme.muted,
    typeface: theme.bodyFont,
  });

  addShape(ctx, slide, 72, 540, 90, 6, theme.highlight || theme.accent);
  addText(ctx, slide, {
    text: String(spec.note || ""),
    x: 72,
    y: 572,
    width: 480,
    height: 44,
    fontSize: 16,
    color: theme.accent,
    typeface: theme.bodyFont,
    bold: true,
  });

  // Right-panel branding (from brief, never hardcoded)
  const brandTitle = spec.brandTitle ?? deck.title;
  const brandSubtitle = spec.brandSubtitle ?? deck.subtitle;
  if (brandTitle) {
    addText(ctx, slide, {
      text: String(brandTitle),
      x: 790,
      y: 600,
      width: 460,
      height: 44,
      fontSize: 28,
      bold: true,
      color: theme.inverse,
      typeface: theme.titleFont,
      fit: false,
    });
  }
  if (brandSubtitle) {
    addText(ctx, slide, {
      text: String(brandSubtitle),
      x: 790,
      y: 650,
      width: 460,
      height: 34,
      fontSize: 16,
      color: "#BFD3E0",
      typeface: theme.bodyFont,
      fit: false,
    });
  }

  addFooter(ctx, slide, theme, deck, slideNumber, slideCount);
}

async function renderBulletsSlide(ctx, slide, theme, deck, spec, slideNumber, slideCount) {
  addBaseBackground(ctx, slide, theme);
  addHeader(ctx, slide, theme, deck, spec);
  addCornerDecor(ctx, slide, theme, "bl");

  const bulletCard = cardPalette(theme, 0);
  addShape(ctx, slide, 72, 232, 580, 424, bulletCard.fill, theme.border, 1, "rect", "rounded-lg");
  addShape(ctx, slide, 72, 232, 10, 424, bulletCard.accent, "#00000000", 0, "rect", "rounded-sm");
  addRichText(ctx, slide, {
    text: bulletLines(spec.bullets || []),
    x: 102,
    y: 268,
    width: 520,
    height: 356,
    fontSize: 26,
    bold: true,
    color: theme.ink,
    typeface: theme.bodyFont,
    highlightColor: theme.red || theme.highlight || "#C5282F",
    bullet: true,
  });

  addShape(ctx, slide, 686, 232, 522, 240, theme.deep, "#00000000", 0, "rect", "rounded-lg");
  addText(ctx, slide, {
    text: String(spec.asideTitle || "Context").toUpperCase(),
    x: 722,
    y: 268,
    width: 140,
    height: 20,
    fontSize: 14,
    bold: true,
    color: theme.highlight || theme.accentSoft,
    typeface: theme.bodyFont,
    fit: false,
  });
  addRichText(ctx, slide, {
    text: String(spec.asideText || ""),
    x: 722,
    y: 310,
    width: 440,
    height: 130,
    fontSize: 26,
    bold: true,
    color: theme.inverse,
    typeface: theme.titleFont,
    highlightColor: theme.red || theme.highlight || "#C5282F",
  });

  await maybeAddImage(ctx, slide, spec.imagePath, { x: 686, y: 492, width: 522, height: 100 }, "cover");
  addShape(ctx, slide, 686, 492, 522, 100, "#00000000", theme.border, 1, "rect", "rounded-lg");

  addFooter(ctx, slide, theme, deck, slideNumber, slideCount);
}

async function renderMetricsSlide(ctx, slide, theme, deck, spec, slideNumber, slideCount) {
  addShape(ctx, slide, 0, 0, ctx.W, ctx.H, theme.deep);
  addShape(ctx, slide, 0, 0, ctx.W, 8, theme.highlight || theme.accent);
  addShape(ctx, slide, ctx.W - 260, -120, 420, 420, theme.deepSoft, "#00000000", 0, "ellipse");
  addShape(ctx, slide, -120, ctx.H - 160, 280, 280, theme.deepSoft, "#00000000", 0, "ellipse");
  addHeader(ctx, slide, theme, deck, spec, true);

  const cards = ensureArray(spec.metrics || [], "metrics");
  if (cards.length === 0) {
    throw new Error("metrics slide must contain at least one metric.");
  }
  const gutter = 28;
  const left = 72;
  const cardWidth = Math.floor((ctx.W - left * 2 - gutter * (cards.length - 1)) / cards.length);
  const top = 250;

  cards.forEach((metric, index) => {
    const x = left + index * (cardWidth + gutter);
    addShape(ctx, slide, x, top, cardWidth, 280, theme.panel, "#00000000", 0, "rect", "rounded-lg");
    addShape(ctx, slide, x, top, cardWidth, 12, theme.accent, "#00000000", 0, "rect", "rounded-sm");
    addText(ctx, slide, {
      text: String(metric.value || ""),
      x: x + 28,
      y: top + 52,
      width: cardWidth - 56,
      height: 64,
      fontSize: 44,
      bold: true,
      color: theme.accent,
      typeface: theme.titleFont,
    });
    addText(ctx, slide, {
      text: String(metric.label || ""),
      x: x + 28,
      y: top + 132,
      width: cardWidth - 56,
      height: 32,
      fontSize: 22,
      bold: true,
      color: theme.ink,
      typeface: theme.bodyFont,
    });
    addText(ctx, slide, {
      text: String(metric.note || ""),
      x: x + 28,
      y: top + 176,
      width: cardWidth - 56,
      height: 72,
      fontSize: 17,
      color: theme.muted,
      typeface: theme.bodyFont,
    });
  });

  addShape(ctx, slide, 72, 590, 1136, 2, theme.accentSoft);
  addRichText(ctx, slide, {
    text: String(spec.takeaway || ""),
    x: 72,
    y: 610,
    width: 1000,
    height: 50,
    fontSize: 24,
    bold: true,
    color: theme.inverse,
    typeface: theme.bodyFont,
    highlightColor: theme.highlight || "#FF9900",
  });

  addFooter(ctx, slide, theme, deck, slideNumber, slideCount, true);
}

async function renderClosingSlide(ctx, slide, theme, deck, spec, slideNumber, slideCount) {
  addBaseBackground(ctx, slide, theme);
  addShape(ctx, slide, 0, 0, ctx.W, 8, theme.accent);
  addCornerDecor(ctx, slide, theme, "tr");
  addCornerDecor(ctx, slide, theme, "bl");
  addSectionNav(ctx, slide, theme, deck, spec.section, false);
  addBrandMark(ctx, slide, theme, deck, false);

  addShape(ctx, slide, 72, 150, 1136, 400, theme.deep, "#00000000", 0, "rect", "rounded-lg");
  addShape(ctx, slide, 72, 150, 16, 400, theme.highlight || theme.accent);
  addShape(ctx, slide, 1000, 380, 220, 220, theme.deepSoft, "#00000000", 0, "ellipse");

  addText(ctx, slide, {
    text: String(spec.kicker || "").toUpperCase(),
    x: 130,
    y: 210,
    width: 220,
    height: 22,
    fontSize: 15,
    bold: true,
    color: theme.highlight || theme.accentSoft,
    typeface: theme.bodyFont,
    fit: false,
  });
  addText(ctx, slide, {
    text: String(spec.title || ""),
    x: 130,
    y: 252,
    width: 920,
    height: 100,
    fontSize: 44,
    bold: true,
    color: theme.inverse,
    typeface: theme.titleFont,
  });
  addRichText(ctx, slide, {
    text: String(spec.message || deck.subtitle || ""),
    x: 130,
    y: 376,
    width: 920,
    height: 90,
    fontSize: 26,
    bold: true,
    color: "#D5E0EA",
    typeface: theme.bodyFont,
    highlightColor: theme.highlight || "#FF9900",
  });
  if (spec.cta) {
    addShape(ctx, slide, 130, 492, 180, 42, theme.highlight || theme.accent, "#00000000", 0, "rect", "rounded-lg");
    addText(ctx, slide, {
      text: String(spec.cta),
      x: 130,
      y: 492,
      width: 180,
      height: 42,
      fontSize: 18,
      bold: true,
      color: theme.inverse,
      typeface: theme.bodyFont,
      align: "center",
      valign: "middle",
      fit: false,
    });
  }
  addFooter(ctx, slide, theme, deck, slideNumber, slideCount);
}

async function renderAgendaSlide(ctx, slide, theme, deck, spec, slideNumber, slideCount) {
  addBaseBackground(ctx, slide, theme);
  addHeader(ctx, slide, theme, deck, spec);
  addCornerDecor(ctx, slide, theme, "bl");

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
  const startY = 236;
  const rowHeight = 116;

  items.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = colX[col];
    const y = startY + row * rowHeight;

    const palette = cardPalette(theme, index);
    addShape(ctx, slide, x, y, colWidth, 100, palette.fill, theme.border, 1, "rect", "rounded-lg");
    addShape(ctx, slide, x, y, 8, 100, palette.accent, "#00000000", 0, "rect", "rounded-sm");

    addShape(ctx, slide, x + 28, y + 24, 44, 44, palette.accent, "#00000000", 0, "ellipse");
    addText(ctx, slide, {
      text: item.number,
      x: x + 28,
      y: y + 24,
      width: 44,
      height: 44,
      fontSize: 20,
      bold: true,
      color: theme.inverse,
      typeface: theme.bodyFont,
      align: "center",
      valign: "middle",
      fit: false,
    });

    addText(ctx, slide, {
      text: item.title,
      x: x + 92,
      y: y + 12,
      width: colWidth - 112,
      height: 48,
      fontSize: 24,
      bold: true,
      color: theme.ink,
      typeface: theme.bodyFont,
    });
    if (item.detail) {
      addText(ctx, slide, {
        text: item.detail,
        x: x + 92,
        y: y + 62,
        width: colWidth - 112,
        height: 32,
        fontSize: 16,
        color: theme.muted,
        typeface: theme.bodyFont,
      });
    }
  });

  addFooter(ctx, slide, theme, deck, slideNumber, slideCount);
}

async function renderSectionSlide(ctx, slide, theme, deck, spec, slideNumber, slideCount) {
  addShape(ctx, slide, 0, 0, ctx.W, ctx.H, theme.deep);
  addShape(ctx, slide, 0, 0, ctx.W, 8, theme.highlight || theme.accent);
  addShape(ctx, slide, ctx.W - 320, -140, 460, 460, theme.deepSoft, "#00000000", 0, "ellipse");
  addShape(ctx, slide, -150, ctx.H - 200, 340, 340, theme.deepSoft, "#00000000", 0, "ellipse");
  addSectionNav(ctx, slide, theme, deck, spec.section, true);
  addBrandMark(ctx, slide, theme, deck, true);

  const number = spec.number != null ? String(spec.number) : String(spec.index).padStart(2, "0");
  addShape(ctx, slide, ctx.W / 2 - 80, 150, 160, 160, theme.accent, "#00000000", 0, "ellipse");
  addText(ctx, slide, {
    text: number,
    x: ctx.W / 2 - 80,
    y: 150,
    width: 160,
    height: 160,
    fontSize: 80,
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
    height: 100,
    fontSize: 48,
    bold: true,
    color: theme.inverse,
    typeface: theme.titleFont,
    align: "center",
  });
  addShape(ctx, slide, ctx.W / 2 - 40, 478, 80, 5, theme.highlight || theme.accent);

  addText(ctx, slide, {
    text: String(spec.subtitle || ""),
    x: 240,
    y: 506,
    width: 800,
    height: 60,
    fontSize: 24,
    color: theme.accentSoft,
    typeface: theme.bodyFont,
    align: "center",
  });

  addFooter(ctx, slide, theme, deck, slideNumber, slideCount, true);
}

async function renderTwoColumnSlide(ctx, slide, theme, deck, spec, slideNumber, slideCount) {
  addBaseBackground(ctx, slide, theme);
  addHeader(ctx, slide, theme, deck, spec);
  addCornerDecor(ctx, slide, theme, "bl");

  const columns = [
    { x: 72, heading: spec.leftHeading, bullets: spec.leftBullets || [] },
    { x: 668, heading: spec.rightHeading, bullets: spec.rightBullets || [] },
  ];

  columns.forEach((column, index) => {
    const palette = cardPalette(theme, index);
    addShape(ctx, slide, column.x, 232, 540, 424, palette.fill, theme.border, 1, "rect", "rounded-lg");
    addShape(ctx, slide, column.x, 232, 10, 424, palette.accent, "#00000000", 0, "rect", "rounded-sm");
    if (column.heading) {
      addText(ctx, slide, {
        text: String(column.heading),
        x: column.x + 28,
        y: 268,
        width: 484,
        height: 56,
        fontSize: 26,
        bold: true,
        color: theme.accent,
        typeface: theme.bodyFont,
      });
    }
    addRichText(ctx, slide, {
      text: bulletLines(column.bullets),
      x: column.x + 28,
      y: column.heading ? 336 : 268,
      width: 484,
      height: column.heading ? 300 : 364,
      fontSize: 22,
      bold: true,
      color: theme.ink,
      typeface: theme.bodyFont,
      highlightColor: theme.red || theme.highlight || "#C5282F",
      bullet: true,
    });
  });

  addFooter(ctx, slide, theme, deck, slideNumber, slideCount);
}

async function renderComparisonSlide(ctx, slide, theme, deck, spec, slideNumber, slideCount) {
  addBaseBackground(ctx, slide, theme);
  addHeader(ctx, slide, theme, deck, spec);
  addCornerDecor(ctx, slide, theme, "bl");

  const leftPalette = cardPalette(theme, 1);
  addShape(ctx, slide, 72, 232, 540, 424, leftPalette.fill, theme.border, 1, "rect", "rounded-lg");
  addShape(ctx, slide, 72, 232, 10, 424, leftPalette.accent, "#00000000", 0, "rect", "rounded-sm");
  addText(ctx, slide, {
    text: String(spec.leftHeading || ""),
    x: 96,
    y: 268,
    width: 492,
    height: 56,
    fontSize: 26,
    bold: true,
    color: theme.accent,
    typeface: theme.bodyFont,
  });
  addRichText(ctx, slide, {
    text: bulletLines(spec.leftPoints || []),
    x: 96,
    y: 336,
    width: 492,
    height: 300,
    fontSize: 22,
    bold: true,
    color: theme.ink,
    typeface: theme.bodyFont,
    highlightColor: theme.red || theme.highlight || "#C5282F",
    bullet: true,
  });

  addShape(ctx, slide, 640, 232, 2, 424, theme.accent);

  addShape(ctx, slide, 668, 232, 540, 424, theme.deep, "#00000000", 0, "rect", "rounded-lg");
  addShape(ctx, slide, 668, 232, 540, 8, theme.highlight || theme.accent, "#00000000", 0, "rect", "rounded-sm");
  addText(ctx, slide, {
    text: String(spec.rightHeading || ""),
    x: 692,
    y: 268,
    width: 492,
    height: 56,
    fontSize: 26,
    bold: true,
    color: theme.highlight || theme.accentSoft,
    typeface: theme.bodyFont,
  });
  addRichText(ctx, slide, {
    text: bulletLines(spec.rightPoints || []),
    x: 692,
    y: 336,
    width: 492,
    height: 300,
    fontSize: 22,
    bold: true,
    color: theme.inverse,
    typeface: theme.bodyFont,
    highlightColor: theme.highlight || "#FF9900",
    bullet: true,
  });

  addFooter(ctx, slide, theme, deck, slideNumber, slideCount);
}

async function renderQuoteSlide(ctx, slide, theme, deck, spec, slideNumber, slideCount) {
  addBaseBackground(ctx, slide, theme);
  addHeader(ctx, slide, theme, deck, spec);
  addCornerDecor(ctx, slide, theme, "tr");

  const panelTop = spec.title ? 240 : 170;
  addShape(ctx, slide, 72, panelTop, 1136, 400, theme.panel, theme.border, 1, "rect", "rounded-lg");
  addShape(ctx, slide, 72, panelTop, 16, 400, theme.highlight || theme.accent);
  addShape(ctx, slide, 1050, panelTop + 210, 200, 200, theme.accentSoft, "#00000000", 0, "ellipse");

  addRichText(ctx, slide, {
    text: String(spec.quote || ""),
    x: 140,
    y: panelTop + 70,
    width: 1000,
    height: 240,
    fontSize: 44,
    bold: true,
    color: theme.ink,
    typeface: theme.titleFont,
    align: "center",
    highlightColor: theme.red || theme.highlight || "#C5282F",
  });

  if (spec.attribution) {
    addText(ctx, slide, {
      text: String(spec.attribution),
      x: 140,
      y: panelTop + 330,
      width: 1000,
      height: 40,
      fontSize: 20,
      bold: true,
      color: theme.accent,
      typeface: theme.bodyFont,
      align: "center",
    });
  }

  addFooter(ctx, slide, theme, deck, slideNumber, slideCount);
}

async function renderTableSlide(ctx, slide, theme, deck, spec, slideNumber, slideCount) {
  addBaseBackground(ctx, slide, theme);
  addHeader(ctx, slide, theme, deck, spec);
  addCornerDecor(ctx, slide, theme, "bl");

  const headers = ensureArray(spec.headers || [], "table headers");
  const rows = ensureArray(spec.rows || [], "table rows");
  if (headers.length === 0 || rows.length === 0) {
    throw new Error("table slide requires non-empty headers and rows.");
  }

  const tableX = 72;
  const tableY = 232;
  const tableWidth = 1136;
  const tableHeight = 400;
  const headerH = 56;
  const bodyH = (tableHeight - headerH) / rows.length;
  const colWidth = tableWidth / headers.length;

  addShape(ctx, slide, tableX, tableY, tableWidth, tableHeight, theme.panel, theme.border, 1, "rect", "rounded-lg");

  const cellText = (rowIndex, colIndex, cell, x, y, width, height, fill, color, align) => {
    addShape(ctx, slide, x, y, width, height, fill, theme.border, 1);
    addText(ctx, slide, {
      text: String(cell ?? ""),
      x: x + 10,
      y: y + 4,
      width: width - 20,
      height: height - 8,
      fontSize: rowIndex === -1 ? 20 : 17,
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

async function renderTimelineSlide(ctx, slide, theme, deck, spec, slideNumber, slideCount) {
  addBaseBackground(ctx, slide, theme);
  addHeader(ctx, slide, theme, deck, spec);
  addCornerDecor(ctx, slide, theme, "bl");

  const items = ensureArray(spec.items || [], "timeline items").map((item) => {
    if (typeof item === "string") return { title: item, detail: "" };
    return { title: String(item?.title || ""), detail: String(item?.detail || "") };
  });
  if (items.length === 0) {
    throw new Error("timeline slide requires at least one item.");
  }

  const lineY = 400;
  addShape(ctx, slide, 72, lineY, 1136, 4, theme.accent);

  items.forEach((item, index) => {
    const nodeX = items.length === 1 ? 640 : 72 + (1136 / (items.length - 1)) * index;
    addShape(ctx, slide, nodeX - 14, lineY - 12, 28, 28, theme.accent, theme.bg, 3, "ellipse");
    addShape(ctx, slide, nodeX - 5, lineY - 3, 10, 10, theme.highlight || theme.accent, "#00000000", 0, "ellipse");

    // Keep title/detail boxes inside the slide: first node left-aligned from the
    // node, last node right-aligned, middle nodes centered.
    const boxW = 300;
    let boxX = nodeX - boxW / 2;
    let boxAlign = "center";
    if (index === 0) {
      boxX = nodeX;
      boxAlign = "left";
    } else if (index === items.length - 1) {
      boxX = nodeX - boxW;
      boxAlign = "right";
    }
    boxX = Math.max(52, Math.min(boxX, 1228 - boxW));

    addText(ctx, slide, {
      text: item.title,
      x: boxX,
      y: 310,
      width: boxW,
      height: 70,
      fontSize: 24,
      bold: true,
      color: theme.ink,
      typeface: theme.bodyFont,
      align: boxAlign,
    });
    if (item.detail) {
      addText(ctx, slide, {
        text: item.detail,
        x: boxX,
        y: 430,
        width: boxW,
        height: 90,
        fontSize: 17,
        color: theme.muted,
        typeface: theme.bodyFont,
        align: boxAlign,
      });
    }
  });

  addFooter(ctx, slide, theme, deck, slideNumber, slideCount);
}

/**
 * Horizontal proportional bar chart, modeled on the reference deck's
 * "学分构成" chart: label + gray track + colored proportional bar + value.
 * spec: { kicker, title, cards?: [{value,color,label}], rows: [{label,value,suffix?,color?}], maxValue?, asideTitle?, asideText? }
 */
async function renderBarChartSlide(ctx, slide, theme, deck, spec, slideNumber, slideCount) {
  addBaseBackground(ctx, slide, theme);
  addHeader(ctx, slide, theme, deck, spec);
  addCornerDecor(ctx, slide, theme, "bl");

  const cards = ensureArray(spec.cards || [], "barChart cards");
  const rows = ensureArray(spec.rows || [], "barChart rows");
  if (rows.length === 0) {
    throw new Error("barChart slide requires at least one row.");
  }
  const maxValue = Number(spec.maxValue) > 0 ? Number(spec.maxValue) : Math.max(...rows.map((r) => Number(r.value) || 0));

  // Stat cards row (optional)
  let barsTop = 250;
  if (cards.length > 0) {
    const gutter = 24;
    const cardWidth = Math.floor((ctx.W - 144 - gutter * (cards.length - 1)) / cards.length);
    cards.forEach((card, index) => {
      const x = 72 + index * (cardWidth + gutter);
      const fill = card.color || theme.accent;
      addShape(ctx, slide, x, 236, cardWidth, 92, theme.panel, theme.border, 1, "rect", "rounded-lg");
      addShape(ctx, slide, x, 236, cardWidth, 10, fill, "#00000000", 0, "rect", "rounded-sm");
      addText(ctx, slide, {
        text: String(card.value || ""),
        x: x + 20,
        y: 254,
        width: cardWidth - 40,
        height: 40,
        fontSize: 28,
        bold: true,
        color: fill,
        typeface: theme.titleFont,
      });
      addText(ctx, slide, {
        text: String(card.label || ""),
        x: x + 20,
        y: 300,
        width: cardWidth - 40,
        height: 24,
        fontSize: 14,
        color: theme.muted,
        typeface: theme.bodyFont,
      });
    });
    barsTop = 348;
  }

  // Bar rows. Row height is computed adaptively so the optional aside panel
  // always stays inside the slide (content bottom = 656px).
  const labelX = 72;
  const labelW = 200;
  const trackX = 300;
  const trackW = 640;
  const valueX = 960;
  const valueW = 180;
  const hasAside = Boolean(spec.asideTitle || spec.asideText);
  const asideH = hasAside ? 88 : 0;
  const maxBottom = 656;
  const rowH = Math.min(42, Math.floor((maxBottom - barsTop - asideH - 10) / rows.length));
  const barH = 22;

  rows.forEach((row, index) => {
    const y = barsTop + index * rowH;
    const value = Number(row.value) || 0;
    const color = row.color || theme.accent;
    addText(ctx, slide, {
      text: String(row.label || ""),
      x: labelX,
      y,
      width: labelW,
      height: 30,
      fontSize: 17,
      bold: true,
      color: theme.ink,
      typeface: theme.bodyFont,
    });
    addShape(ctx, slide, trackX, y + 3, trackW, barH, theme.border, "#00000000", 0, "rect", "rounded-sm");
    const barW = Math.max(barH, (value / maxValue) * trackW);
    addShape(ctx, slide, trackX, y + 3, barW, barH, color, "#00000000", 0, "rect", "rounded-sm");
    addText(ctx, slide, {
      text: `${value}${row.suffix || ""}`,
      x: valueX,
      y,
      width: valueW,
      height: 30,
      fontSize: 17,
      bold: true,
      color: theme.ink,
      typeface: theme.bodyFont,
      align: "right",
    });
  });

  // Optional aside panel on the right of the bars
  if (hasAside) {
    const asideY = barsTop + rows.length * rowH + 10;
    addShape(ctx, slide, 72, asideY, 1136, asideH, theme.panel, theme.border, 1, "rect", "rounded-lg");
    addShape(ctx, slide, 72, asideY, 12, asideH, theme.red || theme.highlight || theme.accent);
    addText(ctx, slide, {
      text: String(spec.asideTitle || ""),
      x: 110,
      y: asideY + 12,
      width: 300,
      height: 26,
      fontSize: 16,
      bold: true,
      color: theme.red || theme.highlight || theme.accent,
      typeface: theme.bodyFont,
    });
    addRichText(ctx, slide, {
      text: String(spec.asideText || ""),
      x: 110,
      y: asideY + 44,
      width: 1060,
      height: asideH - 52,
      fontSize: 15,
      bold: true,
      color: theme.muted,
      typeface: theme.bodyFont,
      highlightColor: theme.red || theme.highlight || "#C5282F",
    });
  }

  addFooter(ctx, slide, theme, deck, slideNumber, slideCount);
}

/**
 * Flow diagram, modeled on the reference deck's "教学团队跨界融合" slide:
 * left source boxes -> chevron arrows -> right target with colored category nodes.
 * spec: { kicker, title, sources: [{title,text}], targetTitle, nodes: [{label,color}], targetText? }
 */
async function renderDiagramSlide(ctx, slide, theme, deck, spec, slideNumber, slideCount) {
  addBaseBackground(ctx, slide, theme);
  addHeader(ctx, slide, theme, deck, spec);
  addCornerDecor(ctx, slide, theme, "bl");

  const sources = ensureArray(spec.sources || [], "diagram sources");
  const nodes = ensureArray(spec.nodes || [], "diagram nodes");
  if (sources.length === 0 || nodes.length === 0) {
    throw new Error("diagram slide requires sources and nodes.");
  }

  // Left source boxes (dark blue)
  const boxX = 72;
  const boxW = 460;
  const boxH = 170;
  const boxGap = 24;
  sources.forEach((source, index) => {
    const y = 250 + index * (boxH + boxGap);
    addShape(ctx, slide, boxX, y, boxW, boxH, theme.deep, "#00000000", 0, "rect", "rounded-lg");
    addShape(ctx, slide, boxX, y, boxW, 8, theme.highlight || theme.accent, "#00000000", 0, "rect", "rounded-sm");
    addText(ctx, slide, {
      text: String(source.title || ""),
      x: boxX + 24,
      y: y + 20,
      width: boxW - 48,
      height: 34,
      fontSize: 20,
      bold: true,
      color: theme.inverse,
      typeface: theme.bodyFont,
    });
    addRichText(ctx, slide, {
      text: String(source.text || ""),
      x: boxX + 24,
      y: y + 62,
      width: boxW - 48,
      height: 90,
      fontSize: 15,
      bold: false,
      color: "#C9D8E6",
      typeface: theme.bodyFont,
      highlightColor: theme.highlight || "#FF9900",
    });
  });

  // Middle chevron arrows
  const chevronX = 560;
  const chevronY = 300;
  const chevronW = 56;
  const chevronH = 88;
  for (let i = 0; i < 2; i += 1) {
    try {
      addShape(ctx, slide, chevronX + i * 52, chevronY + i * 76, chevronW, chevronH, theme.accent, "#00000000", 0, "chevron");
    } catch {
      addShape(ctx, slide, chevronX + i * 52, chevronY + i * 76, chevronW, chevronH, theme.accent);
    }
  }

  // Right target container with colored nodes
  const targetX = 668;
  const targetW = 540;
  const targetY = 236;
  const targetH = 396;
  addShape(ctx, slide, targetX, targetY, targetW, targetH, theme.panel, theme.border, 1, "rect", "rounded-lg");
  addText(ctx, slide, {
    text: String(spec.targetTitle || ""),
    x: targetX,
    y: targetY + 14,
    width: targetW,
    height: 36,
    fontSize: 22,
    bold: true,
    color: theme.accent,
    typeface: theme.bodyFont,
    align: "center",
  });

  const nodeGap = 20;
  const nodeW = Math.floor((targetW - 40 - nodeGap) / 2);
  const nodeH = 96;
  nodes.forEach((node, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = targetX + 20 + col * (nodeW + nodeGap);
    const y = targetY + 64 + row * (nodeH + 16);
    const fill = node.color || theme.accent;
    addShape(ctx, slide, x, y, nodeW, nodeH, fill, "#00000000", 0, "rect", "rounded-lg");
    addText(ctx, slide, {
      text: String(node.label || ""),
      x,
      y,
      width: nodeW,
      height: nodeH,
      fontSize: 20,
      bold: true,
      color: theme.inverse,
      typeface: theme.bodyFont,
      align: "center",
      valign: "middle",
    });
  });

  if (spec.targetText) {
    addText(ctx, slide, {
      text: String(spec.targetText),
      x: targetX + 20,
      y: targetY + targetH - 44,
      width: targetW - 40,
      height: 32,
      fontSize: 15,
      bold: true,
      color: theme.muted,
      typeface: theme.bodyFont,
      align: "center",
    });
  }

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
  "barChart",
  "diagram",
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
    case "barChart":
      await renderBarChartSlide(ctx, slide, theme, brief.deck, spec, slideNumber, slideCount);
      break;
    case "diagram":
      await renderDiagramSlide(ctx, slide, theme, brief.deck, spec, slideNumber, slideCount);
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
