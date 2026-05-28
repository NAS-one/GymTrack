const fs = require('fs');
let content = fs.readFileSync('./Backend/seed.js', 'utf8');

const replacements = {
  'Ã¡': 'á',
  'Ã©': 'é',
  'Ã­': 'í',
  'Ã³': 'ó',
  'Ãº': 'ú',
  'Ã±': 'ñ',
  'Ã ': 'Á',
  'Ã‰': 'É',
  'Ã ': 'Í',
  'Ã“': 'Ó',
  'Ãš': 'Ú',
  'Ã‘': 'Ñ',
  'Â°': '°',
  'â€”': '—',
  'Â¿': '¿',
  'Â¡': '¡'
};

for (const [bad, good] of Object.entries(replacements)) {
  content = content.split(bad).join(good);
}

fs.writeFileSync('./Backend/seed.js', content, 'utf8');
console.log('Codificación corregida en seed.js');
