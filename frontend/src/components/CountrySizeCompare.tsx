import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { geoArea, geoEqualEarth, geoPath } from 'd3-geo';
import './CountrySizeCompare.css';

type CountryProperties = Record<string, string | number | null>;
type CountryFeature = GeoJSON.Feature<GeoJSON.Geometry, CountryProperties>;
type GeoCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, CountryProperties>;

type CountryEntry = {
    id: string;
    label: string;
    name: string;
    areaKm2: number;
    feature: CountryFeature;
};

const EARTH_RADIUS_KM = 6371;
const VIEWBOX_WIDTH = 900;
const VIEWBOX_HEIGHT = 600;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.6;
const ZOOM_STEP = 0.05;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const NAME_KEY_BY_LANGUAGE: Record<string, string> = {
    ar: 'NAME_AR',
    de: 'NAME_DE',
    el: 'NAME_EL',
    en: 'NAME_EN',
    es: 'NAME_ES',
    fa: 'NAME_FA',
    fr: 'NAME_FR',
    he: 'NAME_HE',
    hi: 'NAME_HI',
    hu: 'NAME_HU',
    id: 'NAME_ID',
    it: 'NAME_IT',
    ja: 'NAME_JA',
    ko: 'NAME_KO',
    nl: 'NAME_NL',
    pl: 'NAME_PL',
    pt: 'NAME_PT',
    ru: 'NAME_RU',
    sv: 'NAME_SV',
    tr: 'NAME_TR',
    vi: 'NAME_VI',
    zh: 'NAME_ZH',
};

const getLocalizedName = (properties: CountryFeature['properties'], language: string) => {
    const baseLanguage = language.split('-')[0];
    const languageKey = NAME_KEY_BY_LANGUAGE[baseLanguage] ?? 'NAME_EN';
    const localized = properties[languageKey];
    if (typeof localized === 'string' && localized.trim().length > 0) return localized;
    const fallback = properties.NAME_EN ?? properties.NAME ?? properties.ADMIN ?? properties.NAME_LONG;
    return typeof fallback === 'string' ? fallback : 'Unknown';
};

const formatArea = (value: number, locale: string) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);

const formatRatio = (value: number, locale: string) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);

