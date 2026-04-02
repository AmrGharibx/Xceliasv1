import pypdf

r = pypdf.PdfReader(r'j:\Excelias V2\Study Guide & Excersies\Study Guide Batch 32.pdf')
print(f"{len(r.pages)} pages total\n")
for i, page in enumerate(r.pages):
    print(f"\n{'='*60}")
    print(f"PAGE {i+1}")
    print('='*60)
    print(page.extract_text())
