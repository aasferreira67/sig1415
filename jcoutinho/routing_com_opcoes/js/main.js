/*
Ex. Como criar novo algoritmo routing com geoserver:
1) correr a query (substituir XPTO por novo nome):
    CREATE OR REPLACE FUNCTION public.pgr_deaparab_trsp_XPTO(IN tbl character varying, IN x1 double precision, IN y1 double precision, IN x2 double precision, IN y2 double precision, OUT seq integer, OUT gid integer, OUT name text, OUT heading double precision, OUT cost double precision, OUT geom geometry)
      RETURNS SETOF record AS
    $BODY$
    DECLARE
    sql text;
    rec record;
    source integer;
    target integer;
    point integer;
    BEGIN
    -- Find nearest node
    EXECUTE 'SELECT id::integer FROM rede_viaria_bv_vertex
    ORDER BY geom_vertex <-> ST_GeometryFromText(''POINT('
    || x1 || ' ' || y1 || ')'',3857) LIMIT 1' INTO rec;
    source := rec.id;
    EXECUTE 'SELECT id::integer FROM rede_viaria_bv_vertex
    ORDER BY geom_vertex <-> ST_GeometryFromText(''POINT('
    || x2 || ' ' || y2 || ')'',3857) LIMIT 1' INTO rec;
    target := rec.id;
     
    -- Shortest path query (TODO: limit extent by BBOX)
    seq := 0;
    sql := 'SELECT id, geom_way, osm_name AS name, rede_viaria_bv.cost, source, target, ST_Reverse(geom_way) AS flip_geom FROM ' ||
    'pgr_trsp(''SELECT id, source::int, target::int, '
    || 'length_km::float AS cost, reverse_cost_length_km::float AS reverse_cost FROM '
    || quote_ident(tbl) || '''::text' || ', '
    || source || ', '
    || target || ', '
    || 'true, true, '
    || '''SELECT to_cost, to_edge AS target_id, from_edge||COALESCE('''',''''||via,'''''''') AS via_path FROM restrictions''::text), '
    || quote_ident(tbl)
    || ' WHERE id = id2 ORDER BY seq';
     
    -- Remember start point
    point := source;
     
    FOR rec IN EXECUTE sql
    LOOP
    -- Flip geometry (if required)
    IF ( point != rec.source ) THEN
    rec.geom_way := rec.flip_geom;
    point := rec.source;
    ELSE
    point := rec.target;
    END IF;
     
    -- Calculate heading (simplified)
    EXECUTE 'SELECT degrees( ST_Azimuth(
    ST_StartPoint(''' || rec.geom_way::text || '''),
    ST_EndPoint(''' || rec.geom_way::text || ''') ) )'
    INTO heading;
     
    -- Return record
    seq := seq + 1;
    gid := rec.id;
    name := rec.name;
    cost := rec.cost;
    geom := rec.geom_way;
    RETURN NEXT;
    END LOOP;
    RETURN;
    END;
    $BODY$
      LANGUAGE plpgsql VOLATILE STRICT
      COST 100
      ROWS 1000;
    ALTER FUNCTION public.pgr_deaparab_trsp_XPTO(character varying, double precision, double precision, double precision, double precision)
      OWNER TO postgres;


2. No geoserver, criar um novo Layer:
    2.1 Configure new SQL view...
    2.2 
        View Name: pgr_deaparab_trsp_XPTO
        SQL:
            SELECT ST_MakeLine (rota.geom) FROM
            (SELECT geom FROM
            pgr_deaparab_trsp_XPTO('rede_viaria_bv', %x1%, %y1%, %x2%, %y2%)
            ORDER BY seq) AS rota

    2.3 Guess parameters from SQL
        x1...y2  
            default value: 0      
            Validation regular expression: ^-?[\d.]+$
    2.4 Attributes refresh:
        Type: LineString
        SRID: 4326
    2.5 Save
    2.6 Declared SRS: EPSG:3857
    2.7 SRS handling: Reproject native to declared
    2.8 Compute from data
    2.9 Compute from native bounds
    2.10 Save
*/

