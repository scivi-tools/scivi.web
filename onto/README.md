# scivi.onto

Ontology management tools of the SciVi scientific visualization system, part of SciVi.Tools project

## Documentation ##

Used relations:
1. *is_a* -- "A -is_a-> B" means "A is subclass of B" or "A is of type B"
2. *a_part_of* -- "A -a_part_of-> B" means "A is a part of B"; there should be at least two parts of B in this case, so A should not be a single part, there should be other parts of B
3. *has* -- "A -has-> B" means A possesses B; it is OK when A possesses only one thing, so if B is alone connected to A by "has"
4. *base_type* -- "A -base_type-> B" means that B is base type of A; for example if A is an array, B is type of its elements
5. *is_instsance* -- "A -is_instsance-> B" means A is implementation of B; for example A may denote a code of concept B is about
6. *use_for* -- "A -use_for-> B" means A is used to determine B; for example, if A denotes parameter and B denotes code, this means A is a parameter inside B; if A denotes code and B denotes parameter, this means A calculates out B; if A denotes code and B denotes code mask, this means A should be inserted instead of B
7. *language* -- "A -language-> B" means A is written in B; this is used to link code with language

Please, do not add any other relations.

Used top-level nodes:
1. *Root* -- top-most super abstract concept; everything linked to "Root" by "is_a" is meant to be top-level abstract concept
2. *DataSource*
3. *VisualObject*
4. *Filter*
5. *CodeBlock*
6. *Input*
7. *Output*
8. *ClientSideWorker*
9. *ServerSideWorker*
10. *CodeMask*
11. *Widget*
