# Fuzzy Scanpath

## Scanpath Merger

`scanpathMerger.js` is a filter implementing the eye gaze scanpath aggregation based on fuzzy sets. It builds a so-called *"fuzzy scanpath"* using the following mathematical model:

![eq1](eq1.svg "Equation 1").

$T$ – fuzzy scanpath.

$n$ – maximal number of fixations in all the scanpaths recorded during the experiment (in other words, maximal length of scanpath ever recorded in the experiment).

$m$ – number of areas of interest (AOIs) in the visual stimulus used in the experiment.

$\alpha_j$ – $j$-th AOI.

$\omega^{(i)}_j$ – fuzzy set's belonging function representing the number of informants who have their $i$-th fixation in the $j$-th AOI:

![eq2](eq2.svg "Equation 2").

$\varphi_i^{(k)}$ – $i$-th fixation from the scanpath of $k$-th informant (it is assumed, each informant has a single scanpath recorded in the experiment).

$p$ – number of informants who participated in the experiment.

## Scanpath Filter

`scanpathFilter.js` is a filter rejecting all the outlier elements of the fuzzy scanpath $T$. It uses the following formula to test each $i$-th fixation for whether it should be kept (condition defined by this formula is met) or should be filtered out (condition is not met):

![eq3](eq3.svg "Equation 3")

![eq4](eq4.svg "Equation 4").

$\tau$ – difference threshold (default value is 0.03).

$\theta$ – minimal ratio of informants having their scanpaths longer or equal to $i$ fixations (default value is 0.33).

$\varphi_i^{(k)}$ – $i$-th fixation from the scanpath of $k$-th informant.

$p$ – number of informants who participated in the experiment.
