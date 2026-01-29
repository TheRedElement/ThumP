
#%%imports
import json
import numpy as np

#%%definitions
def make_examples(
    nfiles=5,
    nobj_per_file=100,
    ):

    for f in range(nfiles):
        file = dict()
        for o in range(nobj_per_file):
            nthumbnails = slice(0, np.random.randint(1,4))
            file[f"file{f}_obj{o}"] = dict(
                #required fields
                link="https://theredelement.github.io",
                thumbnailTypes=[
                    "thumbnail1",
                    "thumbnail2",
                    "thumbnail3",
                    "thumbnail4",
                ][nthumbnails],
                thumbnails=[
                    np.random.randn(np.random.randint(10,15),np.random.randint(10,15)).tolist(),
                    np.random.randn(np.random.randint(10,15),np.random.randint(10,15)).tolist(),
                    np.random.randn(np.random.randint(10,15),np.random.randint(10,15)).tolist(),
                    np.random.randn(np.random.randint(10,15),np.random.randint(10,15)).tolist(),
                ][nthumbnails],
                #auxiliary fields
                comment="a test-file. shall not contain commas!",
                aux_col="auxiliary column. shall not contain commas!"
            )
        with open(f"./data/examples/example{f:02d}.json", "w") as f:
            json.dump(file, f, indent=2)
