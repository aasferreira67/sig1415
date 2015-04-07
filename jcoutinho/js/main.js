window.app = {};
var app = window.app;


/**
 * @constructor
 * @extends {ol.interaction.Pointer}
 */








    /**/

    var maxExtent = ol.proj.transformExtent([-8.870560,41.029011,-8.323991,40.438993], 'EPSG:4326', 'EPSG:3857');




    function init(){



    app.Drag = function() {
      ol.interaction.Pointer.call(this, {
        handleDownEvent: app.Drag.prototype.handleDownEvent,
        handleDragEvent: app.Drag.prototype.handleDragEvent,
        handleMoveEvent: app.Drag.prototype.handleMoveEvent,
        handleUpEvent: app.Drag.prototype.handleUpEvent
      });

      /**
       * @type {ol.Pixel}
       * @private
       */
      this.coordinate_ = null;

      /**
       * @type {string|undefined}
       * @private
       */
      this.cursor_ = 'pointer';

      /**
       * @type {ol.Feature}
       * @private
       */
      this.feature_ = null;

      /**
       * @type {string|undefined}
       * @private
       */
      this.previousCursor_ = undefined;

    };




    ol.inherits(app.Drag, ol.interaction.Pointer);




    /**
     * @param {ol.MapBrowserEvent} evt Map browser event.
     * @return {boolean} `true` to start the drag sequence.
     */
    app.Drag.prototype.handleDownEvent = function(evt) {
      var map = evt.map;

      var feature = map.forEachFeatureAtPixel(evt.pixel,
          function(feature, layer) {
            return feature;
          });

      if (feature) {
        this.coordinate_ = evt.coordinate;
        this.feature_ = feature;
      }

      return !!feature;
    };






    /**
     * @param {ol.MapBrowserEvent} evt Map browser event.
     */
    app.Drag.prototype.handleDragEvent = function(evt) {
      var map = evt.map;

      var feature = map.forEachFeatureAtPixel(evt.pixel,
          function(feature, layer) {
            return feature;
          });

      var deltaX = evt.coordinate[0] - this.coordinate_[0];
      var deltaY = evt.coordinate[1] - this.coordinate_[1];

      var geometry = /** @type {ol.geom.SimpleGeometry} */
          (this.feature_.getGeometry());
      geometry.translate(deltaX, deltaY);

      this.coordinate_[0] = evt.coordinate[0];
      this.coordinate_[1] = evt.coordinate[1];
    };







    /**
     * @param {ol.MapBrowserEvent} evt Event.
     */
    app.Drag.prototype.handleMoveEvent = function(evt) {
      if (this.cursor_) {
        var map = evt.map;
        var feature = map.forEachFeatureAtPixel(evt.pixel,
            function(feature, layer) {
              return feature;
            });
        var element = evt.map.getTargetElement();
        if (feature) {
          if (element.style.cursor != this.cursor_) {
            this.previousCursor_ = element.style.cursor;
            element.style.cursor = this.cursor_;
          }
        } else if (this.previousCursor_ !== undefined) {
          element.style.cursor = this.previousCursor_;
          this.previousCursor_ = undefined;
        }
      }
    };






    /**
     * @param {ol.MapBrowserEvent} evt Map browser event.
     * @return {boolean} `false` to stop the drag sequence.
     */
    app.Drag.prototype.handleUpEvent = function(evt) {
      this.coordinate_ = null;
      this.feature_ = null;
        console.log(evt.coordinate);
      refreshPath();
      return false;
    };









        //Definição do mapa
        map = new ol.Map({
                interactions: ol.interaction.defaults().extend([new app.Drag()]),
            	layers:[
			        new ol.layer.Tile({
					        source: new ol.source.OSM()
			        })
		        ],
                target:'mapa',
                renderer:'canvas',
            	view: new ol.View({
            		projection: 'EPSG:3857',
            		center:ol.proj.transform([-8.651697, 40.641121], 'EPSG:4326', 'EPSG:3857'),
            		extent:maxExtent,
            		zoom:13,
            		minZoom:13,
            		maxZoom:22
            	})
        });    
        var params = {
          LAYERS: 'routing:pgrouting',
          FORMAT: 'image/png'
        };
        // As features "ponto de partida" e "ponto de destino".
        var pontoInicial = new ol.Feature();
        var pontoDestino = new ol.Feature();
        // O layer vetorial utilizado para apresentar
        //as entidades ponto de partida e ponto de chegada .
        var layerVetorial = new ol.layer.Vector({
          		source: new ol.source.Vector({
	          		features: [pontoInicial, pontoDestino]
	          	})
        });
        map.addLayer(layerVetorial);
        // Função de transformação para converter coordenadas de 
        // EPSG:3857 para EPSG:4326.
        var transform = ol.proj.getTransform('EPSG:3857', 'EPSG:4326');



        function refreshPath() {
            if (pontoInicial.getGeometry() == null || pontoDestino.getGeometry() == null)
                return;

            var coordInicial = transform(pontoInicial.getGeometry().getCoordinates());
            var coordDestino = transform(pontoDestino.getGeometry().getCoordinates());
            var viewparams = [
              'x1:' + coordInicial[0], 'y1:' + coordInicial[1],
              'x2:' + coordDestino[0], 'y2:' + coordDestino[1]
            ];
            params.viewparams = viewparams.join(';');
            resultado = new ol.layer.Image({
              source: new ol.source.ImageWMS({
                url: 'http://localhost:8080/geoserver/wms?',
                params: params
              })
            });
            map.addLayer(resultado);
        };


        // Registar um listener "click" no mapa.
        map.on('click', function(event) {
            console.log(event.coordinate);
          if (pontoInicial.getGeometry() == null) {
            // Primeiro click.
            pontoInicial.setGeometry(new ol.geom.Point(event.coordinate));
          } else if (pontoDestino.getGeometry() == null) {
            //Segundo click.
            pontoDestino.setGeometry(new ol.geom.Point(event.coordinate));
            // Transformar as coordenadas da projeção do mapa (EPSG:3857)
            // para a projeção dos dados na base de dados (EPSG:4326).
            refreshPath();
            /*var coordInicial = transform(pontoInicial.getGeometry().getCoordinates());
            var coordDestino = transform(pontoDestino.getGeometry().getCoordinates());
            var viewparams = [
              'x1:' + coordInicial[0], 'y1:' + coordInicial[1],
              'x2:' + coordDestino[0], 'y2:' + coordDestino[1]
            ];
            params.viewparams = viewparams.join(';');
            resultado = new ol.layer.Image({
              source: new ol.source.ImageWMS({
                url: 'http://localhost:8080/geoserver/wms?',
                params: params
              })
            });
            map.addLayer(resultado);*/
          }
        });


        var botaoLimpar = document.getElementById('limpar');
        botaoLimpar.addEventListener('click', function(event) {
          // Fazer reset ás entidades "ponto inicial" e "ponto destino".
          pontoInicial.setGeometry(null);
          pontoDestino.setGeometry(null);
          // Remover layer "resultado".
          map.removeLayer(resultado);
        });
        //Controlos	
	        //Attribution ("referências")
	        var omeuControloAttribution = new ol.control.Attribution({
		        className:'ol-attribution', //parâmetro por defeito
		        target:null, //parâmetro por defeito. Coloca as referências ("attribution") numa div
	        });	
	        map.addControl(omeuControloAttribution);
	        //Full Screen
	        var omeuControloFullScreen = new ol.control.FullScreen();
	        map.addControl(omeuControloFullScreen);
	        //Rodar mapa
	        var omeuControloRodarMapa = new ol.control.Rotate()
	        map.addControl(omeuControloRodarMapa);
	        //Barra de escala
	        var omeuControloBarraDeEscala = new ol.control.ScaleLine()
	        map.addControl(omeuControloBarraDeEscala);
	        //Zoom
	        var omeuControloZoom = new ol.control.Zoom();
	        map.addControl(omeuControloZoom);
	        //Coltrolo por defeito de Zoom, mas tem alguns parâmetros
	        //que pode modificar se o desejar:
	        //http://ol3js.org/en/master/apidoc/ol.control.Zoom.html
	        //Slider de zoom
	        var omeuControloZoomSlider = new ol.control.ZoomSlider();
	        map.addControl(omeuControloZoomSlider);
	        //Este controlo ajuda a fazer zoom, também
    }
