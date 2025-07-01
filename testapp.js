mapboxgl.accessToken = 'pk.eyJ1IjoiZ2F6dGFzdGljIiwiYSI6ImNrYzA4Y2c4NjFoYnIyeHRicmZuaTgyMGQifQ.fkkbIOCwq4j70CqNeiBGcA';

let server_url = 'http://localhost:8111/flooding';

function getFilenameAndExtension(pathfilename){

  var filenameextension = pathfilename.replace(/^.*[\\\/]/, '');
  var filename = filenameextension.substring(0, filenameextension.lastIndexOf('.'));
  var ext = filenameextension.split('.').pop();

  return [filename, ext];
}

class FloodMapComponent  extends HTMLComponent {
    constructor() {
        super();

        this.map_root = undefined;

        this.center = [8.76, 51.63];
        this.zoom = 15;
        this.bearing = 0;
        this.pitch = 0;

        this.popup = undefined;
        this.style = '';
        this.style = 'mapbox://styles/mapbox/streets-v12';
        this.buildings = true;

        this.add_navigation = true;
        this.add_scale = true;

        this.style_has_loaded = false;
        this.terrain_exaggeration = 1.5;
        this.show_buildings = true;

        this.elements = {};
        this.current_style_name = '';
        this.current_building_style_name = '';
        this.current_view_style_name = '';

        this.style_labels = ['Vector', 'Satellite'];
        this.building_labels = ['On', 'Off'];
        this.view_labels = ['3D', '2D'];

        this.current_layer_name = '';
        this.layer_data = {};
    }

    oneTimeInit() {
        super.oneTimeInit();

        this.current_style_name = this.style_labels[0];
        this.current_building_style_name = this.building_labels[0];
        this.current_view_style_name = this.view_labels[0];
    }

