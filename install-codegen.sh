#!/bin/sh

set -e

echo "---------------------------------------------------"
echo " Building and installing oai-ts-codegen into"
echo " Apicurio."
echo "---------------------------------------------------"
echo ""
echo ""

yarn run package


echo "---------------------------------------------------"
echo " Deploy package to apicurio-studio (server)."
echo "---------------------------------------------------"
cp dist/bundles/OAI-codegen.umd.js ~/git/apicurio/apicurio-studio/back-end/hub-codegen/src/main/resources/js-lib/OAI-codegen.umd.js

echo ""
echo ""
echo "---------------------------------------------------"
echo " ALL DONE!"
echo "---------------------------------------------------"

rm -rf dist
