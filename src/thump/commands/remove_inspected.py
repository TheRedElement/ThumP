"""removes `ThumP!` input files (json) where ALL objects have been inspected

- finds all files matching `<in_pat>.json` (`ThumP!` input)
- finds all files matching `<out_pat>.csv` (`ThumP!` output)
- checks which input files have IDs, where ALL IDs are contained in the output files
    - removes these files 

Usage
```bash
    thump_remove_inspected [--in_pat IN_PAT] [--out_pat OUT_PAT]
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
        "--in_pat",
        type=str,
        required=True,
        help="pattern defining all `ThumP!` input files. .json will be appended"
    )
    parser.add_argument(
        "--out_pat",
        type=str,
        required=True,
        help="pattern defining all `ThumP!` output files. .csv will be appended"
    )
    parser.add_argument(
        "--dry_run",
        type=lambda v: True if v.lower() == "true" else False,
        nargs="?",
        default=False,
        required=False,
        help="whether to execute as dry-run"
    )

    args=vars(parser.parse_args())

    _ = thdo.remove_inspected(**args)
    
    return

if __name__ == "__main__":
    main()