    onShow(parent) {
        super.onShow(parent);

        this.elements = {};
        let self = this;

        this.content = document.createElement('div');
        this.content.id = this.get_ID();
        this.content.className = 'Square';
        this.content.style.width = "100%";
        this.content.style.height = "100vh";
        this.content.style.backgroundColor = this.bg_colour;
        this.root.appendChild(this.content);

        this.map_root = document.createElement('div');
        this.map_root.id = 'map';
        this.map_root.style.position = 'absolute';
        this.map_root.style.top = '54px';
        this.map_root.style.bottom = '0px';
        this.map_root.style.width = '100%';

        this.content.appendChild(this.map_root);

        let top = '70px';
        let content_root = this.content;

        this.elements['map.info.textbox'] = new Mapbox_Textbox(content_root, {
            'left': '1vw',
            'top': '120px',
            'width': '20%',
            'min-width': '300px',
        });

        this.elements['map.info.textbox'].set_text('Depth: n/a');

        this.elements['map.flood.legend'] = new Mapbox_LegendList(content_root,{
            'left': '1vw',
            'top': '170px',
        });

        this.elements['map_style'] = new Mapbox_dropdown(content_root, {
            'left': '1vw',
            'top': top,
            'width': 'max(160px, 10vw)',
        });

        this.elements['map_buildings'] = new Mapbox_dropdown(content_root, {
            'left': 'max(180px, 12vw)',
            'top': top,
            'width': 'max(140px, 10vw)',
        });

        this.elements['map_projection'] = new Mapbox_dropdown(content_root, {
            'left': 'max(330px, 23vw)',
            'top': top,
            'width': 'max(120px, 10vw)',
        });

        this.elements['map.sources.dropdown'] = new Mapbox_dropdown(content_root, {
            'left': 'max(470px,34vw)',
            'top': top,
            'width': 'max(350px, 10vw)',
        });


        this.elements['map.pos.textbox'] = new Mapbox_Textbox(content_root, {
            'left': 'calc(100% - 375px)',
            'top': top,
            'width': 'max(300px, 3vw)'
        } );

        //fill out content for map dropboxes

        for(let i=0;i < self.style_labels.length;i++){
            let menu_item = new Mapbox_dropdown_item2(this.elements['map_style'], function (d) {
                self.set_style(self.style_labels[i]);
            });
            menu_item.set_name(self.style_labels[i]);

            this.elements['map_style'].append_menu_option(menu_item);
        }

        for(let i=0;i < self.building_labels.length;i++){
            let menu_item = new Mapbox_dropdown_item2(this.elements['map_buildings'], function (d) {
                self.set_building_style(self.building_labels[i]);
            });
            menu_item.set_name(self.building_labels[i]);

            this.elements['map_buildings'].append_menu_option(menu_item);
        }

        for(let i=0;i < self.view_labels.length;i++){
            let menu_item = new Mapbox_dropdown_item2(this.elements['map_projection'], function (d) {
                self.set_projection_style(self.view_labels[i]);
            });
            menu_item.set_name(self.view_labels[i]);

            this.elements['map_projection'].append_menu_option(menu_item);
        }

        this.style_has_loaded = false;
        let props = {
            container: this.map_root.id, // container ID
            center: this.center, // starting position [lng, lat]
            zoom: this.zoom, // starting zoom
            bearing: this.bearing,
            pitch: this.pitch
        };

        if (this.style != ''){
            props['style'] = this.style;
        }

        this.map = new mapboxgl.Map(props);

        this.map.on('move', () => {
            this.on_move();
        });

        this.map.on('mousemove', (e) => {
            self.on_mouse_move(e);
        });

        if(this.add_navigation) {
            this.map.addControl(new mapboxgl.NavigationControl());
        }

        if(this.add_scale) {
            this.map.addControl(new mapboxgl.ScaleControl());
        }

        this.map.on('style.load', () => {
            this.style_has_loaded = true;
            this.map.addSource('mapbox-dem', {
                'type': 'raster-dem',
                'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                'tileSize': 512,
                'maxzoom': 14
            });

            // add the DEM source as a terrain layer with exaggerated height
            this.map.setTerrain({'source': 'mapbox-dem', 'exaggeration': this.terrain_exaggeration});

            if (this.style != '') {
                if (this.buildings) {
                    this.add_3d_buildings();
                }

                if (!(this.style.includes('satellite'))) {
                    this.add_hill_shading();

                    this.map.setFilter('poi-label', ['==', 'category_en', 'x']);
                    this.map.setLayoutProperty('transit-label', 'visibility', 'none');
                    this.map.setLayoutProperty('road-number-shield', 'visibility', 'none');
                    this.map.setLayoutProperty('building-number-label', 'visibility', 'none');
                    this.map.setLayoutProperty('crosswalks', 'visibility', 'none');
                    this.map.setLayoutProperty('turning-feature', 'visibility', 'none');
                    this.map.setLayoutProperty('turning-feature-outline', 'visibility', 'none');
                }

                const language = 'en';
                this.map.setLayoutProperty('country-label', 'text-field', [
                    'get',
                    `name_${language}`
                ]);
            }

            if (this.show_buildings){
                this.map.setLayoutProperty('add-3d-buildings', 'visibility', 'visible');
            }else{
                this.map.setLayoutProperty('add-3d-buildings', 'visibility', 'none');
            }

            this.on_style_load();
        });

        this.on_mouse_move = function(e){

            let loc = this.map.getCenter();
            let features = undefined;

            if (e !== undefined) {
                features = this.map.queryRenderedFeatures(e.point);
                loc = e.lngLat;
            }
            if ('map.pos.textbox' in this.elements) {

                let text = 'Lng:' + loc.lng.toFixed(3);
                text += ' | Lat: ' + loc.lat.toFixed(3);
                text += ' | Zoom:' + this.map.getZoom().toFixed(1);

                this.elements['map.pos.textbox'].set_text(text);
            }

            let text = '';

            if (features !== undefined) {
                for (let i = 0; i < features.length; i++) {
                    if (features[i].layer.id === this.current_layer_name) {
                        if ('depth' in features[i].properties) {
                            text = 'Depth: ' + features[i].properties['depth'].toFixed(2) + 'm';
                        }
                        text += '\n';
                    }
                }
            }

            if (text === ''){
                text = 'Depth: ' + 'n/a';
            }

            if ('map.info.textbox' in this.elements) {
                this.elements['map.info.textbox'].set_text(text);
            }
        };
    }

