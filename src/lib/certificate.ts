/**
 * Draws a printable certificate of appreciation on a canvas (A4 landscape proportions).
 * Everything is drawn locally, so the same canvas is used for display, PNG download,
 * printing and sharing — no server needed.
 */

export interface CertificateData {
  name: string;
  achievement: string;
  dateHijri: string;
  dateGregorian: string;
  serial: string;
  gender: "m" | "f";
}

const CERT_W = 2000;
const CERT_H = 1414;

const BASE: string = (globalThis as { __RIFQ_DATA_BASE__?: string }).__RIFQ_DATA_BASE__ ?? "";
let magdyImg: Promise<HTMLImageElement | null> | null = null;
function loadMagdy() {
  magdyImg ??= new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = `${BASE}/characters/magdy-quran.webp`;
  });
  return magdyImg;
}

async function fontsReady() {
  try {
    await Promise.all([
      document.fonts.load('800 80px "Baloo Bhaijaan 2"'),
      document.fonts.load('700 40px "Baloo Bhaijaan 2"'),
      document.fonts.load('400 30px "Readex Pro"'),
      document.fonts.load('400 40px "Amiri Quran"'),
    ]);
    await document.fonts.ready;
  } catch {
    /* draw with fallback fonts */
  }
}

const TEAL = "#0d7870";
const TEAL2 = "#1fb3a6";
const GOLD = "#c9962e";
const GOLD2 = "#f0c75e";
const INK = "#1d3a4a";

