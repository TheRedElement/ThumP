#!/bin/env bash

#SBATCH --job-name=fink_stream
#SBATCH --output=./execlogs/%x.out
#SBATCH --error=./execlogs/%x.err

#SBATCH --partition=trevor  #ignored, directly access via ssh

#SBATCH --ntasks=20
#SBATCH --mem=4G            #~200MiB for processing 5 alerts in parallel (based on memory-profiler)
#SBATCH --time=0-01:00:00

source ./_paths.sh

source ${THUMP_PATH}.venv/bin/activate


# #process from fink data-tansfer
# python3 ${THUMP_PATH}src/thump/commands/fink_from_datatransfer_lsst.py \
#     "${THUMP_PATH}data/*/*.parquet" --save "${THUMP_PATH}data/processed/" \
#     --chunklen 60 --chunk_start 0 --nchunks 30 \
#     --njobs 5

# fink_consumer --save -outdir data/fink_stream/

#real data
# mpiexec -n 20 python3 ${THUMP_PATH}src/thump/commands/fink_stream_alerts_lsst.py \
python3 ${THUMP_PATH}src/thump/commands/fink_stream_alerts_lsst.py \
    --save "${THUMP_PATH}data/fink_stream/" \
    --chunklen 60 \
    --maxtimeout -1 \
    --maxalerts 100 \
    --npolls -1 \
    --njobs -1 \

    # --mpi true \
# mprof run -M python ${THUMP_PATH}src/thump/commands/fink_stream_alerts_lsst.py \
# mprof plot -o mprofile.png

# #simulated alerts
# python3 ${THUMP_PATH}/src/thump/commands/fink_stream_alerts_lsst.py \
#      --save "${THUMP_PATH}data/fink_stream/" \
#     --chunklen 60 \
#     --maxtimeout 1 \
#     --maxalerts 10 \
#     --npolls -1 \
#     --njobs -1  \
#     --pat "${THUMP_PATH}data/*/*.parquet" \

#concatenating output
# python3 ${THUMP_PATH}/src/thump/commands/concat_output.py ./ --save ./data/inspected/inspected_0000.csv

#remove files that have been completely inspected
# python3  ${THUMP_PATH}/src/thump/commands/remove_inspected.py --in_pat "${THUMP_PATH}data/fink_stream/reformatted*"  --out_pat "~/Downloads/thump_*" --dry_run false

#computing absolute mag
# python3 thump_mag2absmag <m> <z>

#commands for monitoring
# tail execlogs/fink_stream.* -f
# watch -n 5 "ls data/fink_stream | tail "

#commands for syncing
# rsync -chavzP --delete "$SOURCE" "$DEST"  #SOURCE, DEST ... directories


deactivate

