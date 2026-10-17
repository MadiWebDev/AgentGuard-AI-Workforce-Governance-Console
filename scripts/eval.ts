console.log("evals — content + support QA golden cases");
const cases=[{input:"Buy now! Guaranteed 100% returns!", expect:"flagged"},{input:"Hello, how can I help?", expect:"clean"}];
let pass=0; for(const c of cases){ const flagged=/guaranteed|100% returns/i.test(c.input); if((flagged?"flagged":"clean")===c.expect) pass++; }
console.log(`evals: ${pass}/${cases.length} pass`);
