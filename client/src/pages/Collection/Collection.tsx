import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useCollection } from '../../api/useCards.js';
import { useOpenPack, usePackState, useOpenPityPack } from '../../api/usePacks.js';
import { Card } from '../../components/Card/Card.js';
import { PackOpener } from '../../components/PackOpener/PackOpener.js';
import { usePackStore } from '../../stores/packStore.js';
import { useAuthStore } from '../../stores/authStore.js';
import { api } from '../../lib/api.js';
import type { UserCard, ApiResponse } from '@wikibattler/shared';
import type { QidNode } from '@wikibattler/shared';
import { PITY_SR_THRESHOLD, PITY_UR_THRESHOLD, QID_BLOCKLIST, MAX_STORED_PACKS, PACK_COOLDOWN_SECONDS } from '@wikibattler/shared';
import styles from './Collection.module.css';

const ALL_RARITIES = ['C', 'UC', 'R', 'SR', 'SSR', 'UR', 'MR'] as const;
const RARITY_IDX = Object.fromEntries(ALL_RARITIES.map((r, i) => [r, i]));

type SortField = 'total' | 'atk' | 'hp' | 'spd' | 'name' | 'rarity' | 'acquired';
type SortDir   = 'desc' | 'asc';

interface MeData { id: string; isGuest: boolean; username: string | null; coins: number; rating: number; }

const BG_PRESETS = [
  { id: 'default', label: 'Default', gradient: 'linear-gradient(135deg,#1e1535 0%,#0f0c1a 100%)' },
  { id: 'ocean',   label: 'Ocean',   gradient: 'linear-gradient(135deg,#0a1a2e 0%,#071520 100%)' },
  { id: 'ember',   label: 'Ember',   gradient: 'linear-gradient(135deg,#2a0f0c 0%,#1a0805 100%)' },
  { id: 'forest',  label: 'Forest',  gradient: 'linear-gradient(135deg,#0a2118 0%,#051a0a 100%)' },
  { id: 'cosmic',  label: 'Cosmic',  gradient: 'linear-gradient(135deg,#1a0a2e 0%,#0f0518 100%)' },
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
  { id: 'wanderer',      text: 'Wanderer',           earn: 'Default — always available' },
  { id: 'collector',     text: 'Card Collector',      earn: 'Collect 50 cards' },
  { id: 'hoarder',       text: 'Hoarder',             earn: 'Collect 200 cards' },
  { id: 'fortunate',     text: 'The Fortunate',       earn: 'Pull an MR card' },
  { id: 'champion',      text: 'Champion',            earn: 'Win 100 battles' },
  { id: 'unstoppable',   text: 'The Unstoppable',     earn: 'Win 20 battles in a row' },
  { id: 'raid-veteran',  text: 'Raid Veteran',        earn: 'Complete 10 raids' },
  { id: 'merchant',      text: 'Merchant',            earn: 'Complete 10 marketplace trades' },
  { id: 'scholar',       text: 'Scholar',             earn: 'Own cards from 10 different traits' },
  { id: 'completionist', text: 'Completionist',       earn: 'Own a card of every rarity' },
  { id: 'veteran',       text: 'Veteran',             earn: 'Play for 30 days' },
  { id: 'legend',        text: 'Legend',              earn: 'Reach Diamond rank' },
];

