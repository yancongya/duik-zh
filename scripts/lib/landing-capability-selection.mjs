import assert from 'node:assert/strict';

// The original three phases already invert the selected item into scroll space.
// Subtracting a fixed pixel offset afterward can put item 5 back in item 4,
// especially after a viewport resize. Keep the phase math and scroll owner.
export function patchCapabilitySelectionRuntime(source) {
  const before='const v=u/5,h=(j+q+v*V)/l,m=s.start+h*(s.end-s.start)-(u===0?200:u*180);';
  const after='const v=u/5,h=(j+q+v*V)/l,m=s.start+h*(s.end-s.start);';
  if(source.includes(after)){
    assert.equal(source.split(after).length-1,1,'Duplicated capability selection mapping');
    assert(!source.includes(before),'Mixed capability selection mappings');
    return source;
  }
  assert.equal(source.split(before).length-1,1,'Unknown capability selection mapping');
  return source.replace(before,after);
}
