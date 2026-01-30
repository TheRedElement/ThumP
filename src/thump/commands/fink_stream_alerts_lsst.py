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
from datetime import datetime
from fink_client.consumer import AlertConsumer
from fink_client.configuration import load_credentials
import glob
import json
from joblib.parallel import Parallel, delayed
import logging
import numpy as np
import polars as pl
import os
import sys
import time
from typing import Tuple

os.environ["POLARS_MAX_THREADS"] = "1"  #to allow parallelization over chunks

from thump.fink_lsst import process_data as thpd

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
# stdout_handler = logging.StreamHandler(sys.stdout)
# stdout_handler.setLevel(logging.INFO)
# stdout_handler.addFilter(lambda record: record.levelno <= logging.INFO)
# stderr_handler = logging.StreamHandler(sys.stderr)
# stderr_handler.setLevel(logging.WARNING)
# logger.handlers.clear()
# logger.addHandler(stdout_handler)
# logger.addHandler(stderr_handler)

#%%definitions
def simulate_alert_stream(df_test:pl.LazyFrame,
    maxtimeout:int=1,
    alerts_per_s:float=160, alerts_per_s_std:float=1,
    ) -> Tuple[str,pl.LazyFrame,str]:
    """simulates an alert arriving

    - simulates an alert arriving by drawing from a database (`df_test`) of downloaded alerts

    Parameters
        - `df_test`
            - `pl.LazyFrame`
            - each row is one alert
        - `maxtimeout`
            - `int`, optional
            - timeout for not receiving an alert
        - `alerts_per_s`
            - `float`, optional
            - expected number of alerts per second
            - set as the mean of a normal distribution
            - the default is `160`
        - `alerts_per_s_std`
            - `float`, optional
            - standard deviation of expected number of alerts per second
            - set as the std of a normal distribution
            - the default is `1`

    Returns
        - `topic`
            - `str`
            - subscribed topic
            - `None` if no alert was retrieved
        - `alert`
            - `pl.LazyFrame`
            - alerts that got emitted
            - `None` if no alert was retrieved
        - `key`
            - `str`
            - alert ky?
            - `None` if no alert was retrieved
    """
    alerts_exist = np.random.choice([0,1], p=[0.3,0.7]).astype(bool)
    if not alerts_exist:
        #no alerts generated
        time.sleep(maxtimeout)
        return None, None, None

    #alerts found
    noptions = df_test.select(df_test.collect_schema().names()[0]).collect().height #number of alerts in the database
    nalerts = max(1,np.abs(np.random.normal(alerts_per_s, alerts_per_s_std)).astype(int))                     #number of alerts to generate (at least 1 alert)

    topic = "testing"
    alerts = pl.concat([df_test.slice(np.random.randint(0, noptions), 1) for _ in range(nalerts)])    #generate some number of alerts that will be output
    key = "testing"
    
    return topic, alerts, key

def poll_single_alert(
    myconfig, topics,
    maxtimeout:int=2,
    df_test:pl.LazyFrame=None,
    save_dir:str=None,
    alert_idx:int=0,
    n_jobs:int=1,
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
        - `df_test`
            - `pl.LazyFrame`, optional
            - database of stored alerts for simulating alert stream
            - each row is one alert
            - the default is `None`
                - will use the actual alert stream
        - `save_dir`
            - `str`, optional
            - directory to save processed alerts to
            - the default is `None`
                - not saved
        - `alert_idx`
            - `int`, optional
            - index of the currently processed alert
            - the default is `0`
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

    if df_test is not None:
        logger.info("simulated stream")
        #simulated alert stream
        topic, alert, key = simulate_alert_stream(df_test, maxtimeout, **simulate_alert_stream_kwargs)
    else:
        logger.info("polling servers")
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
        nalerts = alert.select(alert.collect_schema().names()[0]).collect().height
        logger.info(f"{type(alert)}, {nalerts=}")

        #process alerts in parallel
        _ = Parallel(n_jobs=n_jobs, backend="threading")(
            delayed(thpd.compile_file)(
                alert,
                chunkidx=f"{alert_idx:04d}_{aidx:02d}",
                chunklen=1,               #entire alert package in one single file
                save_dir=save_dir,
            ) for aidx in range(nalerts)
        )
    else:
        logger.info(f"No alerts received in the last {maxtimeout} seconds")
    
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
        "--alerts_per_s",
        type=float,
        default=100,
        required=False,
        help="only for simulated stream. expected number of alerts per second."
    )
    parser.add_argument(
        "--alerts_per_s_std",
        type=float,
        default=1,
        required=False,
        help="only for simulated stream. variance of expected number of alerts per second."
    )
    parser.add_argument(
        "--save",
        type=str,
        default="./data/fink_stream/",
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
        "--reformat_every",
        type=int,
        default=100,
        required=False,
        help="after how many extracted alerts to reformat to `ThumP!` schema"
    )    
    parser.add_argument(
        "--njobs",
        type=int,
        default=1,
        required=False,
        help="number of jobs to use for parallel processing chunks. -1 denotes all available cores"
    )    
    parser.add_argument(
        "--maxtimeout",
        type=float,
        default=5,
        required=False,
        help="maximum amount of time to wait for an alert until trying again. in seconds"
    )    
    args=vars(parser.parse_args())

    #create `./data/` if it does not exist and is requested
    if not os.path.isdir("data/fink_stream/") and ("data/fink_stream" in args["save"]):
        os.makedirs("./data/fink_stream/")


    #global configs
    if args["pat"] is None:
        #stream real alerts
        df = None
    else:
        #artificial alerts
        fnames = sorted(glob.glob(args["pat"]))
        df = thpd.read_files(fnames)        

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
    while True:
        start = datetime.now()
        state = poll_single_alert(myconfig, creds["mytopics"],
            maxtimeout=args["maxtimeout"],
            df_test=df,
            save_dir=save_dir,
            alert_idx=alert_idx,
            n_jobs=args["njobs"],
            simulate_alert_stream_kwargs=dict(alerts_per_s=args["alerts_per_s"], alerts_per_s_std=args["alerts_per_s_std"])
        ) #poll servers
        logger.info(f"runtime alert processing {datetime.now() - start}")
        
        #update
        poll_idx += 1
        alert_idx += state

        #reformat
        # if ((alert_idx % args["reformat_every"]) == 0):
        start = datetime.now()
        reformat_processed(save_dir, chunklen=args["chunklen"])
        logger.info(f"runtime alert processing {datetime.now() - start}")


if __name__ == "__main__":
    main()
