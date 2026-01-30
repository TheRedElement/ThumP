"""compiles files downloaded via fink datatransfer into `ThumP!` format

- only designed for lsst alerts
- finds all files matching `pat`
- reformats them according to `ThumP!` schema

Usage
```bash
    thump_from_fink_datatransfer \
        pat [--save DIRECTORY] \
        [--chunklen CHUNKLEN] [--chunk_start CHUNK_START] [--nchunks NCHUNKS] \
        [--njobs NJOBS]
```

"""

#%%imports
import argparse
import glob
import os
os.environ["POLARS_MAX_THREADS"] = "1"  #to allow parallelization over chunks

from thump.fink_lsst import process_data as thpd


#%%
def main():
    parser = argparse.ArgumentParser(
    )
    parser.add_argument(
        "pat",
        type=str,
        default="*.parquet",
        help="glob pattern to filter for files downloaded via `fink_client` datatransfer"
    )
    parser.add_argument(
        "--save",
        type=str,
        default="./data/processed/",
        required=False,
        help="directory to save processed files to"
    )
    parser.add_argument(
        "--chunklen",
        type=int,
        default=100,
        required=False,
        help="number of objects each file shall contain"
    )
    parser.add_argument(
        "--chunk_start",
        type=int,
        default=0,
        required=False,
        help="index of the chunk to start processing. used to process subset."
    )
    parser.add_argument(
        "--nchunks",
        type=int,
        default=None,
        required=False,
        help="number of chunks to process, starting from --chunk_start. used to process subset. `None` denotes processing all chunks until the end."
    )
    parser.add_argument(
        "--njobs",
        type=int,
        default=1,
        required=False,
        help="number of jobs to use for parallel processing chunks. -1 denotes all available cores"
    )
    args=vars(parser.parse_args())

    #create `./data/` if it does not exist and is requested
    if not os.path.isdir("data") and ("data" in args["save"]):
        os.makedirs("./data")

    #"./data/*/*.parquet"
    fnames = sorted(glob.glob(args["pat"]))
    df = thpd.read_files(fnames)
    thpd.compile_files(df, chunklen=args["chunklen"], chunk_start=args["chunk_start"], nchunks=args["nchunks"], save_dir=args["save"], n_jobs=args["njobs"])
    
    return

if __name__ == "__main__":
    main()