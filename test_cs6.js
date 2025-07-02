mapboxgl.accessToken = 'pk.eyJ1IjoiZ2F6dGFzdGljIiwiYSI6ImNrYzA4Y2c4NjFoYnIyeHRicmZuaTgyMGQifQ.fkkbIOCwq4j70CqNeiBGcA';
let server_url = 'http://localhost:8112/cs6_app/';
let global_data = {};

class MapboxLayerBase{

    constructor(display)
    {
        if (display === undefined)
        {
            display = true;
        }

        this.display = display;
        this.inited = false;

        this.layer_name = 'undefined';
        this.visibility = true;
    }

    init(map) {
        this.inited = true;
    }

    islayer(map, layer_id){
        let layers = map.getStyle().layers;

        for (let i=0;i< layers.length;i++)
        {
            if (layers[i].id === layer_id){
                return true;
            }
        }

        return false;
    }

    set_visibility(visibility) {
        this.visibility = visibility;
    }

    update_visibility(map) {
        if (map) {
            if (this.visibility === false) {
                map.setLayoutProperty(this.layer_name, 'visibility', 'none');
            } else {
                map.setLayoutProperty(this.layer_name, 'visibility', 'visible');
            }
        }
    }
}

class CS6GeojsonLayer extends MapboxLayerBase{
    constructor(layer_name) {
        super(true);
        this.geojson_data = {};

        this.source_name = layer_name;
        this.layer_name = this.source_name + '-layer';

        let dummy_features = {
            "type": "FeatureCollection",
            "name": this.layer_name,
            "crs": {
                "type": "name",
                "properties": {
                    "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
                }
            },
            "features": [],
        };

        this.geojson_data = dummy_features;
    }

    update(map)
    {
        if (this.display === false)
        {
            return;
        }

        if(this.init_pending === true){
            return;
        }
        this.update_visibility(map);

        try {
            if (map.getSource(this.source_name) !== undefined) {
                map.getSource(this.source_name).setData(this.geojson_data);
            }
        } catch (e) {
            console.log('update:' + e);
        }
    }
}

class CS6SensorLayer extends CS6GeojsonLayer{
    constructor(layer_name) {
        super(layer_name);
    }

    init(map) {
        let sensors = app.get_sensors_for_map();

        this.geojson_data['features'] = [];

        for(let i=0;i< sensors.length;i++){
            let feature = {
                'type': 'Feature',
                "properties": {'name': sensors[i], 'color': 'rgba(163,163,246,255)'},
                "geometry": {
                    "type": 'Point',
                    "coordinates": app.get_loc_for_sensor(sensors[i]),
                },
            };

            this.geojson_data['features'].push(feature);
        }

        super.init(map);

        if (this.display === false) {
            return;
        }

        if (this.islayer(map, this.layer_name)) {
            map.removeLayer(this.layer_name);
            map.removeSource(this.source_name);
        }

        map.addSource(this.source_name, {
            type: 'geojson',
            // Use a URL for the value for the `data` property.
            data: this.geojson_data
        });

        map.addLayer({
            'id': this.layer_name,
            'type': 'circle',
            'source': this.source_name,
            'paint': {
                'circle-color': ['get', 'color'],
                'circle-opacity': 1.0,
                'circle-radius': {
                    'base': 1.0,
                    'stops': [
                        [1, 0.01],
                        [10, 8.0],
                        [15, 7.5],
                        [20, 20],
                        [22, 15]
                    ]
                },
                'circle-stroke-width': 2,
                'circle-stroke-color': '#000000'
            }
        });

        this.init_pending = false;
        this.update(map);
    }
}

class CS6RiverLayer extends CS6GeojsonLayer{
    constructor(layer_name) {
        super(layer_name);
    }

    /*
    Agia varvara downstream -> add!
    X Agia varvara reservoir
    almopaias r discharge ???
    X asomata reservoir
    X ilarion reservoir
    X kouloura junction
    X niselli bridge
    X polyfytos reservoir
    X rapsomaniki junction
    X sfikia reservoir


     */

    init(map) {
        super.init(map);

        if (this.display === false) {
            return;
        }

        if (this.islayer(map, this.layer_name)) {
            map.removeLayer(this.layer_name);
            map.removeSource(this.source_name);
        }

        map.addSource(this.source_name, {
            type: 'geojson',
            // Use a URL for the value for the `data` property.
            data: this.geojson_data
        });

        map.addLayer({
            'id': this.layer_name,
            'type': 'line',
            'source': this.source_name,
            'paint': {
                //'line-color': ['get', 'color'],
                'line-color': '#0095ff',
                'line-width': {
                    'base': 1.75,
                    'stops': [
                        [1, 1],
                        [9, 10],
                        [15, 14],
                        [22, 50]
                    ]
                },
            }
        });

        this.init_pending = true;

        let cmd = server_url + 'get_river';

        axios.get(cmd).then(response => {
            this.geojson_data = response.data;
            this.init_pending = false;
            this.update(map);
            }, (error) => {
                console.log(error);
            });
    }
}

