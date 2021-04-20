/* eslint-disable no-nested-ternary */
import React from 'react';
import { Plane } from '@math.gl/culling';
import debounce from 'lodash/debounce';
import {
  SideBySideViewer,
  PictureInPictureViewer,
  VolumeViewer
  // eslint-disable-next-line import/no-unresolved
} from '@hms-dbmi/viv';
import {
  useImageSettingsStore,
  useViewerStore,
  useChannelSettings
} from '../state';
import { useWindowSize } from '../utils';
import { DEFAULT_OVERVIEW } from '../constants';

const Viewer = () => {
  const {
    useLinkedView,
    setViewerState,
    use3d,
    initialViewState,
    viewState
  } = useViewerStore();
  const { colors, sliders, isOn, selections, loader } = useChannelSettings();
  const viewSize = useWindowSize();
  const {
    lensSelection,
    colormap,
    renderingMode,
    sphericals,
    resolution,
    isLensOn,
    zoomLock,
    panLock,
    isOverviewOn,
    onViewportLoad,
    useFixedAxis
  } = useImageSettingsStore();
  const clippingPlanes = sphericals.map(v =>
    new Plane().fromPointNormal(v.toVector3(), v.toVector3())
  );
  return use3d ? (
    <VolumeViewer
      loader={loader}
      sliderValues={sliders}
      colorValues={colors}
      channelIsOn={isOn}
      loaderSelection={selections}
      colormap={colormap.length > 0 && colormap}
      clippingPlanes={clippingPlanes}
      resolution={resolution}
      renderingMode={renderingMode}
      height={viewSize.height}
      width={viewSize.width}
      onViewportLoad={onViewportLoad}
      useFixedAxis={useFixedAxis}
      viewStates={[viewState]}
      onViewStateChange={debounce(
        ({ viewState: newViewState, viewId }) => {
          setViewerState({ viewState: { ...newViewState, id: viewId } });
          if (!initialViewState)
            setViewerState({
              initialViewState: { ...newViewState, id: viewId }
            });
        },
        250,
        { trailing: true }
      )}
    />
  ) : useLinkedView ? (
    <SideBySideViewer
      loader={loader}
      sliderValues={sliders}
      colorValues={colors}
      channelIsOn={isOn}
      loaderSelection={selections}
      height={viewSize.height}
      width={viewSize.width}
      colormap={colormap.length > 0 && colormap}
      zoomLock={zoomLock}
      panLock={panLock}
      hoverHooks={{
        handleValue: v => setViewerState('pixelValues', v)
      }}
      lensSelection={lensSelection}
      isLensOn={isLensOn}
      onViewportLoad={onViewportLoad}
    />
  ) : (
    <PictureInPictureViewer
      loader={loader}
      sliderValues={sliders}
      colorValues={colors}
      channelIsOn={isOn}
      loaderSelection={selections}
      height={viewSize.height}
      width={viewSize.width}
      colormap={colormap.length > 0 && colormap}
      overview={DEFAULT_OVERVIEW}
      overviewOn={isOverviewOn}
      hoverHooks={{
        handleValue: v => setViewerState('pixelValues', v)
      }}
      lensSelection={lensSelection}
      isLensOn={isLensOn}
      onViewportLoad={onViewportLoad}
    />
  );
};
export default Viewer;