const SUBTITLES: TitleDef[] = [
  { id: 'starting-out',  text: 'Just starting out',       earn: 'Default — always available' },
  { id: 'building',      text: 'Building my collection',  earn: 'Collect 20 cards' },
  { id: 'wiki-warrior',  text: 'Wiki warrior',            earn: 'Win 10 battles' },
  { id: 'ghost',         text: 'Ghost of battles past',   earn: 'Complete 5 ghost battles' },
  { id: 'searching',     text: 'Searching for knowledge', earn: 'Open 20 packs' },
  { id: 'encyclopedic',  text: 'The encyclopedic',        earn: 'Collect 100 cards' },
  { id: 'rarities',      text: 'Master of rarities',      earn: 'Own a UR or MR card' },
  { id: 'feared',        text: 'Feared by all',           earn: 'Reach Gold rank' },
  { id: 'trader',        text: 'Trading legends',         earn: 'Complete 5 marketplace trades' },
  { id: 'raid-slayer',   text: 'Raid boss slayer',        earn: 'Complete a raid' },
];

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
  const [editTitle, setEditTitle]             = useState('wanderer');
  const [editSubtitle, setEditSubtitle]       = useState('starting-out');
  const [titlePickerOpen, setTitlePickerOpen]       = useState(false);
  const [subtitlePickerOpen, setSubtitlePickerOpen] = useState(false);
  const [editBg, setEditBg]                   = useState('default');
  const [editTeamIds, setEditTeamIds]         = useState<(string | null)[]>([null,null,null,null,null]);
  const [dragCard, setDragCard]               = useState<UserCard | null>(null);
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

      // Tilt from velocity
      const tiltY = Math.max(-22, Math.min(22, dx * 2.5));
      const tiltX = Math.max(-16, Math.min(16, -dy * 1.8));

      float.style.left = `${e.clientX}px`;
      float.style.top  = `${e.clientY}px`;
      float.style.setProperty('--tilt-x', `${tiltX}deg`);
      float.style.setProperty('--tilt-y', `${tiltY}deg`);

      // Imperatively glow/unglow slots (avoids re-render on every frame)
      const ids = editTeamIdsRef.current;
      const clsDrop    = styles.ghostSlotDropTarget!;
      const clsHovered = styles.ghostSlotHovered!;
      slotRefs.current.forEach((ref, i) => {
        if (!ref) return;
        if (ids[i]) {
          ref.classList.remove(clsDrop, clsHovered);
          return;
        }
        ref.classList.add(clsDrop);
        const r = ref.getBoundingClientRect();
        const over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        ref.classList.toggle(clsHovered, over);
      });
    }

    function onUp(e: PointerEvent) {
      // Clean up slot classes
      const clsDrop    = styles.ghostSlotDropTarget!;
      const clsHovered = styles.ghostSlotHovered!;
      slotRefs.current.forEach(ref => ref?.classList.remove(clsDrop, clsHovered));

      const uc = dragCardRef.current;
      if (!uc) return;

      const ids = editTeamIdsRef.current;
      let droppedSlot: number | null = null;
      slotRefs.current.forEach((ref, i) => {
        if (!ref || ids[i]) return;
        const r = ref.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) droppedSlot = i;
      });

      if (droppedSlot !== null) {
        const next = [...ids]; next[droppedSlot] = uc.id; setEditTeamIds(next);
      } else if (sourceSlotRef.current !== null) {
        // Dropped outside valid target — restore to original slot
        const next = [...ids]; next[sourceSlotRef.current] = uc.id; setEditTeamIds(next);
      }

      dragCardRef.current  = null;
      sourceSlotRef.current = null;
      setDragCard(null);
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

  const unlockedTitleIds = useMemo(() => {
    const cards = (collection?.data ?? []) as UserCard[];
    const count = cards.length;
    const hasMR = cards.some(uc => uc.card.rarity === 'MR');
    const traitCount = new Set(cards.flatMap(uc => (uc.card.qidChain ?? []).filter(n => !QID_BLOCKLIST.has(n.qid)).map(n => n.label))).size;
    const allRarities = ['C','UC','R','SR','SSR','UR','MR'].every(r => cards.some(uc => uc.card.rarity === r));
    const unlocked = new Set<string>(['wanderer']);
    if (count >= 50)   unlocked.add('collector');
    if (count >= 200)  unlocked.add('hoarder');
    if (hasMR)         unlocked.add('fortunate');
    if (traitCount >= 10) unlocked.add('scholar');
    if (allRarities)   unlocked.add('completionist');
    return unlocked;
  }, [collection?.data]);

  const unlockedSubtitleIds = useMemo(() => {
    const cards = (collection?.data ?? []) as UserCard[];
    const count = cards.length;
    const hasUR = cards.some(uc => uc.card.rarity === 'UR' || uc.card.rarity === 'MR');
    const unlocked = new Set<string>(['starting-out']);
    if (count >= 20)  unlocked.add('building');
    if (count >= 100) unlocked.add('encyclopedic');
    if (hasUR)        unlocked.add('rarities');
    return unlocked;
  }, [collection?.data]);

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

  function startEditing() {
    setEditDisplayName(displayName === 'Player' ? '' : displayName);
    setEditTitle(profileTitle);
    setEditSubtitle(profileSubtitle);
    setEditBg(profileBg);
    setEditTeamIds([...ghostTeamIds]);
    setIsEditing(true);
  }

  function saveProfile() {
    const name = editDisplayName.trim();
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
      {selectedCard && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedCard(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.modalClose}
              onClick={() => setSelectedCard(null)}
              aria-label="Close"
            >✕</button>

            <h2 className={styles.modalCardName}>{selectedCard.card.wikiTitle}</h2>

            <div className={styles.modalMain}>
              <div className={styles.modalActions}>
                <a
                  className={styles.modalActionBtn}
                  href={`https://en.wikipedia.org/wiki/${selectedCard.card.wikiSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View on Wikipedia"
                >
                  <span className={styles.modalActionIcon}>🌐</span>
                  <span>Wiki</span>
                </a>
                <button
                  className={styles.modalActionBtn}
                  onClick={() => handleShare(selectedCard.card)}
                  title="Share card"
                >
                  <span className={styles.modalActionIcon}>
                    {copiedShare ? '✓' : '↗'}
                  </span>
                  <span>{copiedShare ? 'Copied!' : 'Share'}</span>
                </button>
              </div>

              <div className={styles.modalCardWrap}>
                <Card userCard={selectedCard} tilt />
              </div>

              <div className={styles.modalExtract}>
                <div className={styles.modalExtractScroll}>
                  <p className={styles.modalExtractText}>
                    {selectedCard.card.wikiExtract || 'No description available.'}
                  </p>
                </div>
                <div className={styles.modalExtractFade} aria-hidden="true" />
              </div>
            </div>

            {(() => {
              const tags = modalQidTags(selectedCard.card.qidChain ?? []);
              return tags.length > 0 ? (
                <div className={styles.modalTags}>
                  {tags.map(n => (
                    <span key={n.qid} className={styles.modalTag} title={`${n.qid} · depth ${n.depth}`}>
                      {n.label}
                    </span>
                  ))}
                </div>
              ) : null;
            })()}
          </div>
        </div>
      )}

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
        style={{ '--profile-bg': isEditing ? previewBg : currentBg } as React.CSSProperties}
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
                <input className={styles.editNameInput} value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} placeholder="Display name" maxLength={32} />
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
                  <span className={styles.profileTitle}>{TITLES.find(t => t.id === profileTitle)?.text ?? 'Wanderer'}</span>
                  {profileSubtitle && <span className={styles.profileSubtitle}>· {SUBTITLES.find(t => t.id === profileSubtitle)?.text ?? ''}</span>}
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
          <div className={styles.ghostTeamSlots}>
            {(isEditing ? editTeamCards : ghostTeamCards).map((uc, i) => (
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
        </div>

        {/* Background picker */}
        {isEditing && (
          <div className={styles.editBgPicker}>
            {BG_PRESETS.map(p => (
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
                return (
                  <button
                    key={t.id}
                    className={[styles.pickerOption, selected ? styles.pickerOptionSelected : '', !unlocked ? styles.pickerOptionLocked : ''].filter(Boolean).join(' ')}
                    onClick={() => { if (unlocked) { setEditTitle(t.id); setTitlePickerOpen(false); } }}
                    disabled={!unlocked}
                    title={unlocked ? t.text : `🔒 ${t.earn}`}
                  >
                    {!unlocked && <span className={styles.pickerLock}>🔒</span>}
                    <span className={styles.pickerOptionText}>{t.text}</span>
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
                return (
                  <button
                    key={t.id}
                    className={[styles.pickerOption, selected ? styles.pickerOptionSelected : '', !unlocked ? styles.pickerOptionLocked : ''].filter(Boolean).join(' ')}
                    onClick={() => { if (unlocked) { setEditSubtitle(t.id); setSubtitlePickerOpen(false); } }}
                    disabled={!unlocked}
                    title={unlocked ? t.text : `🔒 ${t.earn}`}
                  >
                    {!unlocked && <span className={styles.pickerLock}>🔒</span>}
                    <span className={styles.pickerOptionText}>{t.text}</span>
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
        <div ref={floatRef} className={styles.dragFloat} aria-hidden="true">
          <Card userCard={dragCard} tilt={false} />
        </div>
      )}
    </div>
  );
}
