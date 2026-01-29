"""combines all `ThumP!` output files in `dir` into a single csv

- finds all files matching `thump_*.csv` in `dir`
- saves them to `--save`

Usage
```bash
    thump_concat_output [--save FILENAME.csv>] dir
```

"""

#%%imports
import argparse

from thump.data import output as thdo

#%%definitions

#%%main
def main():
    parser = argparse.ArgumentParser(
    )
    parser.add_argument(
        "dir",
        type=str,
        default="./",
        help="directory containing files to concatenate"
    )
    parser.add_argument(
        "--save",
        type=str,
        default=False,
        required=False,
        help="file to save result to"
    )

    args=vars(parser.parse_args())

    _ = thdo.concat(**args)
    
    return

if __name__ == "__main__":
    main()