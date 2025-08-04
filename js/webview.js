/*
utilities
 */
function objSort() {
    var args = arguments,
        array = args[0],
        case_sensitive, keys_length, key, desc, a, b, i;

    if (typeof arguments[arguments.length - 1] === 'boolean') {
        case_sensitive = arguments[arguments.length - 1];
        keys_length = arguments.length - 1;
    } else {
        case_sensitive = false;
        keys_length = arguments.length;
    }

    return array.sort(function (obj1, obj2) {
        for (i = 1; i < keys_length; i++) {
            key = args[i];
            if (typeof key !== 'string') {
                desc = key[1];
                key = key[0];
                a = obj1[args[i][0]];
                b = obj2[args[i][0]];
            } else {
                desc = false;
                a = obj1[args[i]];
                b = obj2[args[i]];
            }

            if (case_sensitive === false && typeof a === 'string') {
                a = a.toLowerCase();
                b = b.toLowerCase();
            }

            if (! desc) {
                if (a < b) return -1;
                if (a > b) return 1;
            } else {
                if (a > b) return -1;
                if (a < b) return 1;
            }
        }
        return 0;
    });
} //end of objSort


class Random {
    constructor(value) {
       this.seed = 0;
       this.currentValue = 0;
        this.init(value);
    }

    init(value) {
        this.seed = value;
        this.currentValue = this.seed;
    }

    next() {
        this.currentValue += this.seed;
        this.currentValue ^= 353562;

        while(this.currentValue < 0){
            this.currentValue += 353562;
        }

        return this.currentValue;
    }

    reset() {
        this.currentValue = this.seed;
    }

    getInt(min, max) {
        if (min == max) return min;
        var val = this.next() % 10000;
        return Math.floor(((val / 10000.0) * (max - min)) + min);
    }

    getFloat(min, max) {
        if (min == max) return min;
        var val = this.next() % 10000;
        return (((val / 10000.0) * (max - min)) + min);
    }

    getRandomColor(I) {
        var r,g,b;

        if (I===undefined){
            I = 0;
        }

        I = Math.max(Math.min(255,I),0);
        do{
            r= this.getInt(0,255);
            g= this.getInt(0,255);
            b= this.getInt(0,255);

        }while ((r < I) && (g < I) && (b<I));
        var color = '#';
        color += r.toString(16).padStart(2,'0').toLowerCase();
        color += g.toString(16).padStart(2,'0').toLowerCase();
        color += b.toString(16).padStart(2,'0').toLowerCase();

      return color;
    }
}

function makeColor(r,g,b){
    var color = '#';
        color += r.toString(16).padStart(2,'0').toLowerCase();
        color += g.toString(16).padStart(2,'0').toLowerCase();
        color += b.toString(16).padStart(2,'0').toLowerCase();


}

random_colour_rand = new Random(1234);

function getRandomColor() {
  var letters = '0123456789ABC';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[random_colour_rand.getInt(0, letters.length)];
  }
  return color;
}

function color2hex(r,g,b,a){
    let result = '#';

    result +=r.toString(16).padStart(2,'0');
    result +=g.toString(16).padStart(2,'0');
    result +=b.toString(16).padStart(2,'0');

    return result;
}

/*
    Mapbox widgets
 */

let widget_element_index = 1;


class MapboxWidget{
    constructor(parent, element_type) {

        if (element_type === undefined){
            element_type = 'div';
        }

        this.uid = widget_element_index;
        widget_element_index += 1;

        this.parent = parent;

        this.element = document.createElement(element_type);
        this.element.id = this.get_ID();
        if(this.parent) {
            this.parent.appendChild(this.element);
        }

        this.element.style.position = "absolute";
        this.element.style.backgroundColor = "#fff";
        this.element.style.color = "#000";
        this.element.style.padding = "6px 12px";
        this.element.style.zIndex = "1";
        this.element.style.margin = "12px";
        this.element.style.borderRadius = "4px";
        this.element.style.whiteSpace = 'pre';
    }

    set_bg(col){
        this.element.style.backgroundColor = col;
    }

    remove_children(){
        while (this.element.firstChild) {
            this.element.removeChild(this.element.lastChild);
        }
    }

    get_ID(){
        return this.constructor.name +'-'+ this.uid.toString();
    }
    set_ID(label){
        this.uid = label;
        this.element.id = this.get_ID();
    }

    removeFromDOM(){
        delete_element_from_DOM(this.get_ID());
    }


