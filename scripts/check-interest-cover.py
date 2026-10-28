from io import BytesIO
from pathlib import Path
import json
import re
import urllib.request
from PIL import Image, ImageDraw

# Test the ISBN editions actually displayed on the Interests page.
# Previously hard-coded editions could pass while the live covers were absent.
page = Path("interests.html").read_text(encoding="utf-8")
ids = list(dict.fromkeys(re.findall(
    r"https://covers\\.openlibrary\\.org/b/isbn/(\\d{10,13})-L\\.jpg",
    page,
)))
if not ids:
    raise RuntimeError("No Open Library ISBN cover URLs found in interests.html")
entries = []
tiles = []
for isbn in ids:
    url = f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false"
    entry = {"isbn":isbn,"url":url}
    try:
        request = urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (academic portfolio ISBN cover audit)"})
        with urllib.request.urlopen(request,timeout=28) as response:
            raw=response.read(2000000)
            content_type=response.headers.get("Content-Type","")
            entry["http_status"]=response.status
        image=Image.open(BytesIO(raw)).convert("RGB")
        if image.width<100 or image.height<140:
            raise ValueError("Missing or low-resolution cover image")
        entry.update(available=True,width=image.width,height=image.height,content_type=content_type)
        image.thumbnail((190,250))
        tiles.append((isbn,image.copy()))
    except Exception as e:
        entry.update(available=False,error=str(e)[:220])
    entries.append(entry)

out=Path("docs/visual-audit")
out.mkdir(parents=True,exist_ok=True)
(out/"interests-cover-probe.json").write_text(json.dumps({"source":"Open Library Covers API","page":"interests.html","results":entries},indent=2)+"\n")
sheet=Image.new("RGB",(220*len(ids),320),"white")
draw=ImageDraw.Draw(sheet)
for idx,isbn in enumerate(ids):
    x=idx*220
    draw.text((x+9,9),isbn,fill="#222222")
    item=next((image for identifier,image in tiles if identifier==isbn),None)
    if item is None:
        draw.text((x+12,70),"No cover",fill="#111111")
    else:
        sheet.paste(item,(x+(220-item.width)//2,40))
sheet.save(out/"interests-cover-probe.webp","WEBP",quality=83,method=5)
print(json.dumps(entries,indent=2))
