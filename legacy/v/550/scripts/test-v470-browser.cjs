/* Run the entire v469 mobile/desktop browser regression against the v470 bundle. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const filename=path.join(__dirname,'test-v469-browser.cjs');
let code=fs.readFileSync(filename,'utf8');
code=code.replaceAll('mediaflow-v469.bundle.js','mediaflow-v470.bundle.js')
 .replaceAll("result?.v==='469'","result?.v==='470'")
 .replaceAll("'v469-browser-smoke'","'v470-browser-smoke'");
const runner=new Module(filename,module);
runner.filename=filename;runner.paths=Module._nodeModulePaths(path.dirname(filename));
runner._compile(code,filename);
