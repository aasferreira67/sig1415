window.app = {};
var app = window.app;
var ngapp = angular.module('sigApp', []);


var maxExtent = ol.proj.transformExtent([-8.870560,41.029011,-8.323991,40.438993], 'EPSG:4326', 'EPSG:3857');


var layers = [
    {
        'key':'routing:pgr_deaparab_lenght',
        'name':'routing:pgr_deaparab_lenght',
        'format':'image/png'
    },
    {
        'key':'routing:pgr_deaparab_trsp_tempo',
        'name':'routing:pgr_deaparab_trsp_tempo',
        'format':'image/png'
    },
    {
        'key':'routing:pgr_deaparab_trsp_comprimento',
        'name':'routing:pgr_deaparab_trsp_comprimento',
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





ngapp.controller('mainController', function($scope) {
    $scope.algoritms = layers;
    $scope.algoritm = null;
    $scope.view = new ol.View({
	    projection: 'EPSG:3857',
	    center:ol.proj.transform([-8.651697, 40.641121], 'EPSG:4326', 'EPSG:3857'),
	    extent:maxExtent,
		zoom:13,
		minZoom:13,
		maxZoom:17
    });
    $scope.map = new ol.Map({
        //interactions: ol.interaction.defaults().extend([new app.Drag()]),
	    layers:[baseLayers[0]],
        target:'mapa',
        renderer:'canvas',
	    view:$scope.view
    });

    $scope.startNode = new ol.Feature();
    $scope.endNode = new ol.Feature();


    $scope.setAlgoritm = function(a) {
        $scope.algoritm = a;
        console.log("Algoritm set", a, $scope.startNode, $scope.endNode);

        if ($scope.startNode.getGeometry() != null && $scope.endNode.getGeometry() != null) {
            var coordInicial = transform($scope.startNode.getGeometry().getCoordinates());
            var coordDestino = transform($scope.endNode.getGeometry().getCoordinates());
            $scope.addResultado(coordInicial,coordDestino,$scope.algoritm.key, $scope.algoritm.format);
        }
    };

    $scope.clearRouting = function() {
          $scope.startNode.setGeometry(null);
          $scope.endNode.setGeometry(null);
          // Remover layer "resultado".
          $scope.map.removeLayer(resultado);
          $scope.coordDestino = null;
    };

    $scope.findClosestNode = function(x, y, cb) {
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


    $scope.addResultado = function (coordInicial,coordDestino, layer, format) {
        viewparams = [
          'x1:' + coordInicial[0], 'y1:' + coordInicial[1],
          'x2:' + coordDestino[0], 'y2:' + coordDestino[1]
        ];
        params = {
            LAYERS: layer,
            FORMAT: format
        };
        params.viewparams = viewparams.join(';');

        console.log(params);
        resultado = new ol.layer.Image({
          source: new ol.source.ImageWMS({
            name:'resultado',
            url: 'http://localhost:8080/geoserver/wms?',
            params: params
          })
        });   
        //var extent = layerVetorial.getSource().getExtent();
        //map.getView().fitExtent(extent, map.getSize());
       $scope.map.addLayer(resultado);
    };


    // main()

    $scope.startNode.setStyle(startStyle);
    $scope.endNode.setStyle(endStyle);

    var layerVetorial = new ol.layer.Vector({
	    source: new ol.source.Vector({
      		features: [$scope.startNode, $scope.endNode]
      	})
    });

    $scope.map.addLayer(layerVetorial);

    var transform = ol.proj.getTransform('EPSG:3857', 'EPSG:4326');


    $scope.map.on('click', function(event) {
        var x = event.coordinate[0], y = event.coordinate[1];

	    if ($scope.startNode.getGeometry() == null) {
		    var json_url = "./scripts/pontoMaisProximo.php?";
		    json_url += "x=" + x;
		    json_url += "&y=" + y;
            console.log(json_url);
        	$.ajax({url: json_url, async:false, success: function(data){
			    var data = jQuery.parseJSON(data);
			    $scope.startNode.setGeometry(new ol.geom.Point([data[0].x, data[0].y]));
		    }});
		    $scope.coordInicial = transform($scope.startNode.getGeometry().getCoordinates());

	    } else if ($scope.endNode.getGeometry() == null) {

             $scope.findClosestNode(x,y, function(x,y) {
                $scope.endNode.setGeometry(new ol.geom.Point([x, y]));
                $scope.coordDestino = transform($scope.endNode.getGeometry().getCoordinates());
	            $scope.addResultado($scope.coordInicial, $scope.coordDestino, $scope.algoritm.key, $scope.algoritm.format);
            });

        }
    });

});

