#!/usr/bin/env python3
"""Build the canonical Skill demo and deploy only the independent rig test page."""
import subprocess
import sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
cli=root/'skills/character-rig-lab/scripts/riglab.py'
project=root/'output/riglab-demo'
def run(*args):
    subprocess.run([sys.executable,str(cli),*args],check=True)
if not (project/'project.json').exists():
    run('init','--demo','--project',str(project))
run('build','--project',str(project))
run('deploy','--project',str(project),'--public',str(root/'public'))

