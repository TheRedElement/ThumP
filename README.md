# ThumP, Thumbnail Preselector

## TODO
- [x] color-limit selector
- [x] create fink client account
- [x] plot by source ID instead of object ID (first alert: sourceID == objID)
- [x] only 2 buttons (buttons are exclusive - only one can be selected -- radio?)
    - everything is bad by default
    - good
    - maybe
- [x] only redraw plots upon request/page reload
    -  otherwise just update
    - https://www.google.com/search?q=plotly+js+update+trace+data&oq=plotly+js+update+tracw+&gs_lcrp=EgZjaHJvbWUqCAgCEAAYFhgeMgYIABBFGDkyCAgBEAAYFhgeMggIAhAAGBYYHjIHCAMQABjvBTIHCAQQIRiPAjIHCAUQIRiPAjIHCAYQIRiPAtIBCDc5OThqMGo0qAIKsAIB8QVeoKkuJi3YWQ&client=ms-android-google&sourceid=chrome-mobile&ie=UTF-8&aimos=1#lfId=ChxjMe
- [ ] allow setting number of rows and columns in UI
    - maybe instead of image width and height (scale image automatically)
- [ ] scroll
    - save when moving to next page
    - [load when scrolling (only have current page objects in memory)]
- [ ] store data on client side 
    - https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Client-side_APIs/Client-side_storage
    - only retrieve currently relevant objects
    - more memory efficient


## Approach
- html website + js for loading and writing
    - all server side (OS independent)
- grid layout
    - one object per cell
        - link to fink portal
    - 3 cutouts per cell
        - difference
        - reference
        - science
    - 3-flags (store to 3 data-tables)
        - bad
        - good
        - further inspection
- link directly to fink stream?
    - update button to get latest data?

