#!/usr/bin/env python3
"""Portable local character rig workbench. Run --help for subcommands."""
import argparse
import functools
import hashlib
import io
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import zipfile
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote,urlsplit
sys.dont_write_bytecode=True

SKILL=Path(__file__).resolve().parents[1]
WEB=SKILL/'assets/webui'
DEMO=SKILL/'assets/demo'

def emit(value):
    print(json.dumps(value,ensure_ascii=False),flush=True)

def project_dir(value):
    p=Path(value).expanduser().resolve()
    if not (p/'project.json').is_file(): raise ValueError('project.json not found: '+str(p))
    if p.is_relative_to(SKILL): raise ValueError('keep working projects outside the installed Skill directory')
    return p

def initialize(target,demo=False,source=None):
    target=Path(target).expanduser().resolve()
    if target.is_relative_to(SKILL): raise ValueError('project must be outside the Skill directory')
    if target.exists() and any(target.iterdir()): raise ValueError('init requires a new or empty directory; no existing project is overwritten')
    if not demo and not source: raise ValueError('choose --demo or --source')
    source=(DEMO/'source.png') if demo else Path(source).expanduser().resolve()
    if not source.is_file(): raise ValueError('source file not found')
    config=json.loads((DEMO/'project.json').read_text())
    if not demo:
        from PIL import Image
        with Image.open(source) as im:
            if im.format!='PNG' or im.mode!='RGBA' or im.getextrema()[3][0]==255: raise ValueError('new source must be transparent RGBA PNG')
            config['canvas']=list(im.size)
        config['name']=source.stem
        config['sourceSha256']=hashlib.sha256(source.read_bytes()).hexdigest()
        for layer in config['layers']:
            layer['polygon']=[]
            layer['pivot']=None
        config['ownershipOverrides']=[]
        config['joints']={k:None for k in ['root','body','neck','head','l','r']}
        config['camera']=[-config['canvas'][0]*.12,-config['canvas'][1]*.07,config['canvas'][0]*1.24,config['canvas'][1]*1.17]
        config['hairFields']=[]
        config['controllers']={}
        config['faceSupport']={'skinPolygon':[],'crop':[],'bbox':[],'eyeColor':[255,241,211,255]}
        config['provenance']={'mode':'needs-semantic-annotation','generatedOcclusion':False}
    target.mkdir(parents=True,exist_ok=True)
    shutil.copy2(source,target/'source.png')
    (target/'project.json').write_text(json.dumps(config,ensure_ascii=False,indent=2)+'\n')
    return {'project':str(target),'demo':demo,'status':'ready-to-build' if demo else 'needs-semantic-annotation','sourceSha256':config['sourceSha256']}

def build_project(project):
    from build_rig import build
    from project_schema import validate_recipe
    validate_recipe(project/'project.json')
    output=project/'rig'
    if output.exists() and not (output/'.riglab-output.json').is_file(): raise ValueError('rig/ contains unmanaged files; refusing to overwrite')
    staging=Path(tempfile.mkdtemp(prefix='.rig-build-',dir=project))
    try:
        result=build(project/'project.json',staging)
        (staging/'.riglab-output.json').write_text(json.dumps({'generator':'character-rig-lab','version':1})+'\n')
        previous=None
        if output.exists():
            previous=project/('rig.previous-'+str(time.time_ns()))
            output.rename(previous)
        try: staging.rename(output)
        except Exception:
            if previous is not None: previous.rename(output)
            raise
        return {'output':str(output),'previous':str(previous) if previous else None,**result}
    finally:
        if staging.exists(): shutil.rmtree(staging)

