# scivi.web

Web version of the SciVi scientific visualization system including SciVi thin client and the corresponding part of SciVi server, part of SciVi.Tools project

## Basics ##

SciVi system is based on the ontological engineering. Its behavior is fully governed by the knowledge base containing different ontologies. More about the SciVi concepts: https://scivi.tools/publications.html

The working process of SciVi has thin client has two main stages: data processing and visualization. Both stages are set up using data flow diagram (DFD), for which special node-based graphical editor is used. This editor allows to build graphs containing nodes with sockets, which cam be connected with links. Nodes represent operators (data obtaining, processing and visualization units) and links depict data transfer from one operator to another.

**Important note:** in fact, SciVi is an extensible environment. It is all about flexibility and reconfigurability. So its core is pretty tiny and does not include any visualization and data processing capabilities: they all are presented as *separated plugins*. According to the particular task, SciVi can be fully reconstructed by changing its knowledge base. The knowledge base stores all the things SciVi an do. And there is *no* "default" knowledge base (yet?): we create the corresponding one for each set of tasks we have to solve. And each "special" knowledge base contains only needed knowledge, no more that that, to ensure the lightweight and intuitive SciVi interface, avoiding user to be lost in tons of options and variants.

## Build and run ##

Python3 and npm are required.

Having them, first install all the stuff needed for the client:
```
cd client
npm install
cd -
```

And then just
```make```
and
```./run.py```

This will compile the js client core and run the python server.

## Knowledge base ##

The `kb` directory contains knowledge base that the server uses while working. Actually `kb` is a storage for onto repo. But server uses merged onto, so you need to perform the merge first. For this, run `merge.sh` inside `kb`.

## External libraries ##

The `lib` directory contains plugins (and other related stuff like widgets and third-party libraries needed for plugins) used for solving particular tasks (linked to SciVi by particular knowledge base).

## Writing plugins ##

Plugins in JavaScript should be described in ontology. 

Plugins may be data sources (YourPlugin -is_a-> DataSource), filters (YourPlugin -is_a-> Filter) and visual objects (YourPlugin -is_a-> VisualObject). "DataSource", "Filter" and "VisualObject" are conventional top-level SciVi ontology concepts you should use describing your plugin.

The JavaScript-implementation of the plugin should be described like the following: YourPlugin <-instance_of- YourPluginImpl -is_a-> ClientSideWorker; YourPluginImpl -language-> JavaScript. The actual implementation should be linked via the attribute.

If the plugin is super-simple and its implementation is just a single line, the attribute called `inline` should be used as follows:
```
"inline": "yourCode"
```

In case it's something more sophisticated, the path to corresponding file can be likned via `path` attribute:
```
"path": "pathToYourCode.js"
```

Your plugin also can have dependencies. For example, it may depend from a library, or require some CSS. In general, dependencies are the files that will be linked to the result web page. The dependencies are described as follows: YourPlugin -has-> YourPluginDependency -is_a-> Dependency, where "Dependency" is conventional top-level SciVi ontology concept. Moreover, language of the dependency should be specified: YourPluginDependency -language-> JavaScript, YourPluginDependency -language-> CSS, etc. YourPluginDependency in its turn should also have `path` or `inline` attribute (ok, typically `path`, because normally dependent libraries are quite huge).

Each plugin works as individual node inside the DFD. Each time, something is changed, the data flow through the diagram and nodes should recalculate their states. This is called "DFD processing".

For the plugin code, following macros are supported:

* `INPUT` -- dict of node's inputs. Keys are input names (described in ontology like YourPlugin -has-> YourInput -is_a-> Input, where "Input" is conventional top-level SciVi ontology concept you should use). Values are the data placed into inputs by other nodes. The values are read-only.

* `OUTPUT` -- dics of node's outputs. Keys are output names (described in ontology like YourPlugin -has-> YourOutput -is_a-> Output, where "Output" is conventional top-level SciVi ontology concept you should use). You should place the corresponding values into this dict.

* `SETTINGS` -- dics of node's settings. Keys are settings' names (described in ontology like YourPlugin -has-> YourSetting -is_a-> Setting, where "Setting" is conventional top-level SciVi ontology concept you should use). Values are the objects associated with the settings. The exact nature of these objects is up to you. According to the type, you may either store here the specified values, or entire domains. For example, if you want to give the user a choice form a bunch of variants, you can store here the variants and later retrieve them in the type editing widget (see below about the widgets).

