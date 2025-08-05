const container = document.getElementById('popup');
const content = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');

const labelStyle = new ol.style.Style({
    text: new ol.style.Text({
        font: '12px Roboto',
        overflow: true,
        fill: new ol.style.Fill({
            color: '#000',
        }),
        stroke: new ol.style.Stroke({
            color: '#fff',
            width: 3,
        }),
    }),
});
const countryStyle = new ol.style.Style({
    fill: new ol.style.Fill({
        color: 'rgba(0, 198, 0, 0.1)',
    }),
    stroke: new ol.style.Stroke({
        color: '#FFFFFF',
        width: 2,
    }),
});
const style = [countryStyle, labelStyle];

const urlParams = new URLSearchParams(window.location.search);
var villageCode = urlParams.get('code');
if (villageCode === null || villageCode === undefined) {
    villageCode = '643015';
}
//alert(villageCode);

const vectorLayer = new ol.layer.VectorImage({
    //background: 'red',
    source: new ol.source.Vector({
        url: 'data/' + villageCode + '.json?r=' + Math.random(),
        format: new ol.format.GeoJSON(),
    }),
    style: function (feature) {
        const id = feature.getId() || feature.ol_uid;       
        const label = feature.get('l') + '\n' + feature.get('n');
        labelStyle.getText().setText(label);
        return style;        
    },
    declutter: true,
});

// OSM Basemap
const rasterLayer = new ol.layer.Tile({
    source: new ol.source.OSM()
});


const overlay = new ol.Overlay({
    element: container,
    autoPan: {
        animation: {
            duration: 250,
        },
    },
});

var googleSatLayer = new ol.layer.Tile({
    source: new ol.source.XYZ({
        url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        crossOrigin: 'anonymous',
        attributions: '© Google'
    })
});

const info = document.getElementById('info');

let currentFeature;
const displayFeatureInfo = function (pixel, target) {
    const feature = target.closest('.ol-control')
        ? undefined
        : map.forEachFeatureAtPixel(pixel, function (feature) {
            return feature;
        });
    if (feature) {
        info.style.left = pixel[0] + 'px';
        info.style.top = pixel[1] + 'px';
        if (feature !== currentFeature) {
            if (feature.get('a') != 0) {
                info.style.visibility = 'visible';
                info.innerText = 'Relation Name: ' + feature.get('r') + '\n' + 'Acres: ' + feature.get('a');
            }
            else {
                info.style.visibility = 'hidden';
            }
        }
    } else {
        info.style.visibility = 'hidden';
    }
    currentFeature = feature;
};

var map = new ol.Map({
    target: 'map',
    layers: [googleSatLayer, vectorLayer],
    overlays: [overlay],
    view: new ol.View({
        center: ol.proj.fromLonLat([81.05190760944306, 16.299537635972154]),
        zoom: 15
    })
});


//map.on('click', function (evt) {
//    displayFeatureInfo(evt.pixel, evt.originalEvent.target);
//});

map.on('singleclick', function (evt) {
    const coordinate = evt.coordinate;
    //const hdms = toStringHDMS(toLonLat(coordinate));

    const pixel = evt.pixel;
    const feature = evt.originalEvent.target.closest('.ol-control')
        ? undefined
        : map.forEachFeatureAtPixel(pixel, function (feature) {
            return feature;
        });
    if (feature) {
      
        if (feature !== currentFeature) {
            if (feature.get('a') != 0) {
                content.innerHTML = 'LP No: '+ feature.get('l') +'<br/>Name: '+ feature.get('n') + '<br/>Relation Name: ' + feature.get('r') + '<br/>Acres: ' + feature.get('a');
            }
            else {
                content.innerHTML = '<p>You clicked here:</p><code>click</code>';
            }
        }
    } 

    currentFeature = feature;   
    overlay.setPosition(coordinate);
});

closer.onclick = function () {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
};