    size_element(rect){
        if(this.element === undefined){
            return;
        }

        if (rect !== undefined) {
            if ('top' in rect) {
                this.element.style.top = rect.top;
            }

            if ('left' in rect) {
                this.element.style.left = rect.left;
            }

            if ('right' in rect) {
                this.element.style.right = rect.left;
            }

            if ('width' in rect) {
                this.element.style.width = rect.width;
            }

            if ('height' in rect) {
                this.element.style.height = rect.height;
            }

            if('min-width' in rect){
                this.element.style.minWidth = rect['min-width'];
            }

        }
    }

    init(){

    }

    set_text(text) {

        if(this.element !== undefined) {
            this.element.innerText = text;
        }
    }

    set_innerHTML(text) {

        if(this.element !== undefined) {
            this.element.innerHTML = text;
        }
    }

    set_visible(visible){
        if(this.element !== undefined) {
            this.element.hidden = !visible;
        }
    }

    visible(){
        if(this.element !== undefined) {
            return !this.element.hidden;
        }

        return false;
    }

    reset(){

    }

    set_tooltip(label, placement) {
        if (this.element) {
            this.element.setAttribute("data-toggle", "tooltip");

            if(placement !== undefined) {
                this.element.setAttribute('data-bs-placement', placement);
            }

            this.element.setAttribute('data-bs-custom-class' ,"custom-tooltip");

            this.element.title = label;

            $(this.element).tooltip();
        }
    }

    set_pointer_events(enabled){
        if (this.element) {
            if(enabled) {
                this.element.style.pointerEvents = 'auto';
            }else{
                this.element.style.pointerEvents = 'none';
            }
        }
    }

    on_add_to_DOM(){
        try {
            if (this.element) {
                $(this.element).tooltip();
            }
        }catch(error){

        }
    }
}

class Mapbox_Textbox extends MapboxWidget{
    constructor(parent, rect) {
        super(parent);

        //house style
        this.element.style.position = "absolute";
        this.element.style.backgroundColor = "#fff";
        this.element.style.color = "#000";

        this.element.style.zIndex = "1";
        this.element.style.margin = "1px";
        this.element.style.whiteSpace = 'pre';

        //important bit
        this.size_element(rect);
    }
}

class Mapbox_dropdown extends MapboxWidget{

    constructor(parent,rect) {
        super(parent);

        this.element.className = 'dropdown';
        this.element.style.position = 'absolute';
        this.element.style.zIndex = "1";
        this.element.style.padding = "";
        this.element.style.margin = "";
        //this.element.style.borderRadius = "";
        this.element.style.whiteSpace = '';

        this.size_element(rect);

        this.button = document.createElement('button');
        this.button.className = "btn dropdown-toggle";
        this.button.type = "button";
        this.button.style.width = this.element.style.width;
        this.button.style.backgroundColor = "white";
        this.button.style.color = "rgba(0,0,0,255)";
        this.button.id = "dropdownMenuButton";
        this.button.innerText = 'Dropdown button';
        this.button.setAttribute("data-bs-toggle", 'dropdown');
        this.element.appendChild(this.button);

        this.menu = document.createElement('ul');
        this.menu.className = "dropdown-menu";
        this.menu.style.width = this.element.style.width;
        //this.menu.style.width = '45vw';
        this.menu.style.maxHeight = '75vh';
        this.menu.style.overflowY = 'auto';

        this.element.appendChild(this.menu);
    }

    append_menu_option(option){
        this.menu.appendChild(option.get());

        option.on_add_to_DOM();
    }

    reset(){
        while (this.menu.firstChild) {
            this.menu.removeChild(this.menu.lastChild);
        }
    }


    set_button_text(text){
        this.button.innerText = text;
    }
}

class Mapbox_dropdown_item {
    constructor(dropdown, item, data_source) {
        this.li = document.createElement('li');
        this.a = document.createElement('a');
        this.a.className = "dropdown-item";

        this.li.appendChild(this.a);

        let self = this;
        this.a.onclick = function () {
            self.on_click(dropdown, item, data_source);
        };
    }

    on_click(dropdown, item, data_source) {
    }

    get() {
        return this.li;
    }

    set_name(name){
        this.a.innerText = name;
    }
}

class Mapbox_dropdown_item2 extends MapboxWidget{
    constructor(parent, on_click) {

        super(undefined,'li');
        this.parent = parent;

        this.element.style.position = "";
        this.element.style.padding = "";
        this.element.style.zIndex = "1";
        this.element.style.margin = "";
        this.element.style.borderRadius = "";
        this.element.style.whiteSpace = '';


        this.a = document.createElement('a');
        this.a.className = "dropdown-item";
        this.element.appendChild(this.a);

        this.content = document.createElement('multiline');
        this.content.style.width = '20vw';
        this.content.style.whiteSpace = 'pre-wrap';

        this.a.appendChild(this.content);

        if (on_click !== undefined) {
            this.set_onclick(on_click);
        }
    }

