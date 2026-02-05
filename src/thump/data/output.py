#%%imports
import glob
import json
import logging
import os
import polars as pl

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

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

def remove_inspected(in_pat:str, out_pat:str, dry_run:bool=False) -> pl.DataFrame:
    """remove all input files that have been fully inspected

    - finds all files matching `<in_pat>.json` (`ThumP!` input)
    - finds all files matching `<out_pat>.csv` (`ThumP!` output)
    - checks which input files have IDs, where ALL IDs are contained in the output files
        - removes these files 

    Parameters
        -`in_pat`
            - `str`
            - glob pattern defining all `ThumP!` input files
            - .json will be appended to `in_pat`
        -`out_pat`
            - `str`
            - glob pattern defining all `ThumP!` output files
            - .csv will be appended to `in_pat`
        - `dry_run`
            - `bool`, optional
            - don't apply the deletion
            - just print the changes
            - the default is `False`

    Raises

    Returns

    Dependencies
        - `glob`
        - `os`
        - `polars`

    """
    infiles = glob.glob(os.path.expanduser(in_pat) + ".json")
    outfiles = glob.glob(os.path.expanduser(out_pat) + ".csv")

    out_ids = set(
        pl.concat([
            pl.scan_csv(f, comment_prefix="#").select(pl.col("objectId").cast(pl.Utf8)) for f in outfiles
        ]).collect().to_numpy().flatten()
    )

    for f in infiles:
        with open(f, "r") as file:
            in_ids = set(json.load(file).keys())
            all_inspected = (len(in_ids - out_ids) == 0)
        
        if all_inspected:
            if not dry_run:
                os.remove(f)
                logger.info(f"removed {f}")
            else:
                logger.info(f"dry-run (would remove {f})")

    return 
