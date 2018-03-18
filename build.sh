#!/bin/bash
set -ev

if [ "$TRAVIS_EVENT_TYPE" = "cron" ]
then
  	npm run cy:ci:prod:run
else
	npm run cy:ci:prod:run
	npm run test
fi