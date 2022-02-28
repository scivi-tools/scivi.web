# Modified weighted fuzzy pattern classification algorithm

&nbsp;&nbsp;&nbsp;&nbsp;Let us denote the fuzzy classification of maps as <img src="https://latex.codecogs.com/svg.image?F">. Then

<img src="https://latex.codecogs.com/svg.image?F(P,T,W)=\bigcup_{j=1}^{\vert%20T\vert}\bigcup_{i=1}^{\vert%20P\vert}\sum_{k=1}^{T_j}B\left(D\left(P,i,T_j,k,W\right)+C\left(D\left(P,i,T_j,k,W\right),\;E\left(P_i,T_j,k,W\right)\right),T_j\right),">

where <img src="https://latex.codecogs.com/svg.image?P"> is a pattern set (array of maps of known regions), <img src="https://latex.codecogs.com/svg.image?T"> is a test set (array of maps, for which to find fuzzy belonging to the regions from the pattern set), <img src="https://latex.codecogs.com/svg.image?P_i"> is an individual pattern representing the <img src="https://latex.codecogs.com/svg.image?i">-th region, <img src="https://latex.codecogs.com/svg.image?T_j"> is a <img src="https://latex.codecogs.com/svg.image?j">-th test map, <img src="https://latex.codecogs.com/svg.image?W"> is a weight set of properties of settlements.

&nbsp;&nbsp;&nbsp;&nbsp;The membership of the city to a certain region is significant. However, this is still not enough to assess the extent to which the city should be related with the region. Suppose there are 2 patterns and 2 cities that are planned to be classified. Assume that for the first city the membership function values ​​are 0.6 and 0.5, respectively, and for the second city the membership function values ​​are 0.6 and 0.05. In both cases, the city is more in line with the first pattern, but in the first case the advantage is weak and in the second one it is strong. To take this factor into account, the value of the membership function is normalized using the function <img src="https://latex.codecogs.com/svg.image?D">:

<img src="https://latex.codecogs.com/svg.image?D(P,i,T_j,k,W)=\frac{E\left(P_i,T_j,k,W\right)}{{\displaystyle\sum_{m=1}^{\vert%20P\vert}}E\left(P_m,T_j,k,W\right)}.">

&nbsp;&nbsp;&nbsp;&nbsp;Since different settlements can characterize the map membership to a region in different ways, for a more accurate measurement of map membership to a region, a reduction factor is used for such objects that informants often draw, regardless of the region in which they live. It is designated in the formula above as a function <img src="https://latex.codecogs.com/svg.image?B"> and is expressed as follows (the specific value of the coefficient is determined by the researcher):

<img src="https://latex.codecogs.com/svg.image?B(x,\;t)=\bigg\{\begin{array}{lc}x&t\in%20K\\0.5x&t\not\in%20K\end{array},">

where <img src="https://latex.codecogs.com/svg.image?K"> is the set of settlements, drawn by users frequently and region-independently (the list of elements of the set is determined by an expert),

&nbsp;&nbsp;&nbsp;&nbsp;Also, to increase the impact on the classification of the case when the membership function takes a non-zero value for only one region, the function <img src="https://latex.codecogs.com/svg.image?C"> is used, which returns membership to the region if the ratio of membership to the region to the sum of membership to all regions is equal to 1.

<img src="https://latex.codecogs.com/svg.image?C(x,\;y)=\bigg\{\begin{array}{lc}0&x\;\neq1\\y&x=1\end{array}.">

&nbsp;&nbsp;&nbsp;&nbsp;The membership of a settlement to a certain region is determined as follows (with <img src="https://latex.codecogs.com/svg.image?t=T_j">, <img src="https://latex.codecogs.com/svg.image?t_{k,l}"> is an <img src="https://latex.codecogs.com/svg.image?l">-th property of <img src="https://latex.codecogs.com/svg.image?k">-th settlement of test map, <img src="https://latex.codecogs.com/svg.image?W_l"> is a weight denoting the importance of the <img src="https://latex.codecogs.com/svg.image?l">-th property, <img src="https://latex.codecogs.com/svg.image?\mu_{k,l}"> is a function of fuzzy belonging of a <img src="https://latex.codecogs.com/svg.image?j">-th test map to the <img src="https://latex.codecogs.com/svg.image?i">-th pattern calculated for <img src="https://latex.codecogs.com/svg.image?k">-th settlement according to its <img src="https://latex.codecogs.com/svg.image?l">-th property):

<img src="https://latex.codecogs.com/svg.image?E(P_i,t,k,W)\;=\overset{\vert%20W\vert}{\underset{l=1}{min}}(max(\mu_{k,l}(P_i,t_{k,l}),1-W_l)),">

where 

<img src="https://latex.codecogs.com/svg.image?\mu_{k,l}(P_i,x)=D_{i,k,l}(g(x))+\frac{x-g(x)}{h(x)-g(x)}(D_{i,k,l}(h(x))-D_{i,k,l}(g(x))),">

where <img src="https://latex.codecogs.com/svg.image?D_{i,k,l}"> is a frequency distribution of <img src="https://latex.codecogs.com/svg.image?\{P_{m,k,l}\vert\;m=\overline{1,\vert\;P_i\vert}\}"> set (<img src="https://latex.codecogs.com/svg.image?m"> denotes a particular map in the <img src="https://latex.codecogs.com/svg.image?i">-th pattern), <img src="https://latex.codecogs.com/svg.image?g(x)"> clamps <img src="https://latex.codecogs.com/svg.image?x"> to the left nearest element of <img src="https://latex.codecogs.com/svg.image?P_{i,k,l}"> range, and <img src="https://latex.codecogs.com/svg.image?h(x)"> picks the element next to the one given by <img src="https://latex.codecogs.com/svg.image?g(x)"> (or just right nearest to <img src="https://latex.codecogs.com/svg.image?x">). The <img src="https://latex.codecogs.com/svg.image?\mu"> function is extended by 0 wherever it is undefined.

&nbsp;&nbsp;&nbsp;&nbsp;Thus, it is possible to adjust the set of weights <img src="https://latex.codecogs.com/svg.image?W">, the reduction factor in the function <img src="https://latex.codecogs.com/svg.image?B">, and the set <img src="https://latex.codecogs.com/svg.image?K"> of objects that are considered less significant in the classification.

# How to use implementation

Just execute map-classifier.py file. You can adjust some weights and factors, define patterns and test sets at beginning of this file.
