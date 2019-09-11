#!/bin/bash

for d in $(ls -d */ | sed 's#/##');
do
    pushd ${d}
    rm -f ${d}.merged.ont
    lst=($(ls | grep .ont))
    outOnt="${d}.merged.ont"
    n=${#lst[@]}
    cp ${lst[0]} $outOnt
    for (( i=1; i<${n}; i++ ));
    do
        ../../onto/merge.py $outOnt ${lst[i]} $outOnt
    done
    popd
done
