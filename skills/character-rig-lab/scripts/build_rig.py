#!/usr/bin/env python3
"""Deterministic source-pixel layer extraction + shared 2D skin mesh.
Character-specific masks, pivots and limits belong to project.json.
"""
import hashlib
import json
import shutil
import zipfile
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from project_schema import validate_recipe


def build(project_file, output):
    recipe,SOURCE=validate_recipe(project_file)
    OUT=Path(output)
    OUT.mkdir(parents=True,exist_ok=True)
    im=Image.open(SOURCE).convert('RGBA')
    rgba = np.asarray(im).copy()
    W, H = im.size
    visible = rgba[:, :, 3] > 0
    owner = np.zeros((H, W), np.uint8)
    parts = []
    
    def dilate(region, size=3):
        return np.asarray(Image.fromarray(region.astype(np.uint8)*255).filter(ImageFilter.MaxFilter(size))) > 0
    
    def blur(region, radius):
        return np.asarray(Image.fromarray(np.clip(region*255,0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius))).astype(np.float32)/255
    
    def mask(points):
        canvas = Image.new('L', (W, H))
        ImageDraw.Draw(canvas).polygon(points, fill=255)
        return np.asarray(canvas) > 0
    
    def add(name, label, points, bone, pivot, group):
        idx = len(parts) + 1
        region = mask(points) & visible
        owner[region] = idx
        parts.append(dict(id=name, label=label, bone=bone, pivot=pivot, group=group))
        return idx
    
    # Semantic polygons are project data; no character-specific coordinates here.
    for layer in recipe['layers']:
        add(layer['id'],layer['label'],[tuple(p) for p in layer['polygon']],layer['bone'],layer['pivot'],layer['group'])
    for override in recipe.get('ownershipOverrides',[]):
        idx=next(i for i,p in enumerate(parts,1) if p['id']==override['id'])
        owner[mask([tuple(p) for p in override['polygon']]) & visible]=idx
    # Register source-edge pixels to the nearest semantic region instead of
    # accidentally attaching distant alpha fringes to the torso.
    nearest=owner.copy()
    for _ in range(240):
        if not np.any(visible & (nearest==0)): break
        previous=nearest.copy()
        for dy,dx in [(0,1),(0,-1),(1,0),(-1,0)]:
            candidate=np.roll(previous,(dy,dx),(0,1))
            if dy==1: candidate[0,:]=0
            if dy==-1: candidate[-1,:]=0
            if dx==1: candidate[:,0]=0
            if dx==-1: candidate[:,-1]=0
            fill=(nearest==0)&(candidate!=0)
            nearest[fill]=candidate[fill]
    owner[visible & (owner==0)]=nearest[visible & (owner==0)]
    remaining=np.where(visible & (owner==0))
    if len(remaining[0]):
        bounds=[]
        for i in range(1,len(parts)+1):
            yy,xx=np.where((owner==i)&(rgba[:,:,3]>24))
            bounds.append((xx.min(),yy.min(),xx.max(),yy.max()))
        for y,x in zip(*remaining):
            distances=[max(x0-x,0,x-x1)**2+max(y0-y,0,y-y1)**2 for x0,y0,x1,y1 in bounds]
            owner[y,x]=int(np.argmin(distances))+1
    
    bones = recipe['bones']
    labels = np.zeros((H,W),np.uint8)
    for i,p in enumerate(parts,1): labels[owner==i]=bones.index(p['bone'])
    # Shared vertices use a single weight field so cuts stay connected in motion.
    weights=[]
    for i,b in enumerate(bones):
        field=(labels==i).astype(np.float32)*visible
        weights.append(blur(field,recipe['mesh']['trunkBlur'] if b in ['root','body','neck','head'] else recipe['mesh']['limbBlur']))
    weights=np.stack(weights,axis=-1)
    weights/=np.maximum(weights.sum(axis=-1,keepdims=True),1e-9)
    step=recipe['mesh']['step']
    xs=sorted(set(range(0,W,step))|{W-1})
    ys=sorted(set(range(0,H,step))|{H-1})
    if len(xs)*len(ys)>65535: raise ValueError('mesh too dense for uint16; increase mesh.step')
    vertices=[]
    for y in ys:
        for x in xs:
            ws=weights[y,x]
            if ws.sum()<0.01: ws=np.eye(len(bones),dtype=np.float32)[0]
            vertices.append([x,y,*[round(float(v),6) for v in ws]])
    
    assembled=np.zeros_like(rgba)
    for i,p in enumerate(parts,1):
        own=(owner==i)&visible
        if not np.any(own): raise RuntimeError('empty part: '+p['id'])
        assembled[own]=rgba[own]
        # Internal one-pixel overlap prevents filtering cracks at shared cuts.
        expanded=dilate(own,recipe['mesh']['overlap'])
        expanded &= (rgba[:,:,3]==255)|own
        yidx,xidx=np.where(expanded)
        box=[int(xidx.min()),int(yidx.min()),int(xidx.max())+1,int(yidx.max())+1]
        x0,y0,x1,y1=box
        layer=rgba[y0:y1,x0:x1].copy()
        layer[~expanded[y0:y1,x0:x1]]=0
        Image.fromarray(layer).save(OUT/(p['id']+'.png'),optimize=True)
        vy,vx=np.where(own&(rgba[:,:,3]>24))
        vb=[int(vx.min()),int(vy.min()),int(vx.max())+1,int(vy.max())+1]
        thumbnail=Image.fromarray(layer).crop((vb[0]-x0,vb[1]-y0,vb[2]-x0,vb[3]-y0))
        thumbnail.thumbnail((180,180))
        thumbnail.save(OUT/(p['id']+'-thumbnail.png'))
        indices=[]
        for iy in range(len(ys)-1):
            for ix in range(len(xs)-1):
                x,y=xs[ix],ys[iy]; nx,ny=xs[ix+1],ys[iy+1]
                if nx<x0 or x>=x1 or ny<y0 or y>=y1: continue
                if not np.any(expanded[y:ny+1,x:nx+1]): continue
                k=iy*len(xs)+ix; n=k+len(xs)
                indices.extend([k,k+1,n+1,k,n+1,n])
        p.update(src=p['id']+'.png',thumbnail=p['id']+'-thumbnail.png',bbox=box,visualBBox=vb,indices=indices,visiblePixels=int(own.sum()))
    
    exact=bool(np.array_equal(assembled[visible],rgba[visible]))
    if not exact: raise RuntimeError('Rest assembly differs from approved source')
    Image.fromarray(assembled).save(OUT/'rest-assembled.png',optimize=True)
    composite=Image.new('RGBA',(W,H))
    for p in parts:
        composite.alpha_composite(Image.open(OUT/(p['id']+'.png')),dest=tuple(p['bbox'][:2]))
    if not np.array_equal(np.asarray(composite)[visible],rgba[visible]):
        raise RuntimeError('Exported PNG compositing differs from approved source')
    # Original-texture-derived support beneath independent facial expressions.
    face_features=np.isin(owner,[i for i,p in enumerate(parts,1) if p['id'].startswith(('eye-','iris-','brow-')) or p['id']=='mouth'])
    repair_mask=dilate(face_features,9)
    # Normalized source-texture fill from nearby skin, only behind expressions.
    # This is not an AI-generated reconstruction of hidden anatomy.
    skin = mask([tuple(p) for p in recipe['faceSupport']['skinPolygon']]) & ~dilate(face_features,19)
    # Propagate actual neighbouring skin RGB into feature holes in floating point.
    # Avoid dividing quantized 8-bit blur fields, which creates coloured speckles.
    cx0,cy0,cx1,cy1=recipe['faceSupport']['crop']
    crop=(slice(cy0,cy1),slice(cx0,cx1))
    known=skin[crop].copy()
    rgb=rgba[crop][:,:,:3].astype(np.float32)
    filled=np.where(known[:,:,None],rgb,0)
    for _ in range(180):
        if np.all(known): break
        total=np.zeros_like(filled); count=np.zeros_like(known,dtype=np.float32)
        for dy,dx in [(0,1),(0,-1),(1,0),(-1,0)]:
            valid=np.roll(known,(dy,dx),(0,1))
            shifted=np.roll(filled,(dy,dx),(0,1))
            if dy==1: valid[0,:]=False
            if dy==-1: valid[-1,:]=False
            if dx==1: valid[:,0]=False
            if dx==-1: valid[:,-1]=False
            total+=shifted*valid[:,:,None]; count+=valid
        take=(~known)&(count>0)
        filled[take]=total[take]/count[take,None]
        known[take]=True
    free=~skin[crop]
    for _ in range(360):
        smooth=(np.roll(filled,1,0)+np.roll(filled,-1,0)+np.roll(filled,1,1)+np.roll(filled,-1,1))*.25
        filled[free]=smooth[free]
    filled=np.asarray(Image.fromarray(np.clip(filled,0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3)))
    rep=rgba.copy()
    rep[crop][:,:,:3]=filled
    rep[:,:,3]=np.clip(blur(dilate(face_features,15).astype(np.float32),4)*255,0,255).astype(np.uint8)
    rep[dilate(face_features,7),3]=255
    bx=recipe['faceSupport']['bbox']
    Image.fromarray(rep[bx[1]:bx[3],bx[0]:bx[2]]).save(OUT/'face-support.png',optimize=True)
    eye_supports=[]
    for side in ['r','l']:
        iris_index=next(i for i,p in enumerate(parts,1) if p['id']=='iris-'+side)
        eye=next(p for p in parts if p['id']=='eye-'+side)
        region=dilate(owner==iris_index,5)
        support=np.zeros_like(rgba)
        support[region]=recipe['faceSupport']['eyeColor']
        ex0,ey0,ex1,ey1=eye['bbox']
        name='eye-support-'+side
        Image.fromarray(support[ey0:ey1,ex0:ex1]).save(OUT/(name+'.png'),optimize=True)
        eye_supports.append(dict(id=name,src=name+'.png',bbox=eye['bbox'],indices=eye['indices']))
    shutil.copy2(SOURCE,OUT/'source.png')
    manifest=dict(version=3,profile=recipe['profile'],name=recipe['name'],canvas=[W,H],source='source.png',archive='character-layers.zip',
     sourceSha256=recipe['sourceSha256'],parts=parts,bones=bones,vertices=vertices,joints=recipe['joints'],camera=recipe['camera'],hairFields=recipe['hairFields'],controllers=recipe['controllers'],
     faceSupport=dict(src='face-support.png',bbox=bx,method='Neighbouring source-texture fill; not generative hidden-anatomy reconstruction'),eyeSupports=eye_supports,
     validation=dict(restPixelExact=exact,parts=len(parts),missingPixels=int(np.count_nonzero(visible&(owner==0))),visiblePixels=int(visible.sum()),sourceUnchanged=True),motionLimits=recipe['motionLimits'])
    (OUT/'rig.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'\n')
    with zipfile.ZipFile(OUT/'character-layers.zip','w',zipfile.ZIP_DEFLATED) as z:
        for p in parts: z.write(OUT/(p['id']+'.png'),p['id']+'.png')
        archive_rig=json.loads(json.dumps(manifest))
        archive_rig['source']='source.png'
        for entry in archive_rig['parts']+archive_rig['eyeSupports']+[archive_rig['faceSupport']]:
            entry['src']=Path(entry['src']).name
            entry.pop('thumbnail',None)
        z.writestr('rig.json',json.dumps(archive_rig,ensure_ascii=False))
        z.write(SOURCE,'source.png')
        for name in ['face-support.png','eye-support-r.png','eye-support-l.png']:
            z.write(OUT/name,name)
    return dict(canvas=[W,H],parts=len(parts),vertices=len(vertices),triangles=sum(len(p['indices'])//3 for p in parts),validation=manifest['validation'])
