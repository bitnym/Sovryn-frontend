import React from 'react';
import { weiTo4 } from 'utils/blockchain/math-helpers';

import { FieldGroup } from 'app/components/FieldGroup';
import { AmountField } from 'app/containers/AmountField';

import '../../assets/index.scss';

type Props = {
  amountName: string;
  amountValue: string;
  onChangeAmount: (e: string) => void;
  onMaxChange: () => void;

  currency: string;
  minValue?: number | string;
  maxValue?: number | string;
  loadingLimit?: boolean;
};

const Amount: React.FC<Props> = ({
  amountName,
  currency,
  minValue,
  maxValue,
  onChangeAmount,
  amountValue,
  onMaxChange,
  loadingLimit,
}) => {
  return (
    <div className="tw-flex tw-flex-row tw-justify-between">
      <div className="tw-flex tw-flex-grow tw-flex-col">
        <FieldGroup
          label={
            <>
              {amountName}{' '}
              {maxValue !== '0' && !loadingLimit && (
                <span className="tw-text-muted">
                  (Max: {weiTo4(maxValue)} {currency})
                </span>
              )}
            </>
          }
        >
          <AmountField
            onChange={onChangeAmount}
            value={amountValue}
            onMaxClicked={() => onMaxChange()}
          />
        </FieldGroup>
      </div>
    </div>
  );
};

export default Amount;
