"""Generate static translations of the PUBLIC English Conox UI catalogue.
Only development uses Google Translate; no runtime translation requests.
Usage: python3 scripts/i18n/generate-europe.py source.json
"""
import concurrent.futures, json, re, subprocess, sys, time
from pathlib import Path
LANGUAGES='it es pt nl da sv no fi is et lv lt pl cs sk sl hr bs sr mk sq ro hu bg el tr uk ru be mt ga hy ka az'.split()
source=json.loads(Path(sys.argv[1]).read_text())
contextual='--context' in sys.argv
strings=[]
def collect(v):
    if isinstance(v,str): strings.append(v)
    elif isinstance(v,dict):
        for x in v.values(): collect(x)
    elif isinstance(v,list):
        for x in v: collect(x)
collect(source); unique=list(dict.fromkeys(strings)); protected=[]
if contextual: unique=[text for text in unique if re.search(r'\bcases?\b|\bpassage\b',text,re.I) or text=='Play']
for text in unique:
    tokens=[]
    if contextual:
        text=re.sub(r'\bcases\b','clinical cases',text,flags=re.I)
        text=re.sub(r'\bcase\b','clinical case',text,flags=re.I)
        text=re.sub(r'\bpassage\b','recording segment',text,flags=re.I)
        if text=='Play': text='Start playback'
    def sub(m):
        tokens.append(m.group());return 'ZXQPH'+str(len(tokens)-1)+'QXZ'
    clean=re.sub(r'\{\{\w+\}\}|https?://[^\s]+|\b(?:qCON|qNOX|CONOX|ConoxView|CXBIN|DSA|EEG|BSR|SQI|EMG)\b',sub,text)
    protected.append((clean,tokens))
chunks=[];chunk=[];size=0
for i,(text,_) in enumerate(protected):
    if chunk and size+len(text)>3500:chunks.append(chunk);chunk=[];size=0
    chunk.append(i);size+=len(text)+20
if chunk:chunks.append(chunk)
def fetch(lang,ids):
    q='\n'.join('__K'+str(i)+'__\n'+protected[i][0] for i in ids)
    args=['curl','-fsSG','--max-time','45','https://translate.googleapis.com/translate_a/single','--data-urlencode','client=gtx','--data-urlencode','sl=en','--data-urlencode','tl='+lang,'--data-urlencode','dt=t','--data-urlencode','q='+q]
    for retry in range(3):
        try:
            data=json.loads(subprocess.check_output(args,stderr=subprocess.PIPE));result=''.join(row[0] or '' for row in data[0])
            result=result.replace('__К','__K').replace('ЗКСКПХ','ZXQPH').replace('ККСЗ','QXZ')
            parts=re.split(r'__\s*K\s*(\d+)\s*__\s*',result)[1:];out={int(parts[j]):parts[j+1].strip() for j in range(0,len(parts),2)}
            if set(out)!=set(ids):raise ValueError('Missing segment markers')
            for i,value in out.items():
                for n,token in enumerate(protected[i][1]):
                    pattern=r'ZXQPH\s*'+str(n)+r'\s*QXZ'
                    if not re.search(pattern,value,re.I):raise ValueError('Missing protected token')
                    value=re.sub(pattern,lambda _:token,value,flags=re.I)
                if re.search(r'ZXQPH|__K\d',value,re.I):raise ValueError('Unresolved token')
                out[i]=value
            return out
        except Exception:
            if retry==2:
                if len(ids)>1:
                    mid=len(ids)//2;return fetch(lang,ids[:mid])|fetch(lang,ids[mid:])
                # If a service rewrites a marker, translate the textual pieces
                # individually and reinsert protected tokens verbatim.
                i=ids[0]; parts=re.split(r'(ZXQPH\d+QXZ)',protected[i][0]); rebuilt=[]
                for part in parts:
                    marker=re.fullmatch(r'ZXQPH(\d+)QXZ',part)
                    if marker: rebuilt.append(protected[i][1][int(marker[1])]);continue
                    if not part.strip(): rebuilt.append(part);continue
                    plain=args[:-2]+['--data-urlencode','q='+part]
                    response=json.loads(subprocess.check_output(plain,stderr=subprocess.PIPE))
                    text=''.join(row[0] or '' for row in response[0])
                    rebuilt.append((' ' if part.startswith(' ') else '')+text.strip()+(' ' if part.endswith(' ') else ''))
                return {i:''.join(rebuilt)}
            time.sleep(1+retry)
def translate(lang):
    target=Path('src/i18n/europe')/(lang+'.json')
    if target.exists() and not contextual:return lang+' cached'
    previous=json.loads(target.read_text()) if target.exists() else source
    output={};cache=Path('/tmp/conox-translations');cache.mkdir(exist_ok=True)
    for ci,chunk in enumerate(chunks):
        part=cache/f'{lang}-{"context-" if contextual else ""}{ci}.json'
        if part.exists():values={int(k):v for k,v in json.loads(part.read_text()).items()}
        else:values=fetch(lang,chunk);part.write_text(json.dumps(values,ensure_ascii=False))
        output.update(values)
    translated={text:output[i] for i,text in enumerate(unique)}
    def rebuild(v,old):
        if isinstance(v,str):return translated.get(v,old)
        if isinstance(v,dict):return {k:rebuild(x,old[k]) for k,x in v.items()}
        if isinstance(v,list):return [rebuild(x,old[k]) for k,x in enumerate(v)]
        return v
    target.write_text(json.dumps(rebuild(source,previous),ensure_ascii=False,indent=2)+'\n');return lang+' ready'
print(f'{len(unique)} unique texts, {len(chunks)} batches/language',flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    jobs={pool.submit(translate,lang):lang for lang in LANGUAGES}
    for job in concurrent.futures.as_completed(jobs):
        try:print(job.result(),flush=True)
        except Exception as e:print(jobs[job]+' FAILED '+str(e),flush=True)
