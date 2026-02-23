import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { geoArea, geoEqualEarth, geoPath } from 'd3-geo';
import officialAreaByIso3 from '../data/officialAreaByIso3';
import { MatomoEvents } from '../utils/matomo';
import type { CompareEntry, CompareMode, CountryFeature, GeoCollection, SelectedEntry } from './compare/types';
import { ENTITY_COLORS, MAX_SELECTED_ENTITIES } from './compare/types';
import { EARTH_RADIUS_KM, buildContinentEntries, buildSubregionEntries, buildAdmin1Entries, unionBounds } from './compare/geoUtils';
import { CompareSearchInput } from './compare/CompareSearchInput';
import './CountrySizeCompare.css';

const VIEWBOX_WIDTH = 900;
const VIEWBOX_HEIGHT = 600;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 40;
const ZOOM_STEP = 0.1;
const RANKING_LIMIT = 20;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const NAME_KEY_BY_LANGUAGE: Record<string, string> = {
    en: 'NAME_EN',
    ko: 'NAME_KO',
    es: 'NAME_ES',
    pt: 'NAME_PT',
};

const getLocalizedName = (properties: CountryFeature['properties'], language: string, fallbackLabel: string) => {
    const baseLanguage = language.split('-')[0];
    const languageKey = NAME_KEY_BY_LANGUAGE[baseLanguage] ?? 'NAME_EN';
    const localized = properties[languageKey];
    if (typeof localized === 'string' && localized.trim().length > 0) return localized;
    const fallback = properties.NAME_EN ?? properties.NAME ?? properties.ADMIN ?? properties.NAME_LONG;
    return typeof fallback === 'string' ? fallback : fallbackLabel;
};

const formatArea = (value: number, locale: string) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);

/* ─── Overlay entity shape produced by the geometry memo ─── */
type EntityGeo = {
    id: string;
    paths: string[];
    bounds: [[number, number], [number, number]];
    center: [number, number];
    colorIndex: number;
};

