"""Validate a locked upper-body project before writing any output."""
import hashlib
import json
import math
import re
from pathlib import Path

BONES = ['root','body','neck','head','upper-r','fore-r','hand-r','upper-l','fore-l','hand-l']
PARTS = ['torso','waist','hair-back','neck','face','ear-r','ear-l','hair-front','hair-side-r','hair-side-l','sleeve-r','upper-r','fore-r','hand-r','sleeve-l','upper-l','fore-l','hand-l','brow-r','brow-l','eye-r','eye-l','iris-r','iris-l','nose','mouth']

def local_file(root, relative):
    if not isinstance(relative,str) or Path(relative).is_absolute():
        raise ValueError('asset paths must be project-relative')
    result=(root/relative).resolve()
    if not result.is_relative_to(root.resolve()):
        raise ValueError('asset path escapes the project')
    return result

def numbers(value, length=None):
    return isinstance(value,list) and (length is None or len(value)==length) and all(isinstance(x,(int,float)) and not isinstance(x,bool) and math.isfinite(x) for x in value)

def validate_recipe(project_file):
    from PIL import Image
    path=Path(project_file).resolve()
    p=json.loads(path.read_text())
    if p.get('schemaVersion')!=1 or p.get('profile')!='upper-body-2d-v1':
        raise ValueError('unsupported project schema/profile')
    source=local_file(path.parent,p['source'])
    if hashlib.sha256(source.read_bytes()).hexdigest()!=p.get('sourceSha256'):
        raise ValueError('source SHA-256 changed; keep the approved character locked')
    with Image.open(source) as im:
        if im.format!='PNG' or im.mode!='RGBA' or im.getextrema()[3][0]==255:
            raise ValueError('source must be a transparent RGBA PNG; remove background in a candidate first')
        if list(im.size)!=p.get('canvas'):
            raise ValueError('canvas does not match locked source')
    w,h=p['canvas']
    def point(v):
        return numbers(v,2) and 0<=v[0]<=w and 0<=v[1]<=h
    def polygon(v):
        return isinstance(v,list) and len(v)>=3 and all(point(x) for x in v)
    layers=p.get('layers',[])
    if len(layers)!=len(PARTS) or {x.get('id') for x in layers}!=set(PARTS):
        raise ValueError('upper-body-2d-v1 requires the 26 named semantic parts')
    for layer in layers:
        if not polygon(layer.get('polygon')) or not point(layer.get('pivot')):
            raise ValueError('missing/invalid semantic polygon or pivot: '+layer['id']+'; annotate this source, do not borrow demo coordinates')
        if layer.get('bone') not in BONES or not layer.get('label') or not layer.get('group'):
            raise ValueError('invalid layer metadata: '+layer['id'])
    if p.get('bones')!=BONES:
        raise ValueError('bone order must match upper-body-2d-v1')
    j=p['joints']
    for name in ['root','body','neck','head']:
        if not point(j[name]): raise ValueError('invalid joint '+name)
    for side in ['l','r']:
        for name in ['shoulder','elbow','wrist']:
            if not point(j[side][name]): raise ValueError('invalid arm joint')
        a,b,c=[j[side][name] for name in ['shoulder','elbow','wrist']]
        if math.dist(a,b)<1 or math.dist(b,c)<1: raise ValueError('zero-length arm bone')
    if not numbers(p.get('camera'),4) or min(p['camera'][2:])<=0:
        raise ValueError('invalid camera')
    for key in ['headDegrees','bodyDegrees','handTargetRadius','wristDegrees','hairDegrees','rootX','rootY']:
        if not numbers([p['motionLimits'].get(key)]) or p['motionLimits'][key]<=0:
            raise ValueError('invalid motion limit: '+key)
    mesh=p['mesh']
    if not isinstance(mesh['step'],int) or mesh['step']<4: raise ValueError('mesh.step must be an integer >= 4')
    if mesh['overlap'] not in [1,3,5,7,9]: raise ValueError('overlap must be an odd kernel <= 9')
    if not numbers([mesh['trunkBlur'],mesh['limbBlur']]) or min(mesh['trunkBlur'],mesh['limbBlur'])<0: raise ValueError('invalid blur radius')
    for o in p.get('ownershipOverrides',[]):
        if o.get('id') not in PARTS or not polygon(o.get('polygon')): raise ValueError('invalid ownership override')
    support=p['faceSupport']
    if not polygon(support['skinPolygon']): raise ValueError('missing face support skin region')
    for field in ['crop','bbox']:
        box=support[field]
        if not numbers(box,4) or not point(box[:2]) or not point(box[2:]) or box[2]<=box[0] or box[3]<=box[1]: raise ValueError('invalid support '+field)
        if not all(isinstance(x,int) for x in box): raise ValueError('support bounds must be integers')
    if not numbers(support['eyeColor'],4) or any(not 0<=v<=255 for v in support['eyeColor']): raise ValueError('invalid eye support colour')
    for field in p['hairFields']:
        if field['control'] not in ['hairL','hairR'] or not point(field['center']) or not numbers(field['radius'],2) or min(field['radius'])<=0 or not numbers(field['vector'],2): raise ValueError('invalid hair deformation field')
    for name,pos in p['controllers'].items():
        if not re.fullmatch(r'[A-Za-z]+',name) or not numbers(pos,2): raise ValueError('invalid controller position')
    return p,source