    set_onclick(on_click){
        if (on_click !== undefined) {
            this.on_click = on_click;

            let self = this;
            this.a.onclick = function () {
                self.on_click(self.parent);
            };
        }
    }

    on_click(dropdown, item, data_source) {
    }

    get() {
        return this.element;
    }

    set_name(name){
        this.content.innerText = name;
    }
}

class Mapbox_Slider extends MapboxWidget{
    constructor(parent, rect, on_change, data_source) {
        super(parent);

        this.element.style.backgroundColor = "";

        //important bit
        this.size_element(rect);

        this.range= document.createElement('input');
        this.element.appendChild(this.range);
        this.range.id = "epoch-slider";
        this.range.type="range";
        this.range.className="form-range";
        this.range.id="customRange1";
        this.range.min="0";
        this.range.max= "0";
        this.range.step="1";
        this.range.value="0";


        let self = this;
        this.range.onchange= function(){
            on_change(data_source, this.value);
        };
    }


    set_max(max_as_string){
        this.range.max = max_as_string;
    }
    set_current(current_as_string){
        this.range.value = current_as_string;
    }
}

class Mapbox_LegendList extends MapboxWidget {

    constructor(parent,rect) {
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
        this.heading.innerText = 'Flood Depth';
        this.element.appendChild(this.heading);

        this.legend_list_div = document.createElement('div');
        this.legend_list_div.style.overflowY = 'scroll';
        let temp = '';

        temp = "calc(";
        temp += this.element.style.height;
        temp += " - 50px";
        temp += ")";

        this.legend_list_div.style.height = temp;
        this.element.appendChild(this.legend_list_div);
    }

    /*
        legend_list is elements of color: #rrggbb and text = 'some string'
     */

    init(legend_list){
         while (this.legend_list_div.firstChild) {
            this.legend_list_div.removeChild(this.legend_list_div.lastChild);
        }

        for(let i=0;i< legend_list.length;i++) {
            let div = document.createElement('div');
            this.legend_list_div.appendChild(div);

            if ('color' in legend_list[i] && 'text' in legend_list[i]) {
                var entry = document.createElement('span');
                div.appendChild(entry);
                entry.style.cssText = "background-color: " + legend_list[i].color + "; height: 15px; width: 15px; border-radius: 50%; display: inline-block; margin-right: 5px;";
                entry.after(legend_list[i].text);
            }
        }

        this.legend_list_div.style.overflowY = 'auto';
    }

    set_text(text) {
        this.heading.innerText = text;
    }
}

/*
HTMLComponents
 */

let unique_element_index = 1;

function delete_element_from_DOM(element_id){
    let element = document.getElementById(element_id);

    if (element !== null)
    {
        element.parentNode.removeChild(element);
    }
}

class HTMLComponent
{
    constructor() {
        this.uid = unique_element_index;
        unique_element_index += 1;

        this.height = 'calc(100vh)';
    }

    get_ID(){
        return this.constructor.name +'-'+ this.uid.toString();
    }

    oneTimeInit(){
    }

    onShow(parent){
        this.root = parent;
        this.removeFromDOM();
    }

    removeFromDOM(){
        delete_element_from_DOM(this.get_ID());
    }
}

class Screen_base  extends HTMLComponent
{
    constructor() {
        super();
    }
}

class MVC extends HTMLComponent
{
    constructor() {
        super();
    }
}

class DefaultContent extends HTMLComponent
{
    constructor()
    {
        super();
        this.bg_colour = '#ff0000';
    }

    oneTimeInit() {

    }

    onShow(root) {
        super.onShow(root);

        this.removeFromDOM();

        this.content = document.createElement('div');
        this.content.id = this.get_ID();
        this.content.className = 'Square';
        this.content.style.width = "100%";
        this.content.style.height = "100vh";
        this.content.style.backgroundColor = this.bg_colour;
        this.root.appendChild(this.content);
    }
}

class TableTextComponent extends HTMLComponent {
    constructor(payload) {
        super();

        this.payload = payload;

        this.columns = [
            {name: 'Time', style: 'min-width: 200px; max-width: 200px', 'label': 'date'},
            {name: 'Level', style: 'min-width: 100px; max-width: 150px', 'label': 'level'},
            {name: 'Module', style: 'min-width: 200px; max-width: 220px', 'label': 'module'},
            {name: 'Message', style: 'min-width: 200px; max-width: 9999px', 'label': 'message'},
        ];

        this.data_source = undefined;
    }

