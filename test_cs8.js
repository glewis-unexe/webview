mapboxgl.accessToken = 'pk.eyJ1IjoiZ2F6dGFzdGljIiwiYSI6ImNrYzA4Y2c4NjFoYnIyeHRicmZuaTgyMGQifQ.fkkbIOCwq4j70CqNeiBGcA';
let server_url = 'http://localhost:8333/';
//let server_url = '';
let global_data = {};

class MapboxLayer_MadGeojson extends MapboxLayer_Geojson{

    constructor(layer_name, url, lines) {
        super(layer_name, url, lines);

    }

    init_from_data(map,layer_data, render_type, paint_data) {

        let c = new Random(1234);

        for(let i=0;i< layer_data['features'].length;i++){
            layer_data['features'][i]['properties']['color'] = c.getRandomColor();
        }

        paint_data = {
                        'fill-color': ['get', 'color'],
                        'fill-opacity': 0.15,
                        };

        super.init_from_data(map,layer_data,render_type,paint_data);
    }
}

class CS8MapComponent  extends MapboxComponent {
    constructor() {
        super();

        this.center = [-3.55156,50.43280,];
        this.zoom = 12.5;
        this.bearing = 0;
        this.pitch = 0;
        this.popup = undefined;

        this.rainfall = {};
        this.current_flood_step = 0;
    }

    oneTimeInit() {
        super.oneTimeInit();
    }

    onShow(parent) {
        super.onShow(parent);

        this.popup = undefined;

        let top = '70px';
        let content_root = this.content;

        this.elements['map.scenario.slider'] = new Mapbox_Slider(content_root, {
            'left': '25%',
            'top': 'calc(100vh - 100px)',
            'width': '50vw',
            'height': '25px'
        }, this.scenario_slider_on_change, this);

         if ('map.scenario.slider' in this.elements){
             this.elements['map.scenario.slider'].set_max(Object.keys(global_data['floodmap']).length.toString());
             this.elements['map.scenario.slider'].set_current(this.current_flood_step.toString());
        }

        this.elements['map.flood.legend'] = new Mapbox_LegendList(content_root,{
            'left': '1vw',
            'top': '200px',
        });

        if ('map.flood.legend' in this.elements) {

            if ('color_key' in record) {
                let temp = [];
                for (let i = 0; i < record['color_key'].length; i++) {

                    let current = record['color_key'][i];

                    temp.push({
                        text: current.text,
                        color: current.color,
                        id: i
                    });
                }
            }

            this.elements['map.flood.legend'].init(temp);
        }
    }

     scenario_slider_on_change(self, value){

        let label = Object.keys(global_data['floodmap'])[parseInt(value)];

        self.set_layer(label);
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
                        if (('layer' in features[i]) && (features[i]['layer']['id'] in this.rainfall)) {
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

        this.rainfall = {};

        random_colour_rand.reset();

        let fill_data = {
                        'fill-color': '#ff00ff',
                        'fill-opacity': 0.5,
                        };

        let line_data = {
                    'line-color': '#000000',
                    'line-width': {
                                    'base': 0.1,
                                    'stops': [
                                        [1, 0.1],
                                        [6, 0.1],
                                        [10, 0.1],
                                        [12, 0.01],
                                        [15, 0.1],
                                        [22, 0.8]
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

        let key = 'mad_layer';
        this.mad_layer = new MapboxLayer_MadGeojson(key, server_url + 'get_mad_data', true);
        this.mad_layer.edge_paint = line_data;
        this.mad_layer.edge_paint["line-color"] = '#000000';
        this.mad_layer.paint_data = fill_data;
        this.mad_layer.render_type = 'fill';
        this.mad_layer.init(this.map,true);


        for (const [key, value] of Object.entries(global_data['floodmap'])) {
            this.rainfall[key] = new MapboxLayer_Geojson(key, undefined, true);
            this.rainfall[key].edge_paint = line_data;
            this.rainfall[key].edge_paint["line-color"] = '#000000';
            this.rainfall[key].paint_data = fill_data;
            this.rainfall[key].render_type = 'fill';

            this.rainfall[key].init_from_data(this.map, value, 'fill', fill_data);
        }

        this.set_layer(Object.keys(global_data['floodmap'])[0]);
    }

    set_layer(label){
        for (const [key, value] of Object.entries(this.rainfall)) {
            this.rainfall[key].set_visibility(false);
        }

        this.rainfall[label].set_visibility(true);
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

        let h = 'calc(100vh - 60px)';

        this.components = {};
        this.components['Map'] = new CS8MapComponent();

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