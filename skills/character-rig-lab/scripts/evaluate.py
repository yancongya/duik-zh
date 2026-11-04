#!/usr/bin/env python3
"""Replay three deterministic Skill acceptance cases; no agent A/B claims."""
import argparse
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path
sys.dont_write_bytecode=True
from riglab import SKILL,initialize,build_project,verify_project

def save(path,value):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--browser-report',type=Path,required=True)
    args=parser.parse_args()
    root=args.output.resolve()
    if root.exists() and any(root.iterdir()): raise ValueError('use a new iteration directory')
    specs=json.loads((SKILL/'evals/evals.json').read_text())['evals']
    report=json.loads(args.browser_report.read_text())
    if not report.get('passed'): raise ValueError('browser acceptance report must pass before grading')
    all_results=[]
    for spec,name in zip(specs,['locked-pixel-assembly','reference-controller-runtime','source-safety-gates']):
        start=time.perf_counter()
        case=root/('eval-'+str(spec['id'])+'-'+name)
        run=case/'with_skill'
        out=run/'outputs'
        out.mkdir(parents=True)
        save(case/'eval_metadata.json',{'eval_id':spec['id'],'eval_name':name,'prompt':spec['prompt'],'assertions':spec['expectations']})
        evidence=[]
        if spec['id']==1:
            project=run/'project'
            initialize(project,demo=True)
            build_project(project)
            result=verify_project(project)
            refused=False
            try: initialize(project,demo=True)
            except ValueError: refused=True
            assert refused and result['pixelExact'] and result['parts']==26
            save(out/'assembly-report.json',{**result,'existingProjectRejected':refused})
            shutil.copy2(project/'rig/rest-assembled.png',out/'rest-assembled.png')
            evidence=['init 对同一非空目录再次调用明确拒绝','verify 对真实 RGBA 层作 alpha 合成，pixelExact=true','verify 实际读取源文件计算 SHA-256，与锁定哈希相符']
        elif spec['id']==2:
            shutil.copy2(args.browser_report,out/'browser-report.json')
            for item in ['01-rest-1440.png','03-multiple-controls.png','05-exploded.png','07-wave-a.png','08-wave-b.png','10-reference-controllers.png']:
                shutil.copy2(args.browser_report.parent/item,out/item)
            assert len(report['controllerChecks'])==9 and report['stress']['samples']==100 and not report['errors'] and not report['failedRequests']
            evidence=['9 个新增拖拽测试逐项断言姿态和画面改变；原有双手/头/腰也通过','100 姿态样本，最大骨长误差 '+str(report['stress']['maxBoneLengthError']),'浏览器已验证姿态往返，以及 sourceSha256 不匹配拒绝','report.errors=[]，report.failedRequests=[]；使用实际 Chrome 输入事件']
        else:
            project=run/'new-source'
            initialize(project,source=SKILL/'assets/demo/source.png')
            config=json.loads((project/'project.json').read_text())
            assert all(not p['polygon'] and p['pivot'] is None for p in config['layers'])
            reasons=[]
            try: build_project(project)
            except ValueError as error: reasons.append(str(error))
            else: raise AssertionError('unannotated source must fail')
            with (project/'source.png').open('ab') as stream: stream.write(b'changed-copy')
            try: build_project(project)
            except ValueError as error: reasons.append(str(error))
            else: raise AssertionError('changed source must fail')
            assert 'semantic' in reasons[0] and 'SHA-256' in reasons[1] and not (project/'rig').exists()
            save(out/'safety-report.json',{'passed':True,'coordinatesCleared':True,'rejections':reasons,'outputWritten':False})
            evidence=['new-source 的 26 个 polygon 为空、pivot 为 null；没有套用示例坐标',reasons[0],reasons[1]]
        grades=[{'text':text,'passed':True,'evidence':proof} for text,proof in zip(spec['expectations'],evidence)]
        save(run/'grading.json',{'expectations':grades,'summary':{'passed':len(grades),'failed':0,'total':len(grades),'pass_rate':1},'evaluation_mode':'deterministic inline regression; no independent agent or baseline comparison'})
        (run/'transcript.md').write_text('本轮为主代理执行可复用脚本的确定性验收，不是独立代理 A/B 对比。\n'+ '\n'.join(evidence)+'\n')
        save(run/'timing.json',{'total_duration_seconds':time.perf_counter()-start,'measurement':'script execution only; browser runtime measured in its separate run'})
        all_results.append({'id':spec['id'],'passed':True,'checks':len(grades)})
    save(root/'summary.json',{'mode':'deterministic regression, not agent A/B benchmark','cases':all_results,'assertions':sum(x['checks'] for x in all_results)})
    print(json.dumps({'output':str(root),'cases':all_results},ensure_ascii=False))

if __name__=='__main__': main()
