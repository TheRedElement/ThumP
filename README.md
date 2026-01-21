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
- [x] allow setting number of rows and columns in UI
- [x] scroll
    - save when moving to next page
    - [load when scrolling (only have current page objects in memory)]
- [x] store data on client side
    - https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Client-side_APIs/Client-side_storage
    - only retrieve currently relevant objects
    - more memory efficient
    - options
        - File System Access API
            - probably no firefox support
            - https://developer.mozilla.org/en-US/docs/Web/API/File_System_API
        - localhost + fetch
            - `fetch("http://localhost:8000/data")`
            - requires local server to be running
        - `<input type="file" webkitdirectory>`
            - no live updates

## Data Loading
```python
nobj=12781
nchunks=128
[Parallel(n_jobs=2)]: Using backend LokyBackend with 2 concurrent workers.
Exception at chunk 6, object 99: type Float64 is incompatible with expected type Null
Exception at chunk 11, object 71: type Float64 is incompatible with expected type Null
/home/lukas/github/ThumP/.venv/lib/python3.11/site-packages/joblib/externals/loky/process_executor.py:782: UserWarning: A worker stopped while some jobs were given to the executor. This can be caused by a too short worker timeout or by a memory leak.
  warnings.warn(
Exception at chunk 19, object 44: type Float64 is incompatible with expected type Null
Exception at chunk 27, object 41: type Float64 is incompatible with expected type Null
[Parallel(n_jobs=2)]: Done  46 tasks      | elapsed:  8.3min
Exception at chunk 47, object 47: type Float64 is incompatible with expected type Null
Exception at chunk 51, object 6: type Float64 is incompatible with expected type Null
Exception at chunk 68, object 70: type Float64 is incompatible with expected type Null
Exception at chunk 101, object 29: type Float64 is incompatible with expected type Null
Exception at chunk 109, object 23: type Float64 is incompatible with expected type Null
Exception at chunk 113, object 61: type Float64 is incompatible with expected type Null
```

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

