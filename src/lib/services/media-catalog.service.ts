import { createClient } from '@/lib/supabase/client';
import { MediaItem, MediaType } from '@/types';

export function mapDbToMediaItem(row: any): MediaItem {
  return {
    id: row.id,
    type: (row.type || 'movie') as MediaType,
    title: row.title,
    originalTitle: row.original_title || row.title,
    overview: row.overview || 'Açıklama henüz eklenmedi.',
    overviewEn: row.overview_en || undefined,
    posterPath: row.poster_path || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.title || 'İzledin')}&backgroundColor=0a0a0a&textColor=ef4444&fontWeight=900`,
    backdropPath: row.backdrop_path || row.poster_path || undefined,
    releaseDate: row.release_date || undefined,
    year: row.year ? Number(row.year) : undefined,
    voteAverage: row.vote_average !== null && row.vote_average !== undefined ? Number(row.vote_average) : undefined,
    genres: Array.isArray(row.genres) ? row.genres : [],
    duration: row.duration || undefined,
    director: row.director || undefined,
    actors: row.actors || undefined,
    awards: row.awards || undefined,
    imdbVotes: row.imdb_votes || undefined,
  };
}

export function mapMediaItemToDb(item: MediaItem): any {
  return {
    id: item.id,
    type: item.type || 'movie',
    title: item.title,
    original_title: item.originalTitle || item.title,
    overview: item.overview || '',
    overview_en: item.overviewEn || '',
    poster_path: item.posterPath || '',
    backdrop_path: item.backdropPath || '',
    release_date: item.releaseDate || '',
    year: item.year || null,
    vote_average: typeof item.voteAverage === 'number' ? item.voteAverage : null,
    genres: item.genres || [],
    duration: item.duration || '',
    director: item.director || '',
    actors: item.actors || '',
    awards: item.awards || '',
    imdb_votes: item.imdbVotes || '',
  };
}

/**
 * Searches the Supabase media_catalog table with PostgreSQL Full-Text & Trigram Fuzzy matching.
 */
export async function searchDbCatalog(query: string, limit: number = 15): Promise<MediaItem[]> {
  try {
    const supabase = createClient();
    const clean = query.trim();
    if (!clean) return [];

    const { data, error } = await supabase.rpc('search_media_catalog', {
      p_query: clean,
      p_limit: limit,
    });

    if (error) {
      console.warn('search_media_catalog RPC error:', error.message);
      return [];
    }

    if (!Array.isArray(data)) return [];
    return data.map(mapDbToMediaItem);
  } catch (err) {
    console.warn('searchDbCatalog exception:', err);
    return [];
  }
}

/**
 * Retrieves a single movie by IMDb ID from the Supabase media_catalog table.
 */
export async function getDbCatalogItem(id: string): Promise<MediaItem | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('media_catalog')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return mapDbToMediaItem(data);
  } catch {
    return null;
  }
}

/**
 * Asynchronously persists/upserts a newly discovered media item into Supabase media_catalog.
 * Safe fire-and-forget; never blocks the caller.
 */
export async function saveMediaItemToDb(item: MediaItem): Promise<void> {
  if (!item || !item.id) return;
  try {
    const supabase = createClient();
    const payload = mapMediaItemToDb(item);
    await supabase.from('media_catalog').upsert(payload, { onConflict: 'id' });
  } catch (err) {
    console.warn('Failed to auto-cache media item to Supabase:', err);
  }
}
