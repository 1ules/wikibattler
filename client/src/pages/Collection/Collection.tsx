import React, { useMemo, useEffect, useCallback, useRef, useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useCollection } from '../../api/useCards.js';
import { useOpenPack, usePackState, useOpenPityPack } from '../../api/usePacks.js';
import { Card } from '../../components/Card/Card.js';
import { AchievementToast } from '../../components/AchievementToast/AchievementToast.js';
import { PackOpener } from '../../components/PackOpener/PackOpener.js';
import { usePackStore } from '../../stores/packStore.js';
import { useAuthStore } from '../../stores/authStore.js';
import { api } from '../../lib/api.js';
import type { UserCard, ApiResponse } from '@wikibattler/shared';
import type { QidNode } from '@wikibattler/shared';
import { PITY_SR_THRESHOLD, PITY_UR_THRESHOLD, QID_BLOCKLIST, MAX_STORED_PACKS, PACK_COOLDOWN_SECONDS, evaluateTeam, calculateCP, RARITY_DISPLAY } from '@wikibattler/shared';
import { ACHIEVEMENTS, computeStats, checkCondition, type Achievement } from '../../utils/achievements.js';
import styles from './Collection.module.css';

const ALL_RARITIES = ['C', 'UC', 'R', 'SR', 'SSR', 'UR', 'MR'] as const;
const RARITY_IDX = Object.fromEntries(ALL_RARITIES.map((r, i) => [r, i]));

type SortField = 'total' | 'atk' | 'hp' | 'spd' | 'name' | 'rarity' | 'acquired';
type SortDir   = 'desc' | 'asc';

interface MeData { id: string; isGuest: boolean; username: string | null; coins: number; rating: number; }

const BG_PRESETS = [
  // ── Free (flat) ─────────────────────────────────────────────────────────────
  { id: 'default',          label: 'Default',            gradient: 'linear-gradient(135deg,#1e1535,#0f0c1a)' },
  { id: 'ocean',            label: 'Ocean',              gradient: 'linear-gradient(135deg,#0a1a2e,#071520)' },
  { id: 'ember',            label: 'Ember',              gradient: 'linear-gradient(135deg,#2a0f0c,#1a0805)' },
  { id: 'forest',           label: 'Forest',             gradient: 'linear-gradient(135deg,#0a2118,#051a0a)' },
  { id: 'cosmic',           label: 'Cosmic',             gradient: 'linear-gradient(135deg,#1a0a2e,#0f0518)' },
  // ── Bronze (richer flat) ─────────────────────────────────────────────────────
  { id: 'amber-shelf',      label: 'Amber Shelf',        gradient: 'linear-gradient(135deg,#3d2200,#1f1000)' },
  // ── Silver (gradients) ───────────────────────────────────────────────────────
  { id: 'grand-archive',    label: 'Grand Archive',      gradient: 'linear-gradient(160deg,#3d2200 0%,#1a0c00 50%,#2a1500 100%)' },
  { id: 'golden-vault',     label: 'Golden Vault',       gradient: 'linear-gradient(135deg,#2e2000 0%,#4a3400 40%,#1a1200 100%)' },
  { id: 'crimson-glow',     label: 'Crimson Glow',       gradient: 'linear-gradient(135deg,#3d0a0a 0%,#1a0505 50%,#2e1010 100%)' },
  { id: 'purple-nebula',    label: 'Purple Nebula',      gradient: 'linear-gradient(135deg,#2a0a3e 0%,#0a0518 60%,#1a0a2e 100%)' },
  // ── Gold (gradient + texture) ────────────────────────────────────────────────
  { id: 'gilded-throne',    label: 'Gilded Throne',      gradient: 'linear-gradient(160deg,#3d2e00 0%,#1f1700 40%,#4a3a00 80%,#1a1000 100%)' },
  { id: 'scarlet-foil',     label: 'Scarlet Foil',       gradient: 'linear-gradient(135deg,#3d0a0a 0%,#1a0505 30%,#2e0808 70%,#3d1010 100%)' },
  { id: 'mirror-gallery',   label: 'Mirror Gallery',     gradient: 'linear-gradient(160deg,#0a1e3d 0%,#050f1a 50%,#0a1a30 100%)' },
  { id: 'renaissance-map',  label: 'Renaissance Map',    gradient: 'linear-gradient(135deg,#2a1e00 0%,#1a1200 40%,#3d2e00 80%,#0f0900 100%)' },
  { id: 'spectrum-waves',   label: 'Spectrum Waves',     gradient: 'linear-gradient(135deg,#1a0a2e 0%,#001a1a 35%,#1a0a00 70%,#0a001a 100%)' },
  // ── Platinum (textured) ──────────────────────────────────────────────────────
  { id: 'midnight-library', label: 'Midnight Library',   gradient: 'linear-gradient(160deg,#0d0a2e 0%,#050318 50%,#0a0520 100%)' },
  { id: 'void-crystal',     label: 'Void Crystal',       gradient: 'linear-gradient(135deg,#0a0018 0%,#12003a 40%,#05000f 80%,#1a0030 100%)' },
  { id: 'auric-light',      label: 'Auric Light',        gradient: 'linear-gradient(135deg,#3d3000 0%,#1a1500 30%,#4a3c00 65%,#2e2400 100%)' },
  { id: 'starfield-map',    label: 'Starfield Map',      gradient: 'linear-gradient(160deg,#000820 0%,#00040e 60%,#000510 100%)' },
  { id: 'world-atlas',      label: 'World Atlas',        gradient: 'linear-gradient(135deg,#001a2e 0%,#000f1a 40%,#002030 80%,#000810 100%)' },
  { id: 'pack-storm',       label: 'Pack Storm',         gradient: 'linear-gradient(135deg,#002a0a 0%,#000f05 50%,#001a06 100%)' },
  // ── Mythic (animated) ────────────────────────────────────────────────────────
  { id: 'cosmos-scroll',    label: 'Cosmos Scroll',      gradient: 'linear-gradient(135deg,#000820,#000510)' },
  { id: 'prismatic-myth',   label: 'Prismatic Myth',     gradient: 'linear-gradient(135deg,#1a002e,#0f001a)' },
  { id: 'golden-prism',     label: 'Golden Prism',       gradient: 'linear-gradient(135deg,#1a1000,#2e2000)' },
  { id: 'blizzard-cards',   label: 'Blizzard of Cards',  gradient: 'linear-gradient(135deg,#000a1a,#00050f)' },
  { id: 'abyss-throne',     label: 'Abyss Throne',       gradient: 'linear-gradient(135deg,#0a001a,#05000f)' },
  { id: 'hall-of-mirrors',  label: 'Hall of Mirrors',    gradient: 'linear-gradient(135deg,#00101a,#000a10)' },
  { id: 'pack-singularity', label: 'Pack Singularity',   gradient: 'linear-gradient(135deg,#1a0000,#0f0000)' },
] as const;

const RANK_TIERS: readonly { min: number; label: string }[] = [
  { min: 2000, label: 'Diamond I' },  { min: 1800, label: 'Diamond II' },
  { min: 1600, label: 'Diamond III' }, { min: 1400, label: 'Platinum I' },
  { min: 1200, label: 'Platinum II' }, { min: 1000, label: 'Gold I' },
  { min: 800,  label: 'Gold II' },    { min: 600,  label: 'Gold III' },
  { min: 400,  label: 'Silver I' },   { min: 200,  label: 'Silver II' },
  { min: 100,  label: 'Silver III' }, { min: 0,    label: 'Bronze V' },
];

function getRank(rating: number): string {
  return RANK_TIERS.find(t => rating >= t.min)?.label ?? 'Bronze V';
}

function getGhostCode(userId: string): string {
  const clean = userId.replace(/-/g, '').toUpperCase().slice(0, 8);
  return `${clean.slice(0, 4)}-${clean.slice(4, 8)}`;
}

interface TitleDef { id: string; text: string; earn: string; }

