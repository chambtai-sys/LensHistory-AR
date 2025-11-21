import { LandmarkInfo } from './gemini';

export interface SavedLandmark extends LandmarkInfo {
  id: string;
  timestamp: number;
  image: string; // base64 thumbnail
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  items: string[]; // SavedLandmark IDs
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
}

export interface UserProfile {
  points: number;
  level: number;
  badges: Badge[];
  history: SavedLandmark[];
  collections: Collection[];
}

const INITIAL_BADGES: Badge[] = [
  { id: 'first_find', name: 'First Steps', icon: 'flag', description: 'Identify your first landmark', unlocked: false },
  { id: 'explorer', name: 'Explorer', icon: 'compass', description: 'Find 5 landmarks', unlocked: false },
  { id: 'historian', name: 'Historian', icon: 'book', description: 'Find 10 landmarks', unlocked: false },
  { id: 'curator', name: 'Curator', icon: 'camera', description: 'Create a collection', unlocked: false },
  { id: 'globe_trotter', name: 'Globe Trotter', icon: 'globe', description: 'Find 20 landmarks', unlocked: false },
];

const STORAGE_KEY = 'lens_history_user';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

export const getUserProfile = (): UserProfile => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    points: 0,
    level: 1,
    badges: INITIAL_BADGES,
    history: [],
    collections: []
  };
};

export const saveUserProfile = (profile: UserProfile) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
};

export const addPoints = (amount: number): { newPoints: number, leveledUp: boolean } => {
  const profile = getUserProfile();
  const oldLevel = Math.floor(profile.points / 500) + 1;
  profile.points += amount;
  const newLevel = Math.floor(profile.points / 500) + 1;
  
  profile.level = newLevel;
  saveUserProfile(profile);
  
  return { newPoints: profile.points, leveledUp: newLevel > oldLevel };
};

export const saveLandmark = (landmark: LandmarkInfo, image: string): SavedLandmark => {
  const profile = getUserProfile();
  const newLandmark: SavedLandmark = {
    ...landmark,
    id: generateId(),
    timestamp: Date.now(),
    image
  };
  profile.history.unshift(newLandmark);
  saveUserProfile(profile);
  return newLandmark;
};

export const createCollection = (name: string, description: string): Collection => {
  const profile = getUserProfile();
  const newCollection: Collection = {
    id: generateId(),
    name,
    description,
    items: []
  };
  profile.collections.push(newCollection);
  saveUserProfile(profile);
  return newCollection;
};

export const addToCollection = (collectionId: string, landmarkId: string) => {
  const profile = getUserProfile();
  const collection = profile.collections.find(c => c.id === collectionId);
  if (collection && !collection.items.includes(landmarkId)) {
    collection.items.push(landmarkId);
    saveUserProfile(profile);
  }
};

export const checkBadges = (): Badge[] => {
  const profile = getUserProfile();
  const newlyUnlocked: Badge[] = [];

  const rules = [
    { id: 'first_find', condition: () => profile.history.length >= 1 },
    { id: 'explorer', condition: () => profile.history.length >= 5 },
    { id: 'historian', condition: () => profile.history.length >= 10 },
    { id: 'curator', condition: () => profile.collections.length >= 1 },
    { id: 'globe_trotter', condition: () => profile.history.length >= 20 },
  ];

  let changed = false;
  rules.forEach(rule => {
      const badge = profile.badges.find(b => b.id === rule.id);
      if (badge && !badge.unlocked && rule.condition()) {
          badge.unlocked = true;
          newlyUnlocked.push(badge);
          changed = true;
      }
  });

  if (changed) saveUserProfile(profile);
  return newlyUnlocked;
};