    on_style_load(){
        this.on_move();

        this.on_mouse_move(undefined);

        this.set_style(this.current_style_name);
        this.set_building_style(this.current_building_style_name);
        this.set_projection_style(this.current_view_style_name);

        this.popup = new mapboxgl.Popup({
            offset: 25,
            maxWidth: 1200,
            closeButton: false,
            closeOnClick: true
        });


        this.layer_data = {};

        //load data
        let params = {};

        let cmd = server_url + '/get_flood_data';

        axios.get(cmd, {params: params}).then(response => {
            if (response.status === 200) {

                var record = response.data;

                try {
                    if (this.map) {
                        if ('color_key' in record){

                            let temp = [];
                            for (let i = 0; i < record['color_key'].length; i++) {

                                let current = record['color_key'][i];

                                temp.push({
                                    text: current.text,
                                    color: current.color,
                                    id: i
                                });
                            }

                            if ('map.flood.legend' in this.elements) {
                                this.elements['map.flood.legend'].init(temp);
                            }
                        }

                        let temp = [];
                        temp.push({name: 'none', layer: undefined});

                        let print_timestamp = '';

                        if ('timestamp_print' in record){
                            print_timestamp = record['timestamp_print'];
                        }

                        if ('geojson' in record){
                            for (let i = 0; i < record['geojson'].length; i++) {
                                let current = record['geojson'][i];
                                let layer_name = print_timestamp + ' ' + current.type + ' floodmap';
                                let layer = new MapboxLayer_Geojson(layer_name, current.url, false);
                                layer.init(this.map, this.current_layer_name === layer_name);
                                this.layer_data[layer.layer_name] = layer;
                                temp.push({name: layer.layer_name, layer:layer});
                            }
                        }

                        if ('image' in record) {
                            for (let i = 0; i < record['image'].length; i++) {
                                let current = record['image'][i];
                                let layer_name = 'Reference ' + current.type;
                                let layer = new MapboxLayer_Raster(layer_name, current.url, record['rect']);
                                layer.init(this.map,this.current_layer_name === layer_name);
                                this.layer_data[layer.layer_name] = layer;
                                temp.push({name: layer.layer_name, layer: layer});
                            }
                        }

                        let self = this;
                        this.elements['map.sources.dropdown'].reset();

                        for (let i = 0; i < temp.length; i++) {

                            let item = temp[i];

                            if (i == 0) {
                                if ('map.sources.dropdown' in this.elements) {
                                    this.elements['map.sources.dropdown'].set_button_text('Source Layers');
                                }
                            }

                            let menu_item = new Mapbox_dropdown_item2(this.elements['map.sources.dropdown'], function (d) {
                                self.set_current_layer(item);
                            });
                            menu_item.set_name(item['name']);
                            this.elements['map.sources.dropdown'].append_menu_option(menu_item);
                        }

                        for (let i = 0; i < temp.length; i++) {

                            let item = temp[i];

                            if (item.name === this.current_layer_name){
                                this.elements['map.sources.dropdown'].set_button_text(item['name']);
                            }
                        }
                    }
                } catch (e) {
                    console.log(e);
                }
            }
        }).catch(function (error) {
            if (error.response) {
                console.log(arguments, 'Error:' + cmd + ' ' + error.response.data);
            }
        });

    }

    on_move(){
        this.center = this.map.getCenter();
        this.zoom =this.map.getZoom();
        this.bearing = this.map.getBearing();
        this.pitch = this.map.getPitch();
    }

    on_mouse_move(e){
        this.handle_mouse_move(e);
    }

    add_hill_shading(){
        this.map.addSource('dem', {
                    'type': 'raster-dem',
                    'url': 'mapbox://mapbox.mapbox-terrain-dem-v1'
                });

        this.map.addLayer(
            {
                'id': 'hillshading',
                'source': 'dem',
                'type': 'hillshade'
            },
            // Insert below land-structure-polygon layer,
            // where hillshading sits in the Mapbox Streets style.
            'land-structure-polygon'
        );
    }

