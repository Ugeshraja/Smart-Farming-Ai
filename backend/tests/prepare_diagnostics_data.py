import os
import shutil
import zipfile
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
SAMPLE_DIR = BACKEND_DIR / "tests" / "sample_files"
POTATO_VAL_DIR = SAMPLE_DIR / "potato_val"
BRINJAL_VAL_DIR = SAMPLE_DIR / "brinjal_val"

POTATO_VAL_DIR.mkdir(parents=True, exist_ok=True)
BRINJAL_VAL_DIR.mkdir(parents=True, exist_ok=True)

# 1. Copy Potato Validation Images (20 Early Blight, 5 Late Blight, 5 Healthy)
G_VAL = Path(r"G:\My Drive\Project\yolo11\images\val")
if G_VAL.exists():
    print("Copying Potato validation images...")
    import glob
    eb_files = sorted(glob.glob(str(G_VAL / "00_*.JPG")) + glob.glob(str(G_VAL / "00_*.jpg")))[:20]
    lb_files = sorted(glob.glob(str(G_VAL / "01_*.JPG")) + glob.glob(str(G_VAL / "01_*.jpg")))[:5]
    h_files = sorted(glob.glob(str(G_VAL / "02_*.JPG")) + glob.glob(str(G_VAL / "02_*.jpg")))[:5]

    for f in eb_files + lb_files + h_files:
        dest = POTATO_VAL_DIR / os.path.basename(f)
        if not dest.exists():
            shutil.copy2(f, dest)
    print(f"Copied {len(list(POTATO_VAL_DIR.glob('*.*')))} Potato validation images to local SSD.")

# 2. Extract Brinjal Test Images from local SSD zip: E:\temp_brinjal\...\SLIF-Brinjal.zip
inner_zip = Path(r"E:\temp_brinjal\SLIF-Brinjal An In-Field Leaf Dataset for Disease\SLIF-Brinjal.zip")
if inner_zip.exists():
    print("Extracting Brinjal images from local SSD zip...")
    with zipfile.ZipFile(inner_zip, "r") as z:
        names = z.namelist()
        cercospora_files = [n for n in names if "cercospora" in n.lower() and n.lower().endswith((".jpg", ".jpeg", ".png"))]
        bacterial_files = [n for n in names if "bacterial_leaf_spot" in n.lower() and n.lower().endswith((".jpg", ".jpeg", ".png"))]
        healthy_files = [n for n in names if "healthy" in n.lower() and n.lower().endswith((".jpg", ".jpeg", ".png"))]

        print(f"Found in zip: {len(cercospora_files)} Cercospora, {len(bacterial_files)} Bacterial Leaf Spot, {len(healthy_files)} Healthy.")

        # Extract 25 Cercospora, 5 Bacterial Leaf Spot, 5 Healthy
        for n in cercospora_files[:25]:
            fname = "cercospora_" + os.path.basename(n)
            with z.open(n) as sf, open(BRINJAL_VAL_DIR / fname, "wb") as df:
                df.write(sf.read())

        for n in bacterial_files[:5]:
            fname = "bacterial_" + os.path.basename(n)
            with z.open(n) as sf, open(BRINJAL_VAL_DIR / fname, "wb") as df:
                df.write(sf.read())

        for n in healthy_files[:5]:
            fname = "healthy_" + os.path.basename(n)
            with z.open(n) as sf, open(BRINJAL_VAL_DIR / fname, "wb") as df:
                df.write(sf.read())

    print(f"Extracted {len(list(BRINJAL_VAL_DIR.glob('*.*')))} Brinjal validation images to local SSD.")
