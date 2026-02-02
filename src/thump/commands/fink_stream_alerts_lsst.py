"""listens to fink-stream and reformats files to `ThumP!` schema

- only designed for lsst alerts
- listens to the stream and extracts 
- reformats extracted data according to `ThumP!` schema
- setting `--pat` will simulate a stream from files extracted via datatransfer

Usage
```bash
    thump_fink_stream_lsst \
        [--pat PATTERN] \
        [--save DIRECTORY] \
        [--chunklen CHUNKLEN] [--reformat_every REFORMAT_EVERY] \
        [--njobs NJOBS] [--max_timeout MAX_TIMEOUT]
```

"""

#%%imports
import argparse
from astropy.io import fits
from datetime import datetime
from fink_client.consumer import AlertConsumer
from fink_client.configuration import load_credentials
import glob
from io import BytesIO
import json
from joblib.parallel import Parallel, delayed
import logging
import numpy as np
import polars as pl
import os
import sys
import time
from typing import List, Tuple


logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

#%%definitions
def simulate_alert_stream(fnames:List[str],
    maxtimeout:int=1,
    ) -> Tuple[str,pl.LazyFrame,str]:
    """simulates a single alert arriving

    - simulates an alert arriving by drawing from a set of downloaded alerts (defined via `pat`)

    Parameters
        - `fnames`
            - `List[str]`
            - list of files to use for drawing alerts from 
        - `maxtimeout`
            - `int`, optional
            - timeout for not receiving an alert

    Returns
        - `topic`
            - `str`
            - subscribed topic
            - `None` if no alert was retrieved
        - `alert`
            - `dict`
            - alert that got emitted
            - `None` if no alert was retrieved
        - `key`
            - `dict`
            - alert schema
            - ignored here
            - `None` if no alert was retrieved
    """
    alerts_exist = np.random.choice([0,1], p=[0.3,0.7]).astype(bool)
    if not alerts_exist:
        #no alerts generated
        time.sleep(maxtimeout)
        return None, None, None

    #alerts found
    f = np.random.choice(fnames)    #choose random file
    alert = pl.scan_parquet(f)
    nalerts = alert.select(alert.collect_schema().names()[0]).collect().height
    alert = alert.slice(np.random.randint(0, nalerts), 1)   #select single alert to emit

    topic = "testing"
    alert = alert.collect().to_dicts()[0]    #generate a single alert
    
    #deal with images
    key = dict(comment="testing")
    
    return topic, alert, key

def poll_single_alert(
    myconfig, topics,
    maxtimeout:int=2,
    files:List[str]=None,
    save_dir:str=None,
    simulate_alert_stream_kwargs:dict=None,
    ) -> True:
    """polls a single alert

    - function to poll a single alert (maximum waiting time of `maxtimeout`)

    Parameters
        - `myconfig`
            - `dict`
            - confgurationt of the server
        - `topics`
            - `list`
            - topics to listen to
        - `maxtimeout`
            - `int`
            - maximum amount of time to wait until returning
        - `files`
            - `List[str]`
            - list of files to use for drawing alerts from 
        - `save_dir`
            - `str`, optional
            - directory to save processed alerts to
            - the default is `None`
                - not saved
        - `simulate_alert_stream_kwargs`
            - `dict`, optional
            - additional kwargs to pass to `simulate_alert_stream()`
            - the default is `None`
                - set to `dict()`

    Returns
        - `state`
            - `bool`
            - whether an alert was retrieved or not
    """
    if simulate_alert_stream_kwargs is None: simulate_alert_stream_kwargs = dict()

    if files is not None:
        logger.info("poll_single_alert(): simulated stream")
        #simulated alert stream
        topic, alert, key = simulate_alert_stream(files, maxtimeout, **simulate_alert_stream_kwargs)
    else:
        logger.info("poll_single_alert(): polling servers")
        #actual alerts
        # Instantiate a consumer
        consumer = AlertConsumer(topics, myconfig)

        # Poll the servers
        topic, alert, key = consumer.poll(maxtimeout)

        # Close the connection to the servers
        consumer.close()

    
    #manipulate output
    state = topic is not None   #was an alert retrieved?
    if state:
        start = datetime.now()
        #process and save individual objects immediately (only max one alert per poll retrieved)

        #select/preprocess cutouts
        hdul = fits.open(BytesIO(alert["cutoutScience"]))
        science = np.round(hdul[0].data, 1)
        science = np.where(np.isnan(science), None, science)    #NaN is not supported in json
        hdul.close()
        hdul = fits.open(BytesIO(alert["cutoutTemplate"]))
        template = np.round(hdul[0].data, 1)
        template = np.where(np.isnan(template), None, template) #NaN is not supported in json
        hdul.close()
        hdul = fits.open(BytesIO(alert["cutoutDifference"]))
        difference = np.round(hdul[0].data, 1)
        difference = np.where(np.isnan(difference), None, difference)   #NaN is not supported in json
        hdul.close()

        #compile file
        data_json = {
            alert['diaSource']['diaSourceId']: dict(
                link=f"https://lsst.fink-portal.org/{alert['diaObject']['diaObjectId']}",
                thumbnailTypes=[
                    "science",
                    "template",
                    "differece",
                ],
                thumbnails=[
                    science.tolist(),
                    template.tolist(),
                    difference.tolist(),
                ],
                diaObjectId=str(alert["diaObject"]["diaObjectId"]),
                diaSourceId=str(alert["diaSource"]["diaSourceId"]),
                midpointMjdTai=np.round(alert["diaSource"]["midpointMjdTai"], decimals=4),
                ra=np.round(alert["diaObject"]["ra"], decimals=2),
                dec=np.round(alert["diaObject"]["dec"], decimals=2),
                comment="",
            )
        }
        
        if isinstance(save_dir, str):
            with open(f"{save_dir}processed_{datetime.now()}.json", "w") as f:
                json.dump(data_json, f, indent=2)
        else:
            logger.info("poll_single_alert(): alert received but not saved because `--save` is unset or `False`")

        logger.info(f"poll_single_alert(): runtime alert processing: {datetime.now() - start}")

    else:
        logger.info(f"poll_single_alert(): no alerts received in the last {maxtimeout} seconds")
    
    return state

