import fs from 'fs';
import { createMaternalAssessor } from './maternalCore.js';

const modelStr = fs.readFileSync(new URL('./maternal_model.json', import.meta.url));
const model = JSON.parse(modelStr);
const assessMaternal = createMaternalAssessor(model);

const runCase = (name, input) => {
    const res = assessMaternal(input);
    console.log(`--- ${name} ---`);
    console.log(`Level: ${res.level}`);
    console.log(`ML Label: ${res.ml ? res.ml.label : 'null'}`);
    console.log(`Reasons: ${res.reasons.map(r => r.text).join('; ')}`);
}

runCase('a', { vitals: { age: 26, sbp: 110, dbp: 70, bloodSugarMgDl: 90, tempC: 36.8, hr: 78 } });
runCase('b', { vitals: { age: 26, sbp: 150, dbp: 100, bloodSugarMgDl: 90, tempC: 36.8, hr: 78 } });
runCase('c', { vitals: { age: 26, sbp: 110, dbp: 70, bloodSugarMgDl: 90, tempC: 36.8, hr: 78 }, dangerSigns: ["vaginal_bleeding"] });
runCase('d', { vitals: { age: 26 } });
