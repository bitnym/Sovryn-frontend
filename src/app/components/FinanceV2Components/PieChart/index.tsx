import React from 'react';
import { convertPercentageToDegrees } from './utils/convertPercentageToDegrees';
import { getAssetColor } from '../utils/getAssetColor';
import { Asset } from 'types/asset';
import { StyledPieChart } from './styled';

interface IPieChartProps {
  firstAsset: Asset;
  secondAsset?: Asset;
  firstPercentage: number;
  secondPercentage?: number;
  className?: string;
}

export const PieChart: React.FC<IPieChartProps> = ({
  firstAsset,
  secondAsset,
  firstPercentage,
  secondPercentage = 0,
  className,
}) => {
  return (
    <div className={className}>
      <StyledPieChart
        firstPercentage={convertPercentageToDegrees(
          secondPercentage > 0 ? firstPercentage : 100,
        )}
        secondPercentage={convertPercentageToDegrees(secondPercentage)}
        firstColor={getAssetColor(firstAsset)}
        secondColor={secondAsset ? getAssetColor(secondAsset) : ''}
      />
    </div>
  );
};
