/** Dominant-colour name of an image, computed locally in the browser (nothing is uploaded). */
export const COLOURS = ["black", "white", "grey", "red", "orange", "yellow", "green", "blue", "purple", "brown", "pink"] as const;
export function nameColour(r: number, g: number, b: number): string {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 510;
  if (l < 0.15) return "black"; if (l > 0.88 && d < 40) return "white"; if (d < 28) return "grey";
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360;
  if (h < 15 || h >= 345) return l > 0.65 ? "pink" : "red"; if (h < 40) return l < 0.4 ? "brown" : "orange"; if (h < 70) return "yellow";
  if (h < 170) return "green"; if (h < 260) return "blue"; if (h < 300) return "purple"; return "pink";
}
export async function dominantColour(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error("Not an image")); i.src = url; });
    const c = document.createElement("canvas"); c.width = c.height = 24; const x = c.getContext("2d"); if (!x) throw new Error("No canvas");
    // sample the centre 60% so backgrounds count less
    x.drawImage(img, img.width * 0.2, img.height * 0.2, img.width * 0.6, img.height * 0.6, 0, 0, 24, 24);
    const px = x.getImageData(0, 0, 24, 24).data; const votes: Record<string, number> = {};
    for (let i = 0; i < px.length; i += 4) { const n = nameColour(px[i], px[i + 1], px[i + 2]); votes[n] = (votes[n] ?? 0) + 1; }
    return Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];
  } finally { URL.revokeObjectURL(url); }
}