def verify_project(project):
    from project_schema import validate_recipe,local_file
    import numpy as np
    from PIL import Image
    recipe,source=validate_recipe(project/'project.json')
    folder=project/'rig'
    manifest=json.loads((folder/'rig.json').read_text())
    actual=hashlib.sha256(local_file(folder,manifest['source']).read_bytes()).hexdigest()
    if actual!=recipe['sourceSha256'] or manifest['sourceSha256']!=actual: raise ValueError('generated source differs from locked project')
    if manifest['joints']!=recipe['joints'] or manifest['motionLimits']!=recipe['motionLimits']: raise ValueError('generated rig is stale; rebuild the project')
    original=Image.open(source).convert('RGBA')
    composite=Image.new('RGBA',original.size)
    for part in manifest['parts']:
        image=Image.open(local_file(folder,part['src']))
        if image.mode!='RGBA' or image.getbbox() is None: raise ValueError('invalid transparent part '+part['id'])
        composite.alpha_composite(image,dest=tuple(part['bbox'][:2]))
    a,b=np.asarray(original),np.asarray(composite)
    if not np.array_equal(a[a[:,:,3]>0],b[a[:,:,3]>0]) or not np.array_equal(a[:,:,3],b[:,:,3]): raise ValueError('assembled layer pixels differ from source')
    if manifest['bones']!=recipe['bones'] or not manifest['validation']['restPixelExact']: raise ValueError('invalid manifest')
    for vertex in manifest['vertices']:
        if not np.isfinite(vertex).all() or abs(sum(vertex[2:])-1)>1e-5: raise ValueError('invalid skin weights')
    return {'passed':True,'sourceSha256':actual,'parts':len(manifest['parts']),'pixelExact':True,'project':str(project)}

def component_entries(project):
    runtime=['character-rig.js','character-rig-core.js','rig-controller-overlay.js','rig-vendor/rev2d-ik.js','rig-vendor/LICENSE-Rev2D.txt']
    entries={name:(WEB/name).read_bytes() for name in runtime}
    for path in sorted((project/'rig').rglob('*')):
        if path.is_file() and not path.name.startswith('.'):
            if not path.resolve().is_relative_to((project/'rig').resolve()): raise ValueError('component asset escapes rig directory')
            entries['rig/'+path.relative_to(project/'rig').as_posix()]=path.read_bytes()
    demo=(WEB/'rig-embed.html').read_text().replace('<a href="./rig-test.html">返回工作台 ↗</a>','')
    entries['index.html']=demo.encode()
    entries['rig-project.json']=json.dumps({'manifest':'./rig/rig.json'}).encode()
    entries['README.md']=('''# 可嵌入角色组件

这是独立角色运行包，不包含制作工作台或 Nextra。把整个文件夹复制到目标网页的静态目录，用本地/站点 HTTP 服务打开 index.html。

```html
<script type="module" src="./character/character-rig.js"></script>
<character-rig src="./character/rig/rig.json" interaction="both" controls="hover" style="width:480px;height:420px"></character-rig>
```

interaction: drag / hover / both / none。controls: visible / hover / hidden。
透明背景、Shadow DOM 样式隔离、多实例独立。元素的 ready Promise 就绪后，通过 element.rig.setPose / reset / play / pause / exportPose / importPose 操作。移除 DOM 自动停止 RAF 并释放 WebGL 和监听器。

全部素材需与页面同源，不支持 file:// 或未配置的跨域素材。默认遵循系统减少动态效果偏好。保留原图身份及有限幅度，不包含隐藏解剖重建。

双骨 IK 的 MIT 许可保留于 rig-vendor/LICENSE-Rev2D.txt。
''').encode()
    return entries

def component_archive(project):
    data=io.BytesIO()
    with zipfile.ZipFile(data,'w',zipfile.ZIP_DEFLATED) as archive:
        for name,value in component_entries(project).items(): archive.writestr(name,value)
    return data.getvalue()

def export_component(project,target):
    verify_project(project)
    target=Path(target).expanduser().resolve()
    archive=Path(str(target)+'.zip')
    if target.is_relative_to(SKILL) or target.is_relative_to(project/'rig'): raise ValueError('export outside the Skill and source rig directory')
    if target.exists() or archive.exists(): raise ValueError('export requires a new destination; existing outputs are preserved')
    entries=component_entries(project)
    target.mkdir(parents=True)
    for name,value in entries.items():
        path=target/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(value)
    archive.write_bytes(component_archive(project))
    return {'directory':str(target),'zip':str(archive),'entry':'index.html','files':len(entries),'workbenchIncluded':False}

