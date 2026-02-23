import { geoArea, geoPath, geoEqualEarth } from 'd3-geo';
import { officialAreaByIso3 } from '../../data/officialAreaByIso3';
import type { CompareEntry, CountryFeature } from './types';

export const EARTH_RADIUS_KM = 6371;

const officialMap = officialAreaByIso3 as Record<string, number | undefined>;

/** Compute the d3-geo projected bounding box across an array of features. */
export function unionBounds(features: CountryFeature[]) {
    const projection = geoEqualEarth().scale(1).translate([0, 0]);
    const pathGen = geoPath(projection);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const f of features) {
        const b = pathGen.bounds(f);
        if (b[0][0] < minX) minX = b[0][0];
        if (b[0][1] < minY) minY = b[0][1];
        if (b[1][0] > maxX) maxX = b[1][0];
        if (b[1][1] > maxY) maxY = b[1][1];
    }
    return [[minX, minY], [maxX, maxY]] as [[number, number], [number, number]];
}

/** Compute total area in km² from an array of features using d3-geo. */
export function computeTotalArea(features: CountryFeature[]): number {
    let total = 0;
    for (const f of features) {
        total += geoArea(f) * EARTH_RADIUS_KM * EARTH_RADIUS_KM;
    }
    return total;
}

/** Sum official CIA areas for a list of ISO3 codes. Returns null if > 20% of codes lack data. */
export function sumOfficialArea(iso3Codes: string[]): number | null {
    let total = 0;
    let missing = 0;
    for (const code of iso3Codes) {
        const area = officialMap[code];
        if (area != null) {
            total += area;
        } else {
            missing++;
        }
    }
    if (iso3Codes.length > 0 && missing / iso3Codes.length > 0.2) return null;
    return total;
}

const EXCLUDED_CONTINENTS = new Set(['Seven seas (open ocean)', 'Antarctica']);

/** Build CompareEntry[] for continents from country features. */
export function buildContinentEntries(
    features: CountryFeature[],
    getLabel: (name: string) => string,
): CompareEntry[] {
    const groups = new Map<string, { features: CountryFeature[]; iso3Codes: string[] }>();

    for (const f of features) {
        const continent = String(f.properties.CONTINENT || '');
        if (!continent || EXCLUDED_CONTINENTS.has(continent)) continue;
        let g = groups.get(continent);
        if (!g) {
            g = { features: [], iso3Codes: [] };
            groups.set(continent, g);
        }
        g.features.push(f);
        const iso3 = String(f.properties.ADM0_A3 || f.properties.ISO_A3 || '');
        if (iso3) g.iso3Codes.push(iso3);
    }

    const entries: CompareEntry[] = [];
    for (const [name, g] of groups) {
        entries.push({
            id: `continent:${name}`,
            label: getLabel(name),
            name,
            areaKm2: computeTotalArea(g.features),
            officialAreaKm2: sumOfficialArea(g.iso3Codes),
            features: g.features,
            mode: 'continent',
            constituentCount: g.features.length,
        });
    }
    return entries.sort((a, b) => a.label.localeCompare(b.label));
}

/** Build CompareEntry[] for subregions from country features. */
export function buildSubregionEntries(
    features: CountryFeature[],
    getLabel: (name: string) => string,
): CompareEntry[] {
    const groups = new Map<string, { features: CountryFeature[]; iso3Codes: string[] }>();

    for (const f of features) {
        const subregion = String(f.properties.SUBREGION || '');
        if (!subregion) continue;
        const continent = String(f.properties.CONTINENT || '');
        if (EXCLUDED_CONTINENTS.has(continent)) continue;
        let g = groups.get(subregion);
        if (!g) {
            g = { features: [], iso3Codes: [] };
            groups.set(subregion, g);
        }
        g.features.push(f);
        const iso3 = String(f.properties.ADM0_A3 || f.properties.ISO_A3 || '');
        if (iso3) g.iso3Codes.push(iso3);
    }

    const entries: CompareEntry[] = [];
    for (const [name, g] of groups) {
        entries.push({
            id: `subregion:${name}`,
            label: getLabel(name),
            name,
            areaKm2: computeTotalArea(g.features),
            officialAreaKm2: sumOfficialArea(g.iso3Codes),
            features: g.features,
            mode: 'subregion',
            constituentCount: g.features.length,
        });
    }
    return entries.sort((a, b) => a.label.localeCompare(b.label));
}

/** Build CompareEntry[] for admin-1 features. */
export function buildAdmin1Entries(
    features: CountryFeature[],
    countryLabelMap: Map<string, string>,
): CompareEntry[] {
    return features
        .map((f) => {
            const props = f.properties;
            const nameEn = String(props.name_en || props.name || 'Unknown');
            const parentIso3 = String(props.adm0_a3 || '');
            const stateCode = String(props.iso_3166_2 || '');
            const parentLabel = countryLabelMap.get(parentIso3) || parentIso3;
            const areaKm2 = geoArea(f) * EARTH_RADIUS_KM * EARTH_RADIUS_KM;

            return {
                id: stateCode || `${parentIso3}-${nameEn}`,
                label: `${nameEn} (${parentLabel})`,
                name: nameEn,
                areaKm2,
                officialAreaKm2: null,
                features: [f],
                mode: 'admin1' as const,
                parentId: parentIso3,
            };
        })
        .filter((e) => e.areaKm2 > 1)
        .sort((a, b) => a.label.localeCompare(b.label));
}
