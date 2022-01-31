def get_operator_implementation(onto, operatorName, language):
    operatorNode = onto.first(onto.get_nodes_by_name(operatorName))
    implementations = onto.get_nodes_linked_to(operatorNode, "is_instance")
    for impl in implementations:
        implLanguage = onto.first(onto.get_nodes_linked_from(impl, "language"))
        if implLanguage and implLanguage["name"] == language:
            return impl

def get_operator_implementation_path(operator):
    return operator["attributes"]["path"]
