import type { CompareEntry, CompareMode, SearchResultItem, SearchTagFilter } from './types';

/** Build a flat search index from all entity sources. */
export function buildSearchIndex(
    countries: CompareEntry[],
    continents: CompareEntry[],
    subregions: CompareEntry[],
    admin1: CompareEntry[],
): SearchResultItem[] {
    const items: SearchResultItem[] = [];

    for (const entry of countries) {
        items.push({
            entry,
            searchText: [entry.label, entry.name, entry.iso3 || ''].join('\t').toLowerCase(),
        });
    }
    for (const entry of continents) {
        items.push({
            entry,
            searchText: [entry.label, entry.name].join('\t').toLowerCase(),
        });
    }
    for (const entry of subregions) {
        items.push({
            entry,
            searchText: [entry.label, entry.name].join('\t').toLowerCase(),
        });
    }
    for (const entry of admin1) {
        // parentLabel is already embedded in entry.label as "Name (Country)"
        const parentLabel = entry.parentId || '';
        items.push({
            entry,
            searchText: [entry.label, entry.name, parentLabel].join('\t').toLowerCase(),
            parentLabel,
        });
    }

    return items;
}

const MODE_ORDER: CompareMode[] = ['country', 'continent', 'subregion', 'admin1'];
const MAX_PER_GROUP = 15;

export type GroupedResults = {
    mode: CompareMode;
    items: SearchResultItem[];
}[];

/** Filter + group search results. Returns groups in mode order. */
export function filterSearchResults(
    index: SearchResultItem[],
    query: string,
    tagFilter: SearchTagFilter,
    selectedIds: Set<string>,
    totalLimit = 40,
): GroupedResults {
    const q = query.trim().toLowerCase();

    // Init group buckets
    const buckets = new Map<CompareMode, SearchResultItem[]>(
        MODE_ORDER.map(m => [m, []]),
    );

    let total = 0;

    for (const item of index) {
        if (total >= totalLimit) break;
        if (!tagFilter[item.entry.mode]) continue;
        if (selectedIds.has(item.entry.id)) continue;

        const groupItems = buckets.get(item.entry.mode)!;
        if (groupItems.length >= MAX_PER_GROUP) continue;

        if (q) {
            // Score-based matching: prefix > includes
            if (!item.searchText.includes(q)) continue;
        }

        groupItems.push(item);
        total++;
    }

    return MODE_ORDER
        .filter(m => tagFilter[m])
        .map(m => ({ mode: m, items: buckets.get(m)! }))
        .filter(g => g.items.length > 0);
}
