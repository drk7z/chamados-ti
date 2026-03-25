/**
 * Fix script:
 * 1. Create ativo_historico_localizacao table if missing
 * 2. Remove garbled (mojibake) ativo_status / ativo_tipos / ativo_categorias records
 *    and reassign any ativos that point to them → correct record
 */
require('dotenv').config();
const { sequelize } = require('./src/config/database');
const { QueryTypes } = require('sequelize');

const isGarbled = (str) => str && (str.includes('Ã') || str.includes('Â') || str.includes('ç'.charCodeAt(0) < 200 && false));

// Simpler: any nome with a raw byte-replacement marker
const hasMojibake = (str) => /Ã|Â/.test(str || '');

async function run() {
  await sequelize.authenticate();
  console.log('DB connected\n');

  // ── 1. Ensure ativo_historico_localizacao exists ───────────────────────────
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS ativo_historico_localizacao (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      ativo_id UUID NOT NULL REFERENCES ativos(id) ON DELETE CASCADE,
      localizacao_anterior_id UUID REFERENCES unidades(id),
      localizacao_nova_id UUID NOT NULL REFERENCES unidades(id),
      responsavel_anterior_id UUID REFERENCES users(id),
      responsavel_novo_id UUID REFERENCES users(id),
      motivo TEXT,
      data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      realizado_por_id UUID NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ ativo_historico_localizacao table ensured');

  // ── 2. Fix garbled ativo_status ────────────────────────────────────────────
  const allStatus = await sequelize.query(
    'SELECT id, nome, tipo, ativo FROM ativo_status',
    { type: QueryTypes.SELECT }
  );
  console.log('\nAll ativo_status records:');
  allStatus.forEach(s => console.log(`  [${s.ativo ? 'active' : 'inactive'}] ${s.id} → "${s.nome}" (tipo: ${s.tipo})`));

  const goodStatus = allStatus.filter(s => !hasMojibake(s.nome));
  const badStatus  = allStatus.filter(s => hasMojibake(s.nome));

  if (badStatus.length === 0) {
    console.log('\n✓ No garbled status records found');
  } else {
    console.log(`\n⚠  Found ${badStatus.length} garbled status record(s):`, badStatus.map(s => s.nome));

    for (const bad of badStatus) {
      // Try to find the good equivalent by tipo
      const good = goodStatus.find(g => g.tipo === bad.tipo);
      if (good) {
        const [updated] = await sequelize.query(
          `UPDATE ativos SET status_id = :goodId WHERE status_id = :badId`,
          { replacements: { goodId: good.id, badId: bad.id }, type: QueryTypes.UPDATE }
        );
        console.log(`  Re-pointed ${updated} ativo(s) from "${bad.nome}" → "${good.nome}"`);
      }
      await sequelize.query(
        `DELETE FROM ativo_status WHERE id = :id`,
        { replacements: { id: bad.id } }
      );
      console.log(`  Deleted garbled record: "${bad.nome}"`);
    }
  }

  // ── 3. Fix garbled ativo_tipos ─────────────────────────────────────────────
  const allTipos = await sequelize.query(
    `SELECT id, nome, ativo FROM ativo_tipos WHERE deleted_at IS NULL`,
    { type: QueryTypes.SELECT }
  );
  const badTipos = allTipos.filter(t => hasMojibake(t.nome));
  if (badTipos.length === 0) {
    console.log('\n✓ No garbled tipo records found');
  } else {
    const goodTipos = allTipos.filter(t => !hasMojibake(t.nome));
    for (const bad of badTipos) {
      // Try to match by normalizing (strip accents roughly)
      const goodMatch = goodTipos.find(g =>
        g.nome.toLowerCase().replace(/[^a-z]/g, '') ===
        bad.nome.toLowerCase().replace(/[^a-z]/g, '')
      );
      if (goodMatch) {
        await sequelize.query(
          `UPDATE ativos SET tipo_id = :goodId WHERE tipo_id = :badId`,
          { replacements: { goodId: goodMatch.id, badId: bad.id } }
        );
      }
      await sequelize.query(
        `DELETE FROM ativo_tipos WHERE id = :id`,
        { replacements: { id: bad.id } }
      );
      console.log(`  Deleted garbled tipo: "${bad.nome}"`);
    }
  }

  // ── 4. Fix garbled ativo_categorias ───────────────────────────────────────
  const allCats = await sequelize.query(
    `SELECT id, nome FROM ativo_categorias WHERE deleted_at IS NULL`,
    { type: QueryTypes.SELECT }
  );
  const badCats = allCats.filter(c => hasMojibake(c.nome));
  if (badCats.length === 0) {
    console.log('\n✓ No garbled categoria records found');
  } else {
    for (const bad of badCats) {
      await sequelize.query(
        `UPDATE ativos SET categoria_id = NULL WHERE categoria_id = :badId`,
        { replacements: { badId: bad.id } }
      );
      await sequelize.query(
        `DELETE FROM ativo_categorias WHERE id = :id`,
        { replacements: { id: bad.id } }
      );
      console.log(`  Deleted garbled categoria: "${bad.nome}"`);
    }
  }

  console.log('\n✓ All done. Restart the backend to pick up changes.');
  await sequelize.close();
}

run().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