var ngapp = angular.module('sigApp', []);

var maxExtent = ol.proj.transformExtent([-8.870560,41.029011,-8.323991,40.438993], 'EPSG:4326', 'EPSG:3857');

var routingLayers = [
    {
        'key':'routing:pgr_deaparab_trsp_tempo',
        'name':'Tempo (TRSP)',
        'format':'image/png'
    },
    {
        'key':'routing:pgr_deaparab_trsp_comprimento',
        'name':'Comprimento (TRSP)',
        'format':'image/png'
    },
    {
        'key':'routing:xpto',
        'name':'XPTO',
        'format':'image/png'
    },
    {
        'key':'routing:dd',
        'name':'dd (driving distance)',
        'format':'image/png'
    }
];

var baseLayers = [
    {
        obj: new ol.layer.Tile({
	        source: new ol.source.OSM({
		        url:'http://{a-c}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png'
	        })
            }),
        name: 'OpenCycleMap'
    },

    {
        obj: new ol.layer.Tile({
		    source: new ol.source.Stamen({
            	layer: 'toner-lite'
            }),
		    extent: maxExtent
            }),
        name: 'Toner'
    },

    {
        obj: new ol.layer.Tile({
     		source: new ol.source.MapQuest({
     			layer: 'osm'
     		}),
     		extent: maxExtent
            }),
        name: 'OSM'
    },

    {
        obj: new ol.layer.Tile({
		    source: new ol.source.BingMaps({
			    key: 'AvBCehWm6Ep1VVa23v2BM-SsqJ1X3hx7l5CRWAj3ThglltxV7J87lENctywpvfsS',
			    imagerySet: 'AerialWithLabels'
		    })
            }),
        name: 'Bing/Aerial'
    }
];