    static AddTableComponent(parent, columns, data_source){
        let table = document.createElement('table');
        table.className = 'table';
        table.style.cssText = 'width:100%';

        parent.appendChild(table);

        let head = document.createElement('thead');
        table.appendChild(head);


        let tr = document.createElement('tr');
        head.appendChild(tr);


        for (let i = 0; i < columns.length; i++) {
            let current_col = columns[i];
            let th = document.createElement('th');
            th.scope = 'col';
            if ('style' in current_col) {
                th.style.cssText = current_col['style'];
            }
            th.innerText = current_col['name'];
            tr.appendChild(th);
        }

        let body = document.createElement('tbody');
        table.appendChild(body);

        if (data_source !== undefined) {
            for (let index = 0; index < data_source.length; index++) {
                tr = document.createElement('tr');
                body.appendChild(tr);

                for (let col = 0; col < columns.length; col++) {

                    let current_col = columns[col];

                    let th = document.createElement('th');
                    th.scope = 'row';
                    th.style.cssText = 'font-weight: normal; word-wrap: break-word';

                    if (current_col['label'] in data_source[index]) {
                        if (data_source[index][current_col['label']] !== undefined) {
                            th.innerHTML = data_source[index][current_col['label']].replaceAll('\n', '<br>');
                        }else{
                            th.innerHTML = 'undefined';
                        }
                    } else {
                        th.innerHTML = 'no label:' + current_col['label'];
                    }
                    tr.appendChild(th);
                }
            }
        }
    }

    static AddTableFooter(parent){
        {
            let text = document.createElement('div');
            text.className = 'container';
            let h1 = document.createElement('p');
            h1.className = 'text-center';
            text.appendChild(h1);
            h1.innerText = 'End of list';

            parent.appendChild(text);

            for (let i = 0; i < 5; i++) {
                parent.appendChild(document.createElement('br'));
            }
        }
    }


    oneTimeInit() {
        super.oneTimeInit();
    }

    onShow(parent) {
        let container = document.createElement('div');
        parent.appendChild(container);

        container.className = 'container-fullwidth';
        container.id = this.get_ID();
        container.style.cssText = 'height: ' + this.height +'; width:100%; padding-left:1%; padding=right:1% margin:0;';
        container.style.overflowY = 'scroll';

        let table = document.createElement('table');
        table.className = 'table';
        table.style.cssText = 'height:50%; width:100%';

        container.appendChild(table);

        let head = document.createElement('thead');
        head.style.position = 'sticky';
        head.style.padding = '40px';
        head.style.top = '0';
        table.appendChild(head);


        let tr = document.createElement('tr');
        head.appendChild(tr);


        for (let i = 0; i < this.columns.length; i++) {
            let current_col = this.columns[i];
            let th = document.createElement('th');
            th.scope = 'col';
            if ('style' in current_col) {
                th.style.cssText = current_col['style'];
            }
            th.innerText = current_col['name'];
            tr.appendChild(th);
        }

        let body = document.createElement('tbody');
        table.appendChild(body);

        if (this.data_source !== undefined) {
            for (let index = 0; index < this.data_source.length; index++) {
                tr = document.createElement('tr');
                body.appendChild(tr);

                for (let col = 0; col < this.columns.length; col++) {

                    let current_col = this.columns[col];

                    let th = document.createElement('th');
                    th.scope = 'row';
                    th.style.cssText = 'font-weight: normal; word-wrap: break-word';

                    if (current_col['label'] in this.data_source[index]) {
                        th.innerHTML = this.data_source[index][current_col['label']].replaceAll('\n', '<br>');
                    } else {
                        th.innerHTML = 'no label:' + current_col['label'];
                    }
                    tr.appendChild(th);
                }
            }
        }

        {
            let text = document.createElement('div');
            text.className = 'container';
            let h1 = document.createElement('p');
            h1.className = 'text-center';
            text.appendChild(h1);
            h1.innerText = 'End of list';

            container.appendChild(text);

            for (let i = 0; i < 5; i++) {
                container.appendChild(document.createElement('br'));
            }
        }
    }
}

class ChartComponent extends HTMLComponent {
    constructor() {
        super();

        this.current_chart = {};
        this.width = '100vw';
        this.height = '100vh';
        this.top = '0vh';
        this.left = '0vw';
        this.position = 'relative';

        this.tooltip_formatter = undefined;
        this.xaxis_label_formatter = undefined;
        this.xaxis_tick_positions = undefined;
    }

    oneTimeInit() {
        super.oneTimeInit();
    }

