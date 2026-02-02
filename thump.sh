#!/bin/env bash

#SBATCH --job-name=fink_stream
#SBATCH --output=./execlogs/%x.out
#SBATCH --error=./execlogs/%x.err

#SBATCH --partition=trevor  #ignored, directly access via ssh

#SBATCH --ntasks=1
#SBATCH --mem=4G            #~200MiB based on memory-profiler
#SBATCH --time=0-01:00:00

source ./_paths.sh

source ${THUMP_PATH}.venv/bin/activate
# python3 ${THUMP_PATH}src/thump/commands/fink_from_datatransfer_lsst.py \
#     "${THUMP_PATH}data/*/*.parquet" --save "${THUMP_PATH}data/processed/" \
#     --chunklen 60 --chunk_start 0 --nchunks 30 \
#     --njobs 5

# fink_consumer --save -outdir data/fink_stream/

#real data
# mprof run -M python ${THUMP_PATH}src/thump/commands/fink_stream_alerts_lsst.py \
python3 ${THUMP_PATH}src/thump/commands/fink_stream_alerts_lsst.py \
    --save "${THUMP_PATH}data/fink_stream/" \
    --chunklen 60 \
    --maxtimeout 90 \
    --npolls -1
# mprof plot -o mprofile.png
# #simulated alerts
# python3 ${THUMP_PATH}/src/thump/commands/fink_stream_alerts_lsst.py \
#      --save "${THUMP_PATH}data/fink_stream/" \
#     --chunklen 60 \
#     --maxtimeout 1 \
#     --pat "${THUMP_PATH}data/*/*.parquet" \

#commands for monitoring
# tail execlogs/fink_stream.* -f
# watch -n 5 "ls data/fink_stream | tail "

deactivate

