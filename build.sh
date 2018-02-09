#!/bin/bash
set -ev
echo "$TRAVIS_EVENT_TYPE"
if [ "$TRAVIS_EVENT_TYPE" = "cron" ]
then
  	npm run e2e && exit 0
else
	npm run test && exit 0
fi