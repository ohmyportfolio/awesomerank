/**
 * Downloads and processes Natural Earth admin-1 states/provinces GeoJSON data.
 * Strips unnecessary properties and reduces coordinate precision to shrink file size.
 *
 * Usage: node scripts/prepare-admin1-data.mjs
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '..', 'public', 'data', 'admin1-110m.geojson');

// Natural Earth 10m admin-1 GeoJSON (comprehensive: ~4,600 features)
const SOURCE_URL =
    'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson';

const KEEP_PROPERTIES = new Set([
    'name',
    'name_en',
    'name_local',
    'adm0_a3',
    'iso_a2',
    'iso_3166_2',
    'type_en',
    'region',
]);

// Reduce coordinate precision (2 decimal places = ~1.1km accuracy, fine for overview maps)
const PRECISION = 2;
// Skip points in long rings to reduce complexity
const MAX_RING_POINTS = 50;

function roundCoord(coord) {
    return [
        parseFloat(coord[0].toFixed(PRECISION)),
        parseFloat(coord[1].toFixed(PRECISION)),
    ];
}

function simplifyRing(ring, minPoints) {
    const rounded = ring.map(roundCoord);
    // Remove consecutive duplicate points
    const deduped = [rounded[0]];
    for (let i = 1; i < rounded.length; i++) {
        const prev = deduped[deduped.length - 1];
        if (rounded[i][0] !== prev[0] || rounded[i][1] !== prev[1]) {
            deduped.push(rounded[i]);
        }
    }
    if (deduped.length < minPoints) return null;
    // Subsample long rings
    if (deduped.length > MAX_RING_POINTS) {
        const step = deduped.length / MAX_RING_POINTS;
        const sampled = [];
        for (let i = 0; i < MAX_RING_POINTS; i++) {
            sampled.push(deduped[Math.floor(i * step)]);
        }
        // Close the ring
        sampled.push(sampled[0]);
        return sampled;
    }
    return deduped;
}

function simplifyGeometry(geometry) {
    if (geometry.type === 'Polygon') {
        const rings = geometry.coordinates
            .map((ring) => simplifyRing(ring, 4))
            .filter(Boolean);
        if (!rings.length) return null;
        geometry.coordinates = rings;
    } else if (geometry.type === 'MultiPolygon') {
        const polygons = geometry.coordinates
            .map((polygon) => {
                const rings = polygon
                    .map((ring) => simplifyRing(ring, 4))
                    .filter(Boolean);
                return rings.length ? rings : null;
            })
            .filter(Boolean);
        if (!polygons.length) return null;
        geometry.coordinates = polygons;
    }
    return geometry;
}

async function main() {
    console.log('Downloading admin-1 data from Natural Earth...');
    const response = await fetch(SOURCE_URL);
    if (!response.ok) {
        throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log(`Downloaded ${data.features.length} features.`);

    const processed = [];
    for (const feature of data.features) {
        // Strip properties
        const props = feature.properties;
        const kept = {};
        for (const key of KEEP_PROPERTIES) {
            if (props[key] != null) {
                kept[key] = props[key];
            }
        }
        feature.properties = kept;

        // Skip features without valid geometry
        if (!feature.geometry || !feature.geometry.coordinates) continue;

        // Simplify coordinates
        const simplified = simplifyGeometry(feature.geometry);
        if (!simplified) continue;
        feature.geometry = simplified;

        processed.push(feature);
    }

    console.log(`Processed ${processed.length} features (removed ${data.features.length - processed.length}).`);

    // Count countries
    const countryCounts = {};
    for (const f of processed) {
        const c = f.properties.adm0_a3;
        countryCounts[c] = (countryCounts[c] || 0) + 1;
    }
    console.log(`Countries covered: ${Object.keys(countryCounts).length}`);

    const output = {
        type: 'FeatureCollection',
        features: processed,
    };

    const json = JSON.stringify(output);
    writeFileSync(OUTPUT_PATH, json, 'utf-8');

    const sizeMB = (Buffer.byteLength(json) / (1024 * 1024)).toFixed(2);
    console.log(`Wrote ${OUTPUT_PATH} (${sizeMB} MB, ${processed.length} features).`);
}

main().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
});
