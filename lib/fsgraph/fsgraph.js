

const FSGraph = SciViFSGraph.main;
//раскрашиватель дуг
function linkPainter(color)
{
    return [color[0], color[1], color[2], color[3] * 0.5];
}

//раскрашиватель заголовков
function labelPainter(color)
{
    return [1,1,1,1];
}

function controller(command, args)
{

}
const base_functions = ["SQRT", "Linear", "Log"];


if (IN_VISUALIZATION)
{
    const graph_data = INPUT["Data"];
    const state = INPUT["Select State"];
    const colors = INPUT["Colors"];
    //console.log(node_colors);
    const is_directed = SETTINGS_VAL["Is Directed"];
    const title = SETTINGS_VAL["Title"];
    const lang = "ru";

    var graph = CACHE["fsgraph_graph"];
    if (!graph){
        graph = new FSGraph.GraphSerializer().fromJSON(graph_data);
        CACHE['fsgraph_graph'] = graph;
    }
    
    const scene_size = Math.max(graph.meta.nodes_count * 2, 100);
    const states_count = Object.keys(graph.states).length;

    let node_colors = {};
    let node_renderers = {};  
    //формируем цвета и визуализаторы для групп вершин
    if (colors){  	
	    for(let i = 0; i < colors.length; i++){
	    	node_colors[i] = colors[i];
	    	node_renderers[i] = new FSGraph.CircleNodeRenderer();
	    }
	}
	else
		for(let i = 0; i < graph.max_groups_count; i++){
			node_colors[i] = '#B3D9FFFF';
			node_renderers[i] = new FSGraph.CircleNodeRenderer();
		}

    //настройка для круговой укладки
    const CircleLayoutConfig = {
        "R": new FSGraph.ScalarParam(10, scene_size, (scene_size - 10) / 2, 1),
        "use_cluster_splitting" : new FSGraph.BooleanParam(false)
    };

    //настройка для укладки фрухтермана рейнгольда
    const FruchtermanReingoldConfig = {
        "iterations_count" : new FSGraph.ScalarParam(10, 1000, 100, 5),
        "optimal_vertex_distance" : new FSGraph.ScalarParam(1, 50, 15, 1),
        "is_bounding" : new FSGraph.BooleanParam(true),
        "use_cluster_splitting" : new FSGraph.BooleanParam(false)
    };

    //список всех укладок
    const layouts = {
        "CircleLayout" : new FSGraph.LayoutBuilder_Circle(CircleLayoutConfig),
        "FruchtermanReingoldLayout": new FSGraph.LayoutBuilder_FruchtermanReingold(FruchtermanReingoldConfig)
    };

    //делаем стандартные настройки представления для графа
    const link_renderer = is_directed ? new FSGraph.OrientedStraightLinkRenderer() : 
    									new FSGraph.StraightLinkRenderer();

	let node_sizer;
	switch(SETTINGS_VAL["Nodes size function"])
	{
		case "1": 
			node_sizer = (weight) => weight; break;
		case "2": 
			node_sizer = (weight) => Math.log(1 + weight); break;
		default: node_sizer = (weight) => Math.sqrt(weight); break;
	}
	
	let nodes_size_range = [1.01, 10], links_size_range = [0.51, 2];
	{
		const l = SETTINGS_VAL["Nodes size coeff range"].length;
		const values = SETTINGS_VAL["Nodes size coeff range"]
							.substring(1, l - 1).split(';');
		if (values.length == 2)
		{
			const range = values.map(x => Number(x));
			if (!isNaN(range[0]) && !isNaN(range[1]))
				nodes_size_range = range;
		}
	}
	
	{
		const l = SETTINGS_VAL["Links size coeff range"].length;
		const values = SETTINGS_VAL["Links size coeff range"]
							.substring(1, l - 1).split(';');
		if (values.length == 2)
		{
			const range = values.map(x => Number(x));
			if (!isNaN(range[0]) && !isNaN(range[1]))
				links_size_range = range;
		}
	}
	

    //настройка изображения графа
    const graph_view_configuration = {
        link_renderer: link_renderer,
        node_renderer_per_group: node_renderers,
        node_colors_per_group: node_colors,
        node_sizer: node_sizer,
        link_sizer: (weight) => weight,
        node_size_coeff: new FSGraph.ScalarParam(nodes_size_range[0], nodes_size_range[1]),
        link_size_coeff: new FSGraph.ScalarParam(links_size_range[0], links_size_range[1]),
        node_border_width: 0.1,
        link_painter: linkPainter,
        label_painter: labelPainter,
        label_font_size: 15,
        label_layout_strategy: 1,
        scene_size: scene_size,
        scroll_value: new FSGraph.ScalarParam(1, 5, 1)
    };

    //настройка интерфейса(вкладки)
    const gui_configuration = {
        "node_info_tab": new FSGraph.NodeInfoTab(),
        "node_list_tab": new FSGraph.NodeListTab(),
        "settings_tab": new FSGraph.SettingsTab({"Layouts": layouts, "view_config": graph_view_configuration}),
		"clusters_info_tab": new FSGraph.ClusterInfoTab(),
        'about_graph_tab': new FSGraph.AboutGraphTab()
    };
    if (states_count > 1)
    {
    	gui_configuration['calculator_tab'] = new FSGraph.CalculatorTab();
    }

    var gui = CACHE["fsgraph_gui"];
    if (!gui) {
        const translator = FSGraph.getOrCreateTranslatorInstance(lang).extend(g_fsgraph_loc);
        const container = document.createElement('div');
        container.style.height = '100%';
        ADD_VISUAL(container);
        gui = new FSGraph.GUI(controller);
        gui.build(container, gui_configuration, translator);
        if (states_count > 0)
            gui.bindGraph(graph, graph_view_configuration);
    }


}
else
{
    CACHE["fsgraph_gui"] = null;
    CACHE["fsgraph_graph"] = null;
	if (!SETTINGS["Nodes size function"])
		SETTINGS["Nodes size function"] = base_functions;
	if (SETTINGS_VAL["Nodes size function"] === undefined || 
		SETTINGS_VAL["Nodes size function"] >= base_functions.length)
		SETTINGS_VAL["Nodes size function"] = 0;
	
}
