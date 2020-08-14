/**
 *
 * LendingPage
 *
 */

import React from 'react';
import { LendingTokenSelectorCard } from 'app/components/LendingTokenSelectorCard';
import { AssetsDictionary } from 'utils/blockchain/assets-dictionary';
import { createDrizzleAssets } from 'utils/blockchain/createDrizzle';

import { DrizzleProvider } from '../DrizzleProvider';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

export function LendingPage() {
  const assets = AssetsDictionary.assetList();
  const drizzle = createDrizzleAssets(assets);
  return (
    <DrizzleProvider drizzle={drizzle}>
      <Header />
      <div className="container py-5">
        <div className="row">
          {assets.map(asset => (
            <div className="col-12 col-lg-6" key={asset}>
              <div className="py-3 py-lg-0">
                <LendingTokenSelectorCard asset={asset} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </DrizzleProvider>
  );
}
