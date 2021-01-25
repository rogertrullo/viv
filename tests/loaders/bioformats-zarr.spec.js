import { test } from 'tape';
import fs from 'fs/promises';
import { FileSystemStore } from './common';
import { load } from '../../src/loaders/zarr/bioformats-zarr';

const FIXTURE = 'tests/loaders/fixtures/bioformats-zarr';
const store = new FileSystemStore(`${FIXTURE}/data.zarr`);
const meta = fs.readFile(`${FIXTURE}/METADATA.ome.xml`).then(b => b.toString());

test('Creates correct ZarrPixelSource.', async t => {
  t.plan(4);
  try {
    const { data } = await load(store, await meta);
    t.equal(data.length, 1, 'Image should not be pyramidal.');
    const [base] = data;
    t.deepEqual(
      base.labels,
      ['t', 'c', 'z', 'y', 'x'],
      'should have DimensionOrder "XYZCT".'
    );
    t.deepEqual(
      base.shape,
      [1, 3, 1, 167, 439],
      'shape should match dimensions.'
    );
    t.equal(base.meta, undefined, 'No meta.');
  } catch (e) {
    t.fail(e);
  }
});

test('Get raster data.', async t => {
  t.plan(10);
  try {
    const { data } = await load(store, await meta);
    const [base] = data;

    for (let c = 0; c < 3; c += 1) {
      const selection = { c, z: 0, t: 0 };
      const layerData = await base.getRaster({ selection }); // eslint-disable-line no-await-in-loop
      t.equal(layerData.width, 439);
      t.equal(layerData.height, 167);
      t.equal(layerData.data.length, 439 * 167);
    }

    try {
      await base.getRaster({ selection: { c: 3, z: 0, t: 0 } });
    } catch (e) {
      t.ok(e instanceof Error, 'index should be out of bounds.');
    }
  } catch (e) {
    t.fail(e);
  }
});

test('Correct OME-XML.', async t => {
  t.plan(9);
  try {
    const { metadata } = await load(store, await meta);
    const { Name, Pixels } = metadata;
    t.equal(
      Name,
      'multi-channel.ome.tif',
      `Name should be 'multi-channel.ome.tif'.`
    );
    t.equal(Pixels.SizeC, 3, 'Should have three channels.');
    t.equal(Pixels.SizeT, 1, 'Should have one time index.');
    t.equal(Pixels.SizeX, 439, 'Should have SizeX of 429.');
    t.equal(Pixels.SizeY, 167, 'Should have SizeY of 167.');
    t.equal(Pixels.SizeZ, 1, 'Should have one z index.');
    t.equal(Pixels.Type, 'int8', 'Should be int8 pixel type.');
    t.equal(Pixels.Channels.length, 3);
    t.equal(Pixels.Channels[0].SamplesPerPixel, 1);
  } catch (e) {
    t.fail(e);
  }
});