* `SETTINGS_VAL` -- dict of chosen values. This is similar to `SETTINGS`, but you can use this dict to store actual values chosen by user from the domain (that is typically stored in `SETTINGS`). See the part about widgets for more info.

* `SETTINGS_CHANGED` -- dict of boolean flags, notifying that the user changed the value of corresponding setting (and probably your node should recalculate its state). It's up to you to set `false` here, when the changes are accepted.

* `DATA` -- dict for arbitrary data of your node. You can use it in a way you want, it is actually the memory of the node. This memory persists between processing calls. The content of this dict is serialized by saving the settings.

* `CACHE` -- dict for arbitrary _transient_ data of your node. This is much like `DATA`, it persists between processing calls, but is _not_ serialized by saving. Use it for huge objects, that are (or can be) recalculated during processing and do not require saving.

* `PROCESS` -- macro to call processing. Technically it terminates the previous processing (if any) and initiates the new one. Beware of locking up: the code of your plugin is called when the data reach the node that corresponds to your plugin. So, if you call `PROCESS()` in the code without any conditions, processing will start again, again and again, causing the system to lock up. Normally you don't need to call this method at all. But sometimes your plugin may do something asynchronous, for example waiting for WebSocket, parsing something huge, etc. So, you may want to place deferred calls (completion callbacks, etc.) in your code. And you will need to notify DFD about the deferred call is done -- here goes `PROCESS()`.

* `IN_VISUALIZATION` -- read-only flag determining if user hit "Visualize" button. The idea is, that there are two types of DFD processing. First is a lightweight one that appears each time user changes something: connects/disconnects nodes, changes settings, etc. In this case `IN_VISUALIZATION` will give you `false`. In this processing nodes normally do nothing, or do some tiny work to update their settings according to the current DFD state. Second processing type is a havy one, when user hits "Visualize" button and nodes should actually prepare the data for visualization (or the visualization itself). In this case `IN_VISUALIZATION` will give you `true`.

* `ADD_VISUAL` -- append visual object to visualization page. Do it like this: `ADD_VISUAL(yourVisualizationContainer)`.

## Writing widgets ##

Widgets are almost like plugins, but they are used for interactive change of nodes' parameters, and not directly for data processing or visualization. Widgets are associated with data types allowing the user to input or modify corresponding data. They have the following ontological description: Widget <-is_a- YourWidget -use_for-> YourType -is_a-> Type. "Widget" and "Type" are conventional top-level SciVi ontology concepts. "YourWidget" should also have attribute `inline` or `path` and may have dependencies, just like plugin.

When writing widgets code, you may use the following macros:

* `SETTING_ID` -- numerical identifier of the corresponding setting. Actually, it's the ID of corresponding ontological node (the one describing the setting).

* `SETTING_NAME` -- string name of the corresponding setting. Very probably you will need to refer to this name in the widget's interface.

* `SETTINGS` -- the same macro as in plugin.

* `SETTINGS_VAL` -- the same macro as in plugin.

* `SETTINGS_CHANGED` -- the same macro as in plugin.

* `NODE_ID` -- numerical identifier of the node from the DFD that is actually instancing the corresponding plugin.

* `ADD_WIDGET` -- the main thing you need to do to append your code to the entire interface of the DFD editor. Do it like this:
`ADD_WIDGET(yourWidgetCode)`, for example `ADD_WIDGET("<div>SETTING_NAME: SETTINGS_VAL['SETTING_NAME']</div>")`. Of course, the code should contain all the logic of the widget, including the modification callbacks.

## Licensing ##

SciVi is an open source project. It is licensed by GPL v3. But in case you need to use it inside proprietary project, we can discuss EULA (dual licensing, just like Qt does); please, [contact us](mailto:info@scivi.tools).

Very important thing is, that SciVi core is **fully decoupled** from its plugins and its knowledge base. Anything in `kb` and `lib` directories **is not automatically a part of SciVi**. Plugins and particular ontologies **may have other licenses** than the SciVi core! Technically all the stuff from `kb` and `lib` is treated by SciVi as **data** at runtime. In the plugin's point of view, SciVi is an environment that helps third-party plugins work with each other to solve some task individual plugin cannot solve alone.

It is worth noting, that it is completely ok to use proprietary plugins with SciVi: it doesn't clash with SciVi license.

The rule about plugins is that each one should clearly indicate its own license. When it doesn't -- this means it shares the license with SciVi and it is GPL v3. 
