window.app = {};
var app = window.app;


var maxExtent = ol.proj.transformExtent([-8.870560,41.029011,-8.323991,40.438993], 'EPSG:4326', 'EPSG:3857');
var params, viewparams, startNode, endNode;
var coordInicial, coordDestino;
var cDestino;

var startNode = new ol.Feature();
var endNode = new ol.Feature();


var layers = [
    {
        'key':'routing:pgrouting',
        'name':'routing:pgrouting',
        'format':'image/png'
    }
];

var baseLayers = [
    new ol.layer.Tile({
	    source: new ol.source.OSM({
		    url:'http://{a-c}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png'
	    })
    }),

    new ol.layer.Tile({
		source: new ol.source.Stamen({
        	layer: 'toner-lite'
        }),
		extent: maxExtent
    }),

    new ol.layer.Tile({
 		source: new ol.source.MapQuest({
 			layer: 'osm'
 		}),
 		extent: maxExtent
    }),

    new ol.layer.Tile({
		source: new ol.source.BingMaps({
			key: 'AvBCehWm6Ep1VVa23v2BM-SsqJ1X3hx7l5CRWAj3ThglltxV7J87lENctywpvfsS',
			imagerySet: 'Aerial'
		})
    })
];


var startStyle = [
	new ol.style.Style({
		image: new ol.style.Icon({
			opacity: 0.75,
			anchor: [0.5, 300],
			anchorXUnits: 'fraction',
			anchorYUnits: 'pixels',
			src: './img/start.png',
			scale: 0.15
		})
	}),
	new ol.style.Style({
		image: new ol.style.Circle({
			radius: 5,
			fill: new ol.style.Fill({
				color: 'rgba(230,120,30,0.7)'
			})
		})
	})
];

var endStyle = [
	new ol.style.Style({
		image: new ol.style.Icon({
  			opacity: 0.75,
  			anchor: [0.5, 90],
  			anchorXUnits: 'fraction',
  			anchorYUnits: 'pixels',
  			src: './img/finish.png',
  			scale: 0.5
  			}),
	}),
	new ol.style.Style({
		image: new ol.style.Circle({
			radius: 5,
			fill: new ol.style.Fill({
			color: 'rgba(230,120,30,0.7)'
			})
		})
	})
];


function findClosestNode(x, y, cb) {
    var json_url = "./scripts/pontoMaisProximo.php?";
	json_url += "x=" + x;
	json_url += "&y=" + y;
	$.ajax({
		url: json_url,
		async: true,
		success: function(data){
			var data = jQuery.parseJSON(data);
            cb(parseFloat(data[0].x), parseFloat(data[0].y));
		}
	});
};


function init() {

    view= new ol.View({
	    projection: 'EPSG:3857',
	    center:ol.proj.transform([-8.651697, 40.641121], 'EPSG:4326', 'EPSG:3857'),
	    extent:maxExtent,
	    zoom:13,
	    minZoom:4,
	    maxZoom:22
    });

    map = new ol.Map({
        //interactions: ol.interaction.defaults().extend([new app.Drag()]),
	    layers:baseLayers,
        target:'mapa',
        renderer:'canvas',
	    view:view
    });

    startNode.setStyle(startStyle);
    endNode.setStyle(endStyle);

    var layerVetorial = new ol.layer.Vector({
	    source: new ol.source.Vector({
      		features: [startNode, endNode]
      	})
    });

    map.addLayer(layerVetorial);

    // Função de transformação para converter coordenadas de 
    // EPSG:3857 para EPSG:4326.
    var transform = ol.proj.getTransform('EPSG:3857', 'EPSG:4326');

    map.on('click', function(event) {
        var x = event.coordinate[0], y = event.coordinate[1];

	    if (startNode.getGeometry() == null) {
		    var json_url = "./scripts/pontoMaisProximo.php?";
		    json_url += "x=" + x;
		    json_url += "&y=" + y;
            console.log(json_url);
        	$.ajax({url: json_url, async:false, success: function(data){
				    var data = jQuery.parseJSON(data);
				    startNode.setGeometry(new ol.geom.Point([data[0].x, data[0].y]));
				    console.log(cDestino);

		    }});
		    coordInicial = transform(startNode.getGeometry().getCoordinates());

		    document.getElementById("selectpicker").disabled = true;
		    console.log(cDestino);
		    if( typeof cDestino === 'undefined' || cDestino === null ) {$('.typeahead').disableSelection();} else{console.log(cDestino);addResultado(coordInicial,cDestino);document.getElementById("selectpicker").disabled = false;}
		
	    } else if (endNode.getGeometry() == null) {

            //Segundo click.

            findClosestNode(x,y, function(x,y) {
                endNode.setGeometry(new ol.geom.Point([x, y]));
                // Transformar as coordenadas da projeção do mapa (EPSG:3857)
                // para a projeção dos dados na base de dados (EPSG:4326).
                var coordInicial = transform(startNode.getGeometry().getCoordinates());
	            var coordDestino = transform(endNode.getGeometry().getCoordinates());
	            addResultado(coordInicial,coordDestino);
	            document.getElementById("selectpicker").disabled = false;
            });

        }
    });


    $('#selectpicker').change(function(){
    });
};

	
