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


proj4.defs("EPSG:32644", "+proj=utm +zone=44 +datum=WGS84 +units=m +no_defs");
ol.proj.proj4.register(proj4);

const urlParams = new URLSearchParams(window.location.search);
var villageCode = urlParams.get('code');
if (villageCode === null || villageCode === undefined) {
    villageCode = '643015';
}
//alert(villageCode);

const vectorSource = new ol.source.Vector({
    format: new ol.format.GeoJSON(),
    url: 'data/' + villageCode + '.json?r=' + Math.random()
});

// Once the source is loaded and ready
vectorSource.once('change', function () {
    if (vectorSource.getState() === 'ready') {
      
        const extent = vectorSource.getExtent();
        const center = ol.extent.getCenter(extent);

        console.log("Center of the layer extent:", center);

        // You can then use this center to set the view's center
        map.getView().setCenter(center);
    }
});

const vectorLayer = new ol.layer.VectorImage({
    //background: 'red',
    source: vectorSource,
    style: function (feature) {
        const id = feature.getId() || feature.ol_uid;       
        const label = feature.get('LPNo');
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
        url: 'https://mt{0-3}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', //m - road, s - sattilite, y - hybrid
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

        // Reset style of previously selected feature
        if (currentFeature) {
            currentFeature.setStyle(null); // Reverts to layer's default style
        }

        
        feature.setStyle(new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 0, 0, 0.2)',
            }),
            stroke: new ol.style.Stroke({
                color: '#FF0000',
                width: 3,
            }),  
            zIndex: 1000
        }));


        //labelStyle.getText().setText(feature.get('l') + '\n' + feature.get('n'));

        if (feature !== currentFeature) {
            if (feature.get('a') != 0) {
                var code = '0' + feature.get('Code');
                var lpno = feature.get('LPNo')

                //const geometry = feature.getGeometry();

                const area2 = calculateUTMAreaInAcres(feature);
              
                    // Calculates area in square meters using spherical calculation
                //const area = geometry.getArea(geometry) * 0.000247105;
                   // console.log("Area (m²):", area);
               
                //fetch('https://bhunaksha.ap.gov.in/bhunakshalpm/rest/LPMReport/getweblandonedata?state=28&vsrno={code}&plotNo={lpno}', {
                //    method: 'GET',
                //    credentials: 'omit', // Exclude cookies and authentication headers
                //    referrerPolicy: 'no-referrer',
                //    mode: 'no-cors'
                //})
                //    .then(response => response.text())
                //    .then(data => console.log(data))
                //    .catch(error => console.error('Error:', error));

                content.innerHTML = 'LP No: ' + feature.get('LPNo') + '<br/>Area: ' + area2.toFixed(2) + ' Acres<br/>Data link: <a rel="noreferrer" target="_blank" href="https://bhunaksha.ap.gov.in/bhunakshalpm/rest/LPMReport/getweblandonedata?state=28&vsrno=' + code + '&plotNo=' + lpno + '">link</a>';
            }
            else {
                content.innerHTML = '<p>You clicked here:</p><code>click</code>';
            }
        }
    } 

    currentFeature = feature;   
    overlay.setPosition(coordinate);
});

map.on('addfeature', function () {
    console.log('vectorLayer on');
    view.fit(vectorLayer.getExtent(), {
        padding: [50, 50, 50, 50], // Optional padding around the extent
        duration: 1000 // Optional animation duration in milliseconds
    });
});

closer.onclick = function () {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
};

function calculateUTMAreaInAcres(polygonFeature) {
    // 2. Get the geometry of your drawn polygon
    const geometry = polygonFeature.getGeometry();

    // 3. Clone and transform from your map's projection (usually Web Mercator 3857) to UTM 44N
    const utmGeometry = geometry.clone().transform('EPSG:3857', 'EPSG:32644');

    // 4. Get the planar area in square meters
    const areaSqMeters = utmGeometry.getArea();

    // 5. Convert to Acres
    const areaAcres = areaSqMeters * 0.000247105;

    return areaAcres;
}
