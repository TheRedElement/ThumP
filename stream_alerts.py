#%%imports
from datetime import datetime
from fink_client.consumer import AlertConsumer
from fink_client.configuration import load_credentials
import glob
import json
import logging
import numpy as np
import polars as pl
import os
import time
from typing import Tuple

from thump import (
    make_examples as thme,
    process_data as thpd
)

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
#%%definitions
def simulate_alert_stream(df_test:pl.LazyFrame, maxtimeout:int=5) -> Tuple[str,pl.LazyFrame,str]:
    """simulates an alert arriving

    - simulates an alert arriving by drawing from a database (`df_test`) of downloaded alerts

    Parameters
        - `df_test`
            - `pl.LazyFrame`
            - each row is one alert
        - `maxtimeout`
            - `int`, optional
            - timeout for not receiving an alert

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
    nalerts = max(1,np.abs(np.random.normal(3, 1)).astype(int))                     #number of alerts to generate (at least 1 alert)

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

    Returns
        - `state`
            - `bool`
            - whether an alert was retrieved or not
    """


    if df_test is not None:
        logger.info("simulated stream")
        #simulated alert stream
        topic, alert, key = simulate_alert_stream(df_test, maxtimeout)
        # print(alert)
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
        logger.info(type(alert))
        nalerts = alert.select(alert.collect_schema().names()[0]).collect().height
        thpd.compile_file(alert,
            chunkidx=alert_idx,
            chunklen=nalerts,               #entire alert package in one single file
            save_dir=save_dir,
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
    if len(fnames) == 0:
        #nothing to process
        return

    #read files into a single object (DUPLICATE KEYS WILL BE OVERRIDDEN!)
    objs = {}
    for fn in fnames:
        with open(fn, "r") as f:
            objs = {**objs, **json.load(f)}

    #split all objects into chunks of desired length
    nobj = len(objs.keys())
    idxs = np.arange(chunklen, nobj, chunklen)
    chunked = np.array_split(list(objs.keys()), idxs, axis=0)
    logger.info((
        f"reformatting {len(fnames)} files ({nobj} objs)."
        f"{chunklen=}, len(chunks)={[len(c) for c in chunked]}"
    ))

    #reformat to files of desired `chunklen`
    fnames_reformatted = glob.glob(f"{save_dir}reformatted*.json")
    for cidx, chunk in enumerate(chunked):
        file = {obj:objs.pop(obj) for obj in chunk} #objects of current chunk

        if len(chunk) < chunklen:
            #mark as file to be redone (not enough entries, will be added to next round of reformatting)
            with open(f"{save_dir}processed_0000_{datetime.now()}.json", "w") as f:
                json.dump(file, f, indent=2)
        else:
            #save a reformatted
            with open(f"{save_dir}reformatted_{len(fnames_reformatted)+cidx:04d}.json", "w") as f:
                json.dump(file, f, indent=2)
    

    #delete formatted alerts
    for fn in fnames:
        # logger.info(f"removing {fn}")
        os.remove(fn)
    return

#%%main
def main():

    #global configs
    save_dir = f"./data/fink_stream/"
    fnames = sorted(glob.glob("./data/*/*.parquet"))
    df = thpd.read_files(fnames)
    df = None

    #fink configs
    creds = load_credentials()  #fink credentials
    myconfig = {
        "bootstrap.servers": creds["servers"],
        "group.id": creds["group_id"]
    }

    #listener
    poll_idx = 0                #init number of polls made
    alert_idx = 0               #init number of alerts received
    reformat_every = 100         #how often to reformat the extracted alerts
    while True:
        state = poll_single_alert(myconfig, creds["mytopics"],
            maxtimeout=0.1,
            df_test=df,
            save_dir=save_dir,
            alert_idx=alert_idx,
        ) #poll servers
        
        #update
        poll_idx += 1
        alert_idx += state

        if ((alert_idx % reformat_every) == 0):
            reformat_processed(save_dir, chunklen=60)


if __name__ == "__main__":
    main()