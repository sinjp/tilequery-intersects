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