    onShow(parent) {
        super.onShow(parent);

        let chart_defintion= this.get_chart_definition();

        chart_defintion.series = [];

        //for(let series_index =0;series_index < current_chart['devices'].length; series_index++)
        {
            if ('series' in this.current_chart){
                chart_defintion.series = this.current_chart['series'];
            }else {
                let series = {};
                series['name'] = this.current_chart['name'];
                series['data'] = this.current_chart['values'];
                series['type'] = 'line';
                series['color'] = '#2d9dd2';

                series['marker'] = false;
                series['showInLegend'] = false;

                if ('zones' in this.current_chart) {
                    series['zoneAxis'] = 'x';
                    series['zones'] = this.current_chart['zones'];
                }
                chart_defintion.series.push(series);
            }
        }

        if ('yAxis' in  this.current_chart) {
            chart_defintion.yAxis = this.current_chart['yAxis'];
        }

        if ('labels' in  this.current_chart) {
            chart_defintion.xAxis.categories = this.current_chart['labels'];
        }

        if ('height' in  this.current_chart) {
            chart_defintion.chart.height = this.current_chart['height'];
        }

        if ('tick_interval' in this.current_chart) {
            chart_defintion.xAxis.tickInterval = this.current_chart['tick_interval'];
        }else{
            chart_defintion.xAxis.tickInterval = 1;
        }

        chart_defintion.chart.type = 'line';

        if ('main_text' in this.current_chart) {
            chart_defintion.title.text = this.current_chart['main_text'];// + ' ' + chart_index.toString();
        }else{
               chart_defintion.title.text = 'Add Title';
        }

        if (Array.isArray(chart_defintion.yAxis) ){
        }else{
            if('unit_text' in this.current_chart) {
                chart_defintion.yAxis.title.text = this.current_chart['unit_text'];
            }

            if (chart_defintion.yAxis.title.text === undefined)
            {
                chart_defintion.yAxis.title.text = 'Add text here!';
            }
        }

        if ('sub_text' in this.current_chart) {
            chart_defintion.subtitle.text = this.current_chart['sub_text'];
        }

        if (this.tooltip_formatter !== undefined){
            chart_defintion['tooltip'].formatter = this.tooltip_formatter;
        }

        if ('tooltip' in this.current_chart){
            chart_defintion['tooltip'] = this.current_chart['tooltip'];
        }

        if ('legend' in this.current_chart){
            chart_defintion['legend'] = this.current_chart['legend'];
        }

        if (this.xaxis_label_formatter !== undefined){
            chart_defintion['xAxis']['labels'].formatter = this.xaxis_label_formatter;
        }

        chart_defintion['xAxis']['tickPositions'] = undefined;

        if (this.xaxis_tick_positions !== undefined){
            chart_defintion['xAxis']['tickPositions'] = this.xaxis_tick_positions;
        }


        try
        {
            let figure = document.createElement('figure');
            parent.appendChild(figure);
            figure.className = "highcharts-figure";
            figure.id = this.get_ID();
            figure.style.position = this.position;

            if (figure.style.position === 'absolute'){
                figure.style.top = this.top;
                figure.style.left = this.left;
                figure.style.width = this.width;
                figure.style.height = this.height;
            }

            Highcharts.chart(figure.id, chart_defintion);
        }
        catch(error)
        {
            console.log('Charting failed: '+error);
        }
    }

    get_chart_definition(){
        let chart_defintion =
        {
            chart: {
                type: 'line',
                //type: 'column'
                animation: false,
                //height: '100%'
            },

            exporting: { enabled: false },

            title: {
                text: ''
            },

            credits: {enabled: false},

            subtitle: {
                text: ''
            },
            xAxis: {
                categories: [],

                 labels: {
                     formatter: function ()
                     {
                         if(typeof this.value === 'string'){
                             return this.value;
                         }

                        if (Array.isArray(this.value)) {
                            if (this.value.length === 1) {
                                return this.value[0].toString();
                            } else {
                                return this.value[1]; // date
                            }
                        }

                        return this.value.toString();
                     }
                 }
            },
            yAxis: {
                title: {
                    text: ''
                },
                labels:{
                    formatter: undefined
                }
            },
            plotOptions: {
                line: {
                    dataLabels: {
                        enabled: false
                    },
                    enableMouseTracking: true
                }
            },
            series: [],

            tooltip: {
                pointFormat: '{series.name}: <b>{point.y:.4f}</b><br/>',
                shared: true,

                formatter: function()
                {
                    if (this.points !== undefined)
                    {
                        let text = '';
                        if (this.points[0].key.length ==1 )
                        {
                            text = this.points[0].key[0].replace('<br>', ' ');
                        }
                        else
                        {
                            text += this.points[0].key[1]; // date
                            text += ' ';
                            text += this.points[0].key[0]; // time
                        }

                        text += '<br>';


                        for(let i=0;i<this.points.length;i++)
                        {
                            text += this.points[i].series.name;
                            text += ': ';
                            text += '<b>';
                            text += this.points[i].y.toFixed(3);
                            text += '</b>';
                            text += '<br>';
                        }

                        return text;
                    }

                    return 'help';

                }
            }
        };

        return chart_defintion;
    }
}

