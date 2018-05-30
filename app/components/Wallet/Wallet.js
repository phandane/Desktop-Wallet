import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import { FormattedNumber } from 'react-intl';

import styles from './Wallet.css';

import { WalletIcon, ArrowRightIcon } from '../Icons';

class Wallet extends Component {
  render() {
    let keys = Object.keys(this.props.tokens);
    return (
      <NavLink to={"/wallets/walletDetails/" + this.props.index} className={styles.wallet} activeClassName={styles.active}>
        <WalletIcon className={styles.walletIcon} />
        <ul className={styles.walletInfo}>
          <li className={styles.name}>{ this.props.name }</li>
          <li className={styles.token}>
            <FormattedNumber value={(this.props.trx / 1000000).toFixed(3)} /> TRX
          </li>
          {
            keys.map((k, i) =>
              <li className={styles.token} key={k}><FormattedNumber formatNumber="decimal" value={this.props.tokens[k]} /> { k }</li>)
          }
        </ul>
        <ArrowRightIcon className={styles.arrowIcon} />
      </NavLink>
    );
  }
}

export default Wallet;
