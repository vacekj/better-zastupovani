#!/bin/bash
set -ev

if [[ $TRAVIS_EVENT_TYPE == 'cron']]; then
  	./npm run e2e
else
	./npm run test