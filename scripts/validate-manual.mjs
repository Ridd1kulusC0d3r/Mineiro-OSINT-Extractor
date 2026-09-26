import fs from 'node:fs';
const html = fs.readFileSync('MANUAL.html','utf8');
const ids=['capa','o-que-e','como-funciona','jornada','legenda','instalacao','primeiro-uso','dia-a-dia','relatorios','problemas','etica','glossario','tecnica'];
const tokens=['<style>','<script>','@media print','data-tab=','theme-toggle','voltar-topo','Figura 1','Figura 2','Figura 3','svg-flow','svg-journey','svg-legend','svg-architecture'];
const errors=[];
for(const id of ids) if(!html.includes(`id="${id}"`)) errors.push(`Seção ausente: ${id}`);
for(const t of tokens) if(!html.includes(t)) errors.push(`Elemento obrigatório ausente: ${t}`);
if(/<link[^>]+href=|<script[^>]+src=|<img[^>]+src=["']https?:/i.test(html)) errors.push('Dependência externa detectada no MANUAL.html.');
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('[PASS] MANUAL.html validado: seções, controles, diagramas e modo offline presentes.');