class CS6PinTable extends HTMLComponent{
    oneTimeInit(){
    }

    onShow(parent) {
        let cmd = server_url + 'get_pin_data';
        let params = {};

        axios.get(cmd, {params: params}).then(response => {
            if (response.status === 200) {
                try {
                    super.onShow(parent);
                    let container = document.createElement('div');
                    container.id = this.get_ID();
                    container.style.cssText = 'height: calc( 100vh - 145px); width:100%; padding:1%; margin:0;';
                    container.style.overflowY = 'scroll';

                    parent.appendChild(container);

                    for (const [key, value] of Object.entries(response.data)){
                        console.log(key);

                        if (key.includes('pin') ) {
                            {
                                let p = document.createElement('h3');
                                container.appendChild(p);
                                p.style.cssText = 'text-align: center';
                                p.innerHTML = '<b>' + key + '</b>';
                                container.appendChild(document.createElement('br'));
                            }

                            var loc_list = [];
                            for (const [loc, loc_data] of Object.entries(response.data[key])) {
                                loc_list.push(loc);
                            }

                            loc_list = loc_list.sort();

                            for (let i=0;i<loc_list.length;i++){

                                let loc = loc_list[i];
                                let data = response.data[loc];

                                {
                                    let p = document.createElement('h3');
                                    container.appendChild(p);
                                    p.style.cssText = 'text-align: center';
                                    p.innerHTML = '<b>' + loc.replace('_',' ').replace('_', ' ') + '</b>';
                                }



                                let data_source = [];
                                for( let s=0;s< response.data[key][loc].length;s++) {
                                    let data = response.data['sensors'][response.data[key][loc][s]];

                                    data_source.push({'time': data['time'], 'sensor_print': data['sensor_print'],  'prop': data['prop'], 'value_print' : data['value_print'] });
                                }

                                data_source = objSort(data_source, 'time', 'sensor_print', 'prop');

                                let columns = [
                                    {name: 'Time', style: 'width: 20%', 'label': 'time'},
                                    {name: 'Sensor', style: 'width:40%', 'label': 'sensor_print'},
                                    {name: 'Property', style: 'width:20%', 'label': 'prop'},
                                    {name: 'Value', style: 'width:20%', 'label': 'value_print'},
                                ];

                                TableTextComponent.AddTableComponent(container, columns, data_source);
                                container.appendChild(document.createElement('br'));
                                container.appendChild(document.createElement('br'));
                            }
                        }
                    }

                    TableTextComponent.AddTableFooter(container);

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
}

class CS6MapComponent  extends MapboxComponent {
    constructor() {
        super();

        this.center = [22.5, 41];
        this.zoom = 6.0;
        this.bearing = 0;
        this.pitch = 0;

        this.bounds = [[20.5,40.0], [23.0,41.0]];

        this.center[0] = this.bounds[0][0] + (this.bounds[1][0] - this.bounds[0][0])/2;
        this.center[1] = this.bounds[0][1] + (this.bounds[1][1] - this.bounds[0][1])/2;

        this.popup = undefined;

        this.layers = {};
    }

    oneTimeInit() {
        super.oneTimeInit();
    }

    onShow(parent) {
        super.onShow(parent);

        this.popup = undefined;

        let top = '70px';
        let content_root = this.content;


        this.on_mouse_move = function(e){
            this.fill_map_pos_textbox(e);

            let loc = this.map.getCenter();
            let features = undefined;

            if (e !== undefined) {
                features = this.map.queryRenderedFeatures(e.point);
                loc = e.lngLat;
            }

            if (this.popup !== undefined) {
                let text = '';

                if (features !== undefined)

                    for (let i = 0; i < features.length; i++) {
                        if (text.length == 0) {
                        } else {
                            text += '<br>';
                        }
                        if (('layer' in features[i]) && (features[i]['layer']['id'] in this.layers)){
                            text += '<H3><b>' + features[i]['layer']['id'] + '</H3></b>';
                        }

                    }

                if (text.length == 0) {
                    this.popup.remove();
                } else {
                    this.popup.addTo(this.map);
                    this.popup.setHTML(text);
                    this.popup.setLngLat(e.lngLat);
                }
            }

        };
    }

    on_style_load(){
        super.on_style_load();

        this.popup = new mapboxgl.Popup({
            offset: 25,
            maxWidth: 1200,
            closeButton: false,
            closeOnClick: true
        });

        this.layers = {};

        let fill_data = {
                        'fill-color': '#ff0000',
                        'fill-opacity': 0.25,
                        };

        let line_data = {
                    'line-color': getRandomColor(),
                    'line-width': {
                                    'base': 1.75,
                                    'stops': [
                                        [10, 0.01],
                                        [10, 1],
                                        [12, 2],
                                        [15, 4],
                                        [22, 50]
                                    ]
                                }
                    };

        let key = '';

        key = 'aliakmon basin boundaries';
        this.layers[key] = new MapboxLayer_Geojson(key,undefined,true);
        this.layers[key].init_from_data(this.map,global_data[key], 'fill', fill_data);
        this.layers[key].set_visibility(true);

        key = 'aliakmon lakes';
        this.layers[key] = new MapboxLayer_Geojson(key,undefined,true);
        this.layers[key].init_from_data(this.map,global_data[key], 'fill', {'fill-color': '#0000ff','fill-opacity': 0.25,});
        this.layers[key].set_visibility(true);

        key = 'aliakmon digital twin nodes';
        this.layers[key] = new MapboxLayer_Geojson(key,undefined,true);
        this.layers[key].init_from_data(this.map,global_data[key], 'circle', {'circle-color': '#ed09db',
                'circle-opacity': 1.0,
                'circle-radius': {
                    'base': 1.0,
                    'stops': [
                        [1, 0.01],
                        [10, 8.0],
                        [15, 7.5],
                        [20, 20],
                        [22, 15]
                    ]
                },
                'circle-stroke-width': 2,
                'circle-stroke-color': '#000000'});
        this.layers[key].set_visibility(true);

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

        let cmd = server_url + 'get_pin_data';
        let params = {};

        this.data = {};

        axios.get(cmd, {params: params}).then(response => {
            if (response.status === 200) {
                try {
                    for (const [key, value] of Object.entries(response.data)){

                        if (key.includes('pin') ) {

                            let pin_data = {};

                            this.data[key] = pin_data['loc_list'] = {};
                            for (const [loc, loc_data] of Object.entries(response.data[key])) {

                                let actual_key=loc.replace('_',' ').replace('_', ' ');
                                pin_data['loc_list'][actual_key] = [];

                                let sensor_data = response.data[loc];

                                let data_source = [];
                                for( let s=0;s< response.data[key][loc].length;s++) {
                                    let data = response.data['sensors'][response.data[key][loc][s]];

                                    pin_data['loc_list'][actual_key].push({'time': data['time'], 'sensor_print': data['sensor_print'],  'prop': data['prop'], 'value_print' : data['value_print'] });
                                }

                                pin_data['loc_list'][actual_key] = objSort(pin_data['loc_list'][actual_key], 'time', 'sensor_print', 'prop');
                            }
                        }
                    }
                } catch (e) {
                    console.log(e);
                }

                console.log();
            }
        }).catch(function (error) {
            if (error.response) {
                console.log(arguments, 'Error:' + cmd + ' ' + error.response.data);
            }
        });


        this.components = {};
        this.components['Map'] = new CS6MapComponent();
        this.components['Current Sensors Table'] = new SensorComponent();
        this.components['Historic Charts'] = new HistoricCharts();
        this.components['Pin Table'] = new CS6PinTable();

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
        this.nav_selector.set_current_item('Map');
    }

    input_handler(src, item_id){

        if (src.previous_option != ''){
            this.components[src.previous_option].removeFromDOM();
        }

        if(item_id in this.components) {
            this.components[item_id].onShow(this.content_root);
        }
    }

    get_sensors_for_map() {
        return Object.keys(this.data['pin1']);
    }

    get_loc_for_sensor(loc){
        let lookup = {
            "Agia Varvara Downstream": [22.270,40.500],
            "Polyfytos Reservoir": [21.973, 40.233],
            "Almopaios R Discharge":  [22.585,40.542],
            "Sfikia Reservoir": [22.190, 40.390],
            "Agia Varvara Reservoir": [22.257, 40.4888],
            "Asomata Reservoir": [22.243, 40.473],
            "Niselli Bridge Discharge": [22.471, 40.583],
            "Ilarion Reservoir": [22.070, 40.293],
            "Rapsomaniki Junction": [22.358, 40.551],
            "Kouloura Junction": [22.315, 40.552],

        };

    return lookup[loc];
}


    get_text_for_sensor(sensor_name) {
        let result = '';

        for(let i=0;i< this.data['pin1'][sensor_name].length;i++){
            let data = this.data['pin1'][sensor_name][i];
            result +=data['time'] +' ' + data['sensor_print'] +' ' + data['prop'] + ' ' + data['value_print'];
            result += '<br>';
        }

        return result;
    }
}

let app = new AppScreen();
function app_init(root) {

    let cmd = server_url + 'get_map_data';

    let params = {};

    axios.get(cmd, {params: params}).then(response => {
        if (response.status === 200) {

            global_data = response.data;

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
    }).catch(function (error) {
        if (error.response) {
            console.log(arguments, 'Error:' + cmd + ' ' + error.response.data);
        }
    });
}