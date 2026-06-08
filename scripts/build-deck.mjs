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

function themeForName(name) {
  const themes = {
    ember: {
      bg: "#F6F1E8",
      panel: "#FFF9F2",
      ink: "#1E1B18",
      muted: "#6B6258",
      accent: "#C65D2E",
      accentSoft: "#E7B08B",
      border: "#D6C8B8",
      inverse: "#FFF8F0",
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
  };
  return themes[name] || themes.ember;
}

function ensureArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }
  return value;
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
      theme: String(rawBrief.deck.theme || "ember"),
    },
    slides: slides.map((slide, index) => ({
      ...slide,
      type: String(slide.type || "").trim(),
      index: index + 1,
    })),
  };
}

function bulletLines(items) {
  return ensureArray(items, "bullets")
    .map((item) => `• ${String(item)}`)
    .join("\n");
}

function metricCards(metrics) {
  const list = ensureArray(metrics, "metrics");
  if (list.length === 0) {
    throw new Error("metrics slide must contain at least one metric.");
  }
  return list;
}

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

function addShape(ctx, slide, x, y, width, height, fill, lineFill = "#00000000", lineWidth = 0) {
  ctx.addShape(slide, {
    x,
    y,
    width,
    height,
    fill,
    line: ctx.line(lineFill, lineWidth),
  });
}

function addText(ctx, slide, options) {
  return ctx.addText(slide, {
    color: options.color,
    typeface: options.typeface,
    ...options,
  });
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
  });
}

function addFooter(ctx, slide, theme, deck, slideNumber, slideCount) {
  addShape(ctx, slide, 72, 676, ctx.W - 144, 1, theme.border);
  addText(ctx, slide, {
    text: `${deck.title}  |  ${deck.author}`,
    x: 72,
    y: 687,
    width: 320,
    height: 16,
    fontSize: 9,
    color: theme.muted,
    typeface: theme.bodyFont,
  });
  addText(ctx, slide, {
    text: `${slideNumber}/${slideCount}`,
    x: ctx.W - 130,
    y: 687,
    width: 60,
    height: 16,
    fontSize: 9,
    color: theme.muted,
    typeface: theme.bodyFont,
    align: "right",
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

  addText(ctx, slide, {
    text: "Christianity",
    x: 892,
    y: 628,
    width: 260,
    height: 28,
    fontSize: 20,
    bold: true,
    color: theme.inverse,
    typeface: theme.titleFont,
  });
  addText(ctx, slide, {
    text: "A short classroom introduction",
    x: 892,
    y: 654,
    width: 260,
    height: 24,
    fontSize: 12,
    color: "#DCCFBF",
    typeface: theme.bodyFont,
  });

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

  const cards = metricCards(spec.metrics || []);
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

  addShape(ctx, slide, 72, 560, 1136, 2, "#A77A2F");
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

  addFooter(ctx, slide, theme, deck, slideNumber, slideCount);
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
    });
  }
  addFooter(ctx, slide, theme, deck, slideNumber, slideCount);
}

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
    default:
      throw new Error(
        `Unsupported slide type "${spec.type}" on slide ${slideNumber}. Supported types: cover, bullets, metrics, closing.`,
      );
  }

  return slide;
}

async function loadJson(jsonPath) {
  const text = await fs.readFile(jsonPath, "utf8");
  return JSON.parse(text);
}

async function importHelpers(skillDir) {
  const utilsPath = path.join(skillDir, "scripts", "artifact_tool_utils.mjs");
  return import(pathToFileURL(utilsPath).href);
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
