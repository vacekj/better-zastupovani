# better-zastupovani-next
![travis](https://api.travis-ci.org/JouzaLoL/better-zastupovani.svg)
### [Live development version](https://jouzalol.github.com/better-zastupovani)

Better Zastupovani is an open-source attempt to enhance the current Zastupovani at [gytool](http://suplovani.gytool.cz)

The current software in use at the link mentioned suffers from many flaws (and is horribly outdated), which Better Zastupovani tries to correct.

## Goal
Provide a friendly and useful interface for anyone wanting to learn about the current changes in schedule, regardless of viewing environment. (mobile and desktop)


## Feature list
WIP features are enclosed in ()
- Modern design
- Filter entries by class(, teacher, room)
- (Responsive)
- (Offline mode)

The data used in Better Zastupovani are pulled directly from the old system, cached, and refreshed whenever a change is detected. This app is serverless, meaning no backend is being used.

This may change in the future, as the bulk of code can be outsourced to a server, with the client handling only the display of the data and local caching. This would severly reduce the size and thus the load time of the webpage, and reduce client load, as the most expensive operations would be done on server. 