    add_3d_buildings()
    {
        const layers = this.map.getStyle().layers;
        const labelLayerId = layers.find(
            (layer) => layer.type === 'symbol' && layer.layout['text-field']
        ).id;

        // The 'building' layer in the Mapbox Streets
        // vector tileset contains building height data
        // from OpenStreetMap.
        this.map.addLayer(
            {
                'id': 'add-3d-buildings',
                'source': 'composite',
                'source-layer': 'building',
                'filter': ['==', 'extrude', 'true'],
                'type': 'fill-extrusion',
                'minzoom': 12,
                'paint': {
                    'fill-extrusion-color': '#aaa',

                    // Use an 'interpolate' expression to
                    // add a smooth transition effect to
                    // the buildings as the user zooms in.
                    'fill-extrusion-height': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        12,
                        0,
                        12.05,
                        ['get', 'height']
                    ],
                    'fill-extrusion-base': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        12,
                        0,
                        12.05,
                        ['get', 'min_height']
                    ],
                    'fill-extrusion-opacity': 1.0
                }
            },
            labelLayerId
        );
    }

    set_style(style) {
        let desired_style = '';

        if (style === 'Vector'){
            desired_style = 'mapbox://styles/mapbox/streets-v12';
        }else{
            desired_style = 'mapbox://styles/mapbox/satellite-streets-v12';
        }

        if (desired_style !== this.style) {

            this.style = desired_style;

            if (this.style_has_loaded) {
                this.map.setStyle(this.style);
            }

            this.current_style_name = style;
        }

        this.elements['map_style'].set_button_text('Map Style: ' + this.current_style_name);
    }

    set_building_style(building_style) {
        if (building_style === 'On') {
            this.show_buildings = true;
        } else {
            this.show_buildings = false;
        }

        if (this.style_has_loaded) {
            if (this.show_buildings){
                this.map.setLayoutProperty('add-3d-buildings', 'visibility', 'visible');
            }else{
                this.map.setLayoutProperty('add-3d-buildings', 'visibility', 'none');
            }

            this.current_building_style_name = building_style;
        }

        this.elements['map_buildings'].set_button_text('Buildings: ' + this.current_building_style_name);
    }

    set_projection_style(view_style){
        if(view_style === '2D'){
            this.terrain_exaggeration = 0;
        }else{
            this.terrain_exaggeration = 1.5;
        }

        if(this.style_has_loaded){
            this.map.setTerrain({'source': 'mapbox-dem', 'exaggeration': this.terrain_exaggeration});

            this.current_view_style_name = view_style;
        }

        this.elements['map_projection'].set_button_text('View: ' + this.current_view_style_name);
    }

    jumpTo(center, zoom){

        if (zoom === undefined){
            zoom = this.zoom;
        }

        this.map.jumpTo({center: center, zoom: zoom});
    }

    get_display_name_for_layer(item){

        if(item.name === 'none'){
            return 'None';
        }

        let name = getFilenameAndExtension(item.layer.url);

        if (item.layer instanceof MapboxLayer_Raster){
            return 'Image ' + name[0].replace('_', ' ').replace('T', ' ').replace('Z', ' ');
        }

        if (item.layer instanceof MapboxLayer_Geojson){
            return 'Geojson ' + name[0].replace('_', ' ').replace('T', ' ').replace('Z', ' ');
        }

        return 'Undefined';
    }

    set_current_layer(item) {

        for (const [key, value] of Object.entries(this.layer_data)) {
            value.set_visibility(false);
        }

        this.current_layer_name = item.name; //actual layer name, not the display name :S

        item['layer'].set_visibility(true);

        this.elements['map.sources.dropdown'].set_button_text(item['name']);
    }
}

class TrafficLightComponent extends HTMLComponent{
    constructor() {
        super();
        this.elements = {};
    }
    oneTimeInit() {
        super.oneTimeInit();
    }

