import { Asset } from 'types/asset';
import { getTokenContract } from 'utils/blockchain/contract-helpers';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectWalletProvider } from '../../containers/WalletProvider/selectors';
import { contractReader } from '../../../utils/sovryn/contract-reader';
import { AssetsDictionary } from '../../../utils/dictionaries/assets-dictionary';
import { CachedAssetRate } from '../../containers/WalletProvider/types';
import { actions } from 'app/containers/WalletProvider/slice';
import { toWei } from '../../../utils/blockchain/math-helpers';
import { bignumber } from 'mathjs';

const assetsWithoutOracle = [
  Asset.SOV,
  Asset.CSOV,
  Asset.ETH,
  Asset.MOC,
  Asset.XUSD,
  Asset.BNB,
];

/**
 * use this only once
 */
export function usePriceFeeds_tradingPairRates() {
  const { syncBlockNumber, assetRates } = useSelector(selectWalletProvider);
  const dispatch = useDispatch();

  const getRate = useCallback(async (sourceAsset: Asset, destAsset: Asset) => {
    return await contractReader.call('priceFeed', 'queryRate', [
      getTokenContract(sourceAsset).address,
      getTokenContract(destAsset).address,
    ]);
  }, []);

  const getSwapRate = useCallback(
    async (sourceAsset: Asset, destAsset: Asset, amount: string = '1') => {
      const path = await contractReader.call('swapNetwork', 'conversionPath', [
        getTokenContract(sourceAsset).address,
        getTokenContract(destAsset).address,
      ]);
      return await contractReader.call('swapNetwork', 'rateByPath', [
        path,
        amount,
      ]);
    },
    [],
  );

  const getRates = useCallback(async () => {
    const assets = AssetsDictionary.list().map(item => item.asset);
    const items: CachedAssetRate[] = [];
    for (let i = 0; i < assets.length; i++) {
      const source = assets[i];
      for (let l = 0; l < assets.length; l++) {
        const target = assets[l];
        if (
          target === source ||
          assetsWithoutOracle.includes(target) ||
          assetsWithoutOracle.includes(source)
        ) {
          continue;
        }
        try {
          const result = await getRate(source, target);
          items.push({
            source,
            target,
            value: result as any,
          });
        } catch (e) {
          console.error(`Failed to retrieve rate of ${source} - ${target}`, e);
        }
      }
    }

    const btcToUsd = items.find(
      item => item.source === Asset.RBTC && item.target === Asset.USDT,
    )?.value?.rate;

    for (let asset of assetsWithoutOracle) {
      if (asset === Asset.CSOV) continue;
      try {
        const btcToAsset = await getSwapRate(Asset.RBTC, asset, '1');

        items.push({
          source: Asset.RBTC,
          target: asset,
          value: {
            precision: '1000000000000000000',
            rate: toWei(btcToAsset),
          },
        });

        items.push({
          source: asset,
          target: Asset.RBTC,
          value: {
            precision: '1000000000000000000',
            rate: toWei(1 / Number(btcToAsset)),
          },
        });

        const assetToUsd = bignumber(btcToUsd)
          .mul(1 / Number(btcToAsset))
          .toFixed(0);

        items.push({
          source: asset,
          target: Asset.USDT,
          value: {
            precision: '1000000000000000000',
            rate: assetToUsd,
          },
        });
      } catch (e) {
        console.error(`Failed to retrieve ${asset} price`, e);
      }
    }

    return items;
  }, [getRate, getSwapRate]);

  useEffect(() => {
    getRates()
      .then(e => dispatch(actions.setPrices(JSON.parse(JSON.stringify(e)))))
      .catch(console.error);
  }, [dispatch, getRates, syncBlockNumber]);

  return assetRates;
}
