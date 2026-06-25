import { sql } from './bd.js';

async function fixExercises() {
  const ejercicios = await sql`SELECT id, nombre, grupo_muscular, descripcion FROM ejercicios`;

  for (const ex of ejercicios) {
    let updateNeeded = false;
    let newDesc = ex.descripcion;
    let newGrupo = ex.grupo_muscular;

    // Fix description length
    if (newDesc && newDesc.length > 500) {
      // Find the last space before 495 to avoid cutting words
      let truncated = newDesc.substring(0, 495);
      const lastSpaceIndex = truncated.lastIndexOf(' ');
      if (lastSpaceIndex > 0) {
        truncated = truncated.substring(0, lastSpaceIndex);
      }
      newDesc = truncated + '...';
      updateNeeded = true;
    }

    // Fix grupo muscular
    const validGroups = ["Pecho", "Espalda", "Piernas", "Hombros", "Bíceps", "Tríceps", "Abdominales", "Cardio", "Full Body"];
    
    if (!validGroups.includes(newGrupo)) {
      updateNeeded = true;
      const lowerGrupo = (newGrupo || '').toLowerCase();
      const lowerNombre = (ex.nombre || '').toLowerCase();

      if (lowerGrupo.includes('chest') || lowerNombre.includes('pecho') || lowerNombre.includes('press') || lowerNombre.includes('mosca') || lowerNombre.includes('dip')) {
        newGrupo = 'Pecho';
      } else if (lowerGrupo.includes('back') || lowerNombre.includes('espalda') || lowerNombre.includes('remo') || lowerNombre.includes('pull')) {
        newGrupo = 'Espalda';
      } else if (lowerGrupo.includes('leg') || lowerGrupo.includes('calf') || lowerGrupo.includes('thigh') || lowerNombre.includes('sentadilla') || lowerNombre.includes('pierna') || lowerNombre.includes('estocada')) {
        newGrupo = 'Piernas';
      } else if (lowerGrupo.includes('shoulder') || lowerNombre.includes('hombro') || lowerNombre.includes('elevación')) {
        newGrupo = 'Hombros';
      } else if (lowerGrupo.includes('waist') || lowerNombre.includes('abdominales') || lowerNombre.includes('crunch') || lowerNombre.includes('giro')) {
        newGrupo = 'Abdominales';
      } else if (lowerGrupo.includes('cardio') || lowerNombre.includes('bike') || lowerNombre.includes('jump') || lowerNombre.includes('salto')) {
        newGrupo = 'Cardio';
      } else if (lowerNombre.includes('tríceps') || lowerNombre.includes('triceps') || lowerNombre.includes('extensión')) {
        newGrupo = 'Tríceps';
      } else if (lowerNombre.includes('bíceps') || lowerNombre.includes('biceps') || lowerNombre.includes('curl')) {
        newGrupo = 'Bíceps';
      } else {
        newGrupo = 'Full Body';
      }
    }

    if (updateNeeded) {
      await sql`
        UPDATE ejercicios
        SET descripcion = ${newDesc}, grupo_muscular = ${newGrupo}
        WHERE id = ${ex.id}
      `;
    }
  }

  console.log('Ejercicios corregidos correctamente.');
  process.exit(0);
}

fixExercises();
