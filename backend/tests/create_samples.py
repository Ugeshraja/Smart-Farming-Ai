import os

sample_dir = os.path.join(os.path.dirname(__file__), "sample_files")
os.makedirs(sample_dir, exist_ok=True)

# 1. JPG file (1x1 pixel)
jpg_path = os.path.join(sample_dir, "tomato_early_blight.jpg")
with open(jpg_path, "wb") as f:
    f.write(b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' \",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9")

# 2. PDF file
pdf_path = os.path.join(sample_dir, "soil_test_report.pdf")
with open(pdf_path, "wb") as f:
    f.write(b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n")

# 3. TXT file
txt_path = os.path.join(sample_dir, "farm_notes.txt")
with open(txt_path, "w", encoding="utf-8") as f:
    f.write("Tomato crop field observations: Soil pH is 6.5, slight leaf yellowing on lower branches.\n")

print(f"Sample files created at: {sample_dir}")
print(f"  - {jpg_path}")
print(f"  - {pdf_path}")
print(f"  - {txt_path}")