class ChartGroup extends HTMLComponent {
    constructor() {
        super();

        this.number_of_elements=10;
        this.no_of_cols = 2;

        this.chart_list = [];
    }

    oneTimeInit() {
        super.oneTimeInit();
    }

    onShow(parent) {
        super.onShow(parent);

        this.chart_list = [];

        let row = document.createElement('div');
        row.className = 'row';
        row.id = this.get_ID();
        row.style.cssText = 'height: ' + this.height +'; width:100%; padding:1%; margin:0;';
        row.style.overflowY = 'scroll';

        parent.appendChild(row);

        let col = document.createElement('div');
        col.className = 'col-sm-12';
        row.appendChild(col);

        let graph_container = document.createElement('div');
        graph_container.className = 'container-fluid';
        col.appendChild(graph_container);

        for(let graph_index=0;graph_index < this.number_of_elements; graph_index++)
        {
            let r = document.createElement('div');
            r.className = 'row';
            graph_container.appendChild(r);

            let graph = document.createElement('div');
            graph.className = "col-12";
            r.appendChild(graph);

            let chart = new ChartComponent();
            chart.current_chart = this.data_source[graph_index];
            chart.onShow(graph);

            this.chart_list.push(chart);
        }
    }
}


class FIWARETableComponent extends TableTextComponent{
    constructor(payload) {
        super();

        this.columns = [
            {name: 'Time', style: 'min-width: 200px; max-width: 200px', 'label': 'time'},
            {name: 'Sensor', style: 'min-width: 100px; max-width: 150px', 'label': 'sensor_print'},
            {name: 'Property', style: 'min-width: 200px; max-width: 220px', 'label': 'prop'},
            {name: 'Value', style: 'min-width: 200px; max-width: 9999px', 'label': 'value_print'},
        ];
    }
}

class LogComponent extends TableTextComponent {
    constructor(payload) {
        super();

        this.cmd = 'get_current_sensor_data';

        if ((payload !== undefined) && ('cmd' in payload)){
            this.cmd = payload['cmd'];
        }

        this.columns = [
            {name: 'Time', style: 'min-width: 200px; max-width: 200px', 'label': 'date'},
            {name: 'Level', style: 'min-width: 100px; max-width: 150px', 'label': 'level'},
            {name: 'Module', style: 'min-width: 200px; max-width: 220px', 'label': 'module'},
            {name: 'Message', style: 'min-width: 200px; max-width: 9999px', 'label': 'message'},
        ];
    }

    oneTimeInit() {
        super.oneTimeInit();
    }

