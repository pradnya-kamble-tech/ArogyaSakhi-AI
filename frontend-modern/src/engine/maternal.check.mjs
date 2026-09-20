import fs from 'fs';
import { createMaternalAssessor } from './maternalCore.js';

const modelStr = fs.readFileSync(new URL('./maternal_model.json', import.meta.url));
const model = JSON.parse(modelStr);
const assessMaternal = createMaternalAssessor(model);

const runCase = (name, input) => {
    const res = assessMaternal(input);
    return { name, level: res.level, label: res.ml ? res.ml.label : null, reasons: res.reasons.map(r => r.text) };
}

const out = [];
out.push(runCase('a', { vitals: { age: 26, sbp: 110, dbp: 70, bloodSugarMgDl: 90, tempC: 36.8, hr: 78 } }));
out.push(runCase('b', { vitals: { age: 26, sbp: 150, dbp: 100, bloodSugarMgDl: 90, tempC: 36.8, hr: 78 } }));
out.push(runCase('c', { vitals: { age: 26, sbp: 110, dbp: 70, bloodSugarMgDl: 90, tempC: 36.8, hr: 78 }, dangerSigns: ["vaginal_bleeding"] }));
out.push(runCase('d', { vitals: { age: 26 } }));

fs.writeFileSync('check_output.json', JSON.stringify(out, null, 2));
