const IMAGE_CACHE: Record<string, string> = {};

export async function fetchEquipmentImage(marque: string, modele: string, typeCode: string): Promise<string | null> {
  const query = `${marque} ${modele}`.trim();
  if (!query) return null;

  if (IMAGE_CACHE[query]) {
    return IMAGE_CACHE[query];
  }

  try {
    const searchTerms = `${query} parapente`.trim();
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchTerms)}&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json&origin=*`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.query && data.query.pages) {
      const pages = Object.values(data.query.pages) as any[];
      if (pages.length > 0 && pages[0].imageinfo && pages[0].imageinfo[0]) {
        const imgUrl = pages[0].imageinfo[0].thumburl || pages[0].imageinfo[0].url;
        IMAGE_CACHE[query] = imgUrl;
        return imgUrl;
      }
    }
  } catch (err) {
    // Silent catch
  }

  return null;
}

export function getFallbackImage(typeCode: string): string {
  if (typeCode === '1') return './images/harness.jpg';
  if (typeCode === '2') return './images/reserve.jpg';
  return './images/glider.jpg';
}