def reformat_processed(
    save_dir:str,
    chunklen:int,
    ):
    """reformats processed alerts (.json files)
    
    - reformats processed alerts (.json files) such that each reformatted file contains `chunklen` objects
    
    Parameters
        - `save_dir`
            - `str`
            - directory containing processed alerts
            - also used to save reformatted alerts to
        - `chunklen`
            - `int`
            - desired length for each chunk in the reformatted files

    Returns
    """

    fnames = sorted(glob.glob(f"{save_dir}processed*.json"))
    if len(fnames) < chunklen:
        #nothing to process
        return
    else:
        #merge into one file (every file contains one object)
        
        ##load pieces
        fnames = fnames[0:chunklen]
        objs = {}
        for fn in fnames:
            with open(fn, "r") as f:
                objs = {**objs, **json.load(f)}
        ##save as reformatted
        fnames_reformatted = glob.glob(f"{save_dir}reformatted*.json")  #reformatted files
        with open(f"{save_dir}reformatted_{len(fnames_reformatted)+1:04d}.json", "w") as f:
            json.dump(objs, f, indent=2)
        
        #delete formatted alerts
        for fn in fnames:
            # logger.info(f"removing {fn}")
            os.remove(fn)
    return

#%%main
def main():
    parser = argparse.ArgumentParser(
    )
    parser.add_argument(
        "--pat",
        type=str,
        default=None,
        required=False,
        help="glob pattern to filter for files downloaded via `fink_client` datatransfer. serve as template to simulate data-stream. streams real data if omitted"
    )
    parser.add_argument(
        "--save",
        type=str,
        default=False,
        required=False,
        help="glob pattern to filter for files downloaded via `fink_client` datatransfer. serve as template to simulate data-stream"
    )
    parser.add_argument(
        "--chunklen",
        type=int,
        default=100,
        required=False,
        help="number of objects each file shall contain"
    )
    parser.add_argument(
        "--maxtimeout",
        type=float,
        default=5,
        required=False,
        help="maximum amount of time to wait for an alert until trying again. in seconds"
    )
    parser.add_argument(
        "--npolls",
        type=int,
        default=-1,
        required=False,
        help="number of polls to make to fink. used for testing"
    )
    args=vars(parser.parse_args())

    #create `./data/` if it does not exist and is requested
    if not os.path.isdir("data/fink_stream/") and ("data/fink_stream" in args["save"]):
        os.makedirs("./data/fink_stream/")


    #global configs
    if args["pat"] is None:
        #stream real alerts
        fnames = None
    else:
        #artificial alerts
        if not args["pat"].endswith(".parquet"):
            raise ValueError("`--pat` has to end with `.parquet`")        
        fnames = sorted(glob.glob(args["pat"]))

    #saving
    save_dir = args["save"]
    
    #fink configs
    creds = load_credentials()  #fink credentials
    myconfig = {
        "bootstrap.servers": creds["servers"],
        "group.id": creds["group_id"]
    }

    #listener
    poll_idx = 0                #init number of polls made
    alert_idx = 0               #init number of alerts received
    reached_npolls = False
    while not reached_npolls:
        start = datetime.now()
        state = poll_single_alert(myconfig, creds["mytopics"],
            maxtimeout=args["maxtimeout"],
            files=fnames,
            save_dir=save_dir,
            simulate_alert_stream_kwargs=dict(),
        ) #poll servers
        logger.info(f"runtime(alert polling):      {datetime.now() - start}")
        
        #update
        poll_idx += 1
        alert_idx += state

        reached_npolls = False if (args["npolls"] < 0) else (poll_idx >= args["npolls"])

        #reformat
        # if ((alert_idx % args["reformat_every"]) == 0):
        start = datetime.now()
        reformat_processed(save_dir, chunklen=args["chunklen"])
        logger.info(f"runtime(alert reformatting): {datetime.now() - start}")

    logger.info(f"finished after {poll_idx} polls")
if __name__ == "__main__":
    main()
