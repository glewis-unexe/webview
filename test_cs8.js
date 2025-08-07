mapboxgl.accessToken = 'pk.eyJ1IjoiZ2F6dGFzdGljIiwiYSI6ImNrYzA4Y2c4NjFoYnIyeHRicmZuaTgyMGQifQ.fkkbIOCwq4j70CqNeiBGcA';
let server_url = 'http://localhost:8112/cs8_app/';

class SliderDisplay extends MapboxWidget{
    constructor(parent,rect, slider_callback, data_source) {
        super(parent);

        this.element.style.position = "absolute";
        this.element.style.backgroundColor = "#fff";
        this.element.style.color = "#000";
        this.element.style.padding = "6px 12px";
        this.element.style.zIndex = "1";
        this.element.style.margin = "";


        //important bit
        this.size_element(rect);

        this.heading = document.createElement('h4');
        this.heading.innerText = 'Heading';
        this.heading.style.textAlign = 'center';
        this.element.appendChild(this.heading);

        let r = {'left': '0px',
                    'top': '20px',
                    'width': '49vw',
                    'height': '75px'
        };

        this.slider = new Mapbox_Slider(this.element,r, slider_callback, data_source);

    }

    set_heading(v){
        this.heading.innerText = v;
    }

    set_max(v){
        this.slider.set_max(v);
    }
    set_current(v){
        this.slider.set_current(v);
    }
}


class CS8AlbertVizComponent extends MapboxComponent{
    constructor() {
        super();

        this.center = [-3.55156,50.43280,];
        this.zoom = 12.5;
        this.bearing = 0;
        this.pitch = 0;
        this.popup = undefined;
        this.layers = {};

        this.rainfall = {};

        this.current_step = 0;
        this.max_step = 199;
        this.current_viz_mode = '';

        this.impact_legends = [
            {"text": 'No direct impact',                                            "color": "#3f3f3f"},
            {"text": 'Direct impact only, level one',                               "color": '#ff0000'},
            {"text": 'Direct impact only, level two',                               "color": '#00ff00'},
            {"text": 'Direct impact only, level three',                             "color": '#0022ff'},
            {"text": 'Indirect impact only',                                        "color": '#5f1573'},
            {"text": 'Direct impact level one and at least one indirect impact',    "color": '#ffb700'},
            {"text": 'Direct impact level two and at least one indirect impact',    "color": '#ffea55'},
            {"text": 'Direct impact level three and at least one indirect impact',  "color": '#80f1c1'},
            {"text": 'No direct impact, multiple dependent indirect impacts',       "color": '#1b96ac'},
            {"text": 'Direct impact and multiple dependent indirect impacts',       "color": '#1bac8a'},
        ];

        this.damage_legends= [
            {"text": "None",            "color": "#3f3f3f", 'max_val': 0},
            {"text": "<10,000",         "color": '#ff0000', 'max_val': 1000},
            {"text": "<50,000",         "color": '#00ff00', 'max_val': 10000},
            {"text": "<100,000",        "color": '#0022ff', 'max_val': 50000},
            {"text": "<500,000",        "color": '#6a397a', 'max_val': 100000},
            {"text": "<1,000,000",      "color": '#ffb700', 'max_val': 500000},
            {"text": "<10,000,000",     "color": '#ffea55', 'max_val': 1000000},
            {"text": "<100,000,000",    "color": '#80f1c1', 'max_val': 10000000},
            {"text": ">100,000,000",    "color": '#1b96ac', 'max_val': 100000000},
        ];

        this.flood_legends = [
            {"text": "<0.1m",       "color": "#ffffff"},
            {"text": "0.1-0.5m",    "color": "#ceecfe"},
            {"text": "0.5-1.0m",    "color": "#9ccbfe"},
            {"text": "1.0-2.0m",    "color": "#7299fe"},
            {"text": "2.0-4.0m",    "color": "#4566fe"},
            {"text": ">4.0m",       "color": "#1739ce"}
        ];


        this.map_top_px = '50px';
        this.button_top_row = 'calc(' + this.map_top_px + ' + 20px)';



        this.viz_mode_labels = ['Damage','Impact', 'None'];
        this.damage_index = 0;
        this.impact_index = 1;
        this.none_index = 2;

    }

    oneTimeInit() {
        super.oneTimeInit();
        this.set_building_style('Off');

        this.set_viz_mode(this.viz_mode_labels[this.none_index]);
    }


