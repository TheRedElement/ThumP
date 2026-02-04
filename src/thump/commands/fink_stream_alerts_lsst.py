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
from typing import Any, List, Tuple

os.environ["POLARS_MAX_THREADS"] = "1"  #to allow parallelization over chunks

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

def process_single_alert(alert:List[Any], 
    save_dir:str=None,
    ):
    topic, alert, key = alert

    start = datetime.now()

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
            ra=np.round(alert["diaObject"]["ra"], decimals=7),
            dec=np.round(alert["diaObject"]["dec"], decimals=7),
            comment="",
        )
    }
    
    if isinstance(save_dir, str):
        with open(f"{save_dir}processed_{datetime.now()}.json", "w") as f:
            json.dump(data_json, f, indent=2)
    else:
        logger.info("process_single_alert(): alert received but not saved because `--save` is unset or `False`")

    logger.info(f"process_single_alert(): runtime alert processing: {datetime.now() - start}")
    return

def consume_alerts(
    myconfig, topics,
    maxtimeout:int=-1,
    maxalerts:int=1,
    n_jobs:int=1, 
    save_dir:str=None,
    files:List[str]=None,
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
        - `maxalerts`
            - `int`, optional
            - maximum number of alerts to retrieve in one poll
            - the default is `-1`
        - `n_jobs`
            - `int`, optional
            - number of jobs to use for processing each individual retrieved alert
            - the default is `-1`
        - `save_dir`
            - `str`, optional
            - directory to save processed alerts to
            - the default is `None`
                - not saved
        - `files`
            - `List[str]`
            - list of files to use for drawing alerts from
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
        logger.info("consume_alerts(): simulated stream")
        #simulated alert stream
        alerts = []
        for i in range(0, np.random.randint(maxalerts)):
            topic, alert, key = simulate_alert_stream(files, maxtimeout, **simulate_alert_stream_kwargs)
            alerts.append([topic, alert, key])
    else:
        logger.info("consume_alerts(): polling servers")
        #actual alerts
        #instantiate a consumer
        consumer = AlertConsumer(topics, myconfig)

        #poll the servers
        alerts = consumer.consume(num_alerts=maxalerts, timeout=maxtimeout)

        #close the connection to the servers
        consumer.close()

    
    #manipulate output
    state = (len(alerts) > 0)
    if state:
        logger.info(f"consume_alerts(): extracted {len(alerts)} alerts")
        _ = Parallel(n_jobs=n_jobs, backend="threading")(
            delayed(process_single_alert)(
                alert,
                save_dir=save_dir
        ) for alert in alerts)
        # for alert in alerts:
        #     process_single_alert(alert, save_dir=save_dir)
    else:
        logger.info(f"consume_alerts(): no alerts received in the last {maxtimeout} seconds")
    
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
        "--maxalerts",
        type=int,
        default=1,
        required=False,
        help="maximum number of alerts to retrieve in one poll."
    )
    parser.add_argument(
        "--npolls",
        type=int,
        default=-1,
        required=False,
        help="number of polls to make to fink. used for testing"
    )
    parser.add_argument(
        "--njobs",
        type=int,
        default=-2,
        required=False,
        help="number of jobs to use for parallel processing of individual alerts. -1 denotes all available cores"
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
        logger.info(f"######### poll {poll_idx+1} #########")
        start = datetime.now()
        state = consume_alerts(myconfig, creds["mytopics"],
            maxtimeout=args["maxtimeout"],
            maxalerts=args["maxalerts"],
            files=fnames,
            save_dir=save_dir,
            simulate_alert_stream_kwargs=dict(),
        ) #poll servers
        logger.info(f"runtime(consume_alerts):     {datetime.now() - start}")
        
        #update
        poll_idx += 1
        alert_idx += state

        reached_npolls = False if (args["npolls"] < 0) else (poll_idx >= args["npolls"])

        #reformat
        # if ((alert_idx % args["reformat_every"]) == 0):
        start = datetime.now()
        reformat_processed(save_dir, chunklen=args["chunklen"])
        logger.info(f"runtime(reformat_processed): {datetime.now() - start}")

    logger.info(f"finished after {poll_idx} polls")
if __name__ == "__main__":
    main()