    onShow(parent) {
        super.onShow(parent);

        this.content = document.createElement('div');
        this.content.id = this.get_ID();
        this.content.className = 'Square';
        this.content.style.width = "100%";
        this.content.style.height = "100vh";
        this.content.style.backgroundColor = this.bg_colour;
        this.root.appendChild(this.content);

        let top = '70px';
        let content_root = this.content;

        this.elements = {};

        this.elements['current.textbox'] = new Mapbox_Textbox(content_root, {
            'left': '1vw',
            'top': '100px',
            'width': 'calc(100% - 2vw)',
            'height': '25%',
        });

        this.elements['current.textbox'].set_bg("#7f7f7f");

        this.elements['nowcast.textbox'] = new Mapbox_Textbox(content_root, {
            'left': '1vw',
            'top': 'calc(100px + 30%)',
            'width': 'calc(100% - 2vw)',
            'height': '25%',
        });

        this.elements['nowcast.textbox'].set_bg("#7f7f7f");

        this.elements['forecast.textbox'] = new Mapbox_Textbox(content_root, {
            'left': '1vw',
            'top': 'calc(100px + 60%)',
            'width': 'calc(100% - 2vw)',
            'height': '25%',
        });

        this.elements['forecast.textbox'].set_bg("#7f7f7f");

        let params = {};

        let cmd = server_url + '/get_flood_data';

        axios.get(cmd, {params: params}).then(response => {
            if (response.status === 200) {

                var record = response.data;

                let headings = {
                    'current' : 'Over the last couple of days',
                    'nowcast' : 'Over the next couple of hours',
                    'forecast' : 'Over the next couple of days',
                };

                if ('traffic_lights' in record) {
                    let labels = ['current','nowcast','forecast'];

                    for(let i=0;i<labels.length;i++) {
                        let label =labels[i];
                        if (record['traffic_lights'][label] === 'green') {
                            this.elements[label + '.textbox'].set_bg("#46f346");
                        }

                        if (record['traffic_lights'][label] === 'amber') {
                            this.elements[label + '.textbox'].set_bg("#fdc34b");
                        }

                        if (record['traffic_lights'][label] === 'red') {
                            this.elements[label+'.textbox'].set_bg("#ff446a");
                        }

                        //this.elements[label + '.textbox'].set_innerHTML('<h2 style="text-align:center;"'+ headings[label]+'</h2>' + '<h4></h4>' + record['traffic_lights']['text'][label]);
                        if ('traffic_lights' in record && 'text' in record['traffic_lights']) {
                            this.elements[label + '.textbox'].set_innerHTML('<h2 style="text-align: center;">' + headings[label] + '</h2>' + '<h4></h4>' + record['traffic_lights']['text'][label]);
                        }else{
                            this.elements[label+'.textbox'].set_bg("#7f7f7f");
                            this.elements[label + '.textbox'].set_innerHTML('<h2 style="text-align: center;">' + headings[label] + '</h2>' + '<h4></h4>' + 'No data at this time');
                        }

                    }
                }
            }
        });
    }
}

class EttelnSDGComponent extends HTMLComponent{
    constructor() {
        super();
        this.elements = {};
    }
    oneTimeInit() {
        super.oneTimeInit();
    }