    onShow(parent) {

        let cmd = server_url + 'get_albert_out';

        let params = {};

        axios.get(cmd, {params: params}).then(response => {
            if (response.status === 200) {

                super.onShow(parent);

                this.data = response.data;
                this.popup = undefined;

                this.max_step = this.data['caflood']['timesteps'].length;

                let content_root = this.content;

                this.elements['map.scenario.slider'] = new SliderDisplay(content_root, {
                    'left': '25%',
                    'top': 'calc(100vh - 200px)',
                    'width': '50vw',
                    'height': '75px'
                }, this.scenario_slider_on_change, this);

                if ('map.scenario.slider' in this.elements) {
                    this.elements['map.scenario.slider'].set_max(this.max_step.toString());
                    this.elements['map.scenario.slider'].set_current(this.current_step.toString());
                }

                //map builds content from on_style_load, so load the content first ;)
                this.elements['map.flood.legend'] = new Mapbox_LegendList(content_root, {
                    'left': '1vw',
                    'top': '200px',
                });

                this.elements['map.viz.mode'] = new Mapbox_dropdown(content_root, {
                    'left': 'max(460px, 34vw)',
                    'top': this.button_top_row,
                    'width': 'max(150px, 12vw)',
                });

                let self = this;

                for(let i=0;i < this.viz_mode_labels.length;i++){
                    let menu_item = new Mapbox_dropdown_item2(this.elements['map.viz.mode'], function (d) {
                        self.set_viz_mode(self.viz_mode_labels[i]);
                    });
                    menu_item.set_name(self.viz_mode_labels[i]);

                    this.elements['map.viz.mode'].append_menu_option(menu_item);
                }
            }
        }).catch(function (error) {
            if (error.response) {
                console.log(arguments, 'Error:' + cmd + ' ' + error.response.data);
            }
        });
    }

    set_viz_mode(desired_viz_mode){

        this.current_viz_mode = desired_viz_mode;

        if(this.style_has_loaded){
            let key = 'albert_damage_model';

            if((this.current_viz_mode === this.viz_mode_labels[this.damage_index]) || (this.current_viz_mode === this.viz_mode_labels[this.impact_index])) {
                this.layers[key].set_visible(true);
            }else{
                this.layers[key].set_visible(false);
            }

            this.viz(this.current_step);
        }

        if( 'map.scenario.slider' in this.elements) {
            if (this.current_viz_mode === this.viz_mode_labels[this.none_index]) {
                this.elements['map.scenario.slider'].set_visible(false);
            } else {
                this.elements['map.scenario.slider'].set_visible(true);
            }
        }

        if('map.viz.mode' in this.elements) {
            this.elements['map.viz.mode'].set_button_text('Mode: ' + this.current_viz_mode);
        }
    }

    pretty_print_fiware_time(v){
        return v.replace('T',' ').replace('Z','');
    }

    pretty_print_feature(v){

        if (this.current_viz_mode === this.viz_mode_labels[this.damage_index]) {
            return 'Damage: ' + v.toLocaleString();
        }

        if (this.current_viz_mode === this.viz_mode_labels[this.impact_index]) {
            //impact
            return this.impact_legends[v]['text'];
        }

        if (this.current_viz_mode === this.viz_mode_labels[this.none_index]) {
            //none
            return 'Shouldn\'t see this';
        }

        return 'Unknown';
    }


