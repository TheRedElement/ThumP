#%%imports
from astropy.io import fits
import glob
from io import BytesIO
import json
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import polars as pl
from typing import List

#%%definitions
def read_files(fnames:List[str]) -> pl.LazyFrame:
    dfs = [(pl.scan_parquet(fn)
            .select(
                pl.col(r"^cutout.+$"),
                pl.col("diaObject"),
                pl.col("diaSource"),
    )) for fn in fnames]

    dfs = pl.concat(dfs)

    return dfs

def compile_file(ldf:pl.LazyFrame):
    """

    - use lazy frame to deal with huge amount of data
    """
    
    data_json = dict()
    for i in range(0, 100):
        #only ever load one row in memory
        row = ldf.slice(offset=i, length=1).collect()
        # print(row["diaObject"])
        # print(row["diaSource"])
        # print(row["cutoutScience"])
        
        hdul = fits.open(BytesIO(row["cutoutScience"][0]))
        science = hdul[0].data
        hdul.close()
        hdul = fits.open(BytesIO(row["cutoutTemplate"][0]))
        template = hdul[0].data
        hdul.close()
        hdul = fits.open(BytesIO(row["cutoutDifference"][0]))
        difference = hdul[0].data
        hdul.close()

        # fig = make_subplots(1, 3)
        # fig.add_traces(data=[
        #     dict(
        #         z=science,
        #         type="heatmap",
        #     ),
        #     dict(
        #         z=template,
        #         type="heatmap",
        #     ),
        #     dict(
        #         z=difference,
        #         type="heatmap",
        #     ),
        # ], rows=[1,1,1], cols=[1,2,3])
        # fig.show()

        data_json[str(row["diaObject"][0]["diaObjectId"])] = dict(
            diaSourceId=row["diaSource"][0]["diaSourceId"],
            science=science.tolist(),
            template=template.tolist(),
            difference=difference.tolist(),
        )

    with open("./data/processed/processed.json", "w") as f:
        json.dump(data_json, f, indent=2)


    return
#%%
def main():
    fnames = sorted(glob.glob("./data/*/*.parquet"))
    df = read_files(fnames)

    compile_file(df)

    return

if __name__ == "__main__":
    main()