    onShow(parent) {
        super.onShow(parent);

        this.content = document.createElement('div');
        this.content.id = this.get_ID();
        this.content.className = 'Square';
        this.content.style.width = "100%";
        this.content.style.height = "100vh";
        this.content.style.backgroundColor = this.bg_colour;
        this.root.appendChild(this.content);

        let top = '70px';
        let content_root = this.content;

        this.elements = {};

        this.elements['current.textbox'] = new Mapbox_Textbox(content_root, {
            'left': '1vw',
            'top': '100px',
            'width': 'calc(100% - 2vw)',
            'height': '25%',
        });

        this.elements['current.textbox'].set_bg("#7f7f7f");

        this.elements['nowcast.textbox'] = new Mapbox_Textbox(content_root, {
            'left': '1vw',
            'top': 'calc(100px + 30%)',
            'width': 'calc(100% - 2vw)',
            'height': '25%',
        });

        this.elements['nowcast.textbox'].set_bg("#7f7f7f");

        this.elements['forecast.textbox'] = new Mapbox_Textbox(content_root, {
            'left': '1vw',
            'top': 'calc(100px + 60%)',
            'width': 'calc(100% - 2vw)',
            'height': '25%',
        });

        this.elements['forecast.textbox'].set_bg("#7f7f7f");

        let params = {};

        let cmd = server_url + '/get_flood_data';

        axios.get(cmd, {params: params}).then(response => {
            if (response.status === 200) {

                var record = response.data;

                let headings = {
                    'current' : 'Over the last couple of days',
                    'nowcast' : 'Over the next couple of hours',
                    'forecast' : 'Over the next couple of days',
                };

                if ('traffic_lights' in record) {
                    let labels = ['current','nowcast','forecast'];

                    for(let i=0;i<labels.length;i++) {
                        let label =labels[i];
                        if (record['traffic_lights'][label] === 'green') {
                            this.elements[label + '.textbox'].set_bg("#46f346");
                        }

                        if (record['traffic_lights'][label] === 'amber') {
                            this.elements[label + '.textbox'].set_bg("#fdc34b");
                        }

                        if (record['traffic_lights'][label] === 'red') {
                            this.elements[label+'.textbox'].set_bg("#ff446a");
                        }

                        //this.elements[label + '.textbox'].set_innerHTML('<h2 style="text-align:center;"'+ headings[label]+'</h2>' + '<h4></h4>' + record['traffic_lights']['text'][label]);
                        this.elements[label + '.textbox'].set_innerHTML('<h2 style="text-align: center;">'+headings[label] +'</h2>'+ '<h4></h4>' + record['traffic_lights']['text'][label]);
                    }
                }
            }
        });
    }
}

class AppScreen extends Screen_base
{
    constructor(props) {
        super(props);

        this.components = {};
    }

    oneTimeInit(parent) {
        super.oneTimeInit(parent);


        this.data = {};

        this.components = {};
        this.components['Map View'] = new FloodMapComponent();
        this.components['Traffic Lights'] = new TrafficLightComponent();
        //this.components['SDG'] = new EttelnSDGComponent();

        for (const [key, component] of Object.entries(this.components)) {
            component.oneTimeInit();
        }

        this.nav_selector = new NavPills(this);
        this.nav_selector.labels = Object.keys(this.components);
        this.nav_selector.oneTimeInit(this.content_root);
    }

    onShow(parent) {
        super.onShow(parent);

        this.content_root = document.createElement('div');
        this.content_root.id = 'table_root';
        this.content_root.style.backgroundColor = "#ffffff";
        this.content_root.style.width = "100%";
        this.content_root.style.overflowY = 'scroll';
        this.content_root.style.overflowY = 'hidden';
        this.content_root.style.overflowX = 'hidden';
        this.content_root.style.top = '14px';
        this.content_root.style.bottom = '0px';
        this.content_root.style.position = 'absolute';

        this.root.appendChild(this.content_root);

        this.nav_selector.onShow(this.content_root);
        this.nav_selector.set_current_item('Map View');
    }

    input_handler(src, item_id){

        if (src.previous_option != ''){
            this.components[src.previous_option].removeFromDOM();
        }

        if(item_id in this.components) {
            this.components[item_id].onShow(this.content_root);
        }
    }
}

let app = new AppScreen();

function testapp_init(root) {
  let content_root = document.createElement('div');
  content_root.style.left = '0px';
  content_root.style.margin = '0';
  content_root.style.padding = '0';
  content_root.id = 'my_app_root';
  content_root.overflowY = 'hidden';

  content_root.style.bottom = '0px';
  content_root.style.backgroundColor = '#ff0000';

  root.appendChild(content_root);

  app.oneTimeInit(content_root);
  app.onShow(content_root);
}