export const CountrySizeCompare = () => {
    const { t, i18n } = useTranslation();
    const [features, setFeatures] = useState<CountryFeature[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [primaryId, setPrimaryId] = useState<string>('');
    const [secondaryId, setSecondaryId] = useState<string>('');
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const response = await fetch('/data/countries-110m.geojson');
                if (!response.ok) throw new Error('failed to fetch');
                const data = (await response.json()) as GeoCollection;
                if (mounted) {
                    setFeatures(data.features || []);
                }
            } catch (err) {
                console.error(err);
                if (mounted) setError(true);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => {
            mounted = false;
        };
    }, []);

    const countries = useMemo(() => {
        return features
            .map((feature) => {
                const areaSteradians = geoArea(feature);
                const areaKm2 = areaSteradians * EARTH_RADIUS_KM * EARTH_RADIUS_KM;
                const name = (feature.properties.NAME_EN as string) || (feature.properties.ADMIN as string) || 'Unknown';
                return {
                    id: String(feature.properties.ADM0_A3 || name),
                    label: getLocalizedName(feature.properties, i18n.language),
                    name,
                    areaKm2,
                    feature,
                } satisfies CountryEntry;
            })
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [features, i18n.language]);

    useEffect(() => {
        if (!countries.length) return;
        if (!primaryId) {
            const defaultPrimary = countries.find((country) => country.name === 'South Korea') ?? countries[0];
            setPrimaryId(defaultPrimary.id);
        }
        if (!secondaryId) {
            const defaultSecondary = countries.find((country) => country.name === 'United States of America')
                ?? countries[1]
                ?? countries[0];
            setSecondaryId(defaultSecondary.id);
        }
    }, [countries, primaryId, secondaryId]);

    const primary = countries.find((country) => country.id === primaryId) ?? null;
    const secondary = countries.find((country) => country.id === secondaryId) ?? null;

    const autoZoom = useMemo(() => {
        if (!primary || !secondary) return 1;
        const biggerArea = Math.max(primary.areaKm2, secondary.areaKm2);
        const smallerArea = Math.max(1, Math.min(primary.areaKm2, secondary.areaKm2));
        const areaRatio = biggerArea / smallerArea;
        const sizeRatio = Math.sqrt(areaRatio);
        const boost = Math.log10(sizeRatio) * 0.6;
        return clamp(1 + boost, 0.9, 2.2);
    }, [primary, secondary]);

    useEffect(() => {
        if (!primary || !secondary) return;
        setZoom(autoZoom);
    }, [autoZoom, primary, secondary]);

    const overlay = useMemo(() => {
        if (!primary || !secondary) return null;

        const projection = geoEqualEarth().scale(1).translate([0, 0]);
        const pathGenerator = geoPath(projection);

        const primaryPath = pathGenerator(primary.feature);
        const secondaryPath = pathGenerator(secondary.feature);
        if (!primaryPath || !secondaryPath) return null;

        const primaryBounds = pathGenerator.bounds(primary.feature);
        const secondaryBounds = pathGenerator.bounds(secondary.feature);

        const primaryWidth = primaryBounds[1][0] - primaryBounds[0][0];
        const primaryHeight = primaryBounds[1][1] - primaryBounds[0][1];
        const secondaryWidth = secondaryBounds[1][0] - secondaryBounds[0][0];
        const secondaryHeight = secondaryBounds[1][1] - secondaryBounds[0][1];

        const maxWidth = Math.max(primaryWidth, secondaryWidth, 1);
        const maxHeight = Math.max(primaryHeight, secondaryHeight, 1);
        const scale = Math.min((VIEWBOX_WIDTH * 0.82) / maxWidth, (VIEWBOX_HEIGHT * 0.82) / maxHeight);
        const scaled = scale * zoom;

        const primaryCenter = [
            (primaryBounds[0][0] + primaryBounds[1][0]) / 2,
            (primaryBounds[0][1] + primaryBounds[1][1]) / 2,
        ];
        const secondaryCenter = [
            (secondaryBounds[0][0] + secondaryBounds[1][0]) / 2,
            (secondaryBounds[0][1] + secondaryBounds[1][1]) / 2,
        ];

        const baseTranslate = `translate(${VIEWBOX_WIDTH / 2}, ${VIEWBOX_HEIGHT / 2}) scale(${scaled})`;

        return {
            primaryPath,
            secondaryPath,
            primaryTransform: `${baseTranslate} translate(${-primaryCenter[0]}, ${-primaryCenter[1]})`,
            secondaryTransform: `${baseTranslate} translate(${-secondaryCenter[0]}, ${-secondaryCenter[1]})`,
        };
    }, [primary, secondary, zoom]);

    const ratioData = useMemo(() => {
        if (!primary || !secondary) return null;
        const ratio = primary.areaKm2 / secondary.areaKm2;
        const bigger = ratio >= 1 ? primary : secondary;
        const smaller = ratio >= 1 ? secondary : primary;
        const normalizedRatio = ratio >= 1 ? ratio : 1 / ratio;
        return {
            ratio: normalizedRatio,
            bigger,
            smaller,
        };
    }, [primary, secondary]);

    const handleSwap = () => {
        setPrimaryId(secondaryId);
        setSecondaryId(primaryId);
    };

    const handleZoomChange = (value: number) => {
        setZoom(clamp(value, MIN_ZOOM, MAX_ZOOM));
    };

    return (
        <motion.section
            className="country-compare"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="country-compare-hero">
                <motion.div
                    className="country-compare-title"
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <p className="country-compare-kicker">{t('True Size Atlas')}</p>
                    <h1>{t('Compare two countries at real scale')}</h1>
                    <p className="country-compare-subtitle">
                        {t('Pick two countries to see their actual land area side by side and overlapped.')}
                    </p>
                </motion.div>
            </div>

            <div className="country-compare-controls">
                <div className="country-compare-select">
                    <label htmlFor="country-primary">{t('Country A')}</label>
                    <select
                        id="country-primary"
                        value={primaryId}
                        onChange={(event) => setPrimaryId(event.target.value)}
                    >
                        <option value="" disabled>
                            {t('Select a country')}
                        </option>
                        {countries.map((country) => (
                            <option key={country.id} value={country.id}>
                                {country.label}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    className="country-compare-swap"
                    type="button"
                    onClick={handleSwap}
                    aria-label={t('Swap countries')}
                >
                    <span className="swap-icon">{'<>'}</span>
                    <span>{t('Swap')}</span>
                </button>

                <div className="country-compare-select">
                    <label htmlFor="country-secondary">{t('Country B')}</label>
                    <select
                        id="country-secondary"
                        value={secondaryId}
                        onChange={(event) => setSecondaryId(event.target.value)}
                    >
                        <option value="" disabled>
                            {t('Select a country')}
                        </option>
                        {countries.map((country) => (
                            <option key={country.id} value={country.id}>
                                {country.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading && (
                <div className="country-compare-message">{t('Loading countries...')}</div>
            )}

            {!loading && error && (
                <div className="country-compare-message error">{t('Unable to load country shapes.')}</div>
            )}

            {!loading && !error && primary && secondary && (
                <>
                    <div className="country-compare-stats">
                        <div className="country-compare-stat primary">
                            <span className="stat-label">{t('Area')}</span>
                            <h3>{primary.label}</h3>
                            <p className="stat-value mono">
                                {formatArea(primary.areaKm2, i18n.language)} {t('km^2')}
                            </p>
                        </div>
                        <div className="country-compare-stat secondary">
                            <span className="stat-label">{t('Area')}</span>
                            <h3>{secondary.label}</h3>
                            <p className="stat-value mono">
                                {formatArea(secondary.areaKm2, i18n.language)} {t('km^2')}
                            </p>
                        </div>
                        <div className="country-compare-stat ratio">
                            <span className="stat-label">{t('Size ratio')}</span>
                            <h3>{t('Scale difference')}</h3>
                            <p className="stat-value mono">
                                {ratioData ? `${formatRatio(ratioData.ratio, i18n.language)}x` : '--'}
                            </p>
                            {ratioData && (
                                <p className="stat-note">
                                    {t('{{bigger}} is {{ratio}}x the size of {{smaller}}', {
                                        bigger: ratioData.bigger.label,
                                        smaller: ratioData.smaller.label,
                                        ratio: formatRatio(ratioData.ratio, i18n.language),
                                    })}
                                </p>
                            )}
                        </div>
                    </div>

                    <motion.div
                        className="country-compare-map"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="map-header">
                            <div className="map-title">
                                <h2>{t('Overlay view')}</h2>
                                <p>{t('Equal-area projection keeps the size ratio precise.')}</p>
                            </div>
                            <div className="map-tools">
                                <div className="map-legend">
                                    <span className="legend-item primary">
                                        <span className="legend-dot" />
                                        {primary.label}
                                    </span>
                                    <span className="legend-item secondary">
                                        <span className="legend-dot" />
                                        {secondary.label}
                                    </span>
                                </div>
                                <div className="map-controls">
                                    <label htmlFor="overlay-zoom">{t('Zoom')}</label>
                                    <div className="map-zoom">
                                        <button
                                            type="button"
                                            className="zoom-button"
                                            onClick={() => handleZoomChange(zoom - ZOOM_STEP)}
                                            aria-label={t('Zoom out')}
                                            disabled={zoom <= MIN_ZOOM + 0.001}
                                        >
                                            -
                                        </button>
                                        <input
                                            id="overlay-zoom"
                                            type="range"
                                            min={MIN_ZOOM}
                                            max={MAX_ZOOM}
                                            step={ZOOM_STEP}
                                            value={zoom}
                                            onChange={(event) => handleZoomChange(Number(event.target.value))}
                                            aria-label={t('Zoom')}
                                        />
                                        <button
                                            type="button"
                                            className="zoom-button"
                                            onClick={() => handleZoomChange(zoom + ZOOM_STEP)}
                                            aria-label={t('Zoom in')}
                                            disabled={zoom >= MAX_ZOOM - 0.001}
                                        >
                                            +
                                        </button>
                                        <span className="map-zoom-readout mono">
                                            {Math.round(zoom * 100)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="map-stage">
                            <svg
                                viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
                                role="img"
                                aria-label={t('Overlay of {{countryA}} and {{countryB}}', {
                                    countryA: primary.label,
                                    countryB: secondary.label,
                                })}
                            >
                                {overlay && (
                                    <>
                                        <path
                                            className="map-path primary"
                                            d={overlay.primaryPath}
                                            transform={overlay.primaryTransform}
                                        />
                                        <path
                                            className="map-path secondary"
                                            d={overlay.secondaryPath}
                                            transform={overlay.secondaryTransform}
                                        />
                                    </>
                                )}
                            </svg>
                        </div>
                        <p className="map-footnote">{t('Map data: Natural Earth 1:110m.')}</p>
                    </motion.div>
                </>
            )}
        </motion.section>
    );
};
