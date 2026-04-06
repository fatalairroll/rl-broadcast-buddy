import BronzeI from '@/assets/ranks/Bronze_I.webp';
import BronzeII from '@/assets/ranks/Bronze_II.webp';
import BronzeIII from '@/assets/ranks/Bronze_III.webp';
import SilverI from '@/assets/ranks/Silver_I.webp';
import SilverII from '@/assets/ranks/Silver_II.webp';
import SilverIII from '@/assets/ranks/Silver_III.webp';
import GoldI from '@/assets/ranks/Gold_I.webp';
import GoldII from '@/assets/ranks/Gold_II.webp';
import GoldIII from '@/assets/ranks/Gold_III.webp';
import PlatinumI from '@/assets/ranks/Platinum_I.webp';
import PlatinumII from '@/assets/ranks/Platinum_II.webp';
import PlatinumIII from '@/assets/ranks/Platinum_III.webp';
import DiamondI from '@/assets/ranks/Diamond_I.webp';
import DiamondII from '@/assets/ranks/Diamond_II.webp';
import DiamondIII from '@/assets/ranks/Diamond_III.webp';
import ChampionI from '@/assets/ranks/Champion_I.webp';
import ChampionII from '@/assets/ranks/Champion_II.webp';
import ChampionIII from '@/assets/ranks/Champion_III.webp';
import GrandChampionI from '@/assets/ranks/Grand_Champion_I.webp';
import GrandChampionII from '@/assets/ranks/Grand_Champion_II.webp';
import GrandChampionIII from '@/assets/ranks/Grand_Champion_III.webp';
import SupersonicLegend from '@/assets/ranks/Supersonic_Legend.webp';

export interface RankTier {
  name: string;
  minMmr: number;
  maxMmr: number;
  icon: string;
}

export const RANK_TIERS: RankTier[] = [
  { name: 'Bronze I',            minMmr: -Infinity, maxMmr: 172,  icon: BronzeI },
  { name: 'Bronze II',           minMmr: 173,       maxMmr: 233,  icon: BronzeII },
  { name: 'Bronze III',          minMmr: 234,       maxMmr: 294,  icon: BronzeIII },
  { name: 'Silver I',            minMmr: 295,       maxMmr: 354,  icon: SilverI },
  { name: 'Silver II',           minMmr: 355,       maxMmr: 414,  icon: SilverII },
  { name: 'Silver III',          minMmr: 415,       maxMmr: 474,  icon: SilverIII },
  { name: 'Gold I',              minMmr: 475,       maxMmr: 534,  icon: GoldI },
  { name: 'Gold II',             minMmr: 535,       maxMmr: 594,  icon: GoldII },
  { name: 'Gold III',            minMmr: 595,       maxMmr: 654,  icon: GoldIII },
  { name: 'Platinum I',          minMmr: 655,       maxMmr: 714,  icon: PlatinumI },
  { name: 'Platinum II',         minMmr: 715,       maxMmr: 773,  icon: PlatinumII },
  { name: 'Platinum III',        minMmr: 774,       maxMmr: 834,  icon: PlatinumIII },
  { name: 'Diamond I',           minMmr: 835,       maxMmr: 914,  icon: DiamondI },
  { name: 'Diamond II',          minMmr: 915,       maxMmr: 994,  icon: DiamondII },
  { name: 'Diamond III',         minMmr: 995,       maxMmr: 1074, icon: DiamondIII },
  { name: 'Champion I',          minMmr: 1075,      maxMmr: 1194, icon: ChampionI },
  { name: 'Champion II',         minMmr: 1195,      maxMmr: 1314, icon: ChampionII },
  { name: 'Champion III',        minMmr: 1315,      maxMmr: 1434, icon: ChampionIII },
  { name: 'Grand Champion I',    minMmr: 1435,      maxMmr: 1574, icon: GrandChampionI },
  { name: 'Grand Champion II',   minMmr: 1575,      maxMmr: 1713, icon: GrandChampionII },
  { name: 'Grand Champion III',  minMmr: 1714,      maxMmr: 1872, icon: GrandChampionIII },
  { name: 'Supersonic Legend',   minMmr: 1873,      maxMmr: Infinity, icon: SupersonicLegend },
];

const RANK_ICON_MAP: Record<string, string> = {};
for (const tier of RANK_TIERS) {
  RANK_ICON_MAP[tier.name] = tier.icon;
}

export function getRankFromMmr(mmr: number): string {
  for (const tier of RANK_TIERS) {
    if (mmr >= tier.minMmr && mmr <= tier.maxMmr) {
      return tier.name;
    }
  }
  return 'Bronze I';
}

export function getRankIcon(rankName: string | null): string | null {
  if (!rankName) return null;
  // Try exact match first
  if (RANK_ICON_MAP[rankName]) return RANK_ICON_MAP[rankName];
  // Try partial match (e.g. "Diamond" → "Diamond I")
  for (const tier of RANK_TIERS) {
    if (tier.name.startsWith(rankName)) return tier.icon;
  }
  return null;
}
