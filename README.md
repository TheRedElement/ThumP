# ThumP, Thumbnail Preselector

## TODO
- [x] color-limit selector
- [x] create fink client account
- [ ] allow to set number of rows and columns in UI
    - maybe instead of image width and height (scale image automatically)
- [ ] scroll
    - load when scrolling (only have current page objects in memory)
    - save when moving to next page
- [ ] only 2 buttons (buttons are exclusive - only one can be selected -- dropdown?)
    - everything is bad by default
    - good
    - maybe
- [ ] plot by source ID instead of object ID (first alert: sourceID == objID)

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

