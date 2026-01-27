#%%imports
import os
os.environ["POLARS_MAX_THREADS"] = "1"  #to allow parallelization over chunks

import glob

from thump import (
    make_examples as thme,
    process_data as thpd
)

#%%
def main():
    fnames = sorted(glob.glob("./data/*/*.parquet"))
    df = thpd.read_files(fnames)
    thpd.compile_files(df, chunklen=100, chunk_start=167, nchunks=None, save_dir="./data/processed/", n_jobs=-3)
    
    # #artificial examples
    # thme.make_examples(5, 100)

    return

if __name__ == "__main__":
    main()