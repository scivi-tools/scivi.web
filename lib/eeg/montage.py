#!/usr/bin/env python3

import sys
import json

from .ontology import Ontology, Node, Relation

class Montage(object):
    def __init__(self, path):
        self.montages = self._load_from_ontology(path)
        #self.montages = self._load_from_json(path)

    def _load_from_json(self, path):
        with open(path) as f:
            return json.load(f)

    def _load_from_ontology(self, path):
        montages = {}

        o = Ontology.load_ontology(open(path).read())

        montage_root = o.find_node_by_name('Montage')

        schemes = o.find_children(montage_root, 'is_a')

        for schema in schemes:
            electrodes = o.find_children(schema, 'has')
            all_electrode_props = []
            for electrode in electrodes:
                if self._is_electrode(o, electrode):
                    props = self._get_electrode_properties(o, electrode)
                    all_electrode_props.append(props)
            montages[schema.name] = all_electrode_props
        
        return montages

    def _is_electrode(self, o, node):
        electrode = o.find_node_by_name('Electrode')
        return o.is_adjacent(node, electrode, 'is_a')

    def _get_electrode_properties(self, o, electrode):
        name_node = o.find_node_by_name('Name')
        canonical_name_node = o.find_node_by_name('Canonical Name')
        color_node = o.find_node_by_name('Color')
        channel_node = o.find_node_by_name('Channel')

        props = {}

        children = o.find_children(electrode, 'has')

        for child in children:
            if o.is_adjacent(child, name_node, 'is_a'):
                props['name'] = child.name
            if o.is_adjacent(child, canonical_name_node, 'is_a'):
                props['canonical_name'] = child.name
            if o.is_adjacent(child, color_node, 'is_a'):
                props['color'] = child.name
            if o.is_adjacent(child, channel_node, 'is_a'):
                props['index'] = child.name

        return props

    def save_to_json(self, path):
        with open(path, "wt") as f:
            json.dump(self.montages, f, indent = 4)

    def save_to_ontology(self, path):
        o = Ontology()

        name_node = Node(name = 'Name')
        canonical_name_node = Node(name = 'Canonical Name')
        color_node = Node(name = 'Color')
        channel_node = Node(name = 'Channel')
        electrode_node = Node(name = 'Electrode')
        montage_node = Node(name = 'Montage')

        o.add_node(name_node)
        o.add_node(canonical_name_node)
        o.add_node(color_node)
        o.add_node(channel_node)
        o.add_node(electrode_node)
        o.add_node(montage_node)

        for montage_name, montage in self.montages.items():
            montage_name_node = Node(name = montage_name)
            o.add_node(montage_name_node)
            o.add_relation(Relation(name = 'is_a', link = (montage_name_node.id, montage_node.id)))
            for electrode in montage:
                e_node = Node(name = '_')
                o.add_node(e_node)
                o.add_relation(Relation(name = 'has', link = (montage_name_node.id, e_node.id)))
                o.add_relation(Relation(name = 'is_a', link = (e_node.id, electrode_node.id)))

                electrode_name_node = Node(name = electrode['name'])
                electrode_color_node = Node(name = electrode['color'])
                electrode_channel_node = Node(name = electrode['index'])
                electrode_canonical_name_node = Node(name = electrode['canonical_name'])

                o.add_node(electrode_name_node)
                o.add_node(electrode_color_node)
                o.add_node(electrode_channel_node)
                o.add_node(electrode_canonical_name_node)

                o.add_relation(Relation(name = 'has', link = (e_node.id, electrode_name_node.id)))
                o.add_relation(Relation(name = 'has', link = (e_node.id, electrode_color_node.id)))
                o.add_relation(Relation(name = 'has', link = (e_node.id, electrode_channel_node.id)))
                o.add_relation(Relation(name = 'has', link = (e_node.id, electrode_canonical_name_node.id)))

                o.add_relation(Relation(name = 'is_a', link = (electrode_name_node.id, name_node.id)))
                o.add_relation(Relation(name = 'is_a', link = (electrode_color_node.id, color_node.id)))
                o.add_relation(Relation(name = 'is_a', link = (electrode_channel_node.id, channel_node.id)))
                o.add_relation(Relation(name = 'is_a', link = (electrode_canonical_name_node.id, canonical_name_node.id)))

        with open(path, "wt") as f:
            f.write(o.save_ontology())

    def electrode_names(self, montage_name, pad = []):
        montage = self.montages[montage_name]

        return [electrode["canonical_name"] for electrode in montage if electrode["index"] > -1] + pad

    def transform_frame_by_montage(self, frame, montage_name):
        montage = self.montages[montage_name]

        names = []
        indices = []

        for electrode in montage:
            index = electrode["index"]
            canonical_name = electrode["canonical_name"]
            # name and color don't matter for us now
            if index > -1:
                names.append(canonical_name)
                indices.append(index)

        return [names, frame[indices, :]]

if __name__ == '__main__':
    m = Montage(sys.argv[1])
    m.save_to_json('Puk.json')
