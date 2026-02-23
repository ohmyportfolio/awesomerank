import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CompareEntry, CompareMode, SearchTagFilter, SelectedEntry } from './types';
import { ENTITY_COLORS, MAX_SELECTED_ENTITIES } from './types';
import { buildSearchIndex, filterSearchResults } from './searchIndex';
import type { GroupedResults } from './searchIndex';
import './CompareSearchInput.css';

type Props = {
    countries: CompareEntry[];
    continents: CompareEntry[];
    subregions: CompareEntry[];
    admin1: CompareEntry[];
    admin1Loading: boolean;
    selectedEntries: SelectedEntry[];
    onAdd: (entry: CompareEntry) => void;
    onRemove: (id: string) => void;
    onRequestAdmin1: () => void;
};

const MODE_LABELS: Record<CompareMode, string> = {
    country: 'Country',
    continent: 'Continent',
    subregion: 'Subregion',
    admin1: 'State/Province',
};

export function CompareSearchInput({
    countries, continents, subregions, admin1,
    admin1Loading, selectedEntries,
    onAdd, onRemove, onRequestAdmin1,
}: Props) {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [tagFilter, setTagFilter] = useState<SearchTagFilter>({
        country: true, continent: true, subregion: true, admin1: true,
    });
    const [isOpen, setIsOpen] = useState(false);
    const [focusIndex, setFocusIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const searchIndex = useMemo(
        () => buildSearchIndex(countries, continents, subregions, admin1),
        [countries, continents, subregions, admin1],
    );

    const selectedIds = useMemo(
        () => new Set(selectedEntries.map(e => e.id)),
        [selectedEntries],
    );

    const grouped: GroupedResults = useMemo(
        () => filterSearchResults(searchIndex, query, tagFilter, selectedIds),
        [searchIndex, query, tagFilter, selectedIds],
    );

    const flatItems = useMemo(
        () => grouped.flatMap(g => g.items),
        [grouped],
    );

    // Request admin1 data when tag is enabled
    useEffect(() => {
        if (tagFilter.admin1 && admin1.length === 0 && !admin1Loading) {
            onRequestAdmin1();
        }
    }, [tagFilter.admin1, admin1.length, admin1Loading, onRequestAdmin1]);

    const handleSelect = useCallback((entry: CompareEntry) => {
        if (selectedEntries.length >= MAX_SELECTED_ENTITIES) return;
        onAdd(entry);
        setQuery('');
        setFocusIndex(-1);
        inputRef.current?.focus();
    }, [selectedEntries.length, onAdd]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setFocusIndex(prev => Math.min(prev + 1, flatItems.length - 1));
            setIsOpen(true);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setFocusIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter' && focusIndex >= 0 && focusIndex < flatItems.length) {
            e.preventDefault();
            handleSelect(flatItems[focusIndex].entry);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setFocusIndex(-1);
        } else if (e.key === 'Backspace' && !query && selectedEntries.length > 0) {
            onRemove(selectedEntries[selectedEntries.length - 1].id);
        }
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handle = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    const toggleTag = (mode: CompareMode) => {
        setTagFilter(prev => ({ ...prev, [mode]: !prev[mode] }));
    };

    const atLimit = selectedEntries.length >= MAX_SELECTED_ENTITIES;

    // Scroll focused item into view
    useEffect(() => {
        if (focusIndex < 0) return;
        const el = containerRef.current?.querySelector('.search-result.focused');
        el?.scrollIntoView({ block: 'nearest' });
    }, [focusIndex]);

    return (
        <div className="compare-search" ref={containerRef}>
            <div className="compare-search-tags">
                {(['country', 'continent', 'subregion', 'admin1'] as CompareMode[]).map(mode => (
                    <button
                        key={mode}
                        type="button"
                        className={`search-tag${tagFilter[mode] ? ' active' : ''}`}
                        onClick={() => toggleTag(mode)}
                    >
                        {t(MODE_LABELS[mode])}
                    </button>
                ))}
            </div>

            <div className="compare-search-fieldwrap">
                <div className={`compare-search-field${isOpen && flatItems.length > 0 && !atLimit ? ' open' : ''}`}>
                    <div className="compare-search-chips">
                        {selectedEntries.map(entry => {
                            const color = ENTITY_COLORS[entry.colorIndex];
                            return (
                                <span
                                    key={entry.id}
                                    className="search-chip"
                                    style={{ borderColor: color.stroke, background: color.fill }}
                                >
                                    <span className="chip-label">{entry.label}</span>
                                    <button
                                        type="button"
                                        className="chip-remove"
                                        onClick={() => onRemove(entry.id)}
                                        aria-label={t('Remove {{name}}', { name: entry.label })}
                                    >
                                        ×
                                    </button>
                                </span>
                            );
                        })}
                        <input
                            ref={inputRef}
                            type="text"
                            className="compare-search-input"
                            value={query}
                            onChange={e => {
                                setQuery(e.target.value);
                                setIsOpen(true);
                                setFocusIndex(-1);
                            }}
                            onFocus={() => setIsOpen(true)}
                            onKeyDown={handleKeyDown}
                            placeholder={atLimit
                                ? t('Maximum {{count}} items', { count: MAX_SELECTED_ENTITIES })
                                : t('Search countries, regions...')}
                            disabled={atLimit}
                            autoComplete="off"
                        />
                    </div>
                </div>

                {isOpen && flatItems.length > 0 && !atLimit && (
                    <div className="compare-search-dropdown">
                        {grouped.map(group => (
                            <div key={group.mode} className="search-group">
                                <div className="search-group-label">{t(MODE_LABELS[group.mode])}</div>
                                {group.items.map(item => {
                                    const globalIndex = flatItems.indexOf(item);
                                    return (
                                        <button
                                            key={item.entry.id}
                                            type="button"
                                            className={`search-result${globalIndex === focusIndex ? ' focused' : ''}`}
                                            onMouseDown={e => e.preventDefault()}
                                            onClick={() => handleSelect(item.entry)}
                                            onMouseEnter={() => setFocusIndex(globalIndex)}
                                        >
                                            <span className="result-name">{item.entry.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                        {tagFilter.admin1 && admin1Loading && (
                            <div className="search-loading">{t('Loading state/province data...')}</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
