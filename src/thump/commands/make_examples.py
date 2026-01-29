"""generates some amount of example files for `ThumP!`

- will generate
    - `--nfiles` files
    - each file with `--nobj_per_file` objects

Usage
```bash
    thump_make_examples [--nfiles NFILES] [--nobj_per_file NOBJ_PER_FILE]
```

"""
#%%imports
import argparse

from thump.data import examples as thde

#%%main
def main():
    parser = argparse.ArgumentParser(
    )
    parser.add_argument(
        "--nfiles",
        type=int,
        default=5,
        required=False,
        help="number of files to generate"
    )
    parser.add_argument(
        "--nobj_per_file",
        type=int,
        default=100,
        required=False,
        help="number of objects per file to generate"
    )

    args=vars(parser.parse_args())

    thde.make_examples(**args)

    return

if __name__ == "__main__":
    main()