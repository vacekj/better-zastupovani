#!/bin/bash
set -ev
echo "$TRAVIS_EVENT_TYPE"
if [ "$TRAVIS_EVENT_TYPE" = "cron" ]
then
  	npm run e2e
else
	npm run test
fi