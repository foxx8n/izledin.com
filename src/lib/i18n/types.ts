export type Locale = 'en' | 'tr';

export interface TranslationDictionary {
  common: {
    siteName: string;
    tagline: string;
    subTagline: string;
    loading: string;
    cancel: string;
    save: string;
    delete: string;
    close: string;
    search: string;
    back: string;
    undo: string;
    error: string;
    success: string;
  };
  nav: {
    discover: string;
    radar: string;
    diary: string;
    upcoming: string;
    club: string;
    searchPlaceholder: string;
    quickLog: string;
    inbox: string;
    signIn: string;
    signOut: string;
    profile: string;
    dna: string;
    admin: string;
    announcementBadge: string;
  };
  home: {
    deckTitle: string;
    deckSubtitle: string;
    like: string;
    pass: string;
    superLike: string;
    quickLogTitle: string;
    breakTitle: string;
    breakDesc: string;
    breakCountdown: string;
    exploreCatalog: string;
    masterpieceTitle: string;
    masterpieceBadge: string;
    guestBannerTitle: string;
    guestBannerDesc: string;
    guestBannerCta: string;
  };
  matches: {
    title: string;
    subtitle: string;
    all: string;
    friendIntent: string;
    datingIntent: string;
    bothIntent: string;
    likedYouStrip: string;
    compatScore: string;
    sharedTitles: string;
    sharedGenres: string;
    ticketBadge: string;
    sendRequest: string;
    pendingRequest: string;
    matched: string;
    emptyRadar: string;
    emptyRadarDesc: string;
  };
  diary: {
    title: string;
    subtitle: string;
    newEntry: string;
    myLogs: string;
    communityFeed: string;
    emptyLogs: string;
    rating: string;
    favorite: string;
    review: string;
    watchedOn: string;
  };
  media: {
    director: string;
    actors: string;
    duration: string;
    releaseDate: string;
    genres: string;
    overview: string;
    awards: string;
    noOverview: string;
    addToDiary: string;
    addToWatchlist: string;
  };
  footer: {
    quotePrompt: string;
    pullQuote: string;
    copied: string;
    discovery: string;
    club: string;
    legal: string;
    privacy: string;
    terms: string;
    communityRules: string;
    contact: string;
    copyright: string;
    subtext: string;
  };
  auth: {
    modalTitle: string;
    modalSubtitle: string;
    googleCta: string;
    consentNotice: string;
  };
}
