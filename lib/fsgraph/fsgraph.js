

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

if (IN_VISUALIZATION)
{
    const graph_data = INPUT["Data"];
    const state = INPUT["Select State"];
    const colors = INPUT["Colors"];
    //console.log(node_colors);
    const is_directed = SETTINGS_VAL["Is Directed"];
    const title = SETTINGS_VAL["Title"];
    const 
    const lang = "ru";

    var graph = CACHE["fsgraph_graph"];
    if (!graph)
        graph = new FSGraph.GraphSerializer().fromJSON(graph_data);
    const scene_size = Math.max(graph.meta.nodes_count / 2.25, 80);
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
		for(let i = 0; i < graph.meta.groups_count; i++){
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

    //настройка изображения графа
    const graph_view_configuration = {
        link_renderer: link_renderer,
        node_renderer_per_group: node_renderers,
        node_colors_per_group: node_colors,
        node_sizer: (weight) => weight * scene_size / 16,
        link_sizer: (weight) => weight * scene_size / 16,
        max_node_size: scene_size / 4,
        min_node_size: scene_size / 64,
        max_link_size: 1,
        min_link_size: 0.3,
        node_border_width: 0.1,
        link_painter: linkPainter,
        label_painter: labelPainter,
        label_font_size: 15,
        label_layout_strategy: 0,
        scene_size: scene_size,
        scroll_value: new FSGraph.ScalarParam(1, 5)
    };

    //настройка интерфейса(вкладки)
    const gui_configuration = {
        "node_info_tab": new FSGraph.NodeInfoTab(),
        "node_list_tab": new FSGraph.NodeListTab(),
        "settings_tab": new FSGraph.SettingsTab({"Layouts": layouts, "view_config": graph_view_configuration}),
        "filters_tab": new FSGraph.FiltersTab(),
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
        gui.bindGraph(graph, graph_view_configuration);
    }


}
else
{
    CACHE["fsgraph_gui"] = null;
    CACHE["fsgraph_graph"] = null;
}
