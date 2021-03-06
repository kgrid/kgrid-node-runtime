#!/usr/bin/env sh

# abort on errors
set -e
git config --global user.email "kgrid-developers@umich.edu"
git config --global user.name "circleci"

# build
npm run docs:build

# navigate into the build output directory
cd docs/.vuepress/dist

git init
git add -A
git commit -m 'deploy'

# if you are deploying to https://<USERNAME>.github.io/<REPO>
# circleci is still using master as default
git push -f https://${GITHUB_TOKEN}@github.com/kgrid/kgrid-node-runtime.git master:gh-pages