const TITLES: TitleDef[] = [
  { id: 'wanderer',        text: 'Wanderer',           earn: 'Default — always available' },
  { id: 'curious-mind',    text: 'Curious Mind',        earn: 'Add your first card (First Article)' },
  { id: 'collector',       text: 'Collector',           earn: 'Collect 10 cards (Growing Library)' },
  { id: 'centurion',       text: 'Centurion',           earn: 'Collect 100 cards (The Hundred)' },
  { id: 'bibliophile',     text: 'Bibliophile',         earn: 'Collect 250 cards (Bibliophile)' },
  { id: 'archivist',       text: 'Archivist',           earn: 'Collect 500 cards (Grand Archive)' },
  { id: 'encyclopaedist',  text: 'Encyclopaedist',      earn: 'Collect 1000 cards (Encyclopaedia)' },
  { id: 'omniscient',      text: 'Omniscient',          earn: 'Collect 2500 cards (Living Wikipedia)' },
  { id: 'rising-star',     text: 'Rising Star',         earn: 'Get first SR card' },
  { id: 'special-finder',  text: 'Special Finder',      earn: 'Get first SSR card' },
  { id: 'gold-seeker',     text: 'Gold Seeker',         earn: 'Get first UR card' },
  { id: 'myth-touched',    text: 'Myth Touched',        earn: 'Get first MR card' },
  { id: 'sr-devotee',      text: 'SR Devotee',          earn: 'Collect 10 SR+ cards' },
  { id: 'connoisseur',     text: 'Connoisseur',         earn: 'Collect 5 SSR+ cards' },
  { id: 'ultra-collector', text: 'Ultra Collector',     earn: 'Collect 3 UR cards' },
  { id: 'myth-keeper',     text: 'Myth Keeper',         earn: 'Collect 3 MR cards' },
  { id: 'myth-hoarder',    text: 'Myth Hoarder',        earn: 'Collect 5 MR cards' },
  { id: 'spectrum-master', text: 'Spectrum Master',     earn: 'Own a card of every rarity' },
  { id: 'dedicated',       text: 'Dedicated',           earn: 'Collect 100 of any single rarity' },
  { id: 'pack-addict',     text: 'Pack Addict',         earn: 'Open 10 packs' },
  { id: 'devoted-opener',  text: 'Devoted Opener',      earn: 'Open 50 packs' },
  { id: 'century-opener',  text: 'Century Opener',      earn: 'Open 100 packs' },
  { id: 'avalanche',       text: 'Avalanche',           earn: 'Open 500 packs' },
  { id: 'no-life',         text: 'No Life',             earn: 'Open 1000 packs' },
  { id: 'shiny-hunter',    text: 'Shiny Hunter',        earn: 'Get first foil card' },
  { id: 'foil-collector',  text: 'Foil Collector',      earn: 'Collect 5 foil cards' },
  { id: 'mirror-keeper',   text: 'Mirror Keeper',       earn: 'Collect 20 foil cards' },
  { id: 'gilded',          text: 'Gilded',              earn: 'Get a foil SR+ card' },
  { id: 'scarlet-gleam',   text: 'Scarlet Gleam',       earn: 'Get a foil SSR+ card' },
  { id: 'auric',           text: 'Auric',               earn: 'Get a foil UR card' },
  { id: 'prismatic',       text: 'Prismatic',           earn: 'Get a foil MR card' },
  { id: 'all-that-glitters', text: 'All That Glitters', earn: 'Foil card of every SR+ rarity' },
  { id: 'mirror-lord',     text: 'Mirror Lord',         earn: 'Collect 50 foil cards' },
  { id: 'explorer',        text: 'Explorer',            earn: 'Collect 5 different topic tags' },
  { id: 'polymath',        text: 'Polymath',            earn: 'Collect 30 different topic tags' },
  { id: 'universal-scholar', text: 'Universal Scholar', earn: 'Collect 50 different topic tags' },
  { id: 'fortunes-favoured', text: "Fortune's Favoured", earn: 'Claim a pity card' },
];

const SUBTITLES: TitleDef[] = [
  { id: 'starting-out',       text: 'Just starting out',       earn: 'Default — always available' },
  { id: 'of-50-articles',     text: 'of 50 Articles',          earn: 'Collect 50 cards' },
  { id: 'ssr-hunter',         text: 'SSR Hunter',              earn: 'Get first SSR card' },
  { id: 'golden-few',         text: 'The Golden Few',          earn: 'Collect 3 UR cards' },
  { id: 'among-mythic',       text: 'Among the Mythic',        earn: 'Collect 3 MR cards' },
  { id: 'beyond-rare',        text: 'Beyond Rare',             earn: 'Collect 5 MR cards' },
  { id: 'master-of-knowledge', text: 'Master of Knowledge',    earn: 'Collect 1000 cards' },
  { id: 'living-wiki',        text: 'The Living Wikipedia',    earn: 'Collect 2500 cards' },
  { id: '500-packs-deep',     text: '500 Packs Deep',          earn: 'Open 500 packs' },
  { id: '1000-packs-wow',     text: '1000 Packs. Wow.',        earn: 'Open 1000 packs' },
  { id: 'patient-hoarder',    text: 'Patient Hoarder',         earn: 'Fill pack storage to max' },
  { id: 'foil-sr-plus',       text: 'Foil SR+',                earn: 'Get a foil SR+ card' },
  { id: 'golden-foil-bearer', text: 'Golden Foil Bearer',      earn: 'Get a foil UR card' },
  { id: 'mythic-foil-bearer', text: 'Mythic Foil Bearer',      earn: 'Get a foil MR card' },
  { id: 'foil-completionist', text: 'Foil Completionist',      earn: 'Foil of every SR+ rarity' },
  { id: 'hall-of-mirrors-sub', text: 'Hall of Mirrors',        earn: 'Collect 50 foil cards' },
  { id: 'master-of-many',     text: 'Master of Many',          earn: 'Collect 30 topic tags' },
  { id: 'across-all-fields',  text: 'Across All Fields',       earn: 'Collect 50 topic tags' },
  { id: 'nice',               text: 'Nice.',                   earn: 'Have exactly 69 cards' },
  { id: 'blaze-it',           text: 'Blaze It',                earn: 'Have exactly 420 cards' },
];

function firstSentence(text: string): string {
  const m = text.match(/^[^.!?]*[.!?]/);
  return m ? m[0].trim() : text.slice(0, 180).trim();
}

function modalQidTags(chain: QidNode[]): QidNode[] {
  const seen = new Set<string>();
  return chain
    .filter(n => !QID_BLOCKLIST.has(n.qid))
    .sort((a, b) => a.depth - b.depth)
    .filter(n => {
      if (!n.label || seen.has(n.label)) return false;
      seen.add(n.label);
      return true;
    });
}

function getCardTraits(uc: UserCard): string[] {
  const seen = new Set<string>();
  return (uc.card.qidChain ?? [])
    .filter(n => !QID_BLOCKLIST.has(n.qid))
    .sort((a, b) => a.depth - b.depth)
    .flatMap(n => (n.label ? [n.label] : []))
    .filter(label => {
      if (seen.has(label)) return false;
      seen.add(label);
      return true;
    });
}

