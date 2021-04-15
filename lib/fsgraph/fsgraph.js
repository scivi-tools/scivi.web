

const FSGraph = SciViFSGraph.main;
//раскрашиватель дуг
function linkPainter(color)
{
    return {r: color.r, g: color.g, b: color.b, a: color.a * 0.5};
}

//раскрашиватель заголовков
function labelPainter(color)
{
    return {r: 1, g: 1, b: 1, a: 1};
}

function controller(command, args)
{

}

if (IN_VISUALIZATION)
{
    const graph_data = INPUT["Data"];
    const state = INPUT["Select State"];
    const node_colors = INPUT["Colors"];
    const is_directed = SETTINGS_VAL["Is Directed"];
    const title = SETTINGS_VAL["Title"];
    const lang = "ru";

    var graph = CACHE["fsgraph_graph"];
    if (!graph)
        graph = new FSGraph.GraphSerializer().fromJSON(graph_data);

    //настройка для круговой укладки
    const CircleLayoutConfig = {
        "R": new FSGraph.ScalarParam(10, 80, 40, 1)
    }

    //настройка для укладки фрухтермана рейнгольда
    const FruchtermanReingoldConfig = {
        "iterations_count" : new FSGraph.ScalarParam(10, 1000, 100, 5),
        "optimal_vertex_distance" : new FSGraph.ScalarParam(1, 50, 15, 1),
        "is_bounding" : new FSGraph.BooleanParam(true)
    }

    //список всех укладок
    const layouts = {
        "CircleLayout" : new FSGraph.LayoutBuilder_Circle(CircleLayoutConfig),
        "FruchtermanReingoldLayout": new FSGraph.LayoutBuilder_FruchtermanReingold(FruchtermanReingoldConfig)
    };

    //настройка интерфейса(вкладки)
    const gui_configuration = {
        "node_info_tab": new FSGraph.NodeInfoTab(),
        "node_list_tab": new FSGraph.NodeListTab(),
        "settings_tab": new FSGraph.SettingsTab({"Layouts": layouts}),
        "filters_tab": new FSGraph.FiltersTab()
    };

    //делаем стандартные настройки представления для графа
    const link_renderer = is_directed ? new FSGraph.OrientedStraightLinkRenderer() : 
    									new FSGraph.StraightLinkRenderer();
    const node_renderer =  new FSGraph.CircleNodeRenderer();

    //настройка изображения графа
    const graph_view_configuration = {
        link_renderer: link_renderer,
        node_renderer_per_group: {0: node_renderer},
        node_colors_per_group: {0: {h: 210, s: 0.3, v: 1, a: 1.0}},
        node_sizer: (weight) => weight <= 1 ? 1 : Math.log(weight + 1),
        link_sizer: (from_size, to_size, weight) => 0.3,
        link_painter: linkPainter,
        label_painter: labelPainter,
        label_font_size: 15,
        scene_size: 80,
        scroll_value: new FSGraph.ScalarParam(1, 5)
    };

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