export const CountrySizeCompare = () => {
    const { t, i18n } = useTranslation();

    /* ─── Data loading state ─── */
    const [features, setFeatures] = useState<CountryFeature[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [admin1Features, setAdmin1Features] = useState<CountryFeature[] | null>(null);
    const [admin1Loading, setAdmin1Loading] = useState(false);
    const [admin1Requested, setAdmin1Requested] = useState(false);

    /* ─── Selection & interaction state ─── */
    const [selectedEntries, setSelectedEntries] = useState<SelectedEntry[]>([]);
    const [entityOffsets, setEntityOffsets] = useState<Map<string, { x: number; y: number }>>(new Map());
    const [dragTarget, setDragTarget] = useState<string>('__pan__'); // '__pan__' or entity id
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [resolution, setResolution] = useState<'110m' | '10m'>('110m');
    const [showAllRanks, setShowAllRanks] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    /* ─── Refs ─── */
    const dragStateRef = useRef<{
        startX: number;
        startY: number;
        originPanX: number;
        originPanY: number;
        entityId: string | null;
        originEntityOffset: { x: number; y: number };
        scaleX: number;
        scaleY: number;
    } | null>(null);
    const pointerCacheRef = useRef(new Map<number, { x: number; y: number }>());
    const pinchStateRef = useRef<{
        distance: number;
        zoom: number;
        panX: number;
        panY: number;
        midX: number;
        midY: number;
        scaleX: number;
        scaleY: number;
    } | null>(null);
    const initializedRef = useRef(false);

    /* ══════════════════════════════════════════════════════════
       DATA LOADING
    ══════════════════════════════════════════════════════════ */

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);
                setError(false);
                const response = await fetch(`/data/countries-${resolution}.geojson`);
                if (!response.ok) throw new Error('failed to fetch');
                const data = (await response.json()) as GeoCollection;
                if (mounted) setFeatures(data.features || []);
            } catch (err) {
                console.error(err);
                if (mounted) setError(true);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [resolution]);

    // Lazy-load admin-1 when requested by search
    useEffect(() => {
        if (!admin1Requested) return;
        if (admin1Features !== null) return;
        let mounted = true;
        setAdmin1Loading(true);
        fetch('/data/admin1-110m.geojson')
            .then((res) => res.json())
            .then((data: GeoCollection) => {
                if (mounted) setAdmin1Features(data.features || []);
            })
            .catch((err) => {
                console.error('Failed to load admin-1 data:', err);
                if (mounted) setAdmin1Features([]);
            })
            .finally(() => {
                if (mounted) setAdmin1Loading(false);
            });
        return () => { mounted = false; };
    }, [admin1Requested, admin1Features]);

    const handleRequestAdmin1 = useCallback(() => {
        setAdmin1Requested(true);
    }, []);

    /* ══════════════════════════════════════════════════════════
       ENTRY BUILDING
    ══════════════════════════════════════════════════════════ */

    const countries: CompareEntry[] = useMemo(() => {
        const unknownLabel = t('Unknown');
        return features
            .map((feature) => {
                const areaSteradians = geoArea(feature);
                const areaKm2 = areaSteradians * EARTH_RADIUS_KM * EARTH_RADIUS_KM;
                const name = (feature.properties.NAME_EN as string) || (feature.properties.ADMIN as string) || unknownLabel;
                const iso3 = String(feature.properties.ADM0_A3 || feature.properties.ISO_A3 || '');
                const officialAreaKm2 = iso3 ? (officialAreaByIso3 as Record<string, number | undefined>)[iso3] ?? null : null;
                return {
                    id: iso3 || name,
                    iso3,
                    label: getLocalizedName(feature.properties, i18n.language, unknownLabel),
                    name,
                    areaKm2,
                    officialAreaKm2,
                    features: [feature],
                    mode: 'country' as const,
                };
            })
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [features, i18n.language, t]);

    const continentEntries = useMemo(() => {
        if (!features.length) return [];
        return buildContinentEntries(features, (name) => t(name));
    }, [features, t]);

    const subregionEntries = useMemo(() => {
        if (!features.length) return [];
        return buildSubregionEntries(features, (name) => t(name));
    }, [features, t]);

    const countryLabelMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const c of countries) {
            if (c.iso3) map.set(c.iso3, c.label);
        }
        return map;
    }, [countries]);

    const admin1Entries = useMemo(() => {
        if (!admin1Features || !admin1Features.length) return [];
        return buildAdmin1Entries(admin1Features, countryLabelMap);
    }, [admin1Features, countryLabelMap]);

    /* ══════════════════════════════════════════════════════════
       SELECTION HANDLERS
    ══════════════════════════════════════════════════════════ */

    const handleAddEntry = useCallback((entry: CompareEntry) => {
        setSelectedEntries(prev => {
            if (prev.length >= MAX_SELECTED_ENTITIES) return prev;
            if (prev.some(e => e.id === entry.id)) return prev;
            const usedColors = new Set(prev.map(e => e.colorIndex));
            let colorIndex = 0;
            for (let i = 0; i < ENTITY_COLORS.length; i++) {
                if (!usedColors.has(i)) { colorIndex = i; break; }
            }
            return [...prev, { ...entry, colorIndex }];
        });
    }, []);

    const handleRemoveEntry = useCallback((id: string) => {
        setSelectedEntries(prev => prev.filter(e => e.id !== id));
        setEntityOffsets(prev => {
            const next = new Map(prev);
            next.delete(id);
            return next;
        });
        setDragTarget(prev => prev === id ? '__pan__' : prev);
    }, []);

    // Initialize with South Korea + USA
    useEffect(() => {
        if (initializedRef.current || !countries.length) return;
        initializedRef.current = true;
        const korea = countries.find(c => c.name === 'South Korea');
        const usa = countries.find(c => c.name === 'United States of America');
        const initial: SelectedEntry[] = [];
        if (korea) initial.push({ ...korea, colorIndex: 0 });
        if (usa) initial.push({ ...usa, colorIndex: 1 });
        if (initial.length) setSelectedEntries(initial);
    }, [countries]);

    /* ══════════════════════════════════════════════════════════
       ZOOM, PAN, RESET
    ══════════════════════════════════════════════════════════ */

    const autoZoom = useMemo(() => {
        if (selectedEntries.length < 2) return 1;
        const areas = selectedEntries.map(e => e.officialAreaKm2 ?? e.areaKm2);
        const biggestArea = Math.max(...areas);
        const smallestArea = Math.max(1, Math.min(...areas));
        const areaRatio = biggestArea / smallestArea;
        const sizeRatio = Math.sqrt(areaRatio);
        const boost = Math.log10(sizeRatio) * 1.2 + (sizeRatio > 5 ? Math.log2(sizeRatio) * 0.3 : 0);
        return clamp(1 + boost, 0.9, 6);
    }, [selectedEntries]);

    useEffect(() => {
        if (selectedEntries.length === 0) return;
        setZoom(autoZoom);
    }, [autoZoom, selectedEntries.length]);

    // Reset when selection or resolution changes
    const selectionKey = selectedEntries.map(e => e.id).sort().join(',');
    useEffect(() => {
        setPan({ x: 0, y: 0 });
        setEntityOffsets(new Map());
        dragStateRef.current = null;
        pointerCacheRef.current.clear();
        pinchStateRef.current = null;
        setIsDragging(false);
    }, [selectionKey, resolution]);

    useEffect(() => {
        if (!isFullscreen) return;
        document.body.classList.add('cc-fullscreen-lock');

        // Only request browser fullscreen + orientation lock on mobile/touch devices
        const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isMobile) {
            const el = document.documentElement;
            const requestFS = el.requestFullscreen
                ?? (el as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen;
            if (requestFS) {
                requestFS.call(el).then(() => {
                    const orientation = window.screen?.orientation as ScreenOrientation & { lock?: (type: string) => Promise<void> };
                    orientation?.lock?.('landscape').catch(() => {});
                }).catch(() => {});
            }
        }

        return () => {
            document.body.classList.remove('cc-fullscreen-lock');
            if (document.fullscreenElement) {
                const exitFS = document.exitFullscreen
                    ?? (document as Document & { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen;
                exitFS?.call(document).catch(() => {});
            }
        };
    }, [isFullscreen]);

    // Sync: if user exits browser fullscreen via Escape, also exit our fullscreen state
    useEffect(() => {
        const handler = () => {
            if (!document.fullscreenElement && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        document.addEventListener('fullscreenchange', handler);
        document.addEventListener('webkitfullscreenchange', handler);
        return () => {
            document.removeEventListener('fullscreenchange', handler);
            document.removeEventListener('webkitfullscreenchange', handler);
        };
    }, [isFullscreen]);

    const handleZoomChange = (value: number) => {
        const nextZoom = clamp(value, MIN_ZOOM, MAX_ZOOM);
        if (nextZoom === zoom) return;
        const ratio = zoom ? nextZoom / zoom : 1;
        setPan((prev) => ({
            x: prev.x * ratio,
            y: prev.y * ratio,
        }));
        setZoom(nextZoom);
    };

    /* ══════════════════════════════════════════════════════════
       OVERLAY GEOMETRY (split: paths stable, transforms cheap)
    ══════════════════════════════════════════════════════════ */

    const entityGeo: EntityGeo[] = useMemo(() => {
        if (selectedEntries.length === 0) return [];
        const projection = geoEqualEarth().scale(1).translate([0, 0]);
        const pathGenerator = geoPath(projection);

        return selectedEntries.map(entry => {
            const paths = entry.features.map(f => pathGenerator(f)).filter(Boolean) as string[];
            const bounds = entry.features.length === 1
                ? pathGenerator.bounds(entry.features[0])
                : unionBounds(entry.features);
            const center: [number, number] = [
                (bounds[0][0] + bounds[1][0]) / 2,
                (bounds[0][1] + bounds[1][1]) / 2,
            ];
            return { id: entry.id, paths, bounds, center, colorIndex: entry.colorIndex };
        });
    }, [selectedEntries]);

    const overlay = useMemo(() => {
        if (entityGeo.length === 0) return null;

        let maxWidth = 0, maxHeight = 0;
        for (const e of entityGeo) {
            const w = e.bounds[1][0] - e.bounds[0][0];
            const h = e.bounds[1][1] - e.bounds[0][1];
            if (w > maxWidth) maxWidth = w;
            if (h > maxHeight) maxHeight = h;
        }
        const scale = Math.min(
            (VIEWBOX_WIDTH * 0.82) / Math.max(maxWidth, 1),
            (VIEWBOX_HEIGHT * 0.82) / Math.max(maxHeight, 1),
        );
        const scaled = scale * zoom;
        const baseTranslate = `translate(${VIEWBOX_WIDTH / 2 + pan.x}, ${VIEWBOX_HEIGHT / 2 + pan.y}) scale(${scaled})`;

        const entities = entityGeo.map(e => {
            const offset = entityOffsets.get(e.id) || { x: 0, y: 0 };
            return {
                ...e,
                transform: `${baseTranslate} translate(${offset.x - e.center[0]}, ${offset.y - e.center[1]})`,
            };
        });

        return { entities, scaled };
    }, [entityGeo, zoom, pan, entityOffsets]);

    /* ══════════════════════════════════════════════════════════
       AREA BLOCKS
    ══════════════════════════════════════════════════════════ */

    const areaBlocks = useMemo(() => {
        if (selectedEntries.length === 0) return null;
        const entries = selectedEntries.map(e => ({
            id: e.id,
            label: e.label,
            colorIndex: e.colorIndex,
            area: e.officialAreaKm2 ?? e.areaKm2,
        }));
        const sizes = entries.map(e => Math.sqrt(e.area));
        const maxSize = Math.max(...sizes);
        const svgWidth = 900;
        const svgHeight = 350;
        const gap = Math.max(8, Math.round(60 / entries.length));
        const totalSizeWidth = sizes.reduce((s, sz) => s + sz, 0);
        const totalGaps = Math.max(0, entries.length - 1) * gap;
        const scale = Math.min(
            (svgWidth - totalGaps - 40) / Math.max(totalSizeWidth, 1),
            (svgHeight - 40) / Math.max(maxSize, 1),
        );

        let currentX = (svgWidth - (totalSizeWidth * scale + totalGaps)) / 2;
        const rects = entries.map((e, i) => {
            const w = sizes[i] * scale;
            const h = sizes[i] * scale;
            const rect = { x: currentX, y: (svgHeight - 30 - h) / 2, width: w, height: h };
            currentX += w + gap;
            return { ...e, rect };
        });

        return { svgWidth, svgHeight, rects };
    }, [selectedEntries]);

    /* ══════════════════════════════════════════════════════════
       RANKING
    ══════════════════════════════════════════════════════════ */

    const activeModesSet = useMemo(() => {
        const modes = new Set<CompareMode>();
        for (const e of selectedEntries) modes.add(e.mode);
        return modes;
    }, [selectedEntries]);

    const rankedEntries = useMemo(() => {
        const all: CompareEntry[] = [];
        const modes = activeModesSet.size > 0 ? activeModesSet : new Set(['country']);
        if (modes.has('country')) all.push(...countries);
        if (modes.has('continent')) all.push(...continentEntries);
        if (modes.has('subregion')) all.push(...subregionEntries);
        if (modes.has('admin1')) all.push(...admin1Entries);
        return all
            .map(e => ({ ...e, rankingAreaKm2: e.officialAreaKm2 ?? e.areaKm2 }))
            .sort((a, b) => b.rankingAreaKm2 - a.rankingAreaKm2);
    }, [activeModesSet, countries, continentEntries, subregionEntries, admin1Entries]);

    const rankById = useMemo(() => {
        const map = new Map<string, number>();
        rankedEntries.forEach((entry, index) => map.set(entry.id, index + 1));
        return map;
    }, [rankedEntries]);

    const selectedColorMap = useMemo(() => {
        const map = new Map<string, number>();
        for (const e of selectedEntries) map.set(e.id, e.colorIndex);
        return map;
    }, [selectedEntries]);

    const pinnedEntries = useMemo(() => {
        if (showAllRanks || selectedEntries.length === 0) return [];
        const topIds = new Set(rankedEntries.slice(0, RANKING_LIMIT).map(c => c.id));
        return rankedEntries.filter(c => selectedColorMap.has(c.id) && !topIds.has(c.id));
    }, [showAllRanks, rankedEntries, selectedColorMap]);

    const rankingList = showAllRanks ? rankedEntries : rankedEntries.slice(0, RANKING_LIMIT);

    /* ══════════════════════════════════════════════════════════
       DRAG & POINTER HANDLERS
    ══════════════════════════════════════════════════════════ */

    const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        pointerCacheRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

        if (pointerCacheRef.current.size === 1) {
            // Determine drag entity: explicit target > SVG hit-test > pan
            let resolvedEntityId: string | null = null;
            if (dragTarget !== '__pan__') {
                // Explicit entity selected in toolbar
                resolvedEntityId = dragTarget;
            } else {
                // Auto-detect via SVG hit-test
                const entityGroup = (event.target as Element).closest('[data-entity-id]');
                resolvedEntityId = entityGroup?.getAttribute('data-entity-id') || null;
            }
            const hitOffset = resolvedEntityId ? (entityOffsets.get(resolvedEntityId) || { x: 0, y: 0 }) : { x: 0, y: 0 };

            dragStateRef.current = {
                startX: event.clientX,
                startY: event.clientY,
                originPanX: pan.x,
                originPanY: pan.y,
                entityId: resolvedEntityId,
                originEntityOffset: { ...hitOffset },
                scaleX: rect.width ? VIEWBOX_WIDTH / rect.width : 1,
                scaleY: rect.height ? VIEWBOX_HEIGHT / rect.height : 1,
            };
        } else if (pointerCacheRef.current.size === 2) {
            const points = Array.from(pointerCacheRef.current.values());
            const dx = points[0].x - points[1].x;
            const dy = points[0].y - points[1].y;
            const distance = Math.hypot(dx, dy);
            const midX = (points[0].x + points[1].x) / 2;
            const midY = (points[0].y + points[1].y) / 2;
            pinchStateRef.current = {
                distance,
                zoom,
                panX: pan.x,
                panY: pan.y,
                midX,
                midY,
                scaleX: rect.width ? VIEWBOX_WIDTH / rect.width : 1,
                scaleY: rect.height ? VIEWBOX_HEIGHT / rect.height : 1,
            };
            dragStateRef.current = null;
        }
        setIsDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
        if (!overlay) return;
        if (pointerCacheRef.current.has(event.pointerId)) {
            pointerCacheRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        }

        // Pinch zoom
        if (pointerCacheRef.current.size === 2 && pinchStateRef.current) {
            const points = Array.from(pointerCacheRef.current.values());
            const dx = points[0].x - points[1].x;
            const dy = points[0].y - points[1].y;
            const distance = Math.hypot(dx, dy);
            const midX = (points[0].x + points[1].x) / 2;
            const midY = (points[0].y + points[1].y) / 2;
            const ratio = pinchStateRef.current.distance ? distance / pinchStateRef.current.distance : 1;
            const nextZoom = clamp(pinchStateRef.current.zoom * ratio, MIN_ZOOM, MAX_ZOOM);
            setZoom(nextZoom);
            const scaleX = pinchStateRef.current.scaleX || 1;
            const scaleY = pinchStateRef.current.scaleY || 1;
            const dxMid = (midX - pinchStateRef.current.midX) * scaleX;
            const dyMid = (midY - pinchStateRef.current.midY) * scaleY;
            setPan({ x: pinchStateRef.current.panX + dxMid, y: pinchStateRef.current.panY + dyMid });
            return;
        }

        // Single-pointer drag
        if (!dragStateRef.current) return;
        const { startX, startY, originPanX, originPanY, entityId, originEntityOffset, scaleX, scaleY } = dragStateRef.current;
        const dx = (event.clientX - startX) * scaleX;
        const dy = (event.clientY - startY) * scaleY;

        if (entityId) {
            const scaled = overlay.scaled || 1;
            const dxProjected = dx / scaled;
            const dyProjected = dy / scaled;
            setEntityOffsets(prev => {
                const next = new Map(prev);
                next.set(entityId, {
                    x: originEntityOffset.x + dxProjected,
                    y: originEntityOffset.y + dyProjected,
                });
                return next;
            });
        } else {
            setPan({ x: originPanX + dx, y: originPanY + dy });
        }
    };

    const handlePointerEnd = (event: ReactPointerEvent<SVGSVGElement>) => {
        pointerCacheRef.current.delete(event.pointerId);
        if (pointerCacheRef.current.size < 2) {
            pinchStateRef.current = null;
        }
        if (pointerCacheRef.current.size === 0) {
            dragStateRef.current = null;
            setIsDragging(false);
        }
        event.currentTarget.releasePointerCapture(event.pointerId);
    };

    /* ─── Wheel zoom ─── */
    const handleWheel = useCallback((event: React.WheelEvent<SVGSVGElement>) => {
        event.preventDefault();
        const delta = -event.deltaY * 0.002;
        setZoom(prev => {
            const next = clamp(prev * (1 + delta), MIN_ZOOM, MAX_ZOOM);
            const ratio = prev ? next / prev : 1;
            setPan(p => ({ x: p.x * ratio, y: p.y * ratio }));
            return next;
        });
    }, []);

    /* ══════════════════════════════════════════════════════════
       SHARED SVG RENDERER
    ══════════════════════════════════════════════════════════ */

    const renderOverlaySvg = (svgClass: string) => (
        <svg
            className={svgClass}
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
            role="img"
            aria-label={t('Size comparison of {{count}} regions', { count: selectedEntries.length })}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onWheel={handleWheel}
        >
            {overlay && overlay.entities.map(entity => {
                const color = ENTITY_COLORS[entity.colorIndex];
                return (
                    <g key={entity.id} transform={entity.transform} data-entity-id={entity.id}>
                        {entity.paths.map((d, i) => (
                            <path
                                key={i}
                                d={d}
                                fill={color.fill}
                                stroke={color.stroke}
                                strokeWidth={1.8}
                                className="map-path-entity"
                            />
                        ))}
                    </g>
                );
            })}
        </svg>
    );

    /* ══════════════════════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════════════════════ */

    const hasSelection = selectedEntries.length > 0;

    return (
        <>
            <Helmet>
                <title>{t('True Size Atlas - Compare Country Sizes')} | Awesome Rank</title>
                <meta name="description" content={t('Compare the real sizes of countries on an equal-area map. See how big countries really are when placed at the same latitude.')} />
                <meta property="og:title" content={`${t('True Size Atlas')} | Awesome Rank`} />
                <meta property="og:description" content={t('Compare the real sizes of countries on an equal-area map.')} />
            </Helmet>
            <motion.section
                className="country-compare"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
            >
            {/* ─── HERO ─── */}
            <div className="country-compare-hero">
                <motion.div
                    className="country-compare-title"
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <p className="country-compare-kicker">{t('True Size Atlas')}</p>
                    <h1>{t('Compare sizes at real scale')}</h1>
                    <p className="country-compare-subtitle">
                        {t('Search and add countries, continents, subregions, or states to compare their actual sizes on the map.')}
                    </p>
                </motion.div>
            </div>

            {/* ─── SEARCH ─── */}
            <CompareSearchInput
                countries={countries}
                continents={continentEntries}
                subregions={subregionEntries}
                admin1={admin1Entries}
                admin1Loading={admin1Loading}
                selectedEntries={selectedEntries}
                onAdd={handleAddEntry}
                onRemove={handleRemoveEntry}
                onRequestAdmin1={handleRequestAdmin1}
            />

            {/* ─── OPTIONS ─── */}
            <button
                className="mobile-options-toggle"
                onClick={() => setShowOptions((v) => !v)}
                aria-expanded={showOptions}
            >
                {showOptions ? t('Hide options') : t('Options')}
            </button>
            <div className={`country-compare-options${showOptions ? ' show' : ''}`}>
                <div className="country-compare-select">
                    <label htmlFor="map-resolution">{t('Map detail')}</label>
                    <select
                        id="map-resolution"
                        value={resolution}
                        onChange={(event) => setResolution(event.target.value as '110m' | '10m')}
                    >
                        <option value="110m">{t('Fast (110m)')}</option>
                        <option value="10m">{t('High detail (10m)')}</option>
                    </select>
                </div>
                <p className="country-compare-note">
                    {t('Areas use CIA World Factbook totals.')}
                </p>
            </div>

            {/* ─── LOADING / ERROR ─── */}
            {loading && (
                <div className="country-compare-message">{t('Loading countries...')}</div>
            )}
            {!loading && error && (
                <div className="country-compare-message error">{t('Unable to load country shapes.')}</div>
            )}

            {/* ─── MAIN CONTENT (when loaded & selected) ─── */}
            {!loading && !error && hasSelection && (
                <>
                    {/* ─── STATS STRIP ─── */}
                    <div className="compare-stats-strip">
                        {selectedEntries.map(entry => {
                            const area = entry.officialAreaKm2 ?? entry.areaKm2;
                            const rank = rankById.get(entry.id);
                            const color = ENTITY_COLORS[entry.colorIndex];
                            return (
                                <div
                                    key={entry.id}
                                    className="compare-stat-card"
                                    style={{ borderLeftColor: color.stroke }}
                                >
                                    <span className="stat-label">{t('Area')}</span>
                                    <h3>{entry.label}</h3>
                                    <p className="stat-value mono">
                                        {formatArea(area, i18n.language)} {t('km²')}
                                    </p>
                                    {rank && (
                                        <p className="stat-rank">
                                            {t('Rank #{{rank}}', { rank })}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* ─── FULLSCREEN OVERLAY ─── */}
                    {isFullscreen && (
                        <motion.div
                            className="compare-fullscreen"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                        >
                            <div className={`fullscreen-map-stage${isDragging ? ' dragging' : ''}`}>
                                {renderOverlaySvg('fullscreen-svg')}
                            </div>
                            <div className="fullscreen-overlay-top">
                                <div className="fullscreen-legend" role="group" aria-label={t('Drag mode')}>
                                    <button
                                        type="button"
                                        className={`legend-item legend-pan${dragTarget === '__pan__' ? ' active' : ''}`}
                                        onClick={() => setDragTarget('__pan__')}
                                        title={t('Pan view')}
                                    >
                                        ✋
                                    </button>
                                    {selectedEntries.map(entry => {
                                        const color = ENTITY_COLORS[entry.colorIndex];
                                        const isActive = dragTarget === entry.id;
                                        return (
                                            <button
                                                key={entry.id}
                                                type="button"
                                                className={`legend-item${isActive ? ' active' : ''}`}
                                                style={{ color: color.stroke }}
                                                onClick={() => setDragTarget(isActive ? '__pan__' : entry.id)}
                                                title={t('Move {{country}}', { country: entry.label })}
                                            >
                                                <span
                                                    className="legend-dot"
                                                    style={{ background: color.stroke, boxShadow: `0 0 12px ${color.stroke}` }}
                                                />
                                                {entry.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    type="button"
                                    className="fullscreen-close"
                                    onClick={() => setIsFullscreen(false)}
                                    aria-label={t('Exit full screen')}
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="fullscreen-overlay-bottom">
                                <div className="fullscreen-tools">
                                    <div className="fullscreen-zoom">
                                        <button
                                            type="button"
                                            className="zoom-button"
                                            onClick={() => handleZoomChange(zoom - ZOOM_STEP)}
                                            aria-label={t('Zoom out')}
                                            disabled={zoom <= MIN_ZOOM + 0.001}
                                        >
                                            −
                                        </button>
                                        <input
                                            type="range"
                                            className="zoom-slider"
                                            min={MIN_ZOOM}
                                            max={MAX_ZOOM}
                                            step={ZOOM_STEP}
                                            value={zoom}
                                            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                                            aria-label={t('Zoom level')}
                                        />
                                        <span className="zoom-readout mono">{Math.round(zoom * 100)}%</span>
                                        <button
                                            type="button"
                                            className="zoom-button"
                                            onClick={() => handleZoomChange(zoom + ZOOM_STEP)}
                                            aria-label={t('Zoom in')}
                                            disabled={zoom >= MAX_ZOOM - 0.001}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── MAP (INLINE) ─── */}
                    {!isFullscreen && (
                        <motion.div
                            className="country-compare-map"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6 }}
                        >
                        <div className="map-header-compact">
                            <div className="map-title-row">
                                <h2>{t('Overlay view')}</h2>
                                <div className="map-legend-inline" role="group" aria-label={t('Drag mode')}>
                                    <button
                                        type="button"
                                        className={`legend-item legend-pan${dragTarget === '__pan__' ? ' active' : ''}`}
                                        onClick={() => setDragTarget('__pan__')}
                                        title={t('Pan view')}
                                    >
                                        ✋
                                    </button>
                                    {selectedEntries.map(entry => {
                                        const color = ENTITY_COLORS[entry.colorIndex];
                                        const isActive = dragTarget === entry.id;
                                        return (
                                            <button
                                                key={entry.id}
                                                type="button"
                                                className={`legend-item${isActive ? ' active' : ''}`}
                                                style={{ color: color.stroke }}
                                                onClick={() => setDragTarget(isActive ? '__pan__' : entry.id)}
                                                title={t('Move {{country}}', { country: entry.label })}
                                            >
                                                <span
                                                    className="legend-dot"
                                                    style={{ background: color.stroke, boxShadow: `0 0 12px ${color.stroke}` }}
                                                />
                                                {entry.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="map-toolbar">
                                <div className="toolbar-row">
                                    <div className="map-zoom-compact">
                                        <button
                                            type="button"
                                            onClick={() => handleZoomChange(zoom - ZOOM_STEP)}
                                            aria-label={t('Zoom out')}
                                            disabled={zoom <= MIN_ZOOM + 0.001}
                                        >
                                            −
                                        </button>
                                        <input
                                            type="range"
                                            className="zoom-slider"
                                            min={MIN_ZOOM}
                                            max={MAX_ZOOM}
                                            step={ZOOM_STEP}
                                            value={zoom}
                                            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                                            aria-label={t('Zoom level')}
                                        />
                                        <span className="mono">{Math.round(zoom * 100)}%</span>
                                        <button
                                            type="button"
                                            onClick={() => handleZoomChange(zoom + ZOOM_STEP)}
                                            aria-label={t('Zoom in')}
                                            disabled={zoom >= MAX_ZOOM - 0.001}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        className="expand-btn"
                                        onClick={() => {
                                            MatomoEvents.countryCompareFullscreen();
                                            setIsFullscreen(true);
                                        }}
                                        aria-label={t('Full screen')}
                                    >
                                        ⛶
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className={`map-stage${isDragging ? ' dragging' : ''}${dragTarget !== '__pan__' ? ' move-target' : ''}`}>
                            {renderOverlaySvg('map-svg')}
                        </div>
                        <p className="map-footnote">
                            {t('Map data: Natural Earth 1:{{scale}}.', { scale: resolution })}
                        </p>
                        </motion.div>
                    )}

                    {/* ─── AREA BLOCKS ─── */}
                    <motion.div
                        className="country-compare-blocks"
                        initial={{ y: 18, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <div className="map-header">
                            <div className="map-title">
                                <h2>{t('Area blocks (official)')}</h2>
                                <p>{t('Squares are sized by official total area.')}</p>
                            </div>
                        </div>
                        <div className="block-stage">
                            <svg
                                viewBox={`0 0 ${areaBlocks?.svgWidth ?? 900} ${areaBlocks?.svgHeight ?? 350}`}
                                role="img"
                                aria-label={t('Area blocks (official)')}
                            >
                                {areaBlocks && areaBlocks.rects.map(block => {
                                    const color = ENTITY_COLORS[block.colorIndex];
                                    return (
                                        <g key={block.id}>
                                            <rect
                                                x={block.rect.x}
                                                y={block.rect.y}
                                                width={block.rect.width}
                                                height={block.rect.height}
                                                fill={color.fill}
                                                stroke={color.stroke}
                                                strokeWidth={2}
                                            />
                                            <text
                                                x={block.rect.x + block.rect.width / 2}
                                                y={block.rect.y + block.rect.height + 18}
                                                textAnchor="middle"
                                                fill={color.stroke}
                                                className="block-label"
                                            >
                                                {block.label}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    </motion.div>

                    {/* ─── RANKING ─── */}
                    <motion.div
                        className="country-compare-ranking"
                        initial={{ y: 16, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className="ranking-header">
                            <div className="map-title">
                                <h2>{t('Area ranking')}</h2>
                                <p>{t('Ranks use official total area when available.')}</p>
                            </div>
                            <button
                                type="button"
                                className="ranking-toggle"
                                onClick={() => setShowAllRanks((prev) => !prev)}
                            >
                                {showAllRanks ? t('Show top 20') : t('Show all')}
                            </button>
                        </div>
                        <div className="ranking-list">
                            {rankingList.map((entry, index) => {
                                const rank = rankById.get(entry.id) ?? index + 1;
                                const colorIdx = selectedColorMap.get(entry.id);
                                const isSelected = colorIdx !== undefined;
                                const color = isSelected ? ENTITY_COLORS[colorIdx] : null;
                                return (
                                    <div
                                        key={entry.id}
                                        className={`ranking-row${isSelected ? ' selected' : ''}`}
                                        style={isSelected ? {
                                            borderColor: color!.stroke,
                                            boxShadow: `0 0 20px ${color!.fill}`,
                                        } : undefined}
                                    >
                                        <span className="ranking-index mono">#{rank}</span>
                                        <span className="ranking-name">{entry.label}</span>
                                        <span className="ranking-area mono">
                                            {formatArea(entry.rankingAreaKm2, i18n.language)} {t('km²')}
                                        </span>
                                    </div>
                                );
                            })}
                            {pinnedEntries.length > 0 && (
                                <>
                                    <div className="ranking-divider" />
                                    {pinnedEntries.map(entry => {
                                        const rank = rankById.get(entry.id) ?? 0;
                                        const colorIdx = selectedColorMap.get(entry.id);
                                        const color = colorIdx !== undefined ? ENTITY_COLORS[colorIdx] : null;
                                        return (
                                            <div
                                                key={`pinned-${entry.id}`}
                                                className="ranking-row pinned selected"
                                                style={color ? {
                                                    borderColor: color.stroke,
                                                    boxShadow: `0 0 20px ${color.fill}`,
                                                } : undefined}
                                            >
                                                <span className="ranking-index mono">#{rank}</span>
                                                <span className="ranking-name">{entry.label}</span>
                                                <span className="ranking-area mono">
                                                    {formatArea(entry.rankingAreaKm2, i18n.language)} {t('km²')}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </motion.section>
        </>
    );
};