export function Collection() {
  const { data: collection, isLoading } = useCollection();
  const {
    storedPacks,
    secondsUntilNext,
    pitySrAvailable,
    pityUrAvailable,
    pitySrProgress,
    pityUrProgress,
  } = usePackStore();

  const queryClient  = useQueryClient();
  const openPack     = useOpenPack();
  const openPityPack = useOpenPityPack();

  const [packOpenerOpen, setPackOpenerOpen] = useState(false);
  const [packCharging, setPackCharging]     = useState(false);
  const [pendingCards, setPendingCards]     = useState<UserCard[] | null>(null);
  const [selectedCard, setSelectedCard]     = useState<UserCard | null>(null);
  const [copiedShare, setCopiedShare]       = useState(false);
  const pollCancelRef = useRef(false);

  // Search / filter / sort state
  const [search, setSearch]               = useState('');
  const [enabledRarities, setEnabledRarities] = useState<Set<string>>(new Set(ALL_RARITIES));
  const [foilOnly, setFoilOnly]           = useState(false);
  const [sortField, setSortField]         = useState<SortField>('total');
  const [sortDir, setSortDir]             = useState<SortDir>('desc');
  const [selectedTraits, setSelectedTraits] = useState<Set<string>>(new Set());
  const [traitOpen, setTraitOpen]         = useState(false);
  const [traitSearch, setTraitSearch]     = useState('');
  const traitPopoverRef = useRef<HTMLDivElement>(null);
  const traitBtnRef     = useRef<HTMLButtonElement>(null);

  // Drag-and-drop refs (hot path — no React re-renders during motion)
  const dragCardRef    = useRef<UserCard | null>(null);
  const floatRef       = useRef<HTMLDivElement>(null);
  const slotRefs       = useRef<(HTMLDivElement | null)[]>([null, null, null, null, null]);
  const editTeamIdsRef = useRef<(string | null)[]>([null, null, null, null, null]);
  const sourceSlotRef  = useRef<number | null>(null);
  const prevDragPosRef = useRef({ x: 0, y: 0 });
  const prevSnapSlotRef = useRef<number | null>(null);

  usePackState();

  const { userId } = useAuthStore();
  const { data: me } = useQuery<MeData>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<MeData>>('/auth/me');
      return data.data;
    },
    staleTime: 30_000,
  });

  // Profile state
  const [profileDisplayName, setProfileDisplayName] = useState(() => localStorage.getItem('wb-display-name') ?? '');
  const [profileTitle, setProfileTitle]             = useState(() => {
    const s = localStorage.getItem('wb-title') ?? 'wanderer';
    return TITLES.find(t => t.id === s) ? s : (TITLES.find(t => t.text === s)?.id ?? 'wanderer');
  });
  const [profileSubtitle, setProfileSubtitle]       = useState(() => {
    const s = localStorage.getItem('wb-subtitle') ?? 'starting-out';
    return SUBTITLES.find(t => t.id === s) ? s : (SUBTITLES.find(t => t.text === s)?.id ?? 'starting-out');
  });
  const [profileBg, setProfileBg]                   = useState(() => localStorage.getItem('wb-bg') ?? 'default');
  const [ghostTeamIds, setGhostTeamIds]             = useState<(string | null)[]>(() => {
    try { const s = localStorage.getItem('wb-ghost-team'); return s ? (JSON.parse(s) as (string|null)[]) : [null,null,null,null,null]; }
    catch { return [null, null, null, null, null]; }
  });
  const [isEditing, setIsEditing]             = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [nameError, setNameError]             = useState('');
  const [nameSaving, setNameSaving]           = useState(false);
  const [editTitle, setEditTitle]             = useState('wanderer');
  const [editSubtitle, setEditSubtitle]       = useState('starting-out');
  const [titlePickerOpen, setTitlePickerOpen]       = useState(false);
  const [subtitlePickerOpen, setSubtitlePickerOpen] = useState(false);
  const [editBg, setEditBg]                   = useState('default');
  const [editTeamIds, setEditTeamIds]         = useState<(string | null)[]>([null,null,null,null,null]);
  const [dragCard, setDragCard]               = useState<UserCard | null>(null);
  const [snapSlot, setSnapSlot]               = useState<number | null>(null);
  const [ghostCodeCopied, setGhostCodeCopied] = useState(false);

  // Close trait popover on outside click
  useEffect(() => {
    if (!traitOpen) return;
    function handler(e: MouseEvent) {
      if (
        traitPopoverRef.current && !traitPopoverRef.current.contains(e.target as Node) &&
        traitBtnRef.current     && !traitBtnRef.current.contains(e.target as Node)
      ) {
        setTraitOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [traitOpen]);

  // Keep ref in sync so drag handlers (registered via addEventListener) see latest ids
  useEffect(() => { editTeamIdsRef.current = editTeamIds; }, [editTeamIds]);

  // Drag pointer move / up — registered on window so the card tracks past the element edge
  useEffect(() => {
    if (!isEditing) return;

    function onMove(e: PointerEvent) {
      const float = floatRef.current;
      if (!dragCardRef.current || !float) return;

      const dx = e.clientX - prevDragPosRef.current.x;
      const dy = e.clientY - prevDragPosRef.current.y;
      prevDragPosRef.current = { x: e.clientX, y: e.clientY };

      const tiltY = Math.max(-22, Math.min(22, dx * 2.5));
      const tiltX = Math.max(-16, Math.min(16, -dy * 1.8));

      const ids      = editTeamIdsRef.current;
      const clsDrop  = styles.ghostSlotDropTarget!;
      const clsHov   = styles.ghostSlotHovered!;

      // Find which empty slot (if any) the pointer is over
      let overSlot: number | null = null;
      slotRefs.current.forEach((ref, i) => {
        if (!ref || ids[i]) return;
        const r = ref.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) overSlot = i;
      });

      if (overSlot !== null) {
        // Snap float to slot center — clear tilt
        const slotEl = slotRefs.current[overSlot];
        if (slotEl) {
          const r = slotEl.getBoundingClientRect();
          float.style.left = `${r.left + r.width  / 2}px`;
          float.style.top  = `${r.top  + r.height / 2}px`;
        }
        float.style.setProperty('--tilt-x', '0deg');
        float.style.setProperty('--tilt-y', '0deg');
      } else {
        // Free-move with tilt
        float.style.left = `${e.clientX}px`;
        float.style.top  = `${e.clientY}px`;
        float.style.setProperty('--tilt-x', `${tiltX}deg`);
        float.style.setProperty('--tilt-y', `${tiltY}deg`);
      }

      // Trigger mini-card re-render only on snap state change (not every frame)
      if (overSlot !== prevSnapSlotRef.current) {
        prevSnapSlotRef.current = overSlot;
        setSnapSlot(overSlot);
      }

      // Imperatively glow/unglow slots
      slotRefs.current.forEach((ref, i) => {
        if (!ref) return;
        if (ids[i]) { ref.classList.remove(clsDrop, clsHov); return; }
        ref.classList.add(clsDrop);
        ref.classList.toggle(clsHov, i === overSlot);
      });
    }

    function onUp(e: PointerEvent) {
      const clsDrop = styles.ghostSlotDropTarget!;
      const clsHov  = styles.ghostSlotHovered!;
      slotRefs.current.forEach(ref => ref?.classList.remove(clsDrop, clsHov));

      const uc = dragCardRef.current;
      if (!uc) return;

      const ids = editTeamIdsRef.current;
      let droppedSlot: number | null = null;
      slotRefs.current.forEach((ref, i) => {
        if (!ref || ids[i]) return;
        const r = ref.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) droppedSlot = i;
      });

      // Dropped on a slot → fill it. Otherwise slot-sourced cards stay removed (= removed from team).
      if (droppedSlot !== null) {
        const next = [...ids]; next[droppedSlot] = uc.id; setEditTeamIds(next);
      }

      dragCardRef.current   = null;
      sourceSlotRef.current = null;
      prevSnapSlotRef.current = null;
      setDragCard(null);
      setSnapSlot(null);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup',   onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup',   onUp);
    };
  }, [isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  function startDrag(uc: UserCard, e: React.PointerEvent, fromSlot: number | null = null) {
    e.preventDefault();
    dragCardRef.current   = uc;
    sourceSlotRef.current = fromSlot;
    prevDragPosRef.current = { x: e.clientX, y: e.clientY };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
    // Prime float position before first onMove fires
    if (floatRef.current) {
      floatRef.current.style.left = `${e.clientX}px`;
      floatRef.current.style.top  = `${e.clientY}px`;
    }
    if (fromSlot !== null) {
      const next = [...editTeamIds]; next[fromSlot] = null; setEditTeamIds(next);
    }
    setDragCard(uc);
  }

  const allTraits = useMemo(() => {
    if (!collection?.data) return [];
    const seen = new Set<string>();
    const traits: string[] = [];
    for (const uc of collection.data) {
      for (const t of getCardTraits(uc as UserCard)) {
        if (!seen.has(t)) { seen.add(t); traits.push(t); }
      }
    }
    return traits.sort((a, b) => a.localeCompare(b));
  }, [collection?.data]);

  const filteredCollection = useMemo<UserCard[]>(() => {
    if (!collection?.data) return [];
    const q = search.trim().toLowerCase();
    const allEnabled = enabledRarities.size === ALL_RARITIES.length;

    let result = (collection.data as UserCard[]).filter(uc => {
      if (!allEnabled && !enabledRarities.has(uc.card.rarity)) return false;
      if (foilOnly && !uc.isFoil) return false;
      if (selectedTraits.size > 0) {
        const traits = new Set(getCardTraits(uc));
        if (![...selectedTraits].some(t => traits.has(t))) return false;
      }
      if (q) {
        const inName   = uc.card.wikiTitle.toLowerCase().includes(q);
        const inExtract = (uc.card.wikiExtract ?? '').toLowerCase().includes(q);
        const inTraits  = getCardTraits(uc).some(t => t.toLowerCase().includes(q));
        if (!inName && !inExtract && !inTraits) return false;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      let diff = 0;
      switch (sortField) {
        case 'total':
          diff = (a.card.attack + a.card.health + a.card.speed) - (b.card.attack + b.card.health + b.card.speed);
          break;
        case 'atk':     diff = a.card.attack - b.card.attack; break;
        case 'hp':      diff = a.card.health - b.card.health; break;
        case 'spd':     diff = a.card.speed  - b.card.speed;  break;
        case 'name':    diff = a.card.wikiTitle.localeCompare(b.card.wikiTitle); break;
        case 'rarity':  diff = (RARITY_IDX[a.card.rarity] ?? 0) - (RARITY_IDX[b.card.rarity] ?? 0); break;
        case 'acquired':
          diff = new Date(a.acquiredAt).getTime() - new Date(b.acquiredAt).getTime();
          break;
      }
      return sortDir === 'desc' ? -diff : diff;
    });

    return result;
  }, [collection?.data, search, enabledRarities, foilOnly, sortField, sortDir, selectedTraits]);

  const ghostTeamCards = useMemo<(UserCard | null)[]>(() => {
    if (!collection?.data) return ghostTeamIds.map(() => null);
    const byId = new Map((collection.data as UserCard[]).map(uc => [uc.id, uc]));
    return ghostTeamIds.map(id => (id ? (byId.get(id) ?? null) : null));
  }, [collection?.data, ghostTeamIds]);

  const editTeamCards = useMemo<(UserCard | null)[]>(() => {
    if (!collection?.data) return editTeamIds.map(() => null);
    const byId = new Map((collection.data as UserCard[]).map(uc => [uc.id, uc]));
    return editTeamIds.map(id => (id ? (byId.get(id) ?? null) : null));
  }, [collection?.data, editTeamIds]);

  // Whichever team is currently displayed
  const displayTeamCards = isEditing ? editTeamCards : ghostTeamCards;

  const teamStats = useMemo(() => {
    const cards = displayTeamCards.filter((uc): uc is UserCard => uc !== null);
    if (cards.length === 0) return null;

    const atk = cards.reduce((s, uc) => s + uc.card.attack, 0);
    const hp  = cards.reduce((s, uc) => s + uc.card.health, 0);
    const spd = cards.reduce((s, uc) => s + uc.card.speed,  0);

    // Same formula as battle: ATK + HP×0.5 + SPD×0.3
    const power = Math.round(atk + hp * 0.5 + spd * 0.3);

    // Real synergy engine (same one the battle uses)
    const synergyResult = evaluateTeam(cards.map(uc => ({ qidChain: uc.card.qidChain ?? [] })));
    const powerWithBonuses = calculateCP(cards.map(uc => uc.card), synergyResult);

    return { atk, hp, spd, power, powerWithBonuses, synergies: synergyResult.synergies, count: cards.length };
  }, [displayTeamCards]);

  const achievementStats = useMemo(() => {
    const cards = ((collection?.data ?? []) as UserCard[]).map(uc => ({
      rarity: uc.card.rarity,
      isFoil: uc.isFoil,
      tags: (uc.card.qidChain ?? []).filter(n => !QID_BLOCKLIST.has(n.qid)).flatMap(n => n.label ? [n.label] : []),
    }));
    const packsOpened = parseInt(localStorage.getItem('wb-packs-opened') ?? '0', 10);
    const pityClaimed = localStorage.getItem('wb-pity-claimed') === '1';
    const hadMaxStoredPacks = localStorage.getItem('wb-had-max-packs') === '1';
    return computeStats(cards, packsOpened, pityClaimed, hadMaxStoredPacks);
  }, [collection?.data]);

  const unlockedRewards = useMemo(() => {
    const titles    = new Set<string>(['wanderer']);
    const subtitles = new Set<string>(['starting-out']);
    const bgs       = new Set<string>(['default', 'ocean', 'ember', 'forest', 'cosmic']);
    for (const ach of ACHIEVEMENTS) {
      if (!checkCondition(ach.condition, achievementStats)) continue;
      if (ach.reward.title)      titles.add(ach.reward.title.text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
      if (ach.reward.subtitle)   subtitles.add(ach.reward.subtitle.text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
      if (ach.reward.background) bgs.add(ach.reward.background.id);
    }
    // match by title id directly
    const titleIds    = new Set<string>(['wanderer']);
    const subtitleIds = new Set<string>(['starting-out']);
    for (const ach of ACHIEVEMENTS) {
      if (!checkCondition(ach.condition, achievementStats)) continue;
      if (ach.reward.title) {
        const match = TITLES.find(t => t.text === ach.reward.title!.text);
        if (match) titleIds.add(match.id);
      }
      if (ach.reward.subtitle) {
        const match = SUBTITLES.find(t => t.text === ach.reward.subtitle!.text);
        if (match) subtitleIds.add(match.id);
      }
    }
    return { titleIds, subtitleIds, bgIds: bgs };
  }, [achievementStats]);

  const unlockedTitleIds    = unlockedRewards.titleIds;
  const unlockedSubtitleIds = unlockedRewards.subtitleIds;
  const unlockedBgIds       = unlockedRewards.bgIds;

  const [toastQueue, setToastQueue] = useState<Achievement[]>([]);

  useEffect(() => {
    const seen = new Set<string>(JSON.parse(localStorage.getItem('wb-unlocked-achievements') ?? '[]'));
    const newlyUnlocked: Achievement[] = [];
    for (const ach of ACHIEVEMENTS) {
      if (!seen.has(ach.id) && checkCondition(ach.condition, achievementStats)) {
        newlyUnlocked.push(ach);
        seen.add(ach.id);
      }
    }
    if (newlyUnlocked.length > 0) {
      localStorage.setItem('wb-unlocked-achievements', JSON.stringify([...seen]));
      setToastQueue(prev => [...prev, ...newlyUnlocked].slice(-4));
    }
  }, [achievementStats]);

  const dismissToast = useCallback((id: string) => {
    setToastQueue(prev => prev.filter(a => a.id !== id));
  }, []);

  function toggleRarity(rarity: string) {
    setEnabledRarities(prev => {
      const allOn = prev.size === ALL_RARITIES.length;
      if (allOn) return new Set([rarity]);
      const next = new Set(prev);
      if (next.has(rarity) && next.size === 1) return new Set(ALL_RARITIES);
      if (next.has(rarity)) { next.delete(rarity); } else { next.add(rarity); }
      return next.size === ALL_RARITIES.length ? new Set(ALL_RARITIES) : next;
    });
  }

  function toggleTrait(trait: string) {
    setSelectedTraits(prev => {
      const next = new Set(prev);
      if (next.has(trait)) { next.delete(trait); } else { next.add(trait); }
      return next;
    });
  }

  function resetFilters() {
    setSearch('');
    setEnabledRarities(new Set(ALL_RARITIES));
    setFoilOnly(false);
    setSortField('total');
    setSortDir('desc');
    setSelectedTraits(new Set());
    setTraitSearch('');
  }

  const displayName = profileDisplayName || me?.username || 'Player';
  const ghostCode   = userId ? getGhostCode(userId) : 'XXXX-XXXX';
  const currentBg   = BG_PRESETS.find(p => p.id === profileBg)?.gradient ?? BG_PRESETS[0]!.gradient;
  const previewBg   = BG_PRESETS.find(p => p.id === editBg)?.gradient ?? BG_PRESETS[0]!.gradient;

  const activeTitleReward = ACHIEVEMENTS.find(a => {
    const t = TITLES.find(t2 => t2.id === profileTitle);
    return t && a.reward.title?.text === t.text;
  })?.reward.title;
  const activeSubtitleReward = ACHIEVEMENTS.find(a => {
    const s = SUBTITLES.find(s2 => s2.id === profileSubtitle);
    return s && a.reward.subtitle?.text === s.text;
  })?.reward.subtitle;

  function getTitleReward(titleId: string) {
    const t = TITLES.find(t2 => t2.id === titleId);
    return t ? ACHIEVEMENTS.find(a => a.reward.title?.text === t.text)?.reward.title : undefined;
  }
  function getSubtitleReward(subtitleId: string) {
    const s = SUBTITLES.find(s2 => s2.id === subtitleId);
    return s ? ACHIEVEMENTS.find(a => a.reward.subtitle?.text === s.text)?.reward.subtitle : undefined;
  }

  function startEditing() {
    setEditDisplayName(displayName === 'Player' ? '' : displayName);
    setEditTitle(profileTitle);
    setEditSubtitle(profileSubtitle);
    setEditBg(profileBg);
    setEditTeamIds([...ghostTeamIds]);
    setIsEditing(true);
  }

  async function saveProfile() {
    const name = editDisplayName.trim();
    setNameError('');
    if (name && name !== (me?.username ?? '')) {
      setNameSaving(true);
      try {
        await api.put('/users/me/username', { username: name });
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
        setNameSaving(false);
        if (msg.toLowerCase().includes('taken') || msg.toLowerCase().includes('exist')) {
          setNameError('That username is already taken.');
        } else {
          setNameError('Could not save username. Try again.');
        }
        return;
      }
      setNameSaving(false);
    }
    localStorage.setItem('wb-display-name', name);
    localStorage.setItem('wb-title', editTitle || 'wanderer');
    localStorage.setItem('wb-subtitle', editSubtitle || 'starting-out');
    localStorage.setItem('wb-bg', editBg);
    localStorage.setItem('wb-ghost-team', JSON.stringify(editTeamIds));
    setProfileDisplayName(name);
    setProfileTitle(editTitle || 'wanderer');
    setProfileSubtitle(editSubtitle || 'starting-out');
    setProfileBg(editBg);
    setGhostTeamIds(editTeamIds);
    setIsEditing(false);
  }

  function cancelEditing() { setIsEditing(false); }

  function removeFromSlot(idx: number) {
    const next = [...editTeamIds]; next[idx] = null; setEditTeamIds(next);
  }

  async function copyGhostCode() {
    try {
      await navigator.clipboard.writeText(ghostCode);
      setGhostCodeCopied(true);
      setTimeout(() => setGhostCodeCopied(false), 2000);
    } catch { /* ignore */ }
  }

  const hasActiveFilters =
    search !== '' ||
    enabledRarities.size !== ALL_RARITIES.length ||
    foilOnly ||
    selectedTraits.size > 0 ||
    sortField !== 'total' ||
    sortDir !== 'desc';

  const visibleTraits = traitSearch
    ? allTraits.filter(t => t.toLowerCase().includes(traitSearch.toLowerCase()))
    : allTraits;

  async function handleOpenPack() {
    if (storedPacks < 1 || openPack.isPending) return;
    setPackOpenerOpen(true);
    setPackCharging(true);
    setPendingCards(null);
    pollCancelRef.current = false;

    try {
      const result = await openPack.mutateAsync();
      const userCards = result.cards as UserCard[];

      const allHaveQids = userCards.every(
        uc => (uc.card.qidChain as unknown[]).length > 0
      );
      if (allHaveQids || pollCancelRef.current) {
        setPendingCards(userCards);
        setPackCharging(false);
        return;
      }

      const cardIds = userCards.map(uc => uc.card.id).join(',');
      let attempts = 0;
      const MAX_ATTEMPTS = 10;

      const poll = async () => {
        if (pollCancelRef.current) return;
        attempts++;
        try {
          const { data } = await api.get<{
            data: { allReady: boolean; qidData: Record<string, QidNode[]> };
          }>(`/cards/qids-ready?ids=${cardIds}`);
          const resp = data.data;
          if (resp.allReady || attempts >= MAX_ATTEMPTS) {
            if (!pollCancelRef.current) {
              const enriched = userCards.map(uc => ({
                ...uc,
                card: {
                  ...uc.card,
                  qidChain: resp.qidData[uc.card.id] ?? uc.card.qidChain,
                },
              })) as UserCard[];
              setPendingCards(enriched);
              setPackCharging(false);
            }
          } else {
            setTimeout(poll, 1500);
          }
        } catch {
          if (attempts >= MAX_ATTEMPTS && !pollCancelRef.current) {
            setPendingCards(userCards);
            setPackCharging(false);
          } else if (!pollCancelRef.current) {
            setTimeout(poll, 1500);
          }
        }
      };

      setTimeout(poll, 1500);
    } catch {
      setPackOpenerOpen(false);
      setPackCharging(false);
      setPendingCards(null);
    }
  }

  function handleClosePackOpener() {
    pollCancelRef.current = true;
    setPackOpenerOpen(false);
    setPendingCards(null);
    setPackCharging(false);
    void queryClient.invalidateQueries({ queryKey: ['cards'] });
  }

  async function handleOpenPityPack(tier: 'SR' | 'UR') {
    try {
      const result = await openPityPack.mutateAsync(tier);
      setPackOpenerOpen(true);
      setPackCharging(false);
      setPendingCards([result.card as UserCard]);
    } catch { /* ignore */ }
  }

  async function handleShare(card: UserCard['card']) {
    const url = `https://en.wikipedia.org/wiki/${card.wikiSlug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `WikiBattler — ${card.wikiTitle}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2000);
      }
    } catch { /* user cancelled share */ }
  }

  const packRingPct = storedPacks >= 1
    ? Math.round((storedPacks / MAX_STORED_PACKS) * 100)
    : Math.round((1 - secondsUntilNext / PACK_COOLDOWN_SECONDS) * 100);
  const packRingInner = storedPacks === 0
    ? `${String(Math.floor(secondsUntilNext / 60)).padStart(2,'0')}:${String(secondsUntilNext % 60).padStart(2,'0')}`
    : String(storedPacks);
  const srRingPct = Math.round((pitySrProgress / PITY_SR_THRESHOLD) * 100);
  const urRingPct = Math.round((pityUrProgress / PITY_UR_THRESHOLD) * 100);

  return (
    <div className={styles.page}>
      {/* Pack opener overlay */}
      {packOpenerOpen && (
        <PackOpener
          cards={pendingCards ?? []}
          isCharging={packCharging}
          onClose={handleClosePackOpener}
        />
      )}

      {/* ── Card detail modal ── */}
      {selectedCard && (() => {
        const { card, isFoil } = selectedCard;
        const rarityColor = RARITY_DISPLAY[card.rarity].color;
        const rarityLabel = RARITY_DISPLAY[card.rarity].label;
        const power = Math.round(card.attack + card.health * 0.5 + card.speed * 0.3);
        const statMax = Math.max(card.attack, card.health, card.speed, 1);
        const tags = modalQidTags(card.qidChain ?? []);
        const desc = card.wikiExtract ? firstSentence(card.wikiExtract) : null;
        return (
          <div
            className={styles.modalOverlay}
            onClick={() => setSelectedCard(null)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className={styles.modalContent}
              style={{ '--modal-rarity-color': rarityColor } as React.CSSProperties}
              onClick={e => e.stopPropagation()}
            >
              <button className={styles.modalClose} onClick={() => setSelectedCard(null)} aria-label="Close">✕</button>

              {/* Left — large card + ambient glow */}
              <div className={styles.modalCardPanel}>
                <div className={styles.modalCardGlow} aria-hidden="true" />
                <div className={styles.modalCardWrap}>
                  <Card userCard={selectedCard} large tilt />
                </div>
              </div>

              {/* Right — all metadata */}
              <div className={styles.modalDetails}>

                {/* Rarity + foil badges */}
                <div className={styles.modalBadgeRow}>
                  <span className={styles.modalRarityBadge}>{rarityLabel}</span>
                  {isFoil && <span className={styles.modalFoilBadge}>✦ Foil</span>}
                </div>

                {/* Card title */}
                <h2 className={styles.modalTitle}>{card.wikiTitle}</h2>

                {/* Power score */}
                <div className={styles.modalPowerRow}>
                  <span className={styles.modalPowerVal}>{power.toLocaleString()}</span>
                  <span className={styles.modalPowerLabel}>Power</span>
                </div>

                {/* Stat bars */}
                <div className={styles.modalStats}>
                  {([
                    { label: 'ATK', val: card.attack,  color: '#f97316', cls: styles.modalStatNumAtk },
                    { label: 'HP',  val: card.health,  color: '#22c55e', cls: styles.modalStatNumHp  },
                    { label: 'SPD', val: card.speed,   color: '#3b82f6', cls: styles.modalStatNumSpd },
                  ] as const).map(({ label, val, color, cls }) => (
                    <div key={label} className={styles.modalStatRow}>
                      <span className={styles.modalStatLbl} style={{ color }}>{label}</span>
                      <div className={styles.modalStatBar}>
                        <div
                          className={styles.modalStatBarFill}
                          style={{ '--fill-pct': `${(val / statMax * 100).toFixed(1)}%`, background: color } as React.CSSProperties}
                        />
                      </div>
                      <span className={[styles.modalStatNum, cls].join(' ')}>{val.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Description — first sentence */}
                {desc && <p className={styles.modalDesc}>{desc}</p>}

                {/* Traits */}
                {tags.length > 0 && (
                  <div className={styles.modalTagSection}>
                    <span className={styles.modalTagLabel}>Traits</span>
                    <div className={styles.modalTags}>
                      {tags.map(n => (
                        <span key={n.qid} className={styles.modalTag}>{n.label}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className={styles.modalActions}>
                  <a
                    className={styles.modalActionWiki}
                    href={`https://en.wikipedia.org/wiki/${card.wikiSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    🌐 Wikipedia
                  </a>
                  <button className={styles.modalActionShare} onClick={() => handleShare(card)}>
                    {copiedShare ? '✓ Copied!' : '↗ Share'}
                  </button>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Collection</h1>
        <div className={styles.packRings}>
          {/* Pack ring */}
          <div
            className={[styles.ringWrap, storedPacks >= MAX_STORED_PACKS ? styles.ringWrapFull : storedPacks >= 1 ? styles.ringWrapReady : ''].filter(Boolean).join(' ')}
            onClick={storedPacks >= 1 ? handleOpenPack : undefined}
            role={storedPacks >= 1 ? 'button' : undefined}
            tabIndex={storedPacks >= 1 ? 0 : undefined}
            onKeyDown={e => e.key === 'Enter' && storedPacks >= 1 && handleOpenPack()}
            aria-label={storedPacks >= 1 ? `Open pack (${storedPacks} available)` : 'Waiting for next pack'}
          >
            <div className={styles.ringCircle} style={{ '--ring-pct': `${packRingPct}%`, '--ring-color': storedPacks >= 1 ? '#4ade80' : 'var(--color-accent)' } as React.CSSProperties}>
              <div className={styles.ringInner}><span className={styles.ringValue}>{packRingInner}</span></div>
            </div>
            <span className={styles.ringLabel}>Open Pack</span>
            <span className={styles.ringCount}>{storedPacks}/{MAX_STORED_PACKS}</span>
          </div>

          {/* SR/SSR pity ring */}
          <div
            className={[styles.ringWrap, styles.ringWrapSm, pitySrAvailable > 0 ? styles.ringWrapReady : ''].filter(Boolean).join(' ')}
            onClick={pitySrAvailable > 0 ? () => handleOpenPityPack('SR') : undefined}
            role={pitySrAvailable > 0 ? 'button' : undefined}
            tabIndex={pitySrAvailable > 0 ? 0 : undefined}
            aria-label={`SR/SSR pity: ${pitySrProgress}/${PITY_SR_THRESHOLD}`}
          >
            <div className={styles.ringCircleSm} style={{ '--ring-pct': `${srRingPct}%`, '--ring-color': pitySrAvailable > 0 ? '#fbbf24' : '#fb923c' } as React.CSSProperties}>
              <div className={styles.ringInnerSm}><span className={styles.ringValueSm}>{pitySrAvailable > 0 ? '!' : pitySrProgress}</span></div>
            </div>
            <span className={styles.ringLabel}>SR/SSR</span>
            <span className={styles.ringCount}>{pitySrProgress}/{PITY_SR_THRESHOLD}</span>
          </div>

          {/* UR/MR pity ring */}
          <div
            className={[styles.ringWrap, styles.ringWrapSm, pityUrAvailable > 0 ? styles.ringWrapReady : ''].filter(Boolean).join(' ')}
            onClick={pityUrAvailable > 0 ? () => handleOpenPityPack('UR') : undefined}
            role={pityUrAvailable > 0 ? 'button' : undefined}
            tabIndex={pityUrAvailable > 0 ? 0 : undefined}
            aria-label={`UR/MR pity: ${pityUrProgress}/${PITY_UR_THRESHOLD}`}
          >
            <div className={styles.ringCircleSm} style={{ '--ring-pct': `${urRingPct}%`, '--ring-color': pityUrAvailable > 0 ? '#c084fc' : '#fbbf24' } as React.CSSProperties}>
              <div className={styles.ringInnerSm}><span className={styles.ringValueSm}>{pityUrAvailable > 0 ? '!' : pityUrProgress}</span></div>
            </div>
            <span className={styles.ringLabel}>UR/MR</span>
            <span className={styles.ringCount}>{pityUrProgress}/{PITY_UR_THRESHOLD}</span>
          </div>
        </div>
      </div>

      {/* ── Profile / Ghost ── */}
      <section
        className={[styles.profileSection, isEditing ? styles.profileEditing : ''].filter(Boolean).join(' ')}
        data-bg={isEditing ? editBg : profileBg}
        aria-label="Player profile"
      >
        <button className={styles.profileEditBtn} onClick={isEditing ? saveProfile : startEditing} title={isEditing ? 'Save' : 'Edit'}>
          {isEditing ? '✓' : '✎'}
        </button>
        {isEditing && <button className={styles.profileCancelBtn} onClick={cancelEditing}>✕</button>}

        {/* Identity + ghost code */}
        <div className={styles.profileTop}>
          <div className={styles.profileIdentity}>
            {isEditing ? (
              <>
                <input className={styles.editNameInput} value={editDisplayName} onChange={e => { setEditDisplayName(e.target.value); setNameError(''); }} placeholder="Display name" maxLength={20} disabled={nameSaving} />
                {nameError && <span className={styles.nameError}>{nameError}</span>}
                <div className={styles.editTitleRow}>
                  <button className={styles.editTitlePicker} onClick={() => setTitlePickerOpen(true)}>
                    <span>{TITLES.find(t => t.id === editTitle)?.text ?? 'Wanderer'}</span>
                    <span className={styles.editPickerArrow}>▼</span>
                  </button>
                  <button className={styles.editTitlePicker} onClick={() => setSubtitlePickerOpen(true)}>
                    <span>{SUBTITLES.find(t => t.id === editSubtitle)?.text ?? 'Just starting out'}</span>
                    <span className={styles.editPickerArrow}>▼</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className={styles.profileName}>{displayName}</span>
                <div className={styles.profileTitleRow}>
                  <span
                    className={[
                      styles.profileTitle,
                      activeTitleReward?.animated === 'rainbow'  ? styles.titleRainbow  : '',
                      activeTitleReward?.animated === 'shimmer'  ? styles.titleShimmer  : '',
                      activeTitleReward?.animated === 'pulse'    ? styles.titlePulse    : '',
                      activeTitleReward?.glow                    ? styles.titleGlow     : '',
                    ].filter(Boolean).join(' ')}
                    style={{
                      color: activeTitleReward?.color ?? undefined,
                      ...(activeTitleReward?.glow ? { '--title-glow': activeTitleReward.glow } as React.CSSProperties : {}),
                    }}
                  >
                    {TITLES.find(t => t.id === profileTitle)?.text ?? 'Wanderer'}
                  </span>
                  {profileSubtitle && (
                    <span
                      className={styles.profileSubtitle}
                      style={{ color: activeSubtitleReward?.color ?? undefined }}
                    >
                      · {SUBTITLES.find(t => t.id === profileSubtitle)?.text ?? ''}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
          <div className={styles.ghostCodeBlock}>
            <span className={styles.ghostCodeLabel}>Ghost Code</span>
            <button className={styles.ghostCodeBtn} onClick={copyGhostCode} title="Copy ghost code">
              {ghostCode} <span className={styles.ghostCopyIcon}>{ghostCodeCopied ? '✓' : '⎘'}</span>
            </button>
          </div>
        </div>

        {/* Team slots */}
        <div className={styles.ghostTeamWrap}>
          <div className={styles.ghostTeamLabelRow}>
            <span className={styles.ghostTeamLabel}>Ghost Team</span>
            {isEditing && (
              <span className={styles.ghostTeamHint}>drag cards from your collection below</span>
            )}
          </div>
          <div className={styles.ghostTeamBody}>
          <div className={styles.ghostTeamSlots}>
            {displayTeamCards.map((uc, i) => (
              <div
                key={i}
                ref={el => { if (isEditing) slotRefs.current[i] = el; }}
                className={[
                  styles.ghostSlot,
                  isEditing ? styles.ghostSlotEditable : '',
                  uc ? styles.ghostSlotFilled : '',
                ].filter(Boolean).join(' ')}
              >
                {uc ? (
                  <>
                    <div
                      className={styles.ghostSlotDragArea}
                      onPointerDown={isEditing ? e => startDrag(uc, e, i) : undefined}
                      style={isEditing ? { cursor: 'grab' } : undefined}
                    >
                      {uc.card.wikiThumbUrl
                        ? <img className={styles.ghostSlotImg} src={uc.card.wikiThumbUrl} alt={uc.card.wikiTitle} />
                        : <div className={styles.ghostSlotImgFallback}>{uc.card.wikiTitle.slice(0, 2)}</div>}
                      <span className={styles.ghostSlotRarity} style={{ color: `var(--rarity-${uc.card.rarity.toLowerCase()})` }}>{uc.card.rarity}</span>
                    </div>
                    {isEditing && (
                      <button className={styles.ghostSlotRemove} onClick={() => removeFromSlot(i)} aria-label="Remove card">✕</button>
                    )}
                  </>
                ) : (
                  <span className={styles.ghostSlotPlus}>{isEditing ? '＋' : '·'}</span>
                )}
              </div>
            ))}
          </div>

          {/* Team stats + synergies */}
          {teamStats && (
            <div className={styles.teamStatsPanel}>
              {/* Two-line stat block */}
              <div className={styles.teamStatsBlock}>
                {/* Line 1: ATK · HP · SPD */}
                <div className={styles.teamStatLine}>
                  <span className={styles.teamStatItem}>
                    <span className={[styles.teamStatDot, styles.teamStatDotAtk].join(' ')} />
                    <span className={styles.teamStatLbl}>ATK</span>
                    <span className={[styles.teamStatVal, styles.teamStatValAtk].join(' ')}>{teamStats.atk.toLocaleString()}</span>
                  </span>
                  <span className={styles.teamStatSep} />
                  <span className={styles.teamStatItem}>
                    <span className={[styles.teamStatDot, styles.teamStatDotHp].join(' ')} />
                    <span className={styles.teamStatLbl}>HP</span>
                    <span className={[styles.teamStatVal, styles.teamStatValHp].join(' ')}>{teamStats.hp.toLocaleString()}</span>
                  </span>
                  <span className={styles.teamStatSep} />
                  <span className={styles.teamStatItem}>
                    <span className={[styles.teamStatDot, styles.teamStatDotSpd].join(' ')} />
                    <span className={styles.teamStatLbl}>SPD</span>
                    <span className={[styles.teamStatVal, styles.teamStatValSpd].join(' ')}>{teamStats.spd.toLocaleString()}</span>
                  </span>
                </div>
                {/* Line 2: Power · Power+Bonuses */}
                <div className={styles.teamStatLine}>
                  <span className={styles.teamStatItem}>
                    <span className={[styles.teamStatDot, styles.teamStatDotPower].join(' ')} />
                    <span className={styles.teamStatLbl}>Power</span>
                    <span className={[styles.teamStatVal, styles.teamStatValPower].join(' ')}>{teamStats.power.toLocaleString()}</span>
                  </span>
                  {teamStats.powerWithBonuses !== teamStats.power && (
                    <>
                      <span className={styles.teamStatSep} />
                      <span className={styles.teamStatItem}>
                        <span className={[styles.teamStatDot, styles.teamStatDotBonus].join(' ')} />
                        <span className={styles.teamStatLbl}>+Bonuses</span>
                        <span className={[styles.teamStatVal, styles.teamStatValBonus].join(' ')}>{teamStats.powerWithBonuses.toLocaleString()}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Synergies to the right */}
              {teamStats.synergies.length > 0 && (
                <div className={styles.teamSynergies}>
                  <span className={styles.teamSynHeader}>Synergies</span>
                  <div className={styles.teamSynList}>
                    {teamStats.synergies.map(syn => {
                      const pct = Math.round((syn.statMultiplier - 1) * 100);
                      const tier = syn.statMultiplier >= 1.2 ? 'gold' : syn.statMultiplier >= 1.1 ? 'alt' : '';
                      return (
                        <span
                          key={syn.qid}
                          className={[
                            styles.teamSynBadge,
                            tier === 'gold' ? styles.teamSynBadgeGold : tier === 'alt' ? styles.teamSynBadgeAlt : '',
                          ].filter(Boolean).join(' ')}
                          title={`${syn.sharedCount}/${syn.teamSize} cards · +${pct}% stats`}
                        >
                          {syn.label}
                          <span className={styles.teamSynCount}>+{pct}%</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          </div>{/* ghostTeamBody */}
        </div>

        {/* Background picker */}
        {isEditing && (
          <div className={styles.editBgPicker}>
            {BG_PRESETS.filter(p => unlockedBgIds.has(p.id)).map(p => (
              <button key={p.id} className={[styles.editBgSwatch, editBg === p.id ? styles.editBgSwatchActive : ''].filter(Boolean).join(' ')} style={{ background: p.gradient }} onClick={() => setEditBg(p.id)} title={p.label} aria-label={p.label} />
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className={styles.profileStats}>
          <div className={styles.profileStat}>
            <span className={styles.profileStatVal}>{getRank(me?.rating ?? 0)}</span>
            <span className={styles.profileStatLbl}>Rank</span>
          </div>
          <div className={styles.profileStatDivider} />
          <div className={styles.profileStat}>
            <span className={styles.profileStatVal}>0</span>
            <span className={styles.profileStatLbl}>Raid Lvl</span>
          </div>
          <div className={styles.profileStatDivider} />
          <div className={styles.profileStat}>
            <span className={styles.profileStatVal}>{(me?.coins ?? 0).toLocaleString()}</span>
            <span className={styles.profileStatLbl}>Coins</span>
          </div>
        </div>
      </section>

      {/* ── Search / Filter / Sort Controls ── */}
      {!isLoading && (collection?.data.length ?? 0) > 0 && (
        <div className={styles.controls}>
          {/* Row 1: search + traits dropdown + sort */}
          <div className={styles.searchRow}>
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Search by name, description, or trait…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search cards"
            />

            <div className={styles.traitDropdown}>
              <button
                ref={traitBtnRef}
                className={[styles.traitToggleBtn, selectedTraits.size > 0 ? styles.traitToggleBtnActive : ''].filter(Boolean).join(' ')}
                onClick={() => setTraitOpen(o => !o)}
                aria-expanded={traitOpen}
              >
                Traits{selectedTraits.size > 0 ? ` (${selectedTraits.size})` : ''}
                <span className={styles.traitToggleArrow}>{traitOpen ? '▲' : '▼'}</span>
              </button>
              {traitOpen && (
                <div className={styles.traitPopover} ref={traitPopoverRef}>
                  <input
                    className={styles.traitSearch}
                    type="search"
                    placeholder="Filter traits…"
                    value={traitSearch}
                    onChange={e => setTraitSearch(e.target.value)}
                    autoFocus
                  />
                  <div className={styles.traitList}>
                    {visibleTraits.length === 0 ? (
                      <span className={styles.traitEmpty}>No traits found</span>
                    ) : visibleTraits.map(trait => (
                      <label key={trait} className={[styles.traitItem, selectedTraits.has(trait) ? styles.traitItemActive : ''].filter(Boolean).join(' ')}>
                        <input
                          type="checkbox"
                          checked={selectedTraits.has(trait)}
                          onChange={() => toggleTrait(trait)}
                          className={styles.traitCheckbox}
                        />
                        {trait}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.sortControl}>
              <select
                className={styles.sortSelect}
                value={sortField}
                onChange={e => setSortField(e.target.value as SortField)}
                aria-label="Sort by"
              >
                <option value="total">Total Power</option>
                <option value="atk">ATK</option>
                <option value="hp">HP</option>
                <option value="spd">SPD</option>
                <option value="rarity">Rarity</option>
                <option value="name">Name</option>
                <option value="acquired">Date Acquired</option>
              </select>
              <button
                className={styles.sortDirBtn}
                onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                aria-label={sortDir === 'desc' ? 'Sort descending' : 'Sort ascending'}
                title={sortDir === 'desc' ? 'Descending' : 'Ascending'}
              >
                {sortDir === 'desc' ? '↓' : '↑'}
              </button>
            </div>
          </div>

          {/* Row 2: rarity chips + foil + reset */}
          <div className={styles.filterRow}>
            {ALL_RARITIES.map(r => (
              <button
                key={r}
                className={[
                  styles.rarityChip,
                  enabledRarities.has(r) && enabledRarities.size < ALL_RARITIES.length
                    ? (styles[`rarityChipActive-${r}`] ?? styles.rarityChipActiveDefault)
                    : '',
                ].filter(Boolean).join(' ')}
                onClick={() => toggleRarity(r)}
                aria-pressed={enabledRarities.size < ALL_RARITIES.length && enabledRarities.has(r)}
              >
                {r}
              </button>
            ))}

            <button
              className={[styles.foilToggle, foilOnly ? styles.foilActive : ''].filter(Boolean).join(' ')}
              onClick={() => setFoilOnly(o => !o)}
              aria-pressed={foilOnly}
            >
              ✦ Foil
            </button>

            {hasActiveFilters && (
              <button className={styles.resetBtn} onClick={resetFilters}>
                Reset
              </button>
            )}
          </div>

          {/* Active trait chips */}
          {selectedTraits.size > 0 && (
            <div className={styles.activeTraits}>
              {[...selectedTraits].map(trait => (
                <button
                  key={trait}
                  className={styles.traitChip}
                  onClick={() => toggleTrait(trait)}
                  title="Remove filter"
                >
                  {trait} ✕
                </button>
              ))}
            </div>
          )}

          <span className={styles.resultCount}>
            {filteredCollection.length === collection?.data.length
              ? `${filteredCollection.length} cards`
              : `${filteredCollection.length} of ${collection?.data.length} cards`}
          </span>
        </div>
      )}

      {/* ── Title picker modal ── */}
      {titlePickerOpen && (
        <div className={styles.pickerOverlay} onClick={() => setTitlePickerOpen(false)} role="dialog" aria-modal="true" aria-label="Choose a title">
          <div className={styles.pickerModal} onClick={e => e.stopPropagation()}>
            <div className={styles.pickerModalHeader}>
              <span className={styles.pickerModalTitle}>Titles</span>
              <button className={styles.pickerModalClose} onClick={() => setTitlePickerOpen(false)}>✕</button>
            </div>
            <p className={styles.pickerModalSub}>Earn titles through gameplay and achievements.</p>
            <div className={styles.pickerGrid}>
              {TITLES.map(t => {
                const unlocked = unlockedTitleIds.has(t.id);
                const selected = editTitle === t.id;
                const reward = getTitleReward(t.id);
                return (
                  <button
                    key={t.id}
                    className={[styles.pickerOption, selected ? styles.pickerOptionSelected : '', !unlocked ? styles.pickerOptionLocked : ''].filter(Boolean).join(' ')}
                    onClick={() => { if (unlocked) { setEditTitle(t.id); setTitlePickerOpen(false); } }}
                    disabled={!unlocked}
                    title={unlocked ? t.text : `🔒 ${t.earn}`}
                  >
                    {!unlocked && <span className={styles.pickerLock}>🔒</span>}
                    <span
                      className={[
                        styles.pickerOptionText,
                        reward?.animated === 'rainbow' ? styles.titleRainbow : '',
                        reward?.animated === 'shimmer' ? styles.titleShimmer : '',
                        reward?.animated === 'pulse'   ? styles.titlePulse   : '',
                        reward?.glow                   ? styles.titleGlow    : '',
                      ].filter(Boolean).join(' ')}
                      style={{
                        color: reward?.color ?? undefined,
                        ...(reward?.glow ? { '--title-glow': reward.glow } as React.CSSProperties : {}),
                      }}
                    >{t.text}</span>
                    <span className={styles.pickerOptionEarn}>{t.earn}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Subtitle picker modal ── */}
      {subtitlePickerOpen && (
        <div className={styles.pickerOverlay} onClick={() => setSubtitlePickerOpen(false)} role="dialog" aria-modal="true" aria-label="Choose a subtitle">
          <div className={styles.pickerModal} onClick={e => e.stopPropagation()}>
            <div className={styles.pickerModalHeader}>
              <span className={styles.pickerModalTitle}>Subtitles</span>
              <button className={styles.pickerModalClose} onClick={() => setSubtitlePickerOpen(false)}>✕</button>
            </div>
            <p className={styles.pickerModalSub}>Earn subtitles through gameplay and achievements.</p>
            <div className={styles.pickerGrid}>
              {SUBTITLES.map(t => {
                const unlocked = unlockedSubtitleIds.has(t.id);
                const selected = editSubtitle === t.id;
                const reward = getSubtitleReward(t.id);
                return (
                  <button
                    key={t.id}
                    className={[styles.pickerOption, selected ? styles.pickerOptionSelected : '', !unlocked ? styles.pickerOptionLocked : ''].filter(Boolean).join(' ')}
                    onClick={() => { if (unlocked) { setEditSubtitle(t.id); setSubtitlePickerOpen(false); } }}
                    disabled={!unlocked}
                    title={unlocked ? t.text : `🔒 ${t.earn}`}
                  >
                    {!unlocked && <span className={styles.pickerLock}>🔒</span>}
                    <span
                      className={styles.pickerOptionText}
                      style={{ color: reward?.color ?? undefined }}
                    >{t.text}</span>
                    <span className={styles.pickerOptionEarn}>{t.earn}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Collection grid ── */}
      {isLoading ? (
        <div className={styles.loadingGrid}>
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className={styles.cardSkeleton} />
          ))}
        </div>
      ) : (collection?.data.length ?? 0) === 0 ? (
        <div className={styles.empty}>
          <p>Your collection is empty.</p>
          <p>Open a pack to get your first cards!</p>
        </div>
      ) : filteredCollection.length === 0 ? (
        <div className={styles.empty}>
          <p>No cards match your filters.</p>
          <button className={styles.resetBtnInline} onClick={resetFilters}>Clear filters</button>
        </div>
      ) : (
        <div className={[styles.grid, isEditing ? styles.gridDragMode : ''].filter(Boolean).join(' ')}>
          {filteredCollection.map((uc) => {
            const beingDragged = dragCard?.id === uc.id;
            return (
              <div
                key={uc.id}
                className={[styles.gridCardWrap, isEditing ? styles.gridCardDraggable : ''].filter(Boolean).join(' ')}
                onPointerDown={isEditing ? e => startDrag(uc, e, null) : undefined}
              >
                <Card
                  userCard={uc}
                  tilt={!isEditing}
                  onClick={isEditing ? undefined : () => setSelectedCard(uc)}
                  style={beingDragged ? { opacity: 0.25, pointerEvents: 'none' } : undefined}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Floating drag ghost */}
      {dragCard && (
        <div
          ref={floatRef}
          className={[styles.dragFloat, snapSlot !== null ? styles.dragFloatSnapped : ''].filter(Boolean).join(' ')}
          aria-hidden="true"
        >
          {snapSlot !== null ? (
            <div className={styles.dragFloatMini}>
              {dragCard.card.wikiThumbUrl
                ? <img src={dragCard.card.wikiThumbUrl} alt={dragCard.card.wikiTitle} className={styles.dragFloatMiniImg} />
                : <div className={styles.dragFloatMiniFallback}>{dragCard.card.wikiTitle.slice(0, 2)}</div>}
              <span className={styles.dragFloatMiniRarity} style={{ color: `var(--rarity-${dragCard.card.rarity.toLowerCase()})` }}>
                {dragCard.card.rarity}
              </span>
            </div>
          ) : (
            <Card userCard={dragCard} tilt={false} />
          )}
        </div>
      )}

      <AchievementToast achievements={toastQueue} onDismiss={dismissToast} />
    </div>
  );
}
