#%%imports
import glob
import os
import polars as pl

def concat(dir:str, save:str=False) -> pl.DataFrame:
    """concatenates all files output by `ThumP!` that are present in `dir`

    - combines all `ThumP!` output files into one dataframe

    Parameters
        -`dir`
            - `str`
            - directory that contains the desired `ThumP!` files

    Raises

    Returns
        - `df`
            - `pl.DataFrame`
            - dataframe of all the downloaded information

    Dependencies
        - `glob`
        - `os`
        - `polars`

    """
    
    dir = os.path.expanduser(dir)   #allow `~`
    fnames = glob.glob(f"{dir}thump_*.csv",)
    if len(fnames) == 0:
        return pl.DataFrame()
    

    df = pl.concat([pl.scan_csv(fn, comment_prefix="#") for fn in fnames]).collect()
    print(df)    
    #saving
    if isinstance(save, str): df.write_csv(save)

    return df
