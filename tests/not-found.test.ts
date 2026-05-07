import prisma from '../src/lib/prisma';
import { updateAtomicAsset, archiveAtomicAsset } from '../src/entities/atomicAsset';
import { updateCompound, archiveCompound } from '../src/entities/compound';
import { updateComposite, archiveComposite } from '../src/entities/composite';
import { updateCastleService, archiveCastleService } from '../src/entities/castleService';
import { updateCastleUnit, archiveCastleUnit } from '../src/entities/castleUnit';
import { updateBlueprint, archiveBlueprint } from '../src/entities/blueprint';
import { updateCastleType, archiveCastleType } from '../src/entities/castleType';
import { updateCastle, archiveCastle } from '../src/entities/castle';

afterAll(() => prisma.$disconnect());

describe('update* with non-existent ID', () => {
  it('updateAtomicAsset throws', async () => {
    await expect(updateAtomicAsset('AA-NONEXISTENT-V999', { name: 'X' })).rejects.toThrow();
  });

  it('updateCompound throws', async () => {
    await expect(updateCompound('CMPD-NONEXISTENT-V999', { name: 'X' })).rejects.toThrow();
  });

  it('updateComposite throws', async () => {
    await expect(updateComposite('COMP-NONEXISTENT-V999', { name: 'X' })).rejects.toThrow();
  });

  it('updateCastleService throws', async () => {
    await expect(updateCastleService('CS-NONEXISTENT-V999', { name: 'X' })).rejects.toThrow();
  });

  it('updateCastleUnit throws', async () => {
    await expect(updateCastleUnit('CU-NONEXISTENT-V999', { name: 'X' })).rejects.toThrow();
  });

  it('updateBlueprint throws', async () => {
    await expect(updateBlueprint('BP-NONEXISTENT-V999', { name: 'X' })).rejects.toThrow();
  });

  it('updateCastleType throws', async () => {
    await expect(updateCastleType('CT-NONEXISTENT-V999', { name: 'X' })).rejects.toThrow();
  });

  it('updateCastle throws', async () => {
    await expect(updateCastle('CSTL-NONEXISTENT-V999', { castle_name: 'X' })).rejects.toThrow();
  });
});

describe('archive* with non-existent ID', () => {
  it('archiveAtomicAsset throws', async () => {
    await expect(archiveAtomicAsset('AA-NONEXISTENT-V999')).rejects.toThrow();
  });

  it('archiveCompound throws', async () => {
    await expect(archiveCompound('CMPD-NONEXISTENT-V999')).rejects.toThrow();
  });

  it('archiveComposite throws', async () => {
    await expect(archiveComposite('COMP-NONEXISTENT-V999')).rejects.toThrow();
  });

  it('archiveCastleService throws', async () => {
    await expect(archiveCastleService('CS-NONEXISTENT-V999')).rejects.toThrow();
  });

  it('archiveCastleUnit throws', async () => {
    await expect(archiveCastleUnit('CU-NONEXISTENT-V999')).rejects.toThrow();
  });

  it('archiveBlueprint throws', async () => {
    await expect(archiveBlueprint('BP-NONEXISTENT-V999')).rejects.toThrow();
  });

  it('archiveCastleType throws', async () => {
    await expect(archiveCastleType('CT-NONEXISTENT-V999')).rejects.toThrow();
  });

  it('archiveCastle throws', async () => {
    await expect(archiveCastle('CSTL-NONEXISTENT-V999')).rejects.toThrow();
  });
});
