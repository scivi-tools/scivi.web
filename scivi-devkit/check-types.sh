#!/bin/bash
# Working example ./check-types.sh ../kb/csv 'Parse Colors' ../lib/csvGetters/colorParser.js

set -e

D=$(dirname "$0")

display_usage() {
  echo "Usage: $0 <preset dir> <filter name> <JS lib>"
  echo "Example: $0 $D/../kb/csv 'Free-Structured Graph' $D/../lib/fgraph.js"
}

if [  $# -le 2 ]
then
        display_usage
        exit 1
fi


# $1 - knowledge base dir
# $2 - filter name
# $3 - implementation path

echo 'Generate typings'
python3 $D/tsdgenerator.py "$1" "$2" $(dirname "$3")
echo 'Check typings'
npx tsc $3 $(dirname "$3")/index.d.ts --allowJs --checkJs --noEmit --strict --noImplicitAny true --skipLibCheck | grep TS7053

