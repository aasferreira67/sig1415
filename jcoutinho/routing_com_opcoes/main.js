var map;
var maxExtent = ol.proj.transformExtent([-8.870560,41.029011,-8.323991,40.438993], 'EPSG:4326', 'EPSG:3857')

/*
var styleCache = {};
var geoLayer = new ol.layer.Vector({
    source : new ol.source.GeoJSON({
		projection : 'EPSG:900913',
		url : './dados/myGeoJSON.geojson'
	}),
	style : function(feature, resolution) {
		var text = resolution < 5000 ? feature.get('name') : '';
		if (!styleCache[text]) {
			styleCache[text] = [new ol.style.Style({
				fill : new ol.style.Fill({
					color : 'rgba(255, 255, 255, 0.1)'
				}),
				stroke : new ol.style.Stroke({
					color : '#319FD3',
					width : 1
				}),
				text : new ol.style.Text({
					font : '12px Calibri,sans-serif',
					text : text,
					fill : new ol.style.Fill({
						color : '#000'
					}),
					stroke : new ol.style.Stroke({
						color : '#fff',
						width : 3
					})
				}),
				zIndex : 999
			})];
		}
		return styleCache[text];
	}
});
*/
function init(){

var layers = [];

layers[0] = new ol.layer.Tile({ 
		source: new ol.source.Stamen({
        	layer: 'watercolor'}),extent: maxExtent });
layers[1] = new ol.layer.Tile({
		source: new ol.source.Stamen({
        	layer: 'toner-lite'}),extent: maxExtent });
layers[2] = new ol.layer.Tile({ source: new ol.source.MapQuest({layer: 'osm'}),extent: maxExtent });
layers[3] = new ol.layer.Tile({ source: new ol.source.OSM(),extent: maxExtent });


    map = new ol.Map({
        target:'map',
        renderer:'canvas',
        layers:layers,
    	view: new ol.View({
    		projection: 'EPSG:3857',				center:ol.proj.transform([-8.641495, 40.639384], 'EPSG:4326', 'EPSG:3857'),
    		extent:maxExtent,
    		zoom:13,
    		minZoom:13,
    		maxZoom:22
    	})
    });
 
 
 var bingm = new ol.layer.Tile({ source: new ol.source.BingMaps({key: 'AvBCehWm6Ep1VVa23v2BM-SsqJ1X3hx7l5CRWAj3ThglltxV7J87lENctywpvfsS',imagerySet: 'Aerial'}) });
 
 
 	map.addLayer(bingm);
 
 
 /*   
    var newLayer = new ol.layer.Tile({
    source: new ol.source.OSM()
	});

	map.addLayer(newLayer);
	
	
	var vectorLayer = new ol.layer.Tile({
	source: new ol.source.TileWMS({
		preload: Infinity,
		url: 'http://felek.cns.umass.edu:8080/geoserver/wms',
		serverType:'geoserver',
		params:{
			'LAYERS':"Streams:Developed", 'TILED':true
			}
		})
	});
	
	//vectorLayer.setOpacity(.3);
	
	map.addLayer(vectorLayer);
	
	var vectorLayer_2 = new ol.layer.Tile({
	source: new ol.source.TileWMS({
		preload: Infinity,
		url: 'http://felek.cns.umass.edu:8080/geoserver/wms',
		serverType:'geoserver',
		params:{
			'LAYERS':"Streams:Deposition_of_Nitrogen", 'TILED':true
			}
		})
	});
	
	map.addLayer(vectorLayer_2);
	
	map.addLayer(geoLayer);
	

*/	
	//Attribution
var myAttributionControl = new ol.control.Attribution({
  className:'ol-attribution', //default parameter
  target:null, //default parameter. Places attribution in a div
});
map.addControl(myAttributionControl);

//This is a default control. If you felt like destroying someone else's credit, you could use the css reference to stop displaying the attribution.

//Mouse Position
var mousePositionControl = new ol.control.MousePosition({
  className:'ol-full-screen', //default parameter
  coordinateFormat:ol.coordinate.createStringXY(4), //This is the format we want the coordinate in. 
  //The number arguement in createStringXY is the number of decimal places.
  projection:"EPSG:4326", //This is the actual projection of the coordinates. 
  //Luckily, if our map is not native to the projection here, the coordinates will be transformed to the appropriate projection.
  className:"custom-mouse-position",
  target:undefined, //define a target if you have a div you want to insert into already,
  undefinedHTML: '&nbsp;' //what openlayers will use if the map returns undefined for a map coordinate.
});
map.addControl(mousePositionControl);

//Full Screen
var myFullScreenControl = new ol.control.FullScreen();
map.addControl(myFullScreenControl);

//Rotate
var myRotateControl = new ol.control.Rotate()
map.addControl(myRotateControl);

//ScaleLine
var myScaleLine = new ol.control.ScaleLine()
map.addControl(myScaleLine);
//I often use the scale line. The default implementation looks nice.

//Zoom
var myZoom = new ol.control.Zoom();
map.addControl(myZoom);
//Zoom is a default control, but there are some parameters you could change if you wanted:
//Check them out here: http://ol3js.org/en/master/apidoc/ol.control.Zoom.html


//ZoomSlider
var myZoomSlider = new ol.control.ZoomSlider();
map.addControl(myZoomSlider);
//The zoom slider is a nice addition to your map. It is wise to have it accompany your zoom buttons.

//ZoomToExtent
/*var myExtentButton = new ol.control.ZoomToExtent({
    extent:undefined
});
map.addControl(myExtentButton);
//This is a complicated button. We will implement this in a special way. The key for this
//is to create an extent and pass it to the button. If undefined, the extent is the entire map.
*/	
	
	
	
	
	
	var radius = 175;
$(document).keydown(function(evt) {
  if (evt.which === 38) {
    radius = Math.min(radius + 5, 150);
    map.render();
  } else if (evt.which === 40) {
    radius = Math.max(radius - 5, 25);
    map.render();
  }
});

// get the pixel position with every move
var mousePosition = null;
$(map.getViewport()).on('mousemove', function(evt) {
  mousePosition = map.getEventPixel(evt.originalEvent);
  map.render();
}).on('mouseout', function() {
  mousePosition = null;
  map.render();
});

// before rendering the layer, do some clipping
bingm.on('precompose', function(event) {
  var ctx = event.context;
  var pixelRatio = event.frameState.pixelRatio;
  ctx.save();
  ctx.beginPath();
  if (mousePosition) {
    // only show a circle around the mouse
    ctx.arc(mousePosition[0] * pixelRatio, mousePosition[1] * pixelRatio,
        radius * pixelRatio, 0, 2 * Math.PI);
    ctx.lineWidth = 5 * pixelRatio;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.stroke();
  }
  ctx.clip();
});

// after rendering the layer, restore the canvas context
bingm.on('postcompose', function(event) {
  var ctx = event.context;
  ctx.restore();
});
	
	
	function switchLayer()
 {
  var checkedLayer = $('#layerswitcher input[name=layer]:checked').val();
  for (i = 0, ii = layers.length; i < ii; ++i) layers[i].setVisible(i==checkedLayer);
 }

$(function() { switchLayer() } );
$("#layerswitcher input[name=layer]").change(function() { switchLayer() } );
	
	
	}
	
	function removeTopLayer(){
    var layers = map.getLayers();
    layers.pop();
	}
	
	function swapTopLayer(){
    var layers = map.getLayers();
	var topLayer = layers.removeAt(2);
	layers.insertAt(1, topLayer);
	}
	