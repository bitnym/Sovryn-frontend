import React, { useMemo } from 'react';
import cn from 'classnames';
import { Dialog } from '../../../../containers/Dialog';
import { useDispatch, useSelector } from 'react-redux';
import { selectMarginTradePage } from '../../selectors';
import { actions } from '../../slice';
import { TradingPairDictionary } from '../../../../../utils/dictionaries/trading-pair-dictionary';
import {
  toNumberFormat,
  weiToNumberFormat,
} from '../../../../../utils/display-text/format';
import { AssetsDictionary } from '../../../../../utils/dictionaries/assets-dictionary';
import { FormGroup } from 'app/components/Form/FormGroup';
import { TxFeeCalculator } from '../TxFeeCalculator';
import {
  getLendingContractName,
  getTokenContract,
} from '../../../../../utils/blockchain/contract-helpers';
import { PricePrediction } from '../../../../containers/MarginTradeForm/PricePrediction';
import { useTrading_resolvePairTokens } from '../../../../hooks/trading/useTrading_resolvePairTokens';
import { LiquidationPrice } from '../LiquidationPrice';
import { useApproveAndTrade } from '../../../../hooks/trading/useApproveAndTrade';
import { DialogButton } from 'app/components/Form/DialogButton';
import { LoadableValue } from '../../../../components/LoadableValue';
import { fromWei } from '../../../../../utils/blockchain/math-helpers';
import { toWei } from 'web3-utils';
import { Asset } from '../../../../../types/asset';
import { useAccount } from '../../../../hooks/useAccount';
import { TxDialog } from '../../../../components/Dialogs/TxDialog';
import { translations } from '../../../../../locales/i18n';
import { useTranslation, Trans } from 'react-i18next';
// import { Slider } from '../../../BuySovPage/components/Slider';
import { useMaintenance } from 'app/hooks/useMaintenance';
import { ErrorBadge } from 'app/components/Form/ErrorBadge';
import { discordInvite } from 'utils/classifiers';

const maintenanceMargin = 15000000000000000000;

