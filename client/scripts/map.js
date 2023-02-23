import { Feature, Map, View, Overlay } from 'ol';
import TileLayer from 'ol/layer/Tile';
import {OSM} from 'ol/source';
import { Control, defaults as defaultControls } from 'ol/control';
import { transform, transformExtent } from 'ol/proj';
import * as olExtent from 'ol/extent';
import { fromExtent } from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Stroke, Fill } from 'ol/style';
import XYZ from 'ol/source/XYZ';
import GeoJSON from 'ol/format/GeoJSON';
import { initAutocomplete, getMapDetailsFromUrl } from "./helpers";

// create custom search and submit controls
class CustomControls extends Control {
    constructor(opt_options) {
        const options = opt_options || {};

        const search = document.createElement('input');
        search.type = "text";
        search.placeholder = 'Go to location';
        search.id = 'search';
    
        const submit = document.createElement('input');
        submit.type = "submit";
        submit.value = "submit answer";
        submit.id = 'submit';
        // submit.onclick = function() { return submitAnswer(); };
  
        const element = document.createElement('div');
        element.className = 'custom-controls ol-unselectable ol-control';
        element.appendChild(search);
        element.appendChild(submit)
  
        super({
            element: element,
            target: options.target,
        });
    }
}

// map view
const view = new View({
    center: [0, 0],
    zoom: 2
});

// map layer
const layers = [new TileLayer({
    source: new OSM()
})];

// map tooltip for information
const tooltipOverlay = [new Overlay({
    element: document.getElementById('tooltip'),
    offset: [10, 0],
    positioning: 'bottom-left'
})];

// map
const map = new Map({
    controls: defaultControls().extend([new CustomControls()]),
    target: 'map',
    layers: layers,
    overlays: tooltipOverlay,
    view: view
});

window.initAutocomplete = initAutocomplete;

// constants
const tooltip = document.getElementById("tooltip");
const overlay = tooltipOverlay[0];

// TODO: Move all following logic to backend
// get answer box
export function getAnswerBox(answerLink) {
    const [location, zoom] = getMapDetailsFromUrl(answerLink);
    const center = transform([parseFloat(location[1]), parseFloat(location[0])], 'EPSG:4326', 'EPSG:3857')

    const answerView = new View({ center: center, zoom: zoom });
    return transformExtent(answerView.calculateExtent(map.getSize()), 'EPSG:3857', 'EPSG:4326')
}

// display answer for debuggin: TODO: delete later
export function displayAnswerBox(extent) {
    map.addLayer(new VectorLayer({
        source: new VectorSource({
            features: [new Feature({
                geometry: fromExtent(extent).transform('EPSG:4326','EPSG:3857')
            })]
        }),
        style: new Style({
            stroke: new Stroke({
                width: 3,
                color: [255, 0, 0, 1]
            })
        })
    }))
}

export function getScore() {
    const currentAnswer = transformExtent(map.getView().calculateExtent(map.getSize()), 'EPSG:3857', 'EPSG:4326');

    return {
        "bottom_left": olExtent.getBottomLeft(currentAnswer),
        "top_right": olExtent.getTopRight(currentAnswer)
    };
}

function writeValueToHTML(attributeValue) {
    let html = "";
    if (typeof attributeValue === 'string')
        html += "\""+attributeValue+"\"";
    else if (typeof attributeValue === 'number')
        html += attributeValue;
    else if (Array.isArray(attributeValue)) {
        html += "["+attributeValue.toString+"]";
    } else if (typeof attributeValue === 'object') {
        html += "{"
        let first = true;
        for (const key in attributeValue) {
            if (!first)
                html += ", "
            html += key +" &rarr;"+ writeValueToHTML(attributeValue[key]);
            first = false;
        }
        html += "}"
    }
    return html;
  }

function displayXYZData(data, position) {
    tooltip.style.display = data ? '' : 'none';
    if (data) {
        overlay.setPosition(position);
        const attributeNames = Object.keys(data);
        let html = "";
        for (let i = 0; i < attributeNames.length; i++) {
            const attributeName = attributeNames[i];
            html += attributeName + ": ";
            html += writeValueToHTML(data[attributeName]);
            html += "<br/>"
        }
        tooltip.innerHTML = html;
    }
}

function displayGeoJSONData(event) {
    const pixel = event.pixel;
    const feature = map.forEachFeatureAtPixel(pixel, function(feature) {
        return feature;
    });
    tooltip.style.display = feature ? '' : 'none';
    if (feature) {
        overlay.setPosition(event.coordinate);
        const attributeNames = feature.getKeys();
        let html = "";
        for (let i = 0; i < attributeNames.length; i++) {
            const attributeName = attributeNames[i];
            if (attributeName != feature.getGeometryName()) {
                const attributeValue = feature.get(attributeName)
                html += attributeName + ": " + attributeValue + "<br/>"
            }
        }
        tooltip.innerHTML = html;
    }
};

export function displayDataset(dataset, type) {
    // https://gis.stackexchange.com/questions/302532/how-to-update-tile-source-url-at-zoom-change
    if (type == "large") {
        map.addLayer(new TileLayer({
            source: new XYZ({
                tileUrlFunction: function(tileCoord) {
                    return `https://star.cs.ucr.edu/dynamic/visualize.cgi/${dataset}/plot/tile-${tileCoord[0]}-${tileCoord[1]}-${tileCoord[2]}.png`
                },
                minZoom: 0,
                maxZoom: 19
            }),
            visible: true,
            preload: Infinity,
            useInterimTilesOnError: true
        }))
        map.on('click', function(event) {
            const px = event.pixel;
            const southwest = transform(map.getCoordinateFromPixel([px[0] - 3, px[1] + 3]), 'EPSG:3857', 'EPSG:4326');
            const northeast = transform(map.getCoordinateFromPixel([px[0] + 3, px[1] - 3]), 'EPSG:3857', 'EPSG:4326');
            const opx = map.getCoordinateFromPixel(event.pixel);
            const url = `https://star.cs.ucr.edu/datasets/${dataset}/view.geojson?mbr=${southwest[0]},${southwest[1]},${northeast[0]},${northeast[1]}`;
            (async() => {
                const response = await fetch(url);
                const data = await response.json();
                if(!data.out_bound) {
                    displayXYZData(data, opx);
                } else {
                    tooltip.style.display = 'none';
                }
            })();
        });
    } else {
        map.addLayer(new VectorLayer({
            source: new VectorSource({
                format: new GeoJSON(),
                url: `https://star.cs.ucr.edu/dynamic/download.cgi/${dataset}/data_index.geojson`
            }),
            style: function() {
                return new Style({
                    stroke: new Stroke({
                        color: 'black',
                        width: 1
                    }),
                    fill: new Fill({
                        color: 'rgba(211,211,211,0.5)'
                    })
                });
            },
            visible: true,
        }));
        map.getLayers().item(0).setOpacity(0.5);
        map.on('click', displayGeoJSONData);
    }
}

export {view, transform}