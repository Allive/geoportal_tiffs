const GeoTIFF = require('./node_modules/geotiff/dist-node/geotiff')
const axios = require('axios')
let url = 'https://raw.githubusercontent.com/Allive/geoportal_tiffs/main/my.tiff';

try{
axios.get(url, {responseType: 'arraybuffer'})
    //.then(r => r.arrayBuffer())
    .then( async ({data: buffer}) => {
        buffer = toArrayBuffer(buffer)
        const tiff =  await GeoTIFF.fromArrayBuffer(buffer)
        let image = await tiff.getImage();
        let rasters = await image.readRasters();
        let tiepoint = image.getTiePoints()[0];
        let fileDirectory = image.getFileDirectory();
        let [xScale, yScale] = fileDirectory.ModelPixelScale;

        if (typeof bandIndexes === 'undefined' || bandIndexes.length === 0) {
            bandIndexes = [...Array(rasters.length).keys()];
        }

        let scalarFields = [];

        scalarFields = bandIndexes.map(function (bandIndex) {
            let zs = rasters[bandIndex]; // left-right and top-down order

            if (fileDirectory.GDAL_NODATA) {
                let noData = parseFloat(fileDirectory.GDAL_NODATA);
                // console.log(noData);
                let simpleZS = Array.from(zs); // to simple array, so null is allowed | TODO efficiency??
                zs = simpleZS.map(function (z) {
                    return z === noData ? null : z;
                });
            }

            let p = {
                nCols: image.getWidth(),
                nRows: image.getHeight(),
                xllCorner: tiepoint.x,
                yllCorner: tiepoint.y - image.getHeight() * yScale,
                cellXSize: xScale,
                cellYSize: yScale,
                zs: zs,
            };
            return new ScalarField(p);
        });
        console.log(buffer)
    })
    .catch(e => {
        console.log(e)
    })
}catch(e){
    console.log(e)
}

function toArrayBuffer(buf) {
    var ab = new ArrayBuffer(buf.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}
console.log('L')