import { MediaItem, Profile } from '@/types';

/**
 * Calculates a dynamic cinephile discovery score (CineScore) for a media item.
 * Balances:
 * 1. Base Quality (IMDb rating >= 7.0 gets high exponential weighting)
 * 2. Cultural Reach & Prestige (vote count, Oscar / festival awards)
 * 3. User Cinephile DNA (if user profile has matching favoriteGenres, +25 boost)
 * 4. Temporal Variety (deterministic weekly cycle seed so every week features fresh gems)
 */
export function calculateCineScore(
  item: MediaItem,
  userProfile?: Profile | null,
  seedDate: Date = new Date()
): number {
  let score = 0;

  // 1. Rating Score (0 - 55 pts)
  const rating = item.voteAverage || 0;
  if (rating >= 8.5) {
    score += 55 + (rating - 8.5) * 20; // 8.5+ top tier
  } else if (rating >= 7.8) {
    score += 42 + (rating - 7.8) * 15;
  } else if (rating >= 7.0) {
    score += 28 + (rating - 7.0) * 15;
  } else if (rating >= 6.0) {
    score += 15 + (rating - 6.0) * 10;
  } else {
    score += rating * 2;
  }

  // 2. Cultural Reach / Vote Count (0 - 15 pts)
  if (item.imdbVotes) {
    const rawVotes = parseInt(item.imdbVotes.replace(/[^0-9]/g, ''), 10) || 0;
    if (rawVotes > 1000000) {
      score += 15;
    } else if (rawVotes > 500000) {
      score += 12;
    } else if (rawVotes > 100000) {
      score += 8;
    } else if (rawVotes > 20000) {
      score += 4;
    }
  }

  // 3. Prestige & Awards Bonus (0 - 15 pts)
  if (item.awards && (item.awards.includes('Oscar') || item.awards.includes('Kazandı') || item.awards.includes('Ödül'))) {
    score += 12;
  }
  if (item.genres?.includes('Sanat & Festival') || item.genres?.includes('Klasik Sinema') || item.genres?.includes('Neo-Noir')) {
    score += 8;
  }

  // 4. User Cinephile DNA Personalization (0 - 30 pts)
  if (userProfile?.favoriteGenres?.length && item.genres?.length) {
    const userGenreSet = new Set(userProfile.favoriteGenres.map((g) => g.toLowerCase().trim()));
    const matchingCount = item.genres.filter((g) => userGenreSet.has(g.toLowerCase().trim())).length;
    if (matchingCount > 0) {
      score += Math.min(30, matchingCount * 15);
    }
  }

  // 5. Deterministic Weekly Freshness Rotation (0 - 12 pts)
  // Generates a stable hash for (weekNumber + item.id) so movies rotate gently week by week
  const startOfYear = new Date(seedDate.getFullYear(), 0, 1);
  const weekNumber = Math.floor(((seedDate.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  let hash = 0;
  const hashKey = `${weekNumber}-${item.id}`;
  for (let i = 0; i < hashKey.length; i++) {
    hash = (hash << 5) - hash + hashKey.charCodeAt(i);
    hash |= 0;
  }
  const rotationBonus = Math.abs(hash % 12);
  score += rotationBonus;

  return score;
}

export type DiscoverySortOption = 'recommended' | 'rating' | 'newest' | 'popular';

/**
 * Sorts a list of media items according to the selected discovery mode.
 */
export function sortMediaCatalog(
  items: MediaItem[],
  sortBy: DiscoverySortOption = 'recommended',
  userProfile?: Profile | null
): MediaItem[] {
  const copy = [...items];

  switch (sortBy) {
    case 'rating':
      return copy.sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0));

    case 'newest':
      return copy.sort((a, b) => (b.year || 0) - (a.year || 0));

    case 'popular':
      return copy.sort((a, b) => {
        const parseVotes = (v?: string) => {
          if (!v) return 0;
          return parseInt(v.replace(/[^0-9]/g, ''), 10) || 0;
        };
        const votesA = parseVotes(a.imdbVotes);
        const votesB = parseVotes(b.imdbVotes);
        if (votesA !== votesB) return votesB - votesA;
        return (b.voteAverage || 0) - (a.voteAverage || 0);
      });

    case 'recommended':
    default:
      return copy.sort((a, b) => {
        const scoreA = calculateCineScore(a, userProfile);
        const scoreB = calculateCineScore(b, userProfile);
        return scoreB - scoreA;
      });
  }
}
