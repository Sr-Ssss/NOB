import { useEffect, useState } from 'preact/hooks';

/** imagens do Se Vira!: só links (GIPHY/Pexels) ou WebP da galeria pelo canal; nada fica guardado */

const GIPHY = import.meta.env.VITE_GIPHY_KEY as string | undefined;
const PEXELS = import.meta.env.VITE_PEXELS_KEY as string | undefined;

export const temGiphy = (): boolean => !!GIPHY;

export interface Resultado {
  url: string;
  fonte: 'giphy' | 'pexels';
}

/** GIPHY com classificação G (família) */
export async function buscarGiphy(q: string, limite = 24): Promise<string[]> {
  if (!GIPHY || !q.trim()) return [];
  const u = `https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(GIPHY)}&q=${encodeURIComponent(q.trim())}&limit=${limite}&rating=g`;
  const r = await fetch(u);
  if (!r.ok) return [];
  const j = (await r.json()) as { data?: { images?: { downsized_medium?: { url?: string }; fixed_height?: { url?: string } } }[] };
  return (j.data ?? []).map((g) => g.images?.downsized_medium?.url ?? g.images?.fixed_height?.url ?? '').filter(Boolean);
}

async function buscarPexels(q: string): Promise<string[]> {
  if (!PEXELS) return [];
  const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=15`, { headers: { Authorization: PEXELS } });
  if (!r.ok) return [];
  const j = (await r.json()) as { photos?: { src?: { large?: string } }[] };
  return (j.photos ?? []).map((p) => p.src?.large ?? '').filter(Boolean);
}

const cache = new Map<string, Promise<Resultado | null>>();
/** uma pesquisa por termo e fonte (a chave beta da GIPHY só dá 100 pedidos/hora) */
const pesquisas = new Map<string, Promise<string[]>>();
function pesquisar(fonte: Resultado['fonte'], busca: string): Promise<string[]> {
  const k = fonte + '|' + busca;
  if (!pesquisas.has(k)) pesquisas.set(k, (fonte === 'giphy' ? buscarGiphy(busca, 25) : buscarPexels(busca)).catch(() => []));
  return pesquisas.get(k)!;
}

function hash(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/** termos de reserva quando a pesquisa não dá nada */
const RESERVA = ['funny', 'office'];

/**
 * imagem sorteada pelo jogo para um termo (alterna GIPHY/Pexels conforme as chaves que há).
 * Se não houver resultados: a outra fonte, depois outro termo; só no fim null (= emoji)
 */
export function fotoPara(busca: string, chave: string): Promise<Resultado | null> {
  const k = busca + '|' + chave;
  if (!cache.has(k)) {
    const h = hash(k);
    const fontes: Resultado['fonte'][] = [...(GIPHY ? ['giphy' as const] : []), ...(PEXELS ? ['pexels' as const] : [])];
    const p = (async (): Promise<Resultado | null> => {
      if (!fontes.length) return null;
      const ordem = [...fontes.slice(h % fontes.length), ...fontes.slice(0, h % fontes.length)];
      for (const termo of [busca, ...RESERVA.filter((x) => x !== busca)]) {
        for (const fonte of ordem) {
          const l = await pesquisar(fonte, termo);
          if (l.length) return { url: l[h % l.length], fonte };
        }
      }
      return null;
    })();
    cache.set(k, p);
  }
  return cache.get(k)!;
}

export function useFoto(busca: string, chave: string): Resultado | null {
  const [r, setR] = useState<Resultado | null>(null);
  useEffect(() => {
    let vivo = true;
    setR(null);
    void fotoPara(busca, chave).then((x) => vivo && setR(x));
    return () => {
      vivo = false;
    };
  }, [busca, chave]);
  return r;
}

/** reduz uma foto da galeria para WebP de 800 px, ≤100 KB */
export async function reduzirGaleria(f: File, lado = 800, maxBytes = 100_000): Promise<string | null> {
  const url = URL.createObjectURL(f);
  try {
    const img = await new Promise<HTMLImageElement>((ok, erro) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = erro;
      i.src = url;
    });
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    const k = Math.min(1, lado / Math.max(w, h));
    w = Math.round(w * k);
    h = Math.round(h * k);
    const c = document.createElement('canvas');
    for (let tentativa = 0; tentativa < 4; tentativa++) {
      c.width = w;
      c.height = h;
      c.getContext('2d')!.drawImage(img, 0, 0, w, h);
      for (let q = 0.8; q >= 0.3; q -= 0.1) {
        const d = c.toDataURL('image/webp', q);
        if (d.startsWith('data:image/webp') && (d.length * 3) / 4 <= maxBytes) return d;
        // sem WebP (Safari antigo): JPEG
        if (!d.startsWith('data:image/webp')) {
          const j = c.toDataURL('image/jpeg', q);
          if ((j.length * 3) / 4 <= maxBytes) return j;
        }
      }
      w = Math.round(w * 0.75);
      h = Math.round(h * 0.75);
    }
    return null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