var startStyle = [
	new ol.style.Style({
		image: new ol.style.Icon({
			opacity: 1.0,
			anchor: [0.5, 200.0],
			anchorXUnits: 'fraction',
			anchorYUnits: 'pixels',
			src: './img/bicycle-icon.png',
			scale: 0.35
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
  			anchor: [0.25, 500.0],
  			anchorXUnits: 'fraction',
  			anchorYUnits: 'pixels',
  			src: './img/map-pin.png',
  			scale: 0.10
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
    var transform = ol.proj.getTransform('EPSG:3857', 'EPSG:4326');
    $scope.algoritms = routingLayers;
    $scope._baseLayers = baseLayers;
    $scope.algoritm = null;
    $scope._routeLayer = new ol.layer.Image();
    $scope._baseLayer = new ol.layer.Tile();
    $scope.baseLayer = $scope._baseLayers[0];
    $scope.startNode = new ol.Feature();
    $scope.endNode = new ol.Feature();
    $scope.distance = 1;
    $scope.startEndLayer = new ol.layer.Vector({
	    source: new ol.source.Vector({
      		features: [$scope.startNode, $scope.endNode]
      	})
    });

    $scope.view = new ol.View({
	    projection: 'EPSG:3857',
	    center:ol.proj.transform([-8.651697, 40.641121], 'EPSG:4326', 'EPSG:3857'),
	    extent:maxExtent,
		zoom:13,
		minZoom:13,
		maxZoom:17
    });

    $scope.map = new ol.Map({
        target:'mapa',
        renderer:'canvas',
	    view:$scope.view
    });

    $scope.setAlgoritm = function(a) {
        $scope.algoritm = a;
        console.log("Algoritm set", a, $scope.startNode, $scope.endNode);


        if ($scope.startNode.getGeometry() != null && $scope.endNode.getGeometry() != null) {
            var coordInicial = transform($scope.startNode.getGeometry().getCoordinates());
            var coordDestino = transform($scope.endNode.getGeometry().getCoordinates());
            $scope.updateRoute(coordInicial,coordDestino,$scope.algoritm.key, $scope.algoritm.format);
        } else if ($scope.startNode.getGeometry() != null && $scope.algoritm.key == 'routing:dd') {
            $scope.updateDD();
        } else if ($scope.startNode.getGeometry() != null && $scope.algoritm.key == 'routing:xpto') {
            $scope.updateDD();
        }
    };

    $scope.setBaseLayer = function(a) {
        console.log("a",a);
        $scope.baseLayer = a;
        $scope._baseLayer.setSource(a.obj.getSource());
        console.log("Base layer set", a);
    };


    $scope.setSchool = function(a) {
        alert("Escola escolhida");
    };


    $scope.clearRouting = function() {
        $scope.startNode.setGeometry(null);
        $scope.endNode.setGeometry(null);
        $scope.coordDestino = null;
        $scope._routeLayer.setSource(null);
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


    $scope.updateRoute = function (coordInicial,coordDestino, layer, format) {
        viewparams = [
          'x1:' + coordInicial[0], 'y1:' + coordInicial[1],
          'x2:' + coordDestino[0], 'y2:' + coordDestino[1]
        ];
        params = {
            LAYERS: layer,
            FORMAT: format
        };
        params.viewparams = viewparams.join(';');

        $scope._routeLayer.setSource(new ol.source.ImageWMS({
            name:'resultado',
            url: 'http://localhost:8080/geoserver/wms?',
            params: params
        }));
    };

    $scope.$watch("distance", function(new_, val_) {
        if (new_ != val_) {
            $scope.updateDD();
        }
    });


    $scope.updateDD = function() {
        if ($scope.algoritm.key == 'routing:dd' || $scope.algoritm.key == 'routing:xpto') {
            viewparams = [
              'x:' + $scope.coordInicial[0], 'y:' + $scope.coordInicial[1], 
              'distance:' + ((parseFloat($scope.distance) / 60.0))
            ];
            params = {
                LAYERS: $scope.algoritm.key,
                FORMAT: $scope.algoritm.format
            };
            params.viewparams = viewparams.join(';');

            $scope._routeLayer.setSource(new ol.source.ImageWMS({
                name:'resultado',
                url: 'http://localhost:8080/geoserver/wms?',
                params: params
            }));
        }
    }

    // main()

    $scope.startNode.setStyle(startStyle);
    $scope.endNode.setStyle(endStyle);

    $scope.setBaseLayer($scope.baseLayer);

	$scope.map.addLayer($scope._baseLayer);
    $scope.map.addLayer($scope.startEndLayer);
    $scope.map.addLayer($scope._routeLayer);

    $scope.map.on('click', function(event) {
        var x = event.coordinate[0], y = event.coordinate[1];

	    if ($scope.startNode.getGeometry() == null) {
		    var json_url = "./scripts/pontoMaisProximo.php?";
		    json_url += "x=" + x;
		    json_url += "&y=" + y;
        	$.ajax({url: json_url, async:false, success: function(data){
			    var data = jQuery.parseJSON(data);
			    $scope.startNode.setGeometry(new ol.geom.Point([data[0].x, data[0].y]));
		    }});
		    $scope.coordInicial = transform($scope.startNode.getGeometry().getCoordinates());

            if ($scope.algoritm.key == 'routing:dd' || $scope.algoritm.key == 'routing:xpto') {
                $scope.updateDD();
            }
	    } else if ($scope.endNode.getGeometry() == null) {
            if ($scope.algoritm.key == 'routing:dd' || $scope.algoritm.key == 'routing:xpto') {} else {
                 $scope.findClosestNode(x,y, function(x,y) {
                    $scope.endNode.setGeometry(new ol.geom.Point([x, y]));
                    $scope.coordDestino = transform($scope.endNode.getGeometry().getCoordinates());
	                $scope.updateRoute($scope.coordInicial, $scope.coordDestino, $scope.algoritm.key, $scope.algoritm.format);
                });
            }
        }
    });

    $scope.setAlgoritm(routingLayers[0]);

});

