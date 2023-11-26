const getXYZ = require("xyz-affair");
const {bbox, circle, booleanIntersects, buffer} = require('@turf/turf');
const {promisfy} = require('promisfy');
const vt2geojson = promisfy(require('./vendor/@mapbox/vt2geojson/index.js'));

function createTileURLS(obj, tiles) {
    return obj.reduce((i, o) => {
        const url = tiles
            .replace('{x}', o.x)
            .replace('{y}', o.y)
            .replace('{z}', o.z);
        return [...i, url]
    }, [])
}

async function getFeaturesFromTiles(tileURLS, layer, field) {
    if (!field) console.log("warning! no id field specified - features will be duplicated");
    let geojson = {
        type: 'FeatureCollection',
        features: [],
    };
    let index = []; // VECTOR TILE FEATURES MUST HAVE A UNIQUE ID!!!
    const idField = field ? field : "id";
    for (let i = 0; i < tileURLS.length; i++) {
        const uri = tileURLS[i];
        try {
            const queried = await vt2geojson({uri, layer});
            for (let i = 0; i < queried.features.length; i++) {
                const f = queried.features[i];
                if (idField === "id" && !f[idField] && f[idField] !== 0) {
                    geojson.features.push(f)
                } else {
                    const id = idField === "id" ? f.id : f.properties[idField];
                    if (id && index.indexOf(id) < 0) {
                        index.push(id);
                        geojson.features.push(f)
                    }
                }
            }
        } catch (error) {
            geojson["error"] = error
        }
    }
    return geojson
}

async function tilequery(options) {
    const config = Object.assign({
        // Defaults
        point: [-82.54, 39.11],
        radius: 0,  // 0 = no buffer
        units: 'metres',
        tiles: 'https://tilequery.netlify.app/tiles/test/{z}/{x}/{y}.mvt',
        layer: 'test',
        field: 'id',
        zoom: 14,
        logger: false,
    }, options);
    if (config.logger) console.log('config: ', config);

    // Fetch the intersected vector tiles
    let timer = Date.now();
    const bounds = config.bounds ? config.bounds : bbox(circle(config.point, config.radius, {
        units: config.units, steps: 500
    }));
    const xyz = getXYZ([[bounds[0], bounds[1]], [bounds[2], bounds[3]]], config.zoom);
    const urls = createTileURLS(xyz, config.tiles);
    const geojson = await getFeaturesFromTiles(urls, config.layer, config.field);
    if (config.logger) {
        console.log('total features found in tiles: ', geojson.features.length);
        console.log('fetching tiles execution time (seconds): ', (Date.now() - timer) / 1000)
    }

    // Build the GeoJSON query geometry, either point or buffered point (polygon)
    const pointFeature = {
        "type": "Feature",
        "geometry": {
            "type": "Point", "coordinates": config.point,
        },
    };
    if (config.logger) console.log('pointFeature: ', pointFeature);
    const queryFeature = config.radius === 0 ? pointFeature : buffer(pointFeature, config.radius, {units: config.units});
    if (config.logger) console.log('queryFeature: ', queryFeature);

    // Naive search for intersections
    timer = Date.now();
    const queryResults = {
        type: "FeatureCollection", features: []
    };
    for (let i = 0; i < geojson.features.length; i++) {
        if (booleanIntersects(queryFeature, geojson.features[i])) {
            queryResults.features.push(geojson.features[i]);
        }
    }
    if (config.logger) {
        console.log("intersected features returned: ", queryResults.features.length, queryResults);
        console.log('intersection query execution time (seconds): ', (Date.now() - timer) / 1000);
    }

    return queryResults
}

module.exports = tilequery;
