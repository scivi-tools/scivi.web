#!/bin/bash

lst=($(ls | grep .ont | grep -v result))
outOnt="result.ont"
n=${#lst[@]}

cp ${lst[0]} $outOnt

for (( i=1; i<${n}; i++ ));
do
    ../onto/merge.py $outOnt ${lst[i]} $outOnt
done
