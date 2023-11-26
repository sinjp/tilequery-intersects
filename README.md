# tilequery-intersects

Fork of [reyemtm/tilequery](https://github.com/reyemtm/tilequery) to query intersections rather than within.

Query remote vector tiles and return ~point features within a bounding box or point buffer~ features that intersect a point with optional buffer. The returned geojson is only as accurate as the data in the tiles, but the less tiles that need queried the faster the response, so the two factors need to be taken into account when utilizing tilequery.

Polygons and lines will be returned if queried but cut at the tile boundaries. The full list of attributes will be returned however.

A pre-built version is available in `docs/dist` and can be used directly in the browser with the global variable `tilequery`.

## Example

```JavaScript
const tilequery = require("./tilequery.js");

(async function test() {
    const now = Date.now();
    const features = await tilequery({
        point: [-82.54, 39.11],
        radius: 200,  // 0 = no buffer
        units: 'metres',
        tiles: 'https://reyemtm.github.io/tilequery/tiles/{z}/{x}/{y}.mvt',
        layer: 'test',
        field: 'id',
        zoom: 14,
        logger: true,
    });
    console.log("overall timer: ", Date.now() - now, "ms");
})();
```
