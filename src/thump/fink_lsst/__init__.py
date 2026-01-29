"""functions and methods for alerts streamed with the [fink](fink-broker.org) broker

- deals with
    - streaming data in some directory
    - reformatting the streamed data into `ThumP!` format
    - reformatting `ThumP!` output into a single table

Exceptions

Classes

	  
Functions
    - `read_files()`  -- read extracted alert packages
    - `compile_file()` -- compile a single file from a set of alert packages
    - `compile_files()` -- compile enough files to cover all extracted alert packages

Other Objects
"""
#%%make available from top level of module
from .process_data import *