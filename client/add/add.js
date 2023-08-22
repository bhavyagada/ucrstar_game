import Map from './ol/Map.js';
import View from './ol/View.js';
import Overlay from './ol/Overlay.js';
import TileLayer from './ol/layer/Tile.js';
import OSM from './ol/source/OSM.js';
import { defaults as defaultControls } from './ol/control/defaults.js';
// import { transform, transformExtent, getTransform } from '../node_modules/ol/proj';
// import * as olExtent from '../node_modules/ol/extent';
// import { fromExtent } from '../node_modules/ol/geom/Polygon';
// import VectorLayer from '../node_modules/ol/layer/Vector';
// import VectorSource from '../node_modules/ol/source/Vector';
// import { Style, Stroke, Fill } from '../node_modules/ol/style';
// import XYZ from '../node_modules/ol/source/XYZ';
// import GeoJSON from '../node_modules/ol/format/GeoJSON';

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
    controls: defaultControls(),
    target: 'map',
    layers: layers,
    overlays: tooltipOverlay,
    view: view
});