def deploy(project,public):
    verify_project(project)
    public=Path(public).expanduser().resolve()
    if not public.is_dir(): raise ValueError('explicit existing public directory required')
    files=[p for p in WEB.rglob('*') if p.is_file()]
    names=[p.relative_to(WEB) for p in files]+[Path('rig-project.json'),Path('riglab-component.zip')]
    backup=project/'deploy-backups'/str(time.time_ns())
    for name in names:
        dst=public/name
        if dst.is_symlink(): raise ValueError('refusing to replace symlink: '+str(dst))
        if dst.exists():
            (backup/name).parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(dst,backup/name)
    assets=public/'riglab-project'
    if assets.exists():
        if not (assets/'.riglab-output.json').is_file(): raise ValueError('unmanaged riglab-project directory')
        shutil.copytree(assets,backup/'riglab-project')
    shutil.copytree(project/'rig',assets,dirs_exist_ok=True)
    for source,name in zip(files,names):
        (public/name).parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(source,public/name)
    (public/'rig-project.json').write_text(json.dumps({'manifest':'./riglab-project/rig.json','returnUrl':'/','returnLabel':'← 返回落地页','componentBundle':'./riglab-component.zip'},ensure_ascii=False)+'\n')
    (public/'riglab-component.zip').write_bytes(component_archive(project))
    return {'public':str(public),'entry':'rig-test.html','backup':str(backup),'changedFiles':[str(x) for x in names],'landingModified':False}

def serve(project,port):
    if not (project/'rig/rig.json').is_file(): raise ValueError('run build first')
    class Handler(SimpleHTTPRequestHandler):
        def do_GET(self):
            if urlsplit(self.path).path=='/component.zip':
                data=component_archive(project)
                self.send_response(200);self.send_header('Content-Type','application/zip');self.send_header('Content-Disposition','attachment; filename=character-component.zip');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data);return
            if urlsplit(self.path).path=='/rig-project.json':
                data=json.dumps({'manifest':'./project/rig.json','returnLabel':'独立角色实验室','componentBundle':'./component.zip'}).encode()
                self.send_response(200); self.send_header('Content-Type','application/json'); self.send_header('Content-Length',str(len(data))); self.end_headers(); self.wfile.write(data); return
            return super().do_GET()
        def translate_path(self,path):
            value=unquote(urlsplit(path).path)
            if value in ['/','/index.html']: value='/rig-test.html'
            root,relative=(project/'rig',value[len('/project/'):]) if value.startswith('/project/') else (WEB,value.lstrip('/'))
            candidate=(root/relative).resolve()
            if not candidate.is_relative_to(root.resolve()) or any(s.startswith('.') for s in Path(relative).parts): return str(WEB/'__not_found__')
            return str(candidate)
        def list_directory(self,path):
            self.send_error(403,'Directory listing disabled'); return None
        def end_headers(self):
            self.send_header('Cache-Control','no-store'); self.send_header('X-Content-Type-Options','nosniff'); super().end_headers()
        def log_message(self,*args): pass
    with ThreadingHTTPServer(('127.0.0.1',port),Handler) as server:
        emit({'url':f'http://127.0.0.1:{server.server_port}/rig-test.html','project':str(project),'runtime':str(WEB),'localOnly':True})
        try: server.serve_forever()
        except KeyboardInterrupt: pass

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    sub=parser.add_subparsers(dest='command',required=True)
    for name in ['init','build','verify','serve','deploy','demo','export-component']:
        p=sub.add_parser(name)
        p.add_argument('--project',required=True,type=Path,help='working project directory outside the Skill')
        if name=='init':
            g=p.add_mutually_exclusive_group(required=True); g.add_argument('--demo',action='store_true'); g.add_argument('--source',type=Path)
        if name in ['serve','demo']: p.add_argument('--port',type=int,default=3018)
        if name=='deploy': p.add_argument('--public',required=True,type=Path)
        if name=='export-component': p.add_argument('--output',required=True,type=Path)
        if name=='verify':
            p.add_argument('--url'); p.add_argument('--output',type=Path)
    args=parser.parse_args()
    if args.command=='init': emit(initialize(args.project,args.demo,args.source)); return
    if args.command=='demo' and not (args.project/'project.json').exists(): emit(initialize(args.project,True))
    project=project_dir(args.project)
    if args.command in ['build','demo']: emit(build_project(project))
    if args.command=='verify':
        emit(verify_project(project))
        if args.url:
            env={**os.environ,'RIG_URL':args.url,'RIG_OUTPUT':str((args.output or project/'validation').resolve())}
            subprocess.run(['node',str(SKILL/'scripts/validate-browser.mjs')],env=env,check=True)
    if args.command=='deploy': emit(deploy(project,args.public))
    if args.command=='export-component': emit(export_component(project,args.output))
    if args.command in ['serve','demo']: serve(project,args.port)

if __name__=='__main__':
    try: main()
    except (ValueError,KeyError,FileNotFoundError,ImportError,OSError,subprocess.CalledProcessError) as error:
        emit({'error':str(error)}); sys.exit(1)