/** Eight-pointed star (two overlapping squares), a classic Islamic motif. */
function star8(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.62;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.closePath();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number, font: (s: number) => string, start: number, min: number) {
  let size = start;
  ctx.font = font(size);
  while (ctx.measureText(text).width > maxW && size > min) {
    size -= 2;
    ctx.font = font(size);
  }
  return size;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

export async function drawCertificate(canvas: HTMLCanvasElement, c: CertificateData) {
  await fontsReady();
  const magdy = await loadMagdy();
  canvas.width = CERT_W;
  canvas.height = CERT_H;
  const ctx = canvas.getContext("2d")!;
  const W = CERT_W;
  const H = CERT_H;
  ctx.direction = "rtl";
  ctx.textBaseline = "alphabetic";

  // ---------- paper ----------
  const bg = ctx.createRadialGradient(W / 2, H * 0.4, 100, W / 2, H / 2, W * 0.75);
  bg.addColorStop(0, "#fffdf7");
  bg.addColorStop(1, "#f7ecd6");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // faint girih pattern
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = TEAL;
  ctx.lineWidth = 2;
  for (let y = 120; y < H; y += 110) {
    for (let x = 120 + ((y / 110) % 2) * 55; x < W; x += 110) {
      star8(ctx, x, y, 34);
      ctx.stroke();
    }
  }
  ctx.restore();

  // ---------- frame ----------
  ctx.lineWidth = 26;
  ctx.strokeStyle = TEAL;
  roundRect(ctx, 40, 40, W - 80, H - 80, 36);
  ctx.stroke();
  ctx.lineWidth = 6;
  ctx.strokeStyle = GOLD;
  roundRect(ctx, 80, 80, W - 160, H - 160, 26);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = GOLD2;
  roundRect(ctx, 96, 96, W - 192, H - 192, 20);
  ctx.stroke();

  // dotted inner border
  ctx.save();
  ctx.setLineDash([2, 14]);
  ctx.lineCap = "round";
  ctx.lineWidth = 5;
  ctx.strokeStyle = TEAL2;
  roundRect(ctx, 118, 118, W - 236, H - 236, 16);
  ctx.stroke();
  ctx.restore();

  // corner ornaments
  for (const [x, y] of [
    [100, 100],
    [W - 100, 100],
    [100, H - 100],
    [W - 100, H - 100],
  ]) {
    ctx.save();
    star8(ctx, x, y, 58);
    const g = ctx.createLinearGradient(x - 58, y - 58, x + 58, y + 58);
    g.addColorStop(0, GOLD2);
    g.addColorStop(1, GOLD);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#fff8e6";
    ctx.stroke();
    star8(ctx, x, y, 26);
    ctx.fillStyle = TEAL;
    ctx.fill();
    ctx.restore();
  }

  // ---------- header ----------
  const cx = W / 2 + 120; // text column centre (leaves room for Baba Magdy on the left)
  ctx.textAlign = "center";

  // logo medallion
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, 205, 56, 0, Math.PI * 2);
  const lg = ctx.createLinearGradient(cx - 56, 149, cx + 56, 261);
  lg.addColorStop(0, "#4fd6c8");
  lg.addColorStop(1, TEAL);
  ctx.fillStyle = lg;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = GOLD2;
  ctx.stroke();
  // open book
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(cx - 36, 248);
  ctx.quadraticCurveTo(cx - 18, 236, cx, 248);
  ctx.quadraticCurveTo(cx + 18, 236, cx + 36, 248);
  ctx.lineTo(cx + 36, 220);
  ctx.quadraticCurveTo(cx + 18, 208, cx, 220);
  ctx.quadraticCurveTo(cx - 18, 208, cx - 36, 220);
  ctx.closePath();
  ctx.fill();
  star8(ctx, cx, 196, 12);
  ctx.fillStyle = GOLD2;
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = TEAL;
  ctx.font = '800 54px "Baloo Bhaijaan 2", "Readex Pro", sans-serif';
  ctx.fillText("رِفق", cx, 318);
  ctx.font = '400 26px "Readex Pro", sans-serif';
  ctx.fillStyle = "#5f7d8e";
  ctx.fillText("رفيقك في رحلة القرآن", cx, 354);

  // title
  const tg = ctx.createLinearGradient(cx - 400, 0, cx + 400, 0);
  tg.addColorStop(0, GOLD);
  tg.addColorStop(0.5, "#e8b84a");
  tg.addColorStop(1, GOLD);
  ctx.fillStyle = tg;
  ctx.font = '800 112px "Baloo Bhaijaan 2", "Readex Pro", sans-serif';
  ctx.fillText("شهادة تقدير", cx, 476);

  // ornament line under the title
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 330, 512);
  ctx.lineTo(cx - 40, 512);
  ctx.moveTo(cx + 40, 512);
  ctx.lineTo(cx + 330, 512);
  ctx.stroke();
  star8(ctx, cx, 512, 18);
  ctx.fillStyle = TEAL2;
  ctx.fill();

  // presented to
  ctx.fillStyle = INK;
  ctx.font = '400 38px "Readex Pro", sans-serif';
  ctx.fillText(c.gender === "f" ? "يسرّ منصّة رِفق أن تمنح هذه الشهادة إلى البطلة" : "يسرّ منصّة رِفق أن تمنح هذه الشهادة إلى البطل", cx, 586);

  // name
  const nameSize = fitText(ctx, c.name, 1100, (s) => `800 ${s}px "Baloo Bhaijaan 2", "Readex Pro", sans-serif`, 116, 64);
  ctx.fillStyle = TEAL;
  ctx.fillText(c.name, cx, 616 + nameSize);
  const nameY = 616 + nameSize;
  ctx.strokeStyle = GOLD2;
  ctx.lineWidth = 4;
  ctx.beginPath();
  const nw = Math.min(900, ctx.measureText(c.name).width + 160);
  ctx.moveTo(cx - nw / 2, nameY + 26);
  ctx.quadraticCurveTo(cx, nameY + 46, cx + nw / 2, nameY + 26);
  ctx.stroke();

  // achievement
  ctx.fillStyle = INK;
  ctx.font = '700 52px "Baloo Bhaijaan 2", "Readex Pro", sans-serif';
  const lines = wrapLines(ctx, `تقديرًا لأنّه ${c.achievement}`.replace("لأنّه", c.gender === "f" ? "لأنّها" : "لأنّه"), 1150);
  let y = nameY + 104;
  for (const l of lines.slice(0, 2)) {
    ctx.fillText(l, cx, y);
    y += 66;
  }

  // dua
  ctx.fillStyle = "#35566a";
  ctx.font = '400 32px "Readex Pro", sans-serif';
  ctx.fillText(c.gender === "f" ? "جعل الله القرآن ربيع قلبكِ ونور صدركِ، وبارك فيكِ" : "جعل الله القرآن ربيع قلبك ونور صدرك، وبارك فيك", cx, y);

  // ---------- footer ----------
  const fy = H - 300;
  // dates (right)
  ctx.textAlign = "right";
  ctx.fillStyle = "#5f7d8e";
  ctx.font = '400 26px "Readex Pro", sans-serif';
  ctx.fillText("التاريخ", W - 230, fy);
  ctx.fillStyle = INK;
  ctx.font = '700 34px "Baloo Bhaijaan 2", "Readex Pro", sans-serif';
  ctx.fillText(c.dateHijri, W - 230, fy + 48);
  ctx.font = '400 28px "Readex Pro", sans-serif';
  ctx.fillStyle = "#35566a";
  ctx.fillText(c.dateGregorian, W - 230, fy + 92);

  // seal (centre)
  const sx = cx;
  const sy = fy + 40;
  ctx.save();
  for (let i = 0; i < 24; i++) {
    ctx.beginPath();
    const a = (i / 24) * Math.PI * 2;
    ctx.arc(sx + Math.cos(a) * 82, sy + Math.sin(a) * 82, 16, 0, Math.PI * 2);
    ctx.fillStyle = GOLD;
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(sx, sy, 86, 0, Math.PI * 2);
  const sg = ctx.createRadialGradient(sx - 30, sy - 30, 10, sx, sy, 90);
  sg.addColorStop(0, "#ffe7a3");
  sg.addColorStop(1, GOLD);
  ctx.fillStyle = sg;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#fff6dc";
  ctx.beginPath();
  ctx.arc(sx, sy, 66, 0, Math.PI * 2);
  ctx.stroke();
  star8(ctx, sx, sy - 6, 34);
  ctx.fillStyle = TEAL;
  ctx.fill();
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.font = '800 26px "Baloo Bhaijaan 2", sans-serif';
  ctx.fillText("رِفق", sx, sy + 4);
  ctx.fillStyle = "#7a5512";
  ctx.font = '700 20px "Readex Pro", sans-serif';
  ctx.fillText("مُعتمدة", sx, sy + 52);
  ctx.restore();

  // signature (left of seal)
  const gx = cx - 380;
  ctx.textAlign = "center";
  ctx.fillStyle = "#5f7d8e";
  ctx.font = '400 26px "Readex Pro", sans-serif';
  ctx.fillText("مع حبّ", gx, fy);
  ctx.fillStyle = TEAL;
  ctx.font = '400 54px "Amiri Quran", "Baloo Bhaijaan 2", serif';
  ctx.fillText("بابا مجدي", gx, fy + 62);
  ctx.strokeStyle = TEAL2;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(gx - 120, fy + 84);
  ctx.lineTo(gx + 120, fy + 84);
  ctx.stroke();

  // serial
  ctx.fillStyle = "#a6bcc7";
  ctx.font = '400 20px "Readex Pro", sans-serif';
  ctx.fillText(`رقم الشهادة: ${c.serial}`, gx, fy + 118);

  // ---------- Baba Magdy holding the Mushaf ----------
  if (magdy) {
    const h = H - 300;
    const w = (magdy.width / magdy.height) * h;
    const mx = 170;
    const my = 180;
    // soft halo
    const halo = ctx.createRadialGradient(mx + w / 2, my + h * 0.35, 20, mx + w / 2, my + h * 0.35, w);
    halo.addColorStop(0, "rgba(255, 223, 128, 0.35)");
    halo.addColorStop(1, "rgba(255, 223, 128, 0)");
    ctx.fillStyle = halo;
    ctx.fillRect(mx - 80, my - 40, w + 160, h);
    ctx.drawImage(magdy, mx, my, w, h);
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

export const certSerial = (id: string, childId: string) => {
  let h = 0;
  for (const ch of `${id}|${childId}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `RF-${(h % 1000000).toString().padStart(6, "0")}`;
};
