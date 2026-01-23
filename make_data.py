#%%imports
from astropy.io import fits
import glob
from io import BytesIO
from joblib.parallel import Parallel, delayed
import json
import logging
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import polars as pl
from typing import List


logger = logging.getLogger(__name__)
logging.basicConfig(filename=None, level=logging.INFO)


#%%definitions
def read_files(fnames:List[str]) -> pl.LazyFrame:
    dfs = [(pl.scan_parquet(fn)
            .select(
                # pl.col("*"),
                #select what is needed
                pl.col(r"^cutout.+$"),
                pl.col("diaObject").struct.field("diaObjectId"),
                pl.col("diaSource").struct.field("diaSourceId"),
    )) for fn in fnames]

    dfs = pl.concat(dfs)

    return dfs

def compile_file(ldf:pl.LazyFrame, chunkidx:int, chunklen:int):
    """compiles a single chunk of len `chunklen` into a json file

    - use lazy frame to deal with huge amount of data
    """

    #number of entries in dataset 
    # height = ldf.select(ldf.collect_schema().names()[0]).collect().height
    logger.info(f"processing chunk {chunkidx} ({chunklen=})")
    # print(type(ldf.select("diaSource").slice(0, 1).collect()[0]))
    
    data_json = dict()
    for i in range(0, chunklen):
        #only ever load one row in memory
        try:
            row = ldf.slice(offset=i, length=1).select(
                pl.col("cutoutScience"),
                pl.col("cutoutTemplate"),
                pl.col("cutoutDifference"),
                pl.col("diaObjectId"),
                pl.col("diaSourceId"),
            ).collect()
        except Exception as e:
            logger.warning(f"Exception at chunk {chunkidx}, object {i}: {e}")
            continue
        
        npixels = slice(0,-10)   #for testing
        npixels = slice(0,None)
        hdul = fits.open(BytesIO(row["cutoutScience"][0]))
        science = hdul[0].data[:,npixels]
        science = np.where(np.isnan(science), None, science)    #NaN is not supported in json
        hdul.close()
        hdul = fits.open(BytesIO(row["cutoutTemplate"][0]))
        template = hdul[0].data[npixels,:]
        template = np.where(np.isnan(template), None, template) #NaN is not supported in json
        hdul.close()
        hdul = fits.open(BytesIO(row["cutoutDifference"][0]))
        difference = hdul[0].data
        difference = np.where(np.isnan(difference), None, difference)   #NaN is not supported in json
        hdul.close()

        """ fig = make_subplots(1, 3)
        fig.add_traces(data=[
            dict(
                z=science,
                type="heatmap",
            ),
            dict(
                z=template,
                type="heatmap",
            ),
            dict(
                z=difference,
                type="heatmap",
            ),
        ], rows=[1,1,1], cols=[1,2,3])
        fig.show() """

        nthumbnails = slice(0,np.random.choice([1,2,3]))  #for testing
        nthumbnails = slice(0,None)
        data_json[str(row["diaSourceId"][0])] = dict(
            comments=[
                f"ids: [{row['diaSourceId'][0]}, {row['diaObjectId'][0]}]",
            ],
            link=f"https://lsst.fink-portal.org/{row['diaObjectId'][0]}",
            diaSourceId=str(row["diaSourceId"][0]),
            diaObjectId=str(row["diaObjectId"][0]),
            thumbnailTypes=[
                "science",
                "template",
                "differece",
            ][nthumbnails],
            thumbnails=[
                science.tolist(),
                template.tolist(),
                difference.tolist(),
            ][nthumbnails],
        )

    with open(f"./data/processed/processed_{chunkidx:04d}.json", "w") as f:
        json.dump(data_json, f, indent=2)


    return

def compile_files(ldf:pl.LazyFrame,
    chunklen:int=100,
    chunk_start:int=0, nchunks:int=None,
    ):
    """extracts relevant information from all files and stores that in correct schema

    - created files contains `chunklen` objects
    - use lazy frame to deal with huge amount of data

    """

    #number of entries in dataset
    height = ldf.select(ldf.collect_schema().names()[0]).collect().height
    print(f"nobj={height}")

    nchunks = height//chunklen + (height%chunklen>0) if nchunks is None else nchunks
    print(f"{nchunks=}")

    # _ = Parallel(n_jobs=1)(delayed(lambda chunkidx, chunklen: print(chunkidx*chunklen, chunkidx*chunklen+chunklen-1))(
    _ = Parallel(n_jobs=1, backend="loky", verbose=1)(delayed(compile_file)(
        ldf=ldf.slice(chunkidx*chunklen, chunklen),
        chunkidx=chunkidx,
        chunklen=chunklen,
    ) for chunkidx in range(chunk_start, nchunks))

    return

#%%
def main():
    fnames = sorted(glob.glob("./data/*/*.parquet"))
    df = read_files(fnames)

    # compile_file(df)
    compile_files(df, chunklen=100, chunk_start=0, nchunks=5)
    
    return

if __name__ == "__main__":
    main()