export function TradeDialog() {
  const { t } = useTranslation();
  const account = useAccount();
  const { checkMaintenance, States } = useMaintenance();
  const openTradesLocked = checkMaintenance(States.OPEN_MARGIN_TRADES);
  const { position, amount, pairType, collateral, leverage } = useSelector(
    selectMarginTradePage,
  );
  // const [slippage, setSlippage] = useState(0.5);
  const dispatch = useDispatch();

  const pair = useMemo(() => TradingPairDictionary.get(pairType), [pairType]);
  const asset = useMemo(() => AssetsDictionary.get(collateral), [collateral]);

  const {
    loanToken,
    collateralToken,
    useLoanTokens,
  } = useTrading_resolvePairTokens(pair, position, collateral);
  const contractName = getLendingContractName(loanToken);

  const { trade, ...tx } = useApproveAndTrade(
    pair,
    position,
    collateral,
    leverage,
    amount,
  );

  const submit = () =>
    trade({
      pair,
      position,
      collateralToken,
      collateral,
      leverage,
      amount,
    });

  const txArgs = [
    '0x0000000000000000000000000000000000000000000000000000000000000000', //0 if new loan
    toWei(String(leverage - 1), 'ether'),
    useLoanTokens ? amount : '0',
    useLoanTokens ? '0' : amount,
    getTokenContract(collateralToken).address,
    account, // trader
    '0x',
  ];

  const txConf = {
    value: collateral === Asset.RBTC ? amount : '0',
  };

  return (
    <>
      <Dialog
        isOpen={!!position}
        onClose={() => dispatch(actions.closeTradingModal())}
      >
        <div className="tw-mw-320 tw-mx-auto">
          <h1 className="tw-mb-6 tw-text-white tw-text-center">
            Review Transaction
          </h1>
          <div className="tw-text-sm tw-font-light tw-tracking-normal">
            <LabelValuePair label="Trading Pair:" value={pair.name} />
            <LabelValuePair
              label="Leverage:"
              value={<>{toNumberFormat(leverage)}x</>}
            />
            <LabelValuePair label="Direction:" value={position} />
            <LabelValuePair
              label="Collateral:"
              value={
                <>
                  <LoadableValue
                    loading={false}
                    value={weiToNumberFormat(amount, 4)}
                    tooltip={fromWei(amount)}
                  />{' '}
                  {asset.symbol}
                </>
              }
            />
            <LabelValuePair
              label="Maintenance Margin:"
              value={<>{weiToNumberFormat(maintenanceMargin)}%</>}
            />
            <LabelValuePair
              label="Est. Liquidation price:"
              value={
                <>
                  <LiquidationPrice
                    asset={pair.shortAsset}
                    assetLong={pair.longAsset}
                    leverage={leverage}
                    position={position}
                  />{' '}
                  {pair.longDetails.symbol}
                </>
              }
            />
          </div>
          {/*<LabelValuePair*/}
          {/*  label="Renewal Date:"*/}
          {/*  value={<>{weiToNumberFormat(15)}%</>}*/}
          {/*/>*/}

          {/*<FormGroup*/}
          {/*  className="tw-mt-8"*/}
          {/*  label={t(translations.buySovPage.slippageDialog.tolerance)}*/}
          {/*>*/}
          {/*  <Slider*/}
          {/*    value={slippage}*/}
          {/*    onChange={e => setSlippage(e)}*/}
          {/*    min={0.1}*/}
          {/*    max={1}*/}
          {/*    stepSize={0.05}*/}
          {/*    labelRenderer={value => <>{value}%</>}*/}
          {/*    labelValues={[0.1, 0.25, 0.5, 0.75, 1]}*/}
          {/*  />*/}
          {/*</FormGroup>*/}

          <FormGroup label="Approx. Position Entry Price:" className="tw-mt-8">
            <div className="tw-input-wrapper readonly">
              <div className="tw-input">
                <PricePrediction
                  position={position}
                  leverage={leverage}
                  loanToken={loanToken}
                  collateralToken={collateralToken}
                  useLoanTokens={useLoanTokens}
                  weiAmount={amount}
                />
              </div>
              <div className="tw-input-append">{pair.longDetails.symbol}</div>
            </div>
          </FormGroup>
          <TxFeeCalculator
            args={txArgs}
            txConfig={txConf}
            methodName="marginTrade"
            contractName={contractName}
            condition={true}
          />
          <div className="tw-mt-4">
            {openTradesLocked && (
              <ErrorBadge
                content={
                  <Trans
                    i18nKey={translations.maintenance.openMarginTrades}
                    components={[
                      <a
                        href={discordInvite}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="tw-text-Red tw-text-xs tw-underline hover:tw-no-underline"
                      >
                        x
                      </a>,
                    ]}
                  />
                }
              />
            )}
          </div>
          <DialogButton
            confirmLabel={t(translations.common.confirm)}
            onConfirm={() => submit()}
            disabled={openTradesLocked}
            cancelLabel={t(translations.common.cancel)}
            onCancel={() => dispatch(actions.closeTradingModal())}
          />
        </div>
      </Dialog>
      <TxDialog
        tx={tx}
        onUserConfirmed={() => dispatch(actions.closeTradingModal())}
      />
    </>
  );
}

interface LabelValuePairProps {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
}

function LabelValuePair(props: LabelValuePairProps) {
  return (
    <div
      className={cn(
        'tw-flex tw-flex-row tw-justify-between tw-space-x-4 tw-mb-2',
        props.className,
      )}
    >
      <div className="tw-truncate tw-w-7/12">{props.label}</div>
      <div className="tw-truncate tw-w-5/12 tw-text-left">{props.value}</div>
    </div>
  );
}