    viz(step){
        let key = 'albert_damage_model';

        if ('map.flood.legend' in this.elements) {

            if (this.current_viz_mode === this.viz_mode_labels[this.damage_index]) {
                this.elements['map.flood.legend'].init(this.damage_legends);
                this.elements['map.flood.legend'].heading.innerText = 'Damage Legend';
                this.elements['map.flood.legend'].set_visible(true);

                this.elements['map.scenario.slider'].set_heading('Damage Timestep: ' + this.pretty_print_fiware_time(this.data['damage']['steps'][step] ));
            }

            if (this.current_viz_mode === this.viz_mode_labels[this.impact_index]) {
                this.elements['map.flood.legend'].init(this.impact_legends);
                this.elements['map.flood.legend'].heading.innerText = 'Impact Legend';
                this.elements['map.flood.legend'].set_visible(true);

                this.elements['map.scenario.slider'].set_heading('Impact Timestep: ' + this.pretty_print_fiware_time(this.data['impact']['steps'][step]) );
            }

            if (this.current_viz_mode === this.viz_mode_labels[this.none_index]) {
                this.elements['map.flood.legend'].heading.innerText = 'Hide Me!';
                this.elements['map.flood.legend'].set_visible(false);
            }
        }

        for (const [key, value] of Object.entries(this.rainfall)) {

            value.set_visible(false);

            if (this.current_viz_mode !== this.viz_mode_labels[this.none_index]){

                if (key === this.data['caflood']['timesteps'][step].toString())
                {
                    value.set_visible(true);
                }
            }
        }

        for(let i=0;i<this.data['geojson']['features'].length;i++){

            try {
                let c = '#ff00ff';
                let id = this.data['geojson']['features'][i]['properties']['id'];

                if (this.current_viz_mode === this.viz_mode_labels[this.damage_index]) {
                    if (id in this.data['damage']['data']) {
                        let val = this.data['damage']['data'][id][step];

                        for (let j = 0; j < this.damage_legends.length; j++) {
                            if (val >= this.damage_legends[j]['max_val']) {
                                c = this.damage_legends[j]['color'];
                            }
                        }
                    } else {
                        c = this.damage_legends[0]['color'];
                    }
                }

                if (this.current_viz_mode === this.viz_mode_labels[this.impact_index]) {
                    if (id in this.data['impact']['data']) {
                        let val = this.data['impact']['data'][id][step];

                        if(val <0 || val >= this.impact_legends.length){
                            console.log();
                        }

                        c = this.impact_legends[val]['color'];
                    } else {
                        c = this.impact_legends[0]['color'];
                    }
                }

                this.data['geojson']['features'][i]['properties']['color'] = c;
            }catch (err){
                console.log(err);
            }
        }

        this.layers[key].update(this.data['geojson']);

        this.current_step = step;
    }

    scenario_slider_on_change(self, value){
        self.viz(parseInt(value) );
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
                        if (features[i].source.includes('floodmap-')) {
                            if (text.length) {
                                text += '<br>';
                            }

                            if (('properties' in features[i]) && ('depth' in features[i]['properties'])){
                                if (text.length) {
                                    text += '<br>';
                                }

                                text += 'Depth:' + features[i]['properties']['depth'] +'m';
                            }
                        }

                        if (features[i].source === 'albert_damage_model') {
                            if (text.length) {
                                text += '<br>';
                            }
                            let id = features[i]['properties']['id'];

                            let mode = '';

                            if (this.current_viz_mode === this.viz_mode_labels[this.damage_index]){
                                mode = 'damage';
                            } //damage

                            if (this.current_viz_mode === this.viz_mode_labels[this.impact_index]){
                                mode = 'impact';
                            } //impact

                            if (mode !== '') {
                                if (id in this.data[mode]['data']) {
                                    text += ' ' + this.pretty_print_feature(this.data[mode]['data'][id][this.current_step]);
                                }else{
                                    text += ' ' + this.pretty_print_feature(0);
                                }
                            }

                            //text += ' ID:' + id.toString();
                        }
                    }

                if (text.length == 0) {
                    this.popup.remove();
                } else {
                    this.popup.addTo(this.map);
                    this.popup.setHTML('<H3>'+text +'</H3>');
                    this.popup.setLngLat(e.lngLat);
                }
            }
        }catch(err){
            console.log(err);
        }
    }


    on_style_load() {
        super.on_style_load();

        this.popup = new mapboxgl.Popup({
            offset: 25,
            maxWidth: 1200,
            closeButton: false,
            closeOnClick: true
        });

        //build visualisation here ...
        let fill_data = {
            'fill-color': ['get', 'color'],
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

        for (const [key, value] of Object.entries(this.data['caflood']['floodmap'])) {
            this.rainfall[key] = new MapboxLayer_Geojson('floodmap-'+key, undefined, true);
            this.rainfall[key].edge_paint = line_data;
            this.rainfall[key].paint_data = JSON.parse( JSON.stringify(fill_data));
            this.rainfall[key].paint_data['fill-opacity'] =1.0;
            this.rainfall[key].render_type = 'fill';

            this.rainfall[key].init_from_data(this.map, value, 'fill', this.rainfall[key].paint_data);
        }

        let key = 'albert_damage_model';
        this.layers[key] = new MapboxLayer_Geojson(key, undefined, true);
        this.layers[key].edge_paint = line_data;
        this.layers[key].init_from_data(this.map, this.data['geojson'], 'fill', fill_data);
        this.layers[key].set_visible(true);

        this.set_viz_mode(this.current_viz_mode);
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

        let h = 'calc(100vh - 60px)';

        this.components = {};
        this.components['CS8AlbertVizComponent'] = new CS8AlbertVizComponent();

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
        this.nav_selector.set_current_item('CS8AlbertVizComponent');
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

//let app = new AppScreen();
let app = new CS8AlbertVizComponent();

function app_init(root) {

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