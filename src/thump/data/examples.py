
#%%imports
import json
import numpy as np

#%%definitions
def make_examples(
    nfiles=5,
    nobj_per_file=100,
    ):

    maxthumbnails = 4   #maximum number of thumbnails per object
    maxseries = 7       #maximum number of series per thumbnail

    for f in range(nfiles):
        file = dict()
        for o in range(nobj_per_file):
            thumbnails = []
            for _ in range(maxthumbnails):
                thumbnail = []
                for _ in range(maxseries):
                    xi = np.arange(np.random.randint(10, 50))
                    yi = np.random.rand(*xi.shape) * np.sin(xi * 2*np.pi / np.random.randint(5, 20)) + 0.01*np.random.randn(*xi.shape)
                    yi /= yi.max()
                    thumbnail.append(xi.tolist())
                    thumbnail.append(yi.tolist())
                thumbnails.append(thumbnail)

            nthumbnails = slice(0, np.random.randint(1,maxthumbnails))  #actual number of thumbnails
            file[f"file{f}_obj{o}"] = dict(
                #required fields
                link="https://lukassteinwender.com",
                thumbnailTypes=[f"thumbnail{i}" for i in range(maxthumbnails)][nthumbnails],
                thumbnails=thumbnails[nthumbnails],
                #auxiliary fields
                comment="a test-file. shall not contain commas!",
                aux_col="auxiliary column. shall not contain commas!"
            )
        with open(f"./data/examples/example{f:02d}.json", "w") as f:
            json.dump(file, f, indent=2)
