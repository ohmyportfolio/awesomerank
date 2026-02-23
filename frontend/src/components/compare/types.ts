import type { Feature, Geometry } from 'geojson';

export type CountryProperties = Record<string, string | number | null>;
export type CountryFeature = Feature<Geometry, CountryProperties>;
export type GeoCollection = GeoJSON.FeatureCollection<Geometry, CountryProperties>;

export type CompareMode = 'country' | 'continent' | 'subregion' | 'admin1';

export type CompareEntry = {
    id: string;
    label: string;
    name: string;
    areaKm2: number;
    officialAreaKm2: number | null;
    features: CountryFeature[];
    mode: CompareMode;
    parentId?: string;
    iso3?: string;
    constituentCount?: number;
};

/** An entity currently selected and displayed on the map */
export type SelectedEntry = CompareEntry & {
    colorIndex: number;
};

/** Tag filter state — which entity types to include in search */
export type SearchTagFilter = {
    country: boolean;
    continent: boolean;
    subregion: boolean;
    admin1: boolean;
};

/** Pre-indexed search item for fast matching */
export type SearchResultItem = {
    entry: CompareEntry;
    searchText: string;
    parentLabel?: string;
};

/** 10-color palette for map entities */
export const ENTITY_COLORS = [
    { fill: 'rgba(199,109,78,0.55)',  stroke: '#c76d4e', name: 'terracotta' },
    { fill: 'rgba(122,158,126,0.45)', stroke: '#7a9e7e', name: 'sage' },
    { fill: 'rgba(107,140,174,0.50)', stroke: '#6b8cae', name: 'slate-blue' },
    { fill: 'rgba(212,165,116,0.50)', stroke: '#d4a574', name: 'amber' },
    { fill: 'rgba(180,100,160,0.45)', stroke: '#b464a0', name: 'mauve' },
    { fill: 'rgba(90,170,160,0.45)',  stroke: '#5aaaa0', name: 'teal' },
    { fill: 'rgba(220,160,80,0.50)',  stroke: '#dca050', name: 'ochre' },
    { fill: 'rgba(140,110,180,0.45)', stroke: '#8c6eb4', name: 'lavender' },
    { fill: 'rgba(180,80,80,0.45)',   stroke: '#b45050', name: 'crimson' },
    { fill: 'rgba(80,150,100,0.45)',  stroke: '#509664', name: 'forest' },
] as const;

export const MAX_SELECTED_ENTITIES = 10;
