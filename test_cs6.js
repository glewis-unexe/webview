mapboxgl.accessToken = 'pk.eyJ1IjoiZ2F6dGFzdGljIiwiYSI6ImNrYzA4Y2c4NjFoYnIyeHRicmZuaTgyMGQifQ.fkkbIOCwq4j70CqNeiBGcA';
let server_url = 'http://localhost:8112/cs6_app/';
let global_data = {};

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
        this.zoom = 9.0;
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

        this.elements['map.legend'] = new Mapbox_LegendList(content_root,{
            'left': 'calc(100vw - 350px)',
            'top': 'calc(100vh - 330px)',
        });

        this.elements['map.legend'].set_text('Legend');
    }

    on_mouse_move(e){
        super.on_mouse_move(e);

        if(this.map === undefined){
            return;
        }
        
        try {
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
                        if (('layer' in features[i]) && (features[i]['layer']['id'] in this.layers)) {
                            if(features[i]['layer']['id'] === 'Aliakmon Monitoring Stations'){
                                if (text.length) {
                                    text += '<br>';
                                }

                                let prop = 'Name';
                                text += '<H3><b>' + features[i]['properties'][prop] + '</H3></b>';
                                text += '<H4>';
                                text += app.get_pin_data('pin2', features[i]['properties'][prop]);
                                text += '</H4>';
                            }

                            if(features[i]['layer']['id'] === 'Aliakmon Digital Twin Nodes'){
                                if (text.length) {
                                    text += '<br>';
                                }

                                let prop = 'name';
                                text += '<H3><b>' + features[i]['properties'][prop] + '</H3></b>';

                                text += '<H4>';
                                text += app.get_pin_data('pin1', features[i]['properties'][prop]);
                                text += '</H4>';
                            }
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
        }catch(e){
            console.log(e);
        }
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

        random_colour_rand.reset();

        let fill_data = {
                        'fill-color': '#ff0000',
                        'fill-opacity': 0.1,
                        };

        let line_data = {
                    'line-color': getRandomColor(),
                    'line-width': {
                                    'base': 1.75,
                                    'stops': [
                                        [1, 0.1],
                                        [6, 2],
                                        [10, 4],
                                        [12, 8],
                                        [15, 16],
                                        [22, 50]
                                    ]
                                }
                    };

        let circle_data = {'circle-color': '#ed09db',
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
                'circle-stroke-color': '#000000'};

        let legend_list = [];

        let key = '';

        if (true) {
            key = 'Aliakmon Basin Boundaries';
            this.layers[key] = new MapboxLayer_Geojson(key, undefined, true);
            fill_data['fill-color'] = '#ff0000';
            this.layers[key].edge_paint = line_data;
            this.layers[key].edge_paint["line-color"] = fill_data['fill-color'];
            this.layers[key].init_from_data(this.map, global_data[key], 'fill', fill_data);
            this.layers[key].set_visibility(true);

            legend_list.push({text: key, color: fill_data['fill-color'], id: 0});

            key = 'Aliakmon Lakes';
            this.layers[key] = new MapboxLayer_Geojson(key, undefined, true);
            fill_data['fill-color'] = '#0000ff';
            this.layers[key].init_from_data(this.map, global_data[key], 'fill', fill_data);
            this.layers[key].set_visibility(true);
            legend_list.push({text: key, color: fill_data['fill-color'], id: 0});
        }

        if (true) {
            key = 'Aliakmon Digital Twin Nodes';
            this.layers[key] = new MapboxLayer_Geojson(key, undefined, true);
            circle_data['circle-color'] = '#ed09db';
            this.layers[key].init_from_data(this.map, global_data[key], 'circle', circle_data);
            this.layers[key].set_visibility(true);
            legend_list.push({text: key, color: circle_data['circle-color'], id: 0});
        }

        if (true) {
            key = 'Aliakmon Monitoring Stations';
            this.layers[key] = new MapboxLayer_Geojson(key, undefined, true);
            circle_data['circle-color'] = '#29edde';
            this.layers[key].init_from_data(this.map, global_data[key], 'circle', circle_data);
            this.layers[key].set_visibility(true);
            legend_list.push({text: key.replace('-', ' '), color: circle_data['circle-color'], id: 0});
        }

        if (true) {
            let rivers = ['Aliakmon Basin Hydrographic Network',
                'Almopaios River',
                'Aliakmon Main River',
                'A0 to Thessaloniki',
                'A0'
            ];

            for (let i = 0; i < rivers.length; i++) {
                key = rivers[i];
                this.layers[key] = new MapboxLayer_Geojson(key, undefined, false);
                line_data['line-color'] = getRandomColor();
                this.layers[key].init_from_data(this.map, global_data[key], 'line', line_data);
                this.layers[key].set_visibility(true);

                legend_list.push({text: key, color: line_data['line-color'], id: 0});
            }
        }

        if ('map.legend' in this.elements) {
            legend_list = objSort(legend_list,'text');

            this.elements['map.legend'].init(legend_list);
        }
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

            }
        }).catch(function (error) {
            if (error.response) {
                console.log(arguments, 'Error:' + cmd + ' ' + error.response.data);
            }
        });


        this.components = {};
        this.components['Map'] = new CS6MapComponent();
        this.components['Current Sensors Table'] = new SensorComponent({'cmd':server_url + 'get_current_sensor_data'});
        this.components['Historic Charts'] = new HistoricCharts({'cmd':server_url + 'get_historic_sensor_data'});
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

    get_pin_data(pin_name, group_label){
        let result = '';

        try {
            group_label = group_label.replace('_', ' ');

            for (let i = 0; i < this.data[pin_name][group_label].length; i++) {
                let data = this.data[pin_name][group_label][i];
                result += data['time'].replace('T', ' ').replace('Z', ' ') + ' ' + data['sensor_print'] + ' ' + data['prop'] + ' ' + data['value_print'];
                result += '<br>';
            }
        }catch (e) {
            console.log(e);
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