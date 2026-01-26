# ThumP!, Thumbnails? Preselect!

## TODO

## Current Best Settings
* local (half screen): col width: 59; row height: 49; ncols: NaN; nrows: 4; highlight: 4
* local (full screen): col width: 66; row height: 66; ncols: NaN; nrows: 4; highlight: 4
* local (wide screen): col width: 69; row height: 69; ncols: NaN; nrows: 5; highlight: 10

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
