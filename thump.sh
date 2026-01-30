#!/bin/env bash


#SBATCH --job-name=fink_stream
#SBATCH --output=./execlogs/%x.out
#SBATCH --error=./execlogs/%x.err

#SBATCH --partition=trevor

#SBATCH --ntasks=20
#SBATCH --mem=16G
#SBATCH --time=0-01:00:00

source ./_paths.sh

source ${THUMP_PATH}.venv/bin/activate
# python3 ${THUMP_PATH}src/thump/commands/fink_from_datatransfer_lsst.py \
#     "${THUMP_PATH}data/*/*.parquet" --save "${THUMP_PATH}data/processed/" \
#     --chunklen 60 --chunk_start 0 --nchunks 30 \
#     --njobs 5

# #real data
# python3 ${THUMP_PATH}src/thump/commands/fink_stream_alerts_lsst.py \
#      --save "${THUMP_PATH}data/fink_stream/" \
#     --chunklen 60 --reformat_every 100 \
#     --njobs 8 --maxtimeout 5 \
#testing
python3 ${THUMP_PATH}/src/thump/commands/fink_stream_alerts_lsst.py \
     --save "${THUMP_PATH}data/fink_stream/" \
    --chunklen 60 --reformat_every 100 \
    --njobs -1 --maxtimeout 0.01 \
    --pat "${THUMP_PATH}data/*/*.parquet" --alerts_per_s 16 --alerts_per_s_std 1 \

deactivate

