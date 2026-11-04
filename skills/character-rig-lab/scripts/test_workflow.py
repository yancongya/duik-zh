#!/usr/bin/env python3
"""Deterministic CLI safety/regression checks; not an agent A/B benchmark."""
import hashlib
import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
import zipfile
sys.dont_write_bytecode=True
from riglab import initialize,verify_project,build_project,export_component,component_archive,SKILL
from project_schema import validate_recipe,local_file

class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(prefix='riglab-safety-')
        self.root=Path(self.temp.name)
        self.project=self.root/'character'
        initialize(self.project,demo=True)
    def tearDown(self): self.temp.cleanup()
    def test_demo_locks_real_source(self):
        recipe,source=validate_recipe(self.project/'project.json')
        self.assertEqual(len(recipe['layers']),26)
        self.assertEqual(hashlib.sha256(source.read_bytes()).hexdigest(),recipe['sourceSha256'])
    def test_existing_project_is_not_overwritten(self):
        before=(self.project/'project.json').read_bytes()
        with self.assertRaisesRegex(ValueError,'new or empty'): initialize(self.project,demo=True)
        self.assertEqual((self.project/'project.json').read_bytes(),before)
    def test_source_tampering_fails_before_output(self):
        with (self.project/'source.png').open('ab') as stream: stream.write(b'changed')
        with self.assertRaisesRegex(ValueError,'SHA-256'): build_project(self.project)
        self.assertFalse((self.project/'rig').exists())
    def test_new_source_has_no_borrowed_coordinates(self):
        target=self.root/'new-source'
        initialize(target,source=SKILL/'assets/demo/source.png')
        recipe=json.loads((target/'project.json').read_text())
        self.assertTrue(all(p['polygon']==[] and p['pivot'] is None for p in recipe['layers']))
        self.assertEqual(recipe['provenance']['mode'],'needs-semantic-annotation')
        with self.assertRaisesRegex(ValueError,'semantic polygon'): build_project(target)
        self.assertFalse((target/'rig').exists())
    def test_outside_asset_path_rejected(self):
        with self.assertRaisesRegex(ValueError,'escapes'): local_file(self.project,'../../private.png')
    def test_unmanaged_output_not_overwritten(self):
        (self.project/'rig').mkdir()
        (self.project/'rig/user-file.txt').write_text('keep')
        with self.assertRaisesRegex(ValueError,'unmanaged'): build_project(self.project)
        self.assertEqual((self.project/'rig/user-file.txt').read_text(),'keep')
    def test_invalid_mesh_rejected(self):
        path=self.project/'project.json'
        data=json.loads(path.read_text()); data['mesh']['step']=0
        path.write_text(json.dumps(data))
        with self.assertRaisesRegex(ValueError,'mesh.step'): validate_recipe(path)

class ComponentExportTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.workspace=tempfile.TemporaryDirectory(prefix='riglab-export-')
        cls.root=Path(cls.workspace.name)
        cls.project=cls.root/'project'
        initialize(cls.project,demo=True)
        build_project(cls.project)
    @classmethod
    def tearDownClass(cls): cls.workspace.cleanup()
    def test_export_contains_local_runtime_and_identical_assets(self):
        result=export_component(self.project,self.root/'export')
        target=Path(result['directory'])
        self.assertFalse(result['workbenchIncluded'])
        with zipfile.ZipFile(result['zip']) as archive:
            self.assertIsNone(archive.testzip())
            names=set(archive.namelist())
            self.assertEqual(len(names),result['files'])
            for name in ['character-rig.js','character-rig-core.js','rig-controller-overlay.js','rig-vendor/rev2d-ik.js','rig-vendor/LICENSE-Rev2D.txt','rig/rig.json','index.html']:
                self.assertIn(name,names)
            self.assertNotIn('rig-test.js',names)
            self.assertNotIn('rig-test.html',names)
            for name in names:
                self.assertEqual(archive.read(name),(target/name).read_bytes())
                if name.startswith('rig/'):
                    self.assertEqual(archive.read(name),(self.project/name).read_bytes())
        self.assertEqual(json.loads((target/'rig-project.json').read_text())['manifest'],'./rig/rig.json')
    def test_existing_directory_is_preserved(self):
        target=self.root/'existing';target.mkdir();(target/'keep.txt').write_text('keep')
        with self.assertRaisesRegex(ValueError,'existing outputs'): export_component(self.project,target)
        self.assertEqual((target/'keep.txt').read_text(),'keep')
        self.assertFalse(Path(str(target)+'.zip').exists())
    def test_existing_archive_is_preserved(self):
        target=self.root/'occupied';archive=Path(str(target)+'.zip');archive.write_bytes(b'keep')
        with self.assertRaisesRegex(ValueError,'existing outputs'): export_component(self.project,target)
        self.assertEqual(archive.read_bytes(),b'keep')
        self.assertFalse(target.exists())
    def test_external_asset_symlink_is_rejected(self):
        outside=self.root/'external.txt';outside.write_text('private')
        link=self.project/'rig/escaped.txt';link.symlink_to(outside)
        try:
            with self.assertRaisesRegex(ValueError,'escapes rig directory'): component_archive(self.project)
        finally: link.unlink()
    def test_export_into_skill_is_rejected(self):
        with self.assertRaisesRegex(ValueError,'outside the Skill'): export_component(self.project,SKILL/'component-test-output')
        self.assertFalse((SKILL/'component-test-output').exists())

if __name__=='__main__': unittest.main(verbosity=2)
