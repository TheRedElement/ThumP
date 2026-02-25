import glob
import re
from pathlib import Path

curdir = Path(__file__).resolve().parent
print(str(curdir))

fnames = glob.glob(str(curdir) + "/*_firstalerts.csv")
# print(fnames)

lines = []
for i, fn in enumerate(fnames[:]):
		
	with open(fn, "r") as f:
		lines_ = f.readlines()
		# lines_ = [l.strip("\n") for l in lines_]
		if i != 0:
			lines_ = filter(lambda l: not l.strip().startswith("#"), lines_)
			lines_ = filter(lambda l: not l.strip().startswith("class"), lines_)
		lines += lines_
with open("thump_compiled.csv", "w") as outfile:
	outfile.writelines(lines)
# print(list(lines))
