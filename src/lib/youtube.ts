/**
 * Extrai o ID de um vídeo do YouTube a partir de URL ou ID puro.
 * Aceita: frMgRna2FIo, youtube.com/watch?v=..., youtu.be/..., embed/..., shorts/...
 */
export function extractYoutubeVideoId(
  input: string | null | undefined,
): string | null {
  if (!input?.trim()) return null;

  const value = input.trim();

  if (/^[\w-]{11}$/.test(value)) {
    return value;
  }

  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=|youtube\.com\/watch\?v=)([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /youtube\.com\/live\/([\w-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
  }

  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);

    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }

    const vParam = url.searchParams.get("v");
    if (vParam && /^[\w-]{11}$/.test(vParam)) return vParam;

    const pathMatch = url.pathname.match(/\/(?:embed|shorts|live)\/([\w-]{11})/);
    if (pathMatch?.[1]) return pathMatch[1];
  } catch {
    return null;
  }

  if (!value.includes("/") && !value.includes(".")) {
    return value;
  }

  return null;
}

export function getYoutubeEmbedUrl(
  input: string | null | undefined,
  autoplay = false,
): string | null {
  const id = extractYoutubeVideoId(input);
  if (!id) return null;

  const params = new URLSearchParams({
    enablejsapi: "1",
    ...(autoplay ? { autoplay: "1" } : {}),
  });

  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}
