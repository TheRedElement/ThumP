"""combines all `ThumP!` output files in `dir` into a single csv

- finds all files matching `thump_*.csv` in `dir`
- saves them to `--save`

Usage
```bash
    thump_concat_output dir [--save FILENAME.csv]
```

"""

#%%imports
import argparse
from astropy.cosmology import FlatLambdaCDM
from lust_codesnippets_py.astronomy import absmag as lcaa

#%%definitions

#%%main
def main():
    parser = argparse.ArgumentParser(
    )
    parser.add_argument(
        "m",
        type=float,
        help="apparent magnitude"
    )
    parser.add_argument(
        "z",
        type=float,
        help="redshift"
    )
    args=vars(parser.parse_args())


    H0 = 70
    Om0 = 0.3
    cosmo = FlatLambdaCDM(H0, Om0)

    m, z = args["m"], args["z"]
    M = lcaa.absmag(m, z, cosmo)
    print(f"M({m=}, {z=}, LCDM({H0}, {Om0})) = {M[0]:.1f} +/- {M[1]:.1f}")

    return

if __name__ == "__main__":
    main()