    onShow(parent) {
        let params = {};

        axios.get(this.cmd, {params: params}).then(response => {
            if (response.status === 200) {
                try {
                    this.data_source = response.data;
                    super.onShow(parent);
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


class SensorComponent extends FIWARETableComponent{
    constructor(payload) {
        super(payload);

        this.cmd = 'get_log_data';

        if ((payload !== undefined) && ('cmd' in payload)){
            this.cmd = payload['cmd'];
        }
    }

    onShow(parent) {
        let params = {};

        axios.get(this.cmd, {params: params}).then(response => {
            if (response.status === 200) {
                try {
                    if ('device_data' in response.data) {
                        this.data_source = response.data['device_data'];
                    }else{
                        this.data_source = response.data['Device'];
                    }
                    this.data_source = objSort(this.data_source, 'time', 'sensor_print', 'prop');
                    this.number_of_elements = this.data_source.length;
                    super.onShow(parent);
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

class ForecastComponent extends FIWARETableComponent{
    constructor(payload) {
        super(payload);

        this.data_source = objSort(payload['WeatherForecast'], 'time', 'sensor_print','prop');
    }
}

class FIWAREChartComponent extends ChartGroup{
    constructor(payload) {
        super(payload);
    }
}

class HistoricCharts extends FIWAREChartComponent{
    constructor(payload) {
        super(payload);

        this.bg_colour = '#ff0000';

        this.cmd = 'get_historic_sensor_data';

        if ((payload !== undefined) && ('cmd' in payload)){
            this.cmd = payload['cmd'];
        }
    }

    onShow(parent) {
        let params = {};

        axios.get(this.cmd, {params: params}).then(response => {
            if (response.status === 200) {
                try {
                    this.data_source = response.data['device_data'];
                    this.number_of_elements = this.data_source.length;
                    super.onShow(parent);
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

class FutureCharts extends FIWAREChartComponent{
    constructor(payload) {
        super(payload);

        this.bg_colour = '#00ff00';
    }

    onShow(parent) {
        let cmd = 'get_forecast_sensor_data';
        let params = {};

        axios.get(cmd, {params: params}).then(response => {
            if (response.status === 200) {
                try {
                    this.data_source = response.data['device_data'];
                    this.number_of_elements = this.data_source.length;
                    super.onShow(parent);
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
class NavPills extends HTMLComponent
{
    constructor(context) {
        super();
        this.context = context;

        this.current_option = '';
        this.previous_option = '';

        this.labels = [];
    }

    oneTimeInit() {
        super.oneTimeInit();
    }

    onShow(parent){
        this.removeFromDOM();

        let nav = document.createElement('nav');
        nav.className="nav nav-pills nav-justified";
        nav.id = this.get_ID();
        parent.appendChild(nav);

        $(nav).hover(function ()
        {
            $(this).css('cursor', 'pointer');
        });

        let self = this;

        for (let i = 0; i < this.labels.length; i++)
        {
            let a = document.createElement('nav');
            a.className="nav-item nav-link active";
            a.style.marginLeft = '10px';
            a.style.marginRight = '10px';
            a.id = this.labels[i];
            a.href="#";
            a.innerHTML = this.labels[i];
            a.onclick= function()
            {
                self.internal_on_click(a.id);
            };

            nav.appendChild(a);
        }

        {
            let div = document.createElement('div');
            div.className = 'row';
            div.id = 'this one';
            div.style = 'height:22px;';
            div.style.backgroundColor = '#f0f0f0';
            //parent.appendChild(div);
        }
    }

    internal_on_click(option_label){
        this.previous_option = this.current_option;

        let elements = document.getElementById(this.get_ID() ).childNodes;


        for(let i=0;i< elements.length;i++)
        {
            elements[i].className = "nav-item nav-link";

            if(elements[i].id === option_label)
            {
                elements[i].className += " active";
                this.current_option = option_label;
            }
        }

        if (this.context !== undefined) {
            this.context.input_handler(this, option_label);
        }
    }

    set_current_item(option_label){
        this.internal_on_click(option_label);
    }
}

/*
    Mapbox
 */

class MapboxLayer
{
    constructor(layer_name) {
      this.layer_name = layer_name;
      this.visibility = undefined;
    }

    init(map, is_visible)
    {
        this.map = map;
    }

    update(request_data, params)
    {
    }

    set_visibility(visibility){

        this.visibility = visibility;

        if(this.map) {

            if (this.visibility == false) {
                this.map.setLayoutProperty(this.layer_name, 'visibility', 'none');
            }
            else
            {
                this.map.setLayoutProperty(this.layer_name, 'visibility', 'visible');
            }
        }
    }

    get_display_name()
    {
        return 'my lovely name';
    }

    islayer(layer_id){
        var layers = this.map.getStyle().layers;

        for (let i=0;i< layers.length;i++)
        {
            if (layers[i].id === layer_id){
                return true;
            }
        }
        return false;
    }
}

class MapboxLayer_Raster extends MapboxLayer
{
    constructor(layer_name, url, rect) {
        super(layer_name);
        this.url = url;
        this.rect = JSON.parse(JSON.stringify(rect));
        this.opacity = 0.5;
    }
    init(map, is_visible) {
        super.init(map, is_visible);

        let params = {};
        try {
            if (this.map) {
                this.map.addSource(this.layer_name, {
                    'type': 'image',
                    'url': this.url,
                    'coordinates': this.rect
                });

                this.map.addLayer({
                    id: this.layer_name,
                    'type': 'raster',
                    'source': this.layer_name,
                    'paint': {
                        'raster-fade-duration': 0,
                        'raster-opacity': this.opacity,
                    }
                });

                this.set_visibility(is_visible);
            }
        } catch (e) {
            console.log(e);
        }
    }

    get_display_name()
    {
        let result = getFilenameAndExtension(this.url);
        return 'Image ' + result[0].replace('_', ' ').replace('T', ' ').replace('Z', ' ');
    }
}


class MapboxLayer_Geojson extends MapboxLayer
{
    constructor(layer_name, url, lines) {
        super(layer_name);
        this.url = url;

        this.has_edges = lines;

        if (this.has_edges === undefined) {
            this.has_edges = false;
        }

        this.display_content = true;

        this.line_colour = '#000000';

        this.edge_paint = {
            'line-color': this.line_colour,
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

        this.render_type = 'fill';
        this.paint_data = {
                        'fill-color': '#ff0000',
                        'fill-opacity': 1.0,
                        };

    }

    init(map, is_visible)
    {
        super.init(map);
        let params = {};

        axios.get(this.url, {params: params}).then(response => {
            if (response.status === 200) {
                this.init_from_data(this.map,response.data, this.render_type,this.paint_data);
                this.set_visibility(is_visible);
            }
        }).catch(function (error) {
            if (error.response) {
                console.log(arguments, 'Error:' + ' ' + error.response.data);
            }
        });
    }

    build_from_colourmap(layer_data){
    }

    init_from_data(map,layer_data, render_type, paint_data){
        super.init(map);

        try {
            if (this.map) {
                if (this.islayer(this.layer_name)){
                    this.map.removeLayer(this.layer_name);

                    if(this.has_edges === true){
                        this.map.removeLayer(this.layer_name +'_line');
                    }

                    this.map.removeSource(this.layer_name);
                }
/*
                if ((layer_data['features'].length > 0) && !('color' in layer_data['features'][0]['properties']))
                {
                    this.build_from_colourmap(layer_data);
                }
*/
                this.map.addSource(this.layer_name, {
                    type: 'geojson',
                    data: layer_data
                });

                if (paint_data === undefined) {
                    paint_data = {
                        'fill-color': '#ff0000',
                        'fill-opacity': 0.25,
                    };
                }

                this.map.addLayer({
                    'id': this.layer_name,
                    'type': render_type,
                    'source': this.layer_name,
                    'paint': paint_data,

                });

                if(this.has_edges === true)
                {
                    this.map.addLayer({
                        'id': this.layer_name +'_line',
                        'type': 'line',
                        'source': this.layer_name,
                        'paint': this.edge_paint
                    });
                }

                this.set_visibility(false);
            }
        } catch (e) {
            console.log(e);
        }
    }

    update(layer_data){
        this.map.getSource(this.layer_name).setData(layer_data);
    }

    get_display_name()
    {
        let result = getFilenameAndExtension(this.url);
        return result[0].replace('_', ' ').replace('T', ' ').replace('Z', ' ');
    }

    set_visibility(visibility){

        this.visibility = visibility;

        this.set_layer_visible(this.layer_name,this.visibility && this.display_content);

        if(this.has_edges === true) {
            this.set_layer_visible(this.layer_name + '_line', this.visibility);
        }
    }

    set_layer_visible(layer_name, is_visible){
        if(this.map) {

            if(this.islayer(layer_name) === true) {
                if (is_visible == false) {
                    this.map.setLayoutProperty(layer_name, 'visibility', 'none');
                } else {
                    this.map.setLayoutProperty(layer_name, 'visibility', 'visible');
                }
            }else{
                console.log('Layer not in map:' + layer_name);
            }
        }
    }
}

class MapboxComponent  extends HTMLComponent {
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

        /*this.elements['map.info.textbox'] = new Mapbox_Textbox(content_root, {
            'left': '1vw',
            'top': '120px',
            'width': '20%',
            'min-width': '300px',
        });

        this.elements['map.info.textbox'].set_text('Depth: n/a');*/

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
    }

    fill_map_pos_textbox(e){
        let loc = this.map.getCenter();

        if (e !== undefined) {
            loc = e.lngLat;
        }
        if ('map.pos.textbox' in this.elements) {

            let text = 'Lng:' + loc.lng.toFixed(3);
            text += ' | Lat: ' + loc.lat.toFixed(3);
            text += ' | Zoom:' + this.map.getZoom().toFixed(1);

            this.elements['map.pos.textbox'].set_text(text);
        }
    }

    on_style_load(){
        this.on_move();

        this.on_mouse_move(undefined);

        this.set_style(this.current_style_name);
        this.set_building_style(this.current_building_style_name);
        this.set_projection_style(this.current_view_style_name);

    }

    on_move(){
        this.center = this.map.getCenter();
        this.zoom =this.map.getZoom();
        this.bearing = this.map.getBearing();
        this.pitch = this.map.getPitch();
    }

    on_mouse_move(e){
        this.fill_map_pos_textbox(e);
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
            if (this.show_buildings) {
                this.map.setLayoutProperty('add-3d-buildings', 'visibility', 'visible');
            } else {
                this.map.setLayoutProperty('add-3d-buildings', 'visibility', 'none');
            }
        }

        this.current_building_style_name = building_style;

        if('map_buildings' in this.elements) {
            this.elements['map_buildings'].set_button_text('Buildings: ' + this.current_building_style_name);
